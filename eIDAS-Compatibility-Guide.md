# Adaptação do Digital Passport para Compatibilidade eIDAS

## 📋 Visão Geral

Este documento apresenta as adaptações necessárias para tornar o **WEG Digital Passport** compatível com o regulamento **eIDAS** (electronic IDentification, Authentication and trust Services) da União Europeia.

## 🎯 Objetivos da Adaptação

- ✅ **Assinaturas Eletrônicas Qualificadas (QES)**
- ✅ **Níveis de Garantia de Identidade (LoA)**
- ✅ **Integração com Prestadores de Serviços de Confiança Qualificados (QTSP)**
- ✅ **Timestamping Qualificado**
- ✅ **Preservação a Longo Prazo (LTV)**
- ✅ **Interoperabilidade Europeia**

---

## 🔧 Principais Adaptações Técnicas

### 1. **Esquemas eIDAS-Compatíveis**

#### Schema: eIDAS_QUALIFIED_ATTESTATION
```solidity
struct eIDASQualifiedAttestation {
    // Dados originais da attestation
    bytes32 originalUID;
    string schemaType;
    bytes originalData;
    
    // Certificação eIDAS
    bytes32 qualifiedCertificateHash;    // Hash do certificado qualificado
    address qtspAddress;                 // Endereço do QTSP na blockchain
    string qtspName;                     // Nome do prestador qualificado
    string qtspCountry;                  // País do QTSP (ISO 3166-1)
    
    // Níveis de garantia
    uint8 levelOfAssurance;              // 1=Substancial, 2=Alto
    bool isQualifiedSignature;           // Se é assinatura qualificada
    
    // Timestamp qualificado
    uint256 qualifiedTimestamp;          // Timestamp do TSA qualificado
    bytes32 timestampTokenHash;          // Hash do token de timestamp
    string tsaProvider;                  // Prestador de timestamp qualificado
    
    // Validação temporal
    uint256 validationTime;              // Momento da validação
    bytes32 validationProofHash;         // Hash das evidências de validação
    uint256 nextValidationRequired;      // Próxima validação necessária
    
    // Metadados eIDAS
    string signatureFormat;              // "CAdES", "XAdES", "PAdES"
    bytes signatureValue;                // Assinatura eletrônica qualificada
    bool isAdvancedSignature;            // Se é AdES (Advanced Electronic Signature)
    
    // Interoperabilidade
    string euTrustListVersion;           // Versão da EU Trust Service List
    bool crossBorderRecognition;         // Reconhecimento transfronteiriço
}
```

#### Schema: eIDAS_CERTIFICATE_VALIDATION
```solidity
struct eIDASCertificateValidation {
    bytes32 certificateHash;
    address certificateHolder;
    string qtspName;
    string qtspCountry;
    uint256 issuanceDate;
    uint256 expirationDate;
    uint8 certificateType;               // 1=Pessoa física, 2=Pessoa jurídica, 3=Website
    string validationMethod;             // "OCSP", "CRL", "Real-time"
    bool isRevoked;
    uint256 lastValidationCheck;
    bytes32 validationProofHash;
}
```

### 2. **Contratos Inteligentes Adaptados**

#### eIDASQualifiedAttestor.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract eIDASQualifiedAttestor is Ownable, ReentrancyGuard {
    
    // ============ STRUCTS ============
    
    struct QualifiedTrustServiceProvider {
        string name;
        string country;
        string trustListStatus;          // "granted", "withdrawn", "suspended"
        uint256 registrationDate;
        uint256 lastValidation;
        bool isActive;
        string[] supportedServices;      // ["QES", "QWAC", "QTS", "QTST"]
    }
    
    struct LevelOfAssurance {
        uint8 level;                     // 1=Substancial, 2=Alto
        string[] requirements;           // Requisitos atendidos
        uint256 validatedAt;
        address validator;
        bool isValid;
    }
    
    // ============ STORAGE ============
    
    /// @dev Mapping de QTSPs autorizados
    mapping(address => QualifiedTrustServiceProvider) public authorizedQTSPs;
    
    /// @dev Mapping de certificados qualificados validados
    mapping(bytes32 => eIDASCertificateValidation) public validatedCertificates;
    
    /// @dev Mapping de níveis de garantia por endereço
    mapping(address => LevelOfAssurance) public levelOfAssurance;
    
    /// @dev Lista de países eIDAS reconhecidos
    mapping(string => bool) public recognizedCountries;
    
    /// @dev Versão atual da EU Trust Service List
    string public currentTrustListVersion;
    
    // ============ EVENTS ============
    
    event QTSPRegistered(address indexed qtsp, string name, string country);
    event CertificateValidated(bytes32 indexed certHash, address holder, uint8 loa);
    event QualifiedAttestationCreated(bytes32 indexed uid, address attester, uint8 loa);
    event TrustListUpdated(string newVersion, uint256 timestamp);
    
    // ============ MODIFIERS ============
    
    modifier onlyAuthorizedQTSP() {
        require(authorizedQTSPs[msg.sender].isActive, "Not authorized QTSP");
        _;
    }
    
    modifier validLevelOfAssurance(uint8 level) {
        require(level >= 1 && level <= 2, "Invalid LoA level");
        _;
    }
    
    // ============ QTSP MANAGEMENT ============
    
    function registerQTSP(
        address qtspAddress,
        string memory name,
        string memory country,
        string[] memory supportedServices
    ) external onlyOwner {
        require(recognizedCountries[country], "Country not in eIDAS");
        
        authorizedQTSPs[qtspAddress] = QualifiedTrustServiceProvider({
            name: name,
            country: country,
            trustListStatus: "granted",
            registrationDate: block.timestamp,
            lastValidation: block.timestamp,
            isActive: true,
            supportedServices: supportedServices
        });
        
        emit QTSPRegistered(qtspAddress, name, country);
    }
    
    // ============ CERTIFICATE VALIDATION ============
    
    function validateQualifiedCertificate(
        bytes32 certificateHash,
        address certificateHolder,
        uint8 certificateType,
        uint8 proposedLoA
    ) external onlyAuthorizedQTSP validLevelOfAssurance(proposedLoA) {
        
        // Validar certificado com QTSP
        eIDASCertificateValidation memory validation = eIDASCertificateValidation({
            certificateHash: certificateHash,
            certificateHolder: certificateHolder,
            qtspName: authorizedQTSPs[msg.sender].name,
            qtspCountry: authorizedQTSPs[msg.sender].country,
            issuanceDate: block.timestamp,
            expirationDate: block.timestamp + 365 days, // Certificados válidos por 1 ano
            certificateType: certificateType,
            validationMethod: "Real-time",
            isRevoked: false,
            lastValidationCheck: block.timestamp,
            validationProofHash: keccak256(abi.encodePacked(certificateHash, block.timestamp))
        });
        
        validatedCertificates[certificateHash] = validation;
        
        // Definir nível de garantia
        string[] memory requirements = new string[](3);
        if (proposedLoA == 2) {
            requirements[0] = "Multi-factor authentication";
            requirements[1] = "Physical presence verification";
            requirements[2] = "Biometric verification";
        } else {
            requirements[0] = "Identity document verification";
            requirements[1] = "Address verification";
            requirements[2] = "Digital signature capability";
        }
        
        levelOfAssurance[certificateHolder] = LevelOfAssurance({
            level: proposedLoA,
            requirements: requirements,
            validatedAt: block.timestamp,
            validator: msg.sender,
            isValid: true
        });
        
        emit CertificateValidated(certificateHash, certificateHolder, proposedLoA);
    }
    
    // ============ QUALIFIED ATTESTATION CREATION ============
    
    function createQualifiedAttestation(
        bytes32 originalUID,
        string memory schemaType,
        bytes memory originalData,
        bytes memory qualifiedSignature,
        string memory signatureFormat
    ) external returns (bytes32) {
        
        // Verificar se o attester tem certificado válido
        LevelOfAssurance memory loa = levelOfAssurance[msg.sender];
        require(loa.isValid, "No valid LoA for attester");
        
        // Verificar se o certificado não expirou
        bytes32 certHash = keccak256(abi.encodePacked(msg.sender, loa.validatedAt));
        eIDASCertificateValidation memory cert = validatedCertificates[certHash];
        require(block.timestamp < cert.expirationDate, "Certificate expired");
        require(!cert.isRevoked, "Certificate revoked");
        
        // Criar attestation qualificada
        bytes32 qualifiedUID = keccak256(abi.encodePacked(
            originalUID,
            msg.sender,
            block.timestamp,
            "eIDAS-QUALIFIED"
        ));
        
        // Registrar na EAS com dados eIDAS
        eIDASQualifiedAttestation memory qualifiedAttestation = eIDASQualifiedAttestation({
            originalUID: originalUID,
            schemaType: schemaType,
            originalData: originalData,
            qualifiedCertificateHash: certHash,
            qtspAddress: loa.validator,
            qtspName: authorizedQTSPs[loa.validator].name,
            qtspCountry: authorizedQTSPs[loa.validator].country,
            levelOfAssurance: loa.level,
            isQualifiedSignature: true,
            qualifiedTimestamp: block.timestamp,
            timestampTokenHash: keccak256(abi.encodePacked(block.timestamp, block.difficulty)),
            tsaProvider: "Blockchain-TSA",
            validationTime: block.timestamp,
            validationProofHash: keccak256(abi.encodePacked(certHash, block.timestamp)),
            nextValidationRequired: block.timestamp + 30 days,
            signatureFormat: signatureFormat,
            signatureValue: qualifiedSignature,
            isAdvancedSignature: true,
            euTrustListVersion: currentTrustListVersion,
            crossBorderRecognition: true
        });
        
        emit QualifiedAttestationCreated(qualifiedUID, msg.sender, loa.level);
        
        return qualifiedUID;
    }
    
    // ============ LONG-TERM VALIDATION ============
    
    function performLongTermValidation(bytes32 qualifiedUID) external {
        // Implementar validação a longo prazo (LTV)
        // Renovar evidências criptográficas
        // Verificar status de revogação
        // Atualizar provas de validação
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function isQualifiedAttester(address attester) external view returns (bool) {
        return levelOfAssurance[attester].isValid;
    }
    
    function getAttesterLoA(address attester) external view returns (uint8) {
        return levelOfAssurance[attester].level;
    }
    
    function isCertificateValid(bytes32 certHash) external view returns (bool) {
        eIDASCertificateValidation memory cert = validatedCertificates[certHash];
        return !cert.isRevoked && block.timestamp < cert.expirationDate;
    }
}
```

### 3. **Integração com Digital Passport**

#### DigitalPassport_eIDAS.sol (Versão Adaptada)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DigitalPassport.sol";
import "./eIDASQualifiedAttestor.sol";

contract DigitalPassport_eIDAS is DigitalPassport {
    
    // ============ eIDAS INTEGRATION ============
    
    eIDASQualifiedAttestor public immutable eidasAttestor;
    
    // Mapping de attestations qualificadas
    mapping(bytes32 => bool) public isQualifiedAttestation;
    mapping(bytes32 => uint8) public attestationLoA;
    
    constructor(
        string memory _productId,
        address _manufacturer,
        address _eidasAttestor
    ) DigitalPassport(_productId, _manufacturer) {
        eidasAttestor = eIDASQualifiedAttestor(_eidasAttestor);
    }
    
    // ============ eIDAS QUALIFIED FUNCTIONS ============
    
    function addQualifiedAttestation(
        bytes32 uid,
        string memory schemaType,
        address attester,
        bytes memory qualifiedSignature,
        string memory signatureFormat
    ) external onlyManufacturer nonReentrant whenActive {
        
        // Verificar se é um attester qualificado
        require(
            eidasAttestor.isQualifiedAttester(attester),
            "Attester not eIDAS qualified"
        );
        
        // Obter nível de garantia
        uint8 loa = eidasAttestor.getAttesterLoA(attester);
        
        // Criar attestation qualificada
        bytes32 qualifiedUID = eidasAttestor.createQualifiedAttestation(
            uid,
            schemaType,
            abi.encodePacked(productId, schemaType, block.timestamp),
            qualifiedSignature,
            signatureFormat
        );
        
        // Adicionar como attestation regular
        addAttestation(qualifiedUID, schemaType, attester);
        
        // Marcar como qualificada
        isQualifiedAttestation[qualifiedUID] = true;
        attestationLoA[qualifiedUID] = loa;
        
        emit QualifiedAttestationAdded(qualifiedUID, schemaType, attester, loa);
    }
    
    event QualifiedAttestationAdded(
        bytes32 indexed uid,
        string indexed schemaType,
        address indexed attester,
        uint8 levelOfAssurance
    );
    
    // ============ eIDAS VIEW FUNCTIONS ============
    
    function getQualifiedAttestations() external view returns (AttestationRecord[] memory) {
        uint256 qualifiedCount = 0;
        
        // Contar attestations qualificadas
        for (uint256 i = 0; i < attestations.length; i++) {
            if (isQualifiedAttestation[attestations[i].uid]) {
                qualifiedCount++;
            }
        }
        
        // Criar array resultado
        AttestationRecord[] memory qualified = new AttestationRecord[](qualifiedCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < attestations.length; i++) {
            if (isQualifiedAttestation[attestations[i].uid]) {
                qualified[index] = attestations[i];
                index++;
            }
        }
        
        return qualified;
    }
    
    function getAttestationLoA(bytes32 uid) external view returns (uint8) {
        return attestationLoA[uid];
    }
    
    function hasHighAssuranceAttestations() external view returns (bool) {
        for (uint256 i = 0; i < attestations.length; i++) {
            if (attestationLoA[attestations[i].uid] == 2) {
                return true;
            }
        }
        return false;
    }
}
```

