const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * Script de deploy para o sistema eIDAS completo
 * Deploy order:
 * 1. eIDASQualifiedAttestor
 * 2. PassportRegistry (atualizado)
 * 3. DigitalPassportFactory (atualizado para eIDAS)
 * 4. Exemplos de QTSPs
 */

async function main() {
    console.log("🚀 Iniciando deploy do sistema eIDAS...\n");
    
    // Obter signers
    const [deployer, qtsp1, qtsp2, manufacturer] = await ethers.getSigners();
    
    console.log("📋 Informações de Deploy:");
    console.log("├─ Deployer:", deployer.address);
    console.log("├─ QTSP 1:", qtsp1.address);
    console.log("├─ QTSP 2:", qtsp2.address);
    console.log("└─ Manufacturer:", manufacturer.address);
    console.log();
    
    // 1. Deploy eIDASQualifiedAttestor
    console.log("📄 1. Deploying eIDASQualifiedAttestor...");
    const EIDASQualifiedAttestor = await ethers.getContractFactory("eIDASQualifiedAttestor");
    const eidasAttestor = await EIDASQualifiedAttestor.deploy();
    await eidasAttestor.deployed();
    console.log("├─ eIDASQualifiedAttestor deployed to:", eidasAttestor.address);
    
    // 2. Deploy PassportRegistry
    console.log("📄 2. Deploying PassportRegistry...");
    const PassportRegistry = await ethers.getContractFactory("PassportRegistry");
    const passportRegistry = await PassportRegistry.deploy();
    await passportRegistry.deployed();
    console.log("├─ PassportRegistry deployed to:", passportRegistry.address);
    
    // 3. Deploy DigitalPassportFactory_eIDAS
    console.log("📄 3. Deploying DigitalPassportFactory_eIDAS...");
    const DigitalPassportFactory_eIDAS = await ethers.getContractFactory("DigitalPassportFactory_eIDAS");
    const factory = await DigitalPassportFactory_eIDAS.deploy(
        passportRegistry.address,
        eidasAttestor.address
    );
    await factory.deployed();
    console.log("├─ DigitalPassportFactory_eIDAS deployed to:", factory.address);
    
    // 4. Configurar PassportRegistry para aceitar a factory
    console.log("📄 4. Configuring PassportRegistry...");
    await passportRegistry.connect(deployer).transferOwnership(factory.address);
    console.log("├─ PassportRegistry ownership transferred to factory");
    
    // 5. Registrar QTSPs de exemplo
    console.log("📄 5. Registering example QTSPs...");
    
    // QTSP Alemão
    await eidasAttestor.connect(deployer).registerQTSP(
        qtsp1.address,
        "D-Trust GmbH",
        "DE",
        ["QES", "QWAC", "QTS", "QTST"],
        "https://www.d-trust.net/trust-list"
    );
    console.log("├─ German QTSP registered: D-Trust GmbH");
    
    // QTSP Francês
    await eidasAttestor.connect(deployer).registerQTSP(
        qtsp2.address,
        "CertEurope",
        "FR", 
        ["QES", "QTS"],
        "https://www.certeurope.fr/trust-list"
    );
    console.log("├─ French QTSP registered: CertEurope");
    
    // 6. Validar certificados de exemplo
    console.log("📄 6. Validating example certificates...");
    
    // Certificado para manufacturer (nível alto)
    const manufacturerCertHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("manufacturer-cert-2024")
    );
    
    await eidasAttestor.connect(qtsp1).validateQualifiedCertificate(
        manufacturerCertHash,
        manufacturer.address,
        2, // Pessoa jurídica
        2  // Nível alto
    );
    console.log("├─ Manufacturer certificate validated (High LoA)");
    
    // Certificado para deployer (nível substancial)
    const deployerCertHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("deployer-cert-2024")
    );
    
    await eidasAttestor.connect(qtsp2).validateQualifiedCertificate(
        deployerCertHash,
        deployer.address,
        1, // Pessoa física
        1  // Nível substancial
    );
    console.log("├─ Deployer certificate validated (Substantial LoA)");
    
    // 7. Criar passaporte de exemplo
    console.log("📄 7. Creating example digital passport...");
    
    const productId = "WEG-W22-eIDAS-2024-001";
    const createTx = await factory.connect(manufacturer).createPassport(
        productId,
        manufacturer.address
    );
    const receipt = await createTx.wait();
    
    // Extrair endereço do passaporte do evento
    const passportCreatedEvent = receipt.events?.find(
        event => event.event === 'PassportCreated'
    );
    const passportAddress = passportCreatedEvent?.args?.passportAddress;
    
    console.log("├─ Digital Passport created:", passportAddress);
    console.log("├─ Product ID:", productId);
    
    // 8. Adicionar attestation qualificada de exemplo
    console.log("📄 8. Adding qualified attestation example...");
    
    const DigitalPassport_eIDAS = await ethers.getContractFactory("DigitalPassport_eIDAS");
    const passport = DigitalPassport_eIDAS.attach(passportAddress);
    
    // Criar assinatura de exemplo (simulada)
    const messageHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
            ["string", "string", "uint256"],
            [productId, "WEG_PRODUCT_INIT", Date.now()]
        )
    );
    
    const qualifiedSignature = await manufacturer.signMessage(
        ethers.utils.arrayify(messageHash)
    );
    
    const attestationUID = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("attestation-" + Date.now())
    );
    
    await passport.connect(manufacturer).addQualifiedAttestation(
        attestationUID,
        "WEG_PRODUCT_INIT",
        manufacturer.address,
        qualifiedSignature,
        "CAdES"
    );
    
    console.log("├─ Qualified attestation added");
    console.log("├─ Attestation UID:", attestationUID);
    
    // 9. Verificar estatísticas
    console.log("📄 9. System statistics:");
    
    const [totalQTSPs, totalCerts, totalQualifiedAttestations] = 
        await eidasAttestor.getSystemStats();
    
    const [totalAttestations, qualifiedAttestations, substantialLoA, highLoA] = 
        await passport.getAttestationStats();
    
    console.log("├─ Total QTSPs registered:", totalQTSPs.toString());
    console.log("├─ Total qualified attestations:", totalQualifiedAttestations.toString());
    console.log("├─ Passport total attestations:", totalAttestations.toString());
    console.log("├─ Passport qualified attestations:", qualifiedAttestations.toString());
    console.log("├─ Substantial LoA attestations:", substantialLoA.toString());
    console.log("└─ High LoA attestations:", highLoA.toString());
    
    console.log("\n✅ Sistema eIDAS deployado com sucesso!");
    console.log("\n📋 Endereços dos Contratos:");
    console.log("├─ eIDASQualifiedAttestor:", eidasAttestor.address);
    console.log("├─ PassportRegistry:", passportRegistry.address);
    console.log("├─ DigitalPassportFactory_eIDAS:", factory.address);
    console.log("└─ Example Digital Passport:", passportAddress);
    
    console.log("\n👥 QTSPs Registrados:");
    console.log("├─ D-Trust GmbH (DE):", qtsp1.address);
    console.log("└─ CertEurope (FR):", qtsp2.address);
    
    console.log("\n🔐 Certificados Validados:");
    console.log("├─ Manufacturer (High LoA):", manufacturer.address);
    console.log("└─ Deployer (Substantial LoA):", deployer.address);
    
    // 10. Salvar configurações para uso posterior
    const deploymentConfig = {
        network: hre.network.name,
        timestamp: new Date().toISOString(),
        contracts: {
            eidasAttestor: eidasAttestor.address,
            passportRegistry: passportRegistry.address,
            factory: factory.address,
            examplePassport: passportAddress
        },
        qtsps: {
            dTrust: {
                address: qtsp1.address,
                name: "D-Trust GmbH",
                country: "DE"
            },
            certEurope: {
                address: qtsp2.address,
                name: "CertEurope",
                country: "FR"
            }
        },
        certificates: {
            manufacturer: {
                address: manufacturer.address,
                certHash: manufacturerCertHash,
                loa: 2
            },
            deployer: {
                address: deployer.address,
                certHash: deployerCertHash,
                loa: 1
            }
        },
        exampleAttestation: {
            uid: attestationUID,
            schema: "WEG_PRODUCT_INIT",
            attester: manufacturer.address,
            format: "CAdES"
        }
    };
    
    // Salvar configuração em arquivo
    const fs = require('fs');
    const path = require('path');
    
    const configDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    const configFile = path.join(configDir, `eidas-${hre.network.name}.json`);
    fs.writeFileSync(configFile, JSON.stringify(deploymentConfig, null, 2));
    
    console.log("\n💾 Configuração salva em:", configFile);
    
    // 11. Instruções de uso
    console.log("\n📖 Próximos Passos:");
    console.log("1. Verificar contratos no explorer da rede");
    console.log("2. Registrar QTSPs adicionais se necessário");
    console.log("3. Validar certificados de usuários reais");
    console.log("4. Criar passaportes digitais para produtos");
    console.log("5. Adicionar attestations qualificadas eIDAS");
    console.log("6. Configurar validação LTV automatizada");
    
    console.log("\n🔍 Para verificar contratos:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${eidasAttestor.address}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${passportRegistry.address}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${factory.address} "${passportRegistry.address}" "${eidasAttestor.address}"`);
    
    return {
        eidasAttestor: eidasAttestor.address,
        passportRegistry: passportRegistry.address,
        factory: factory.address,
        examplePassport: passportAddress,
        config: deploymentConfig
    };
}

// Função auxiliar para aguardar confirmações
async function waitForConfirmations(tx, confirmations = 2) {
    console.log(`⏳ Aguardando ${confirmations} confirmações...`);
    const receipt = await tx.wait(confirmations);
    console.log(`✅ Transação confirmada: ${receipt.transactionHash}`);
    return receipt;
}

// Executar script
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Erro no deploy:", error);
            process.exit(1);
        });
}

module.exports = { main }; 