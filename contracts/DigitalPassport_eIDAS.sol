// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./eIDASQualifiedAttestor.sol";

/**
 * @title DigitalPassport_eIDAS
 * @dev Versão do Digital Passport compatível com regulamento eIDAS
 * @notice Suporte para assinaturas eletrônicas qualificadas e níveis de garantia
 */
contract DigitalPassport_eIDAS is ReentrancyGuard {
    
    // ============ STRUCTS ============
    
    /**
     * @dev Registro de uma attestation individual
     */
    struct AttestationRecord {
        bytes32 uid;                     // UID único da attestation
        string schemaType;               // Tipo do schema
        address attester;                // Quem criou a attestation
        uint256 timestamp;               // Quando foi criada
        bool isQualified;                // Se é attestation qualificada eIDAS
        uint8 levelOfAssurance;          // Nível de garantia (0=não qualificado, 1=substancial, 2=alto)
    }
    
    /**
     * @dev Informações específicas eIDAS de uma attestation
     */
    struct eIDASAttestationInfo {
        bytes32 qualifiedCertificateHash; // Hash do certificado qualificado
        string qtspName;                 // Nome do QTSP
        string qtspCountry;              // País do QTSP
        string signatureFormat;          // Formato da assinatura (CAdES, XAdES, PAdES)
        uint256 qualifiedTimestamp;      // Timestamp qualificado
        bool crossBorderRecognition;     // Reconhecimento transfronteiriço
        uint256 nextValidationRequired;   // Próxima validação LTV necessária
        bool isValid;                    // Status atual de validade
    }
    
    // ============ STORAGE ============
    
    /// @dev ID único do produto
    string public productId;
    
    /// @dev Endereço do fabricante (Manager)
    address public manufacturer;
    
    /// @dev Timestamp de criação do passaporte
    uint256 public createdAt;
    
    /// @dev Status ativo/inativo
    bool public isActive;
    
    /// @dev Referência ao contrato eIDAS
    eIDASQualifiedAttestor public immutable eidasAttestor;
    
    /// @dev Array de todas as attestations
    AttestationRecord[] public attestations;
    
    /// @dev Mapping de schema para array de indices de attestations
    mapping(string => uint256[]) public attestationsBySchema;
    
    /// @dev Mapping de attester para array de indices de attestations
    mapping(address => uint256[]) public attestationsByAttester;
    
    /// @dev Mapping para verificar se um UID já foi registrado
    mapping(bytes32 => bool) public uidExists;
    
    /// @dev Mapping de informações eIDAS por UID de attestation
    mapping(bytes32 => eIDASAttestationInfo) public eidasInfo;
    
    /// @dev Contadores de attestations por nível de garantia
    mapping(uint8 => uint256) public attestationsByLoA;
    
    /// @dev Mapping de attestations que precisam de validação LTV
    mapping(bytes32 => uint256) public ltvValidationRequired;
    
    // ============ EVENTS ============
    
    /**
     * @dev Emitido quando uma nova attestation é adicionada
     */
    event AttestationAdded(
        bytes32 indexed uid,
        string indexed schemaType,
        address indexed attester,
        uint256 timestamp,
        uint256 attestationIndex,
        bool isQualified,
        uint8 levelOfAssurance
    );
    
    /**
     * @dev Emitido quando uma attestation qualificada eIDAS é criada
     */
    event QualifiedAttestationAdded(
        bytes32 indexed uid,
        string indexed schemaType,
        address indexed attester,
        uint8 levelOfAssurance,
        string qtspName,
        string qtspCountry,
        uint256 timestamp
    );
    
    /**
     * @dev Emitido quando o status é alterado
     */
    event StatusChanged(
        bool oldStatus,
        bool newStatus,
        address changedBy,
        uint256 timestamp
    );
    
    /**
     * @dev Emitido quando validação LTV é realizada
     */
    event LTVValidationPerformed(
        bytes32 indexed uid,
        uint256 timestamp,
        bool isValid,
        uint256 nextValidationRequired
    );
    
    /**
     * @dev Emitido quando attestation eIDAS é invalidada
     */
    event eIDASAttestationInvalidated(
        bytes32 indexed uid,
        string reason,
        uint256 timestamp
    );
    
    // ============ ERRORS ============
    
    error OnlyManufacturer(address caller);
    error AttestationAlreadyExists(bytes32 uid);
    error InvalidUID(bytes32 uid);
    error InvalidSchemaType(string schemaType);
    error InvalidAttester(address attester);
    error PassportInactive();
    error AttesterNotQualified(address attester);
    error AttestationNotFound(bytes32 uid);
    error InvalidSignatureFormat(string format);
    error LTVValidationNotRequired(bytes32 uid);
    
    // ============ MODIFIERS ============
    
    /**
     * @dev Apenas o fabricante pode executar
     */
    modifier onlyManufacturer() {
        if (msg.sender != manufacturer) {
            revert OnlyManufacturer(msg.sender);
        }
        _;
    }
    
    /**
     * @dev Verifica se o passaporte está ativo
     */
    modifier whenActive() {
        if (!isActive) {
            revert PassportInactive();
        }
        _;
    }
    
    /**
     * @dev Valida parâmetros da attestation
     */
    modifier validAttestation(
        bytes32 uid, 
        string memory schemaType, 
        address attester
    ) {
        if (uid == bytes32(0)) {
            revert InvalidUID(uid);
        }
        if (bytes(schemaType).length == 0) {
            revert InvalidSchemaType(schemaType);
        }
        if (attester == address(0)) {
            revert InvalidAttester(attester);
        }
        if (uidExists[uid]) {
            revert AttestationAlreadyExists(uid);
        }
        _;
    }
    
    /**
     * @dev Verifica se o formato de assinatura é válido
     */
    modifier validSignatureFormat(string memory format) {
        bytes32 formatHash = keccak256(abi.encodePacked(format));
        if (formatHash != keccak256(abi.encodePacked("CAdES")) &&
            formatHash != keccak256(abi.encodePacked("XAdES")) &&
            formatHash != keccak256(abi.encodePacked("PAdES"))) {
            revert InvalidSignatureFormat(format);
        }
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Inicializa o passaporte digital com suporte eIDAS
     * @param _productId ID único do produto
     * @param _manufacturer Endereço do fabricante
     * @param _eidasAttestor Endereço do contrato eIDAS
     */
    constructor(
        string memory _productId,
        address _manufacturer,
        address _eidasAttestor
    ) {
        require(bytes(_productId).length > 0, "Invalid product ID");
        require(_manufacturer != address(0), "Invalid manufacturer");
        require(_eidasAttestor != address(0), "Invalid eIDAS attestor");
        
        productId = _productId;
        manufacturer = _manufacturer;
        eidasAttestor = eIDASQualifiedAttestor(_eidasAttestor);
        createdAt = block.timestamp;
        isActive = true;
    }
    
    // ============ STANDARD ATTESTATION FUNCTIONS ============
    
    /**
     * @dev Adiciona uma attestation padrão (não qualificada)
     * @param uid UID único da attestation
     * @param schemaType Tipo do schema
     * @param attester Endereço de quem criou a attestation
     */
    function addAttestation(
        bytes32 uid,
        string memory schemaType,
        address attester
    ) 
        external 
        onlyManufacturer 
        nonReentrant 
        whenActive 
        validAttestation(uid, schemaType, attester) 
    {
        _addAttestationInternal(uid, schemaType, attester, false, 0);
    }
    
    // ============ eIDAS QUALIFIED FUNCTIONS ============
    
    /**
     * @dev Adiciona uma attestation qualificada eIDAS
     * @param uid UID único da attestation original
     * @param schemaType Tipo do schema
     * @param attester Endereço de quem criou a attestation
     * @param qualifiedSignature Assinatura eletrônica qualificada
     * @param signatureFormat Formato da assinatura (CAdES, XAdES, PAdES)
     */
    function addQualifiedAttestation(
        bytes32 uid,
        string memory schemaType,
        address attester,
        bytes memory qualifiedSignature,
        string memory signatureFormat
    ) 
        external 
        onlyManufacturer 
        nonReentrant 
        whenActive 
        validAttestation(uid, schemaType, attester)
        validSignatureFormat(signatureFormat)
    {
        // Verificar se é um attester qualificado
        if (!eidasAttestor.isQualifiedAttester(attester)) {
            revert AttesterNotQualified(attester);
        }
        
        // Obter nível de garantia
        uint8 loa = eidasAttestor.getAttesterLoA(attester);
        
        // Criar attestation qualificada no contrato eIDAS
        bytes32 qualifiedUID = eidasAttestor.createQualifiedAttestation(
            uid,
            schemaType,
            abi.encodePacked(productId, schemaType, block.timestamp),
            qualifiedSignature,
            signatureFormat
        );
        
        // Adicionar como attestation no passaporte
        _addAttestationInternal(qualifiedUID, schemaType, attester, true, loa);
        
        // Obter informações da attestation qualificada
        eIDASQualifiedAttestor.QualifiedAttestation memory qualifiedAttestation = 
            eidasAttestor.getQualifiedAttestation(qualifiedUID);
        
        // Armazenar informações eIDAS
        eidasInfo[qualifiedUID] = eIDASAttestationInfo({
            qualifiedCertificateHash: qualifiedAttestation.qualifiedCertificateHash,
            qtspName: qualifiedAttestation.qtspName,
            qtspCountry: qualifiedAttestation.qtspCountry,
            signatureFormat: signatureFormat,
            qualifiedTimestamp: qualifiedAttestation.qualifiedTimestamp,
            crossBorderRecognition: qualifiedAttestation.crossBorderRecognition,
            nextValidationRequired: qualifiedAttestation.nextValidationRequired,
            isValid: true
        });
        
        // Agendar validação LTV
        ltvValidationRequired[qualifiedUID] = qualifiedAttestation.nextValidationRequired;
        
        emit QualifiedAttestationAdded(
            qualifiedUID,
            schemaType,
            attester,
            loa,
            qualifiedAttestation.qtspName,
            qualifiedAttestation.qtspCountry,
            block.timestamp
        );
    }
    
    /**
     * @dev Realiza validação a longo prazo (LTV) de uma attestation qualificada
     * @param uid UID da attestation qualificada
     */
    function performLTVValidation(bytes32 uid) external {
        if (ltvValidationRequired[uid] == 0 || block.timestamp < ltvValidationRequired[uid]) {
            revert LTVValidationNotRequired(uid);
        }
        
        // Realizar validação LTV no contrato eIDAS
        eidasAttestor.performLongTermValidation(uid);
        
        // Obter resultado da validação
        eIDASQualifiedAttestor.QualifiedAttestation memory updatedAttestation = 
            eidasAttestor.getQualifiedAttestation(uid);
        
        // Atualizar informações locais
        eIDASAttestationInfo storage info = eidasInfo[uid];
        info.isValid = updatedAttestation.isValid;
        info.nextValidationRequired = updatedAttestation.nextValidationRequired;
        
        // Atualizar agendamento
        ltvValidationRequired[uid] = updatedAttestation.nextValidationRequired;
        
        // Se attestation foi invalidada, emitir evento
        if (!updatedAttestation.isValid) {
            emit eIDASAttestationInvalidated(uid, "LTV validation failed", block.timestamp);
        }
        
        emit LTVValidationPerformed(
            uid,
            block.timestamp,
            updatedAttestation.isValid,
            updatedAttestation.nextValidationRequired
        );
    }
    
    // ============ MANUFACTURER FUNCTIONS ============
    
    /**
     * @dev Altera o status do passaporte
     * @param newStatus Novo status (ativo/inativo)
     */
    function setStatus(bool newStatus) external onlyManufacturer {
        bool oldStatus = isActive;
        isActive = newStatus;
        
        emit StatusChanged(oldStatus, newStatus, msg.sender, block.timestamp);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Retorna todas as attestations
     * @return AttestationRecord[] Array de attestations
     */
    function getAttestations() external view returns (AttestationRecord[] memory) {
        return attestations;
    }
    
    /**
     * @dev Retorna apenas attestations qualificadas eIDAS
     * @return AttestationRecord[] Array de attestations qualificadas
     */
    function getQualifiedAttestations() external view returns (AttestationRecord[] memory) {
        uint256 qualifiedCount = attestationsByLoA[1] + attestationsByLoA[2];
        AttestationRecord[] memory qualified = new AttestationRecord[](qualifiedCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < attestations.length; i++) {
            if (attestations[i].isQualified) {
                qualified[index] = attestations[i];
                index++;
            }
        }
        
        return qualified;
    }
    
    /**
     * @dev Retorna attestations de um schema específico
     * @param schemaType Tipo do schema
     * @return AttestationRecord[] Array de attestations do schema
     */
    function getAttestationsBySchema(string memory schemaType) 
        external 
        view 
        returns (AttestationRecord[] memory) 
    {
        uint256[] memory indices = attestationsBySchema[schemaType];
        AttestationRecord[] memory result = new AttestationRecord[](indices.length);
        
        for (uint256 i = 0; i < indices.length; i++) {
            result[i] = attestations[indices[i]];
        }
        
        return result;
    }
    
    /**
     * @dev Retorna attestations de um attester específico
     * @param attester Endereço do attester
     * @return AttestationRecord[] Array de attestations do attester
     */
    function getAttestationsByAttester(address attester) 
        external 
        view 
        returns (AttestationRecord[] memory) 
    {
        uint256[] memory indices = attestationsByAttester[attester];
        AttestationRecord[] memory result = new AttestationRecord[](indices.length);
        
        for (uint256 i = 0; i < indices.length; i++) {
            result[i] = attestations[indices[i]];
        }
        
        return result;
    }
    
    /**
     * @dev Retorna attestations por nível de garantia
     * @param loa Nível de garantia (1=Substancial, 2=Alto)
     * @return AttestationRecord[] Array de attestations do LoA
     */
    function getAttestationsByLoA(uint8 loa) 
        external 
        view 
        returns (AttestationRecord[] memory) 
    {
        require(loa >= 1 && loa <= 2, "Invalid LoA");
        
        uint256 count = 0;
        for (uint256 i = 0; i < attestations.length; i++) {
            if (attestations[i].levelOfAssurance == loa) {
                count++;
            }
        }
        
        AttestationRecord[] memory result = new AttestationRecord[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < attestations.length; i++) {
            if (attestations[i].levelOfAssurance == loa) {
                result[index] = attestations[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Retorna informações eIDAS de uma attestation
     * @param uid UID da attestation
     * @return eIDASAttestationInfo Informações eIDAS
     */
    function getEIDASInfo(bytes32 uid) external view returns (eIDASAttestationInfo memory) {
        return eidasInfo[uid];
    }
    
    /**
     * @dev Verifica se o passaporte tem attestations de alto nível de garantia
     * @return bool Se tem attestations de LoA alto
     */
    function hasHighAssuranceAttestations() external view returns (bool) {
        return attestationsByLoA[2] > 0;
    }
    
    /**
     * @dev Verifica se o passaporte tem attestations com reconhecimento transfronteiriço
     * @return bool Se tem reconhecimento transfronteiriço
     */
    function hasCrossBorderRecognition() external view returns (bool) {
        for (uint256 i = 0; i < attestations.length; i++) {
            if (attestations[i].isQualified && 
                eidasInfo[attestations[i].uid].crossBorderRecognition) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Retorna o total de attestations
     * @return uint256 Número total de attestations
     */
    function getTotalAttestations() external view returns (uint256) {
        return attestations.length;
    }
    
    /**
     * @dev Retorna estatísticas de attestations por tipo
     * @return uint256 Total, qualificadas, LoA substancial, LoA alto
     */
    function getAttestationStats() external view returns (uint256, uint256, uint256, uint256) {
        uint256 total = attestations.length;
        uint256 qualified = attestationsByLoA[1] + attestationsByLoA[2];
        uint256 substantial = attestationsByLoA[1];
        uint256 high = attestationsByLoA[2];
        
        return (total, qualified, substantial, high);
    }
    
    /**
     * @dev Lista attestations que precisam de validação LTV
     * @return bytes32[] Array de UIDs que precisam validação
     */
    function getAttestationsRequiringLTV() external view returns (bytes32[] memory) {
        uint256 count = 0;
        
        // Contar attestations que precisam validação
        for (uint256 i = 0; i < attestations.length; i++) {
            bytes32 uid = attestations[i].uid;
            if (ltvValidationRequired[uid] != 0 && 
                block.timestamp >= ltvValidationRequired[uid]) {
                count++;
            }
        }
        
        // Criar array resultado
        bytes32[] memory result = new bytes32[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < attestations.length; i++) {
            bytes32 uid = attestations[i].uid;
            if (ltvValidationRequired[uid] != 0 && 
                block.timestamp >= ltvValidationRequired[uid]) {
                result[index] = uid;
                index++;
            }
        }
        
        return result;
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @dev Função interna para adicionar attestation
     * @param uid UID da attestation
     * @param schemaType Tipo do schema
     * @param attester Endereço do attester
     * @param isQualified Se é attestation qualificada
     * @param loa Nível de garantia
     */
    function _addAttestationInternal(
        bytes32 uid,
        string memory schemaType,
        address attester,
        bool isQualified,
        uint8 loa
    ) internal {
        // Criar nova attestation
        AttestationRecord memory newAttestation = AttestationRecord({
            uid: uid,
            schemaType: schemaType,
            attester: attester,
            timestamp: block.timestamp,
            isQualified: isQualified,
            levelOfAssurance: loa
        });
        
        // Adicionar ao array principal
        attestations.push(newAttestation);
        uint256 attestationIndex = attestations.length - 1;
        
        // Atualizar indices por schema
        attestationsBySchema[schemaType].push(attestationIndex);
        
        // Atualizar indices por attester
        attestationsByAttester[attester].push(attestationIndex);
        
        // Marcar UID como existente
        uidExists[uid] = true;
        
        // Atualizar contadores por LoA
        if (loa > 0) {
            attestationsByLoA[loa]++;
        }
        
        emit AttestationAdded(
            uid,
            schemaType,
            attester,
            block.timestamp,
            attestationIndex,
            isQualified,
            loa
        );
    }
} 