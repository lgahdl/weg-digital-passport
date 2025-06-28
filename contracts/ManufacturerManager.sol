// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./DigitalPassportFactory.sol";
import "./DigitalPassport_eIDAS.sol";
import "./eIDASQualifiedAttestor.sol";

/**
 * @title ManufacturerManager
 * @dev Abstract base contract for manufacturer-specific managers with eIDAS support
 * @author WEG Digital Passport Team
 */
abstract contract ManufacturerManager is Ownable, ReentrancyGuard {
    
    // ============ STRUCTS ============
    
    /**
     * @dev Information about a role in the system
     */
    struct RoleInfo {
        string name;                     // Nome da role
        string description;              // Descrição da role
        string[] allowedSchemas;         // Schemas que esta role pode usar
        uint256 createdAt;              // Data de criação
        bool isActive;                   // Status ativo
        uint8 requiredLoA;              // Nível de garantia mínimo requerido (0=qualquer, 1=substancial, 2=alto)
        bool requiresQualifiedSignature; // Se requer assinatura qualificada eIDAS
    }
    
    /**
     * @dev Information about a stakeholder
     */
    struct StakeholderInfo {
        string name;                     // Nome do stakeholder
        string role;                     // Nome da role
        string additionalInfo;           // Informações adicionais
        uint256 registrationDate;       // Data de registro
        bool isActive;                   // Status ativo
        uint8 currentLoA;               // Nível de garantia atual
        bytes32 qualifiedCertHash;      // Hash do certificado qualificado (se aplicável)
        string qtspName;                // Nome do QTSP (se aplicável)
        string country;                 // País do stakeholder
        bool hasQualifiedSignature;     // Se possui assinatura qualificada
    }
    
    /**
     * @dev Schema registration information
     */
    struct SchemaInfo {
        bytes32 schemaId;               // ID do schema no EAS
        string schemaName;              // Nome do schema
        string schemaDefinition;        // Definição do schema
        bool isActive;                  // Status ativo
        uint256 registeredAt;           // Data de registro
        uint8 minimumLoA;              // LoA mínimo para usar este schema
        bool requiresQualifiedAttestation; // Se requer attestation qualificada
    }
    
    // ============ STORAGE ============
    
    /// @dev Address of the manufacturer (company wallet)
    address public manufacturer;
    
    /// @dev Name of the manufacturer
    string public manufacturerName;
    
    /// @dev Country of the manufacturer (ISO 3166-1)
    string public manufacturerCountry;
    
    /// @dev Reference to the factory contract
    DigitalPassportFactory public immutable factory;
    
    /// @dev Reference to the eIDAS qualified attestor
    eIDASQualifiedAttestor public immutable eidasAttestor;
    
    /// @dev Mapping of registered schemas
    mapping(string => SchemaInfo) public registeredSchemas;
    
    /// @dev Array of schema names for iteration
    string[] public schemaNames;
    
    /// @dev Mapping of roles
    mapping(string => RoleInfo) public roles;
    
    /// @dev Array of role names for iteration
    string[] public roleNames;
    
    /// @dev Mapping of stakeholders
    mapping(address => StakeholderInfo) public stakeholders;
    
    /// @dev Array of stakeholder addresses for iteration
    address[] public stakeholderAddresses;
    
    /// @dev Mapping to check if stakeholder is authorized
    mapping(address => bool) public isAuthorizedStakeholder;
    
    /// @dev Mapping from role to list of stakeholders
    mapping(string => address[]) public stakeholdersByRole;
    
    /// @dev Counter for total attestations created
    uint256 public totalAttestationsCreated;
    
    /// @dev Mapping to track attestations by schema
    mapping(string => uint256) public attestationsBySchema;
    
    // ============ EVENTS ============
    
    event RoleCreated(
        string indexed roleName,
        string description,
        uint8 requiredLoA,
        bool requiresQualifiedSignature,
        uint256 timestamp
    );
    
    event StakeholderAdded(
        address indexed stakeholder,
        string indexed role,
        string name,
        uint8 currentLoA,
        uint256 timestamp
    );
    
    event StakeholderUpdated(
        address indexed stakeholder,
        string newRole,
        uint8 newLoA,
        uint256 timestamp
    );
    
    event SchemaRegistered(
        string indexed schemaName,
        bytes32 schemaId,
        uint8 minimumLoA,
        bool requiresQualifiedAttestation,
        uint256 timestamp
    );
    
    event AttestationCreated(
        address indexed passport,
        string indexed schemaName,
        address indexed attester,
        bool isQualified,
        uint8 levelOfAssurance,
        uint256 timestamp
    );
    
    event QualifiedCertificateAssigned(
        address indexed stakeholder,
        bytes32 certificateHash,
        string qtspName,
        uint8 levelOfAssurance,
        uint256 timestamp
    );
    
    // ============ ERRORS ============
    
    error RoleAlreadyExists(string roleName);
    error RoleNotFound(string roleName);
    error StakeholderAlreadyExists(address stakeholder);
    error StakeholderNotFound(address stakeholder);
    error SchemaAlreadyRegistered(string schemaName);
    error SchemaNotFound(string schemaName);
    error UnauthorizedStakeholder(address stakeholder);
    error InsufficientLoA(uint8 required, uint8 current);
    error QualifiedSignatureRequired();
    error InvalidPassportAddress(address passport);
    error InvalidCountryCode(string country);
    
    // ============ MODIFIERS ============
    
    modifier onlyAuthorizedStakeholder() {
        if (!isAuthorizedStakeholder[msg.sender]) {
            revert UnauthorizedStakeholder(msg.sender);
        }
        _;
    }
    
    modifier validRole(string memory roleName) {
        if (!roles[roleName].isActive) {
            revert RoleNotFound(roleName);
        }
        _;
    }
    
    modifier validSchema(string memory schemaName) {
        if (!registeredSchemas[schemaName].isActive) {
            revert SchemaNotFound(schemaName);
        }
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Initialize the manufacturer manager
     * @param _factory Address of the DigitalPassportFactory
     * @param _eidasAttestor Address of the eIDASQualifiedAttestor
     * @param _manufacturer Address of the manufacturer wallet
     * @param _manufacturerName Name of the manufacturer
     * @param _manufacturerCountry Country code of the manufacturer
     */
    constructor(
        address _factory,
        address _eidasAttestor,
        address _manufacturer,
        string memory _manufacturerName,
        string memory _manufacturerCountry
    ) Ownable(msg.sender) {
        require(_factory != address(0), "Invalid factory address");
        require(_eidasAttestor != address(0), "Invalid eIDAS attestor address");
        require(_manufacturer != address(0), "Invalid manufacturer address");
        require(bytes(_manufacturerName).length > 0, "Invalid manufacturer name");
        require(bytes(_manufacturerCountry).length == 2, "Invalid country code"); // ISO 3166-1
        
        factory = DigitalPassportFactory(_factory);
        eidasAttestor = eIDASQualifiedAttestor(_eidasAttestor);
        manufacturer = _manufacturer;
        manufacturerName = _manufacturerName;
        manufacturerCountry = _manufacturerCountry;
        
        // Note: Roles and stakeholders will be initialized by derived contracts
        // This allows for manufacturer-specific role definitions
    }
    
    // ============ ROLE MANAGEMENT ============
    
    /**
     * @dev Create a new role
     * @param name Name of the role
     * @param description Description of the role
     * @param allowedSchemas Array of schema names this role can use
     * @param requiredLoA Minimum level of assurance required
     * @param requiresQualifiedSignature If qualified signature is required
     */
    function createRole(
        string memory name,
        string memory description,
        string[] memory allowedSchemas,
        uint8 requiredLoA,
        bool requiresQualifiedSignature
    ) external onlyOwner {
        _createRole(name, description, allowedSchemas, requiredLoA, requiresQualifiedSignature);
    }
    
    /**
     * @dev Update an existing role
     * @param name Name of the role to update
     * @param newAllowedSchemas New array of allowed schemas
     * @param newRequiredLoA New minimum LoA
     * @param newRequiresQualifiedSignature New qualified signature requirement
     */
    function updateRole(
        string memory name,
        string[] memory newAllowedSchemas,
        uint8 newRequiredLoA,
        bool newRequiresQualifiedSignature
    ) external onlyOwner validRole(name) {
        RoleInfo storage role = roles[name];
        role.allowedSchemas = newAllowedSchemas;
        role.requiredLoA = newRequiredLoA;
        role.requiresQualifiedSignature = newRequiresQualifiedSignature;
    }
    
    // ============ STAKEHOLDER MANAGEMENT ============
    
    /**
     * @dev Add a new stakeholder
     * @param stakeholderAddress Address of the stakeholder
     * @param name Name of the stakeholder
     * @param roleName Role to assign
     * @param additionalInfo Additional information
     */
    function addStakeholder(
        address stakeholderAddress,
        string memory name,
        string memory roleName,
        string memory additionalInfo
    ) external onlyOwner validRole(roleName) {
        if (isAuthorizedStakeholder[stakeholderAddress]) {
            revert StakeholderAlreadyExists(stakeholderAddress);
        }
        
        _addStakeholderInternal(
            stakeholderAddress,
            roleName,
            name,
            additionalInfo,
            0, // No LoA initially
            bytes32(0),
            "",
            false
        );
    }
    
    /**
     * @dev Assign qualified certificate to stakeholder
     * @param stakeholderAddress Address of the stakeholder
     * @param certificateHash Hash of the qualified certificate
     * @param qtspName Name of the QTSP
     * @param levelOfAssurance Level of assurance from certificate
     */
    function assignQualifiedCertificate(
        address stakeholderAddress,
        bytes32 certificateHash,
        string memory qtspName,
        uint8 levelOfAssurance
    ) external onlyOwner {
        if (!isAuthorizedStakeholder[stakeholderAddress]) {
            revert StakeholderNotFound(stakeholderAddress);
        }
        
        // Verify certificate is valid in eIDAS system
        require(
            eidasAttestor.isCertificateValid(certificateHash),
            "Certificate not valid in eIDAS"
        );
        
        StakeholderInfo storage stakeholder = stakeholders[stakeholderAddress];
        stakeholder.currentLoA = levelOfAssurance;
        stakeholder.qualifiedCertHash = certificateHash;
        stakeholder.qtspName = qtspName;
        stakeholder.hasQualifiedSignature = true;
        
        emit QualifiedCertificateAssigned(
            stakeholderAddress,
            certificateHash,
            qtspName,
            levelOfAssurance,
            block.timestamp
        );
    }
    
    // ============ SCHEMA MANAGEMENT ============
    
    /**
     * @dev Register a new schema
     * @param schemaName Name of the schema
     * @param schemaId ID of the schema in EAS
     * @param schemaDefinition Definition string of the schema
     * @param minimumLoA Minimum LoA required to use this schema
     * @param requiresQualifiedAttestation If qualified attestation is required
     */
    function registerSchema(
        string memory schemaName,
        bytes32 schemaId,
        string memory schemaDefinition,
        uint8 minimumLoA,
        bool requiresQualifiedAttestation
    ) external onlyOwner {
        if (registeredSchemas[schemaName].isActive) {
            revert SchemaAlreadyRegistered(schemaName);
        }
        
        registeredSchemas[schemaName] = SchemaInfo({
            schemaId: schemaId,
            schemaName: schemaName,
            schemaDefinition: schemaDefinition,
            isActive: true,
            registeredAt: block.timestamp,
            minimumLoA: minimumLoA,
            requiresQualifiedAttestation: requiresQualifiedAttestation
        });
        
        schemaNames.push(schemaName);
        
        emit SchemaRegistered(
            schemaName,
            schemaId,
            minimumLoA,
            requiresQualifiedAttestation,
            block.timestamp
        );
    }
    
    // ============ ATTESTATION FUNCTIONS ============
    
    /**
     * @dev Create an attestation to a product passport
     * @param passportAddress Address of the passport contract
     * @param schemaName Name of the schema to use
     * @param data Attestation data
     * @param useQualifiedSignature Whether to use qualified signature
     * @param signatureFormat Format for qualified signature (if applicable)
     */
    function attestToProduct(
        address passportAddress,
        string memory schemaName,
        bytes memory data,
        bool useQualifiedSignature,
        string memory signatureFormat
    ) public onlyAuthorizedStakeholder validSchema(schemaName) {
        _attestToProduct(passportAddress, schemaName, data, useQualifiedSignature, signatureFormat);
    }

    /**
     * @dev Internal function to create an attestation to a product passport
     * @param passportAddress Address of the passport contract
     * @param schemaName Name of the schema to use
     * @param data Attestation data
     * @param useQualifiedSignature Whether to use qualified signature
     * @param signatureFormat Format for qualified signature (if applicable)
     */
    function _attestToProduct(
        address passportAddress,
        string memory schemaName,
        bytes memory data,
        bool useQualifiedSignature,
        string memory signatureFormat
    ) internal validSchema(schemaName) {
        // Verify passport is valid
        if (passportAddress == address(0)) {
            revert InvalidPassportAddress(passportAddress);
        }
        
        // Get stakeholder and role info
        StakeholderInfo memory stakeholder = stakeholders[msg.sender];
        RoleInfo memory role = roles[stakeholder.role];
        SchemaInfo memory schema = registeredSchemas[schemaName];
        
        // Check if stakeholder has permission to use this schema
        bool hasSchemaPermission = false;
        for (uint256 i = 0; i < role.allowedSchemas.length; i++) {
            if (keccak256(abi.encodePacked(role.allowedSchemas[i])) == 
                keccak256(abi.encodePacked(schemaName))) {
                hasSchemaPermission = true;
                break;
            }
        }
        require(hasSchemaPermission, "Role not authorized for this schema");
        
        // Check LoA requirements
        if (stakeholder.currentLoA < schema.minimumLoA) {
            revert InsufficientLoA(schema.minimumLoA, stakeholder.currentLoA);
        }
        
        // Check qualified signature requirements
        if (schema.requiresQualifiedAttestation || role.requiresQualifiedSignature) {
            if (!useQualifiedSignature || !stakeholder.hasQualifiedSignature) {
                revert QualifiedSignatureRequired();
            }
        }
        
        // Generate attestation UID
        bytes32 attestationUID = keccak256(abi.encodePacked(
            passportAddress,
            schemaName,
            msg.sender,
            block.timestamp,
            totalAttestationsCreated
        ));
        
        // Create attestation on passport
        DigitalPassport_eIDAS passport = DigitalPassport_eIDAS(passportAddress);
        
        if (useQualifiedSignature && stakeholder.hasQualifiedSignature) {
            // Create qualified attestation
            bytes memory qualifiedSignature = abi.encodePacked(
                attestationUID,
                data,
                stakeholder.qualifiedCertHash
            );
            
            passport.addQualifiedAttestation(
                attestationUID,
                schemaName,
                msg.sender,
                qualifiedSignature,
                signatureFormat
            );
            
            emit AttestationCreated(
                passportAddress,
                schemaName,
                msg.sender,
                true,
                stakeholder.currentLoA,
                block.timestamp
            );
        } else {
            // Create regular attestation
            passport.addAttestation(
                attestationUID,
                schemaName,
                msg.sender
            );
            
            emit AttestationCreated(
                passportAddress,
                schemaName,
                msg.sender,
                false,
                0,
                block.timestamp
            );
        }
        
        // Update statistics
        totalAttestationsCreated++;
        attestationsBySchema[schemaName]++;
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Check if stakeholder has permission to use a schema
     * @param stakeholderAddress Address of the stakeholder
     * @param schemaName Name of the schema
     * @return bool True if has permission
     */
    function hasPermission(address stakeholderAddress, string memory schemaName) 
        external 
        view 
        returns (bool) 
    {
        if (!isAuthorizedStakeholder[stakeholderAddress]) {
            return false;
        }
        
        StakeholderInfo memory stakeholder = stakeholders[stakeholderAddress];
        RoleInfo memory role = roles[stakeholder.role];
        
        for (uint256 i = 0; i < role.allowedSchemas.length; i++) {
            if (keccak256(abi.encodePacked(role.allowedSchemas[i])) == 
                keccak256(abi.encodePacked(schemaName))) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Get role of a stakeholder
     * @param stakeholderAddress Address of the stakeholder
     * @return string Role name
     */
    function getStakeholderRole(address stakeholderAddress) external view returns (string memory) {
        return stakeholders[stakeholderAddress].role;
    }
    
    /**
     * @dev Get all stakeholders
     * @return address[] Array of stakeholder addresses
     */
    function getStakeholders() external view returns (address[] memory) {
        return stakeholderAddresses;
    }
    
    /**
     * @dev Get all registered schemas
     * @return string[] Array of schema names
     */
    function getRegisteredSchemas() external view returns (string[] memory) {
        return schemaNames;
    }
    
    /**
     * @dev Get all roles
     * @return string[] Array of role names
     */
    function getRoles() external view returns (string[] memory) {
        return roleNames;
    }
    
    /**
     * @dev Get stakeholders by role
     * @param roleName Name of the role
     * @return address[] Array of stakeholder addresses
     */
    function getStakeholdersByRole(string memory roleName) external view returns (address[] memory) {
        return stakeholdersByRole[roleName];
    }
    
    /**
     * @dev Get system statistics
     * @return totalStakeholders Number of stakeholders
     * @return totalRoles Number of roles
     * @return totalSchemas Number of schemas
     * @return totalAttestations Number of attestations created
     */
    function getSystemStats() external view returns (uint256, uint256, uint256, uint256) {
        return (
            stakeholderAddresses.length,
            roleNames.length,
            schemaNames.length,
            totalAttestationsCreated
        );
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @dev Internal function to create a role
     */
    function _createRole(
        string memory name,
        string memory description,
        string[] memory allowedSchemas,
        uint8 requiredLoA,
        bool requiresQualifiedSignature
    ) internal {
        if (roles[name].isActive) {
            revert RoleAlreadyExists(name);
        }
        
        roles[name] = RoleInfo({
            name: name,
            description: description,
            allowedSchemas: allowedSchemas,
            createdAt: block.timestamp,
            isActive: true,
            requiredLoA: requiredLoA,
            requiresQualifiedSignature: requiresQualifiedSignature
        });
        
        roleNames.push(name);
        
        emit RoleCreated(
            name,
            description,
            requiredLoA,
            requiresQualifiedSignature,
            block.timestamp
        );
    }
    
    /**
     * @dev Internal function to register a schema
     */
    function _registerSchema(
        string memory schemaName,
        bytes32 schemaId,
        string memory schemaDefinition,
        uint8 minimumLoA,
        bool requiresQualifiedAttestation
    ) internal {
        registeredSchemas[schemaName] = SchemaInfo({
            schemaId: schemaId,
            schemaName: schemaName,
            schemaDefinition: schemaDefinition,
            isActive: true,
            registeredAt: block.timestamp,
            minimumLoA: minimumLoA,
            requiresQualifiedAttestation: requiresQualifiedAttestation
        });
        
        schemaNames.push(schemaName);
        
        emit SchemaRegistered(
            schemaName,
            schemaId,
            minimumLoA,
            requiresQualifiedAttestation,
            block.timestamp
        );
    }

    /**
     * @dev Internal function to add a stakeholder
     */
    function _addStakeholderInternal(
        address stakeholderAddress,
        string memory roleName,
        string memory name,
        string memory additionalInfo,
        uint8 currentLoA,
        bytes32 qualifiedCertHash,
        string memory qtspName,
        bool hasQualifiedSignature
    ) internal {
        stakeholders[stakeholderAddress] = StakeholderInfo({
            name: name,
            role: roleName,
            additionalInfo: additionalInfo,
            registrationDate: block.timestamp,
            isActive: true,
            currentLoA: currentLoA,
            qualifiedCertHash: qualifiedCertHash,
            qtspName: qtspName,
            country: manufacturerCountry,
            hasQualifiedSignature: hasQualifiedSignature
        });
        
        stakeholderAddresses.push(stakeholderAddress);
        stakeholdersByRole[roleName].push(stakeholderAddress);
        isAuthorizedStakeholder[stakeholderAddress] = true;
        
        emit StakeholderAdded(
            stakeholderAddress,
            roleName,
            name,
            currentLoA,
            block.timestamp
        );
    }
    
    // ============ ABSTRACT FUNCTIONS ============
    
    /**
     * @dev Initialize manufacturer-specific schemas
     * Must be implemented by derived contracts
     */
    function _initializeSchemas() internal virtual;
    
    /**
     * @dev Initialize manufacturer-specific roles
     * Must be implemented by derived contracts
     */
    function _initializeRoles() internal virtual;
} 