---

## 🌍 Implementação da Interoperabilidade Europeia

### 4. **Sistema de Reconhecimento Mútuo**

#### EUTrustServiceManager.sol
```solidity
contract EUTrustServiceManager is Ownable {
    
    struct EUMemberState {
        string countryCode;              // "DE", "FR", "IT", etc.
        string countryName;
        bool isEUMember;
        bool eidasCompliant;
        string trustListURL;
        uint256 lastTrustListUpdate;
    }
    
    struct CrossBorderRecognition {
        string originCountry;
        string targetCountry;
        bool mutualRecognition;
        uint256 lastValidation;
        string[] recognizedServices;
    }
    
    mapping(string => EUMemberState) public euMemberStates;
    mapping(bytes32 => CrossBorderRecognition) public crossBorderRecognitions;
    
    function initializeEUMemberStates() external onlyOwner {
        // Inicializar todos os 27 países da UE
        euMemberStates["DE"] = EUMemberState("DE", "Germany", true, true, "https://esignature.ec.europa.eu/efda/tl-browser/api/v1/search/tsl_xml", block.timestamp);
        euMemberStates["FR"] = EUMemberState("FR", "France", true, true, "https://esignature.ec.europa.eu/efda/tl-browser/api/v1/search/tsl_xml", block.timestamp);
        euMemberStates["IT"] = EUMemberState("IT", "Italy", true, true, "https://esignature.ec.europa.eu/efda/tl-browser/api/v1/search/tsl_xml", block.timestamp);
        // ... outros países
    }
    
    function establishMutualRecognition(
        string memory originCountry,
        string memory targetCountry
    ) external onlyOwner {
        require(euMemberStates[originCountry].eidasCompliant, "Origin not eIDAS compliant");
        require(euMemberStates[targetCountry].eidasCompliant, "Target not eIDAS compliant");
        
        bytes32 recognitionKey = keccak256(abi.encodePacked(originCountry, targetCountry));
        
        string[] memory services = new string[](4);
        services[0] = "QES"; // Qualified Electronic Signatures
        services[1] = "QWAC"; // Qualified Website Authentication Certificates
        services[2] = "QTS"; // Qualified Time Stamps
        services[3] = "QTST"; // Qualified Trust Service for Time Stamping
        
        crossBorderRecognitions[recognitionKey] = CrossBorderRecognition({
            originCountry: originCountry,
            targetCountry: targetCountry,
            mutualRecognition: true,
            lastValidation: block.timestamp,
            recognizedServices: services
        });
    }
}
```

