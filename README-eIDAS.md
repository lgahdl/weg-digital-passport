# WEG Digital Passport - Implementação eIDAS

## 🔐 Visão Geral

Esta implementação adapta o **WEG Digital Passport** para ser totalmente compatível com o regulamento **eIDAS** (electronic IDentification, Authentication and trust Services) da União Europeia, permitindo que as attestations tenham **valor jurídico** em todos os países eIDAS.

## 🎯 Funcionalidades eIDAS

### ✅ Implementado

- **Assinaturas Eletrônicas Qualificadas (QES)**
- **Níveis de Garantia de Identidade (LoA)**: Substancial e Alto
- **Prestadores de Serviços de Confiança Qualificados (QTSP)**
- **Timestamping Qualificado**
- **Validação a Longo Prazo (LTV)**
- **Reconhecimento Transfronteiriço**
- **Múltiplos Formatos**: CAdES, XAdES, PAdES
- **Interoperabilidade Europeia**

### 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    eIDAS Compliance Layer                   │
├─────────────────────────────────────────────────────────────┤
│  eIDASQualifiedAttestor  │  DigitalPassport_eIDAS          │
│  - QTSP Management       │  - Qualified Attestations       │
│  - Certificate Validation│  - LoA Tracking                 │
│  - LTV Implementation    │  - Cross-border Recognition     │
├─────────────────────────────────────────────────────────────┤
│                 Existing Digital Passport                   │
│                    Infrastructure                           │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Instalação e Deploy

### 1. Pré-requisitos

```bash
npm install
npm install --save-dev @openzeppelin/contracts
npm install --save-dev @ethereum-attestation-service/eas-contracts
```

### 2. Deploy do Sistema eIDAS

```bash
# Deploy completo do sistema eIDAS
npx hardhat run scripts/deploy-eidas-system.js --network arbitrum

# Deploy em rede local para testes
npx hardhat run scripts/deploy-eidas-system.js --network localhost
```

### 3. Verificação dos Contratos

```bash
# Verificar contratos no explorador
npx hardhat verify --network arbitrum <CONTRACT_ADDRESS>
```

## 📋 Contratos Principais

### 1. eIDASQualifiedAttestor.sol

Contrato principal que gerencia:
- **QTSPs**: Registro e validação de prestadores qualificados
- **Certificados**: Validação de certificados qualificados
- **LoA**: Níveis de garantia de identidade
- **LTV**: Validação a longo prazo

```solidity
// Registrar QTSP
function registerQTSP(
    address qtspAddress,
    string memory name,
    string memory country,
    string[] memory supportedServices,
    string memory trustListURL
) external onlyOwner

// Validar certificado qualificado
function validateQualifiedCertificate(
    bytes32 certificateHash,
    address certificateHolder,
    uint8 certificateType,
    uint8 proposedLoA
) external onlyAuthorizedQTSP

// Criar attestation qualificada
function createQualifiedAttestation(
    bytes32 originalUID,
    string memory schemaType,
    bytes memory originalData,
    bytes memory qualifiedSignature,
    string memory signatureFormat
) external returns (bytes32)
```

### 2. DigitalPassport_eIDAS.sol

Versão adaptada do Digital Passport com suporte eIDAS:

```solidity
// Adicionar attestation qualificada
function addQualifiedAttestation(
    bytes32 uid,
    string memory schemaType,
    address attester,
    bytes memory qualifiedSignature,
    string memory signatureFormat
) external onlyManufacturer

// Realizar validação LTV
function performLTVValidation(bytes32 uid) external

// Verificar reconhecimento transfronteiriço
function hasCrossBorderRecognition() external view returns (bool)

// Obter estatísticas por LoA
function getAttestationStats() external view returns (uint256, uint256, uint256, uint256)
```

## 🌍 QTSPs Suportados

### Países eIDAS Reconhecidos

O sistema suporta QTSPs de todos os **27 países da UE** + **3 países EEA**:

| País | Código | Exemplo QTSP |
|------|--------|--------------|
| 🇩🇪 Alemanha | DE | D-Trust GmbH |
| 🇫🇷 França | FR | CertEurope |
| 🇮🇹 Itália | IT | InfoCert S.p.A |
| 🇪🇸 Espanha | ES | FNMT-RCM |
| 🇳🇱 Holanda | NL | QuoVadis |
| ... | ... | ... |

### Registro de QTSP

```javascript
// Exemplo: Registrar QTSP alemão
await eidasAttestor.registerQTSP(
    qtspAddress,
    "D-Trust GmbH",
    "DE",
    ["QES", "QWAC", "QTS", "QTST"],
    "https://www.d-trust.net/trust-list"
);
```

## 🔐 Níveis de Garantia (LoA)

### Nível 1: Substancial
- ✅ Verificação de documento de identidade
- ✅ Verificação de endereço
- ✅ Capacidade de assinatura digital

### Nível 2: Alto
- ✅ Autenticação multifator
- ✅ Verificação de presença física
- ✅ Verificação biométrica
- ✅ Verificação de documento oficial

## 📝 Formatos de Assinatura Suportados

### CAdES (CMS Advanced Electronic Signatures)
- **Uso**: Dados binários e estruturados
- **Padrão**: ETSI EN 319 122

### XAdES (XML Advanced Electronic Signatures)
- **Uso**: Documentos XML
- **Padrão**: ETSI EN 319 132

### PAdES (PDF Advanced Electronic Signatures)
- **Uso**: Documentos PDF
- **Padrão**: ETSI EN 319 142

## 🔄 Exemplos de Uso

### 1. Validar Certificado e Criar Attestation

```javascript
const { ethers } = require("hardhat");

// 1. Conectar aos contratos
const eidasAttestor = await ethers.getContractAt("eIDASQualifiedAttestor", EIDAS_ADDRESS);
const passport = await ethers.getContractAt("DigitalPassport_eIDAS", PASSPORT_ADDRESS);

// 2. Validar certificado (executado pelo QTSP)
const certHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("user-cert-2024"));
await eidasAttestor.connect(qtsp).validateQualifiedCertificate(
    certHash,
    userAddress,
    1, // Pessoa física
    2  // Nível alto
);

// 3. Criar assinatura qualificada
const messageHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
        ["string", "string", "uint256"],
        [productId, "WEG_MAINTENANCE_EVENT", Date.now()]
    )
);
const signature = await user.signMessage(ethers.utils.arrayify(messageHash));

// 4. Adicionar attestation qualificada
const attestationUID = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("att-" + Date.now()));
await passport.connect(manufacturer).addQualifiedAttestation(
    attestationUID,
    "WEG_MAINTENANCE_EVENT",
    userAddress,
    signature,
    "CAdES"
);
```

### 2. Verificar Conformidade eIDAS

```javascript
// Verificar se passaporte tem attestations qualificadas
const [total, qualified, substantial, high] = await passport.getAttestationStats();
console.log("Attestations qualificadas:", qualified.toString());
console.log("Nível alto:", high.toString());

// Verificar reconhecimento transfronteiriço
const crossBorder = await passport.hasCrossBorderRecognition();
console.log("Reconhecimento UE:", crossBorder);

// Listar attestations que precisam validação LTV
const ltvRequired = await passport.getAttestationsRequiringLTV();
console.log("LTV necessária:", ltvRequired.length);
```

### 3. Executar Demonstração Completa

```bash
# Executar exemplo completo com cenários eIDAS
npx hardhat run examples/eidas-usage-example.js --network localhost
```

## 🔍 Validação a Longo Prazo (LTV)

### Processo Automatizado

1. **Agendamento**: Attestations qualificadas são automaticamente agendadas para validação
2. **Verificação**: Status de certificados e QTSPs é verificado periodicamente
3. **Renovação**: Evidências criptográficas são renovadas conforme necessário
4. **Auditoria**: Todas as validações são registradas na blockchain

### Execução Manual

```javascript
// Listar attestations que precisam validação
const attestationsLTV = await passport.getAttestationsRequiringLTV();

// Realizar validação para cada uma
for (const uid of attestationsLTV) {
    await passport.performLTVValidation(uid);
}
```

## 📊 Monitoramento e Auditoria

### Métricas do Sistema

```javascript
// Estatísticas gerais
const [totalQTSPs, totalCerts, totalQualified] = await eidasAttestor.getSystemStats();

// Estatísticas do passaporte
const [total, qualified, substantial, high] = await passport.getAttestationStats();

// Verificações de conformidade
const hasHighAssurance = await passport.hasHighAssuranceAttestations();
const hasCrossBorder = await passport.hasCrossBorderRecognition();
```

### Auditoria de QTSPs

```javascript
// Listar todos os QTSPs registrados
const qtspAddresses = await eidasAttestor.getRegisteredQTSPs();

for (const qtspAddress of qtspAddresses) {
    const qtspInfo = await eidasAttestor.authorizedQTSPs(qtspAddress);
    console.log(`QTSP: ${qtspInfo.name} (${qtspInfo.country})`);
    console.log(`Status: ${qtspInfo.trustListStatus}`);
    console.log(`Ativo: ${qtspInfo.isActive}`);
}
```

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários dos contratos eIDAS
npx hardhat test test/eidas-qualified-attestor.test.js

# Testes de integração
npx hardhat test test/digital-passport-eidas.test.js

# Testes de conformidade
npx hardhat test test/eidas-compliance.test.js
```

### Cenários de Teste

1. **Registro de QTSPs**: Múltiplos países e serviços
2. **Validação de Certificados**: Diferentes tipos e LoAs
3. **Criação de Attestations**: Todos os formatos de assinatura
4. **Validação LTV**: Renovação e invalidação
5. **Reconhecimento Transfronteiriço**: Interoperabilidade
6. **Conformidade**: Verificação de todos os requisitos

## 🔧 Configuração

### Arquivo de Configuração

Após o deploy, o sistema gera um arquivo de configuração:

```json
{
  "network": "arbitrum",
  "timestamp": "2024-12-19T10:00:00.000Z",
  "contracts": {
    "eidasAttestor": "0x...",
    "passportRegistry": "0x...",
    "factory": "0x...",
    "examplePassport": "0x..."
  },
  "qtsps": {
    "dTrust": {
      "address": "0x...",
      "name": "D-Trust GmbH",
      "country": "DE"
    }
  }
}
```

### Variáveis de Ambiente

```bash
# .env
PRIVATE_KEY=your_private_key
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 🌐 Interoperabilidade

### Reconhecimento Mútuo

O sistema implementa reconhecimento automático entre todos os países eIDAS:

- ✅ **27 países da UE**
- ✅ **3 países EEA** (Islândia, Liechtenstein, Noruega)
- ✅ **Potencial extensão** para Suíça e Reino Unido

### Padrões Técnicos

- **ETSI EN 319 series**: Assinaturas eletrônicas
- **RFC 3161**: Timestamping
- **X.509**: Certificados digitais
- **OCSP/CRL**: Verificação de status

## 📚 Documentação Adicional

- [Guia de Conformidade eIDAS](./eIDAS-Compliance-Guide.md)
- [Documentação da EAS](./EAS-Architecture.md)
- [Contratos Inteligentes](./Smart-Contracts-Infrastructure.md)
- [Exemplo Multi-Fabricante](./Exemplo-Uso-Multi-Fabricante.md)

## 🤝 Contribuição

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Para suporte técnico ou dúvidas sobre a implementação eIDAS:

- **Issues**: [GitHub Issues](https://github.com/weg/digital-passport/issues)
- **Email**: digital-passport@weg.net
- **Documentação**: [Wiki do Projeto](https://github.com/weg/digital-passport/wiki)

---

## 🎉 Benefícios da Implementação eIDAS

### Para Empresas
- ✅ **Valor Jurídico**: Attestations reconhecidas legalmente na UE
- ✅ **Conformidade**: Atendimento automático a regulamentações
- ✅ **Interoperabilidade**: Funcionamento em todos os países eIDAS
- ✅ **Auditoria**: Rastreabilidade completa e verificável

### Para Usuários
- ✅ **Confiança**: Assinaturas eletrônicas qualificadas
- ✅ **Privacidade**: Controle sobre dados pessoais
- ✅ **Portabilidade**: Reconhecimento transfronteiriço
- ✅ **Segurança**: Múltiplas camadas de validação

### Para Autoridades
- ✅ **Transparência**: Auditoria completa na blockchain
- ✅ **Conformidade**: Aderência ao regulamento eIDAS
- ✅ **Eficiência**: Validação automatizada
- ✅ **Inovação**: Tecnologia blockchain para serviços públicos

---

**🔐 WEG Digital Passport + eIDAS = Futuro da Rastreabilidade Industrial Europeia** 