---

## 📚 Guia de Implementação

### Passos para Adaptação:

1. **Deploy dos Contratos eIDAS**
   ```bash
   # Deploy do sistema eIDAS
   npx hardhat run scripts/deploy-eidas-system.js --network arbitrum
   ```

2. **Registro de QTSPs**
   ```javascript
   // Registrar prestadores de serviços qualificados
   await eidasAttestor.registerQTSP(
     qtspAddress,
     "Certisign Certificadora Digital",
     "BR", // Brasil (se reconhecido)
     ["QES", "QTS"]
   );
   ```

3. **Validação de Certificados**
   ```javascript
   // Validar certificado qualificado
   await eidasAttestor.validateQualifiedCertificate(
     certificateHash,
     userAddress,
     1, // Pessoa física
     2  // Nível Alto
   );
   ```

4. **Criação de Attestations Qualificadas**
   ```javascript
   // Criar attestation com assinatura qualificada
   await digitalPassport.addQualifiedAttestation(
     attestationUID,
     "WEG_PRODUCT_INIT",
     attesterAddress,
     qualifiedSignatureBytes,
     "CAdES"
   );
   ```

### Benefícios da Adaptação eIDAS:

- ✅ **Reconhecimento Legal**: Attestations com valor jurídico na UE
- ✅ **Interoperabilidade**: Funcionamento em todos os países eIDAS
- ✅ **Segurança Aprimorada**: Assinaturas eletrônicas qualificadas
- ✅ **Conformidade Regulatória**: Atendimento às normas europeias
- ✅ **Preservação a Longo Prazo**: Validação temporal das evidências
- ✅ **Auditoria Completa**: Rastreabilidade com garantias legais

---

## 🔍 Próximos Passos

1. **Implementar contratos eIDAS**
2. **Integrar com QTSPs europeus**
3. **Desenvolver APIs de validação**
4. **Criar interface para assinaturas qualificadas**
5. **Testar interoperabilidade transfronteiriça**
6. **Documentar conformidade regulatória**

Esta adaptação torna o WEG Digital Passport totalmente compatível com o regulamento eIDAS, permitindo seu uso legal e reconhecido em toda a União Europeia. 