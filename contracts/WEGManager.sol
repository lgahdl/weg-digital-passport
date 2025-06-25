// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ManufacturerManager.sol";

/**
 * @title WEGManager
 * @dev WEG-specific manufacturer manager with eIDAS support
 * @author WEG Digital Passport Team
 */
contract WEGManager is ManufacturerManager {
    
    // ============ WEG SPECIFIC STORAGE ============
    
    /// @dev WEG Schema IDs (to be registered in EAS)
    bytes32 public WEG_PRODUCT_INIT_SCHEMA;
    bytes32 public WEG_TRANSPORT_EVENT_SCHEMA;
    bytes32 public WEG_OWNERSHIP_TRANSFER_SCHEMA;
    bytes32 public WEG_MAINTENANCE_EVENT_SCHEMA;
    bytes32 public WEG_END_OF_LIFE_SCHEMA;
    
    /// @dev WEG-specific constants
    string public constant WEG_COMPANY_NAME = "WEG S.A.";
    string public constant WEG_COUNTRY_CODE = "BR";
    
    /// @dev Mapping of real WEG stakeholders
    mapping(string => address) public wegStakeholders;
    
    /// @dev Product lifecycle tracking
    mapping(string => uint8) public productLifecycleStage; // 0=init, 1=transport, 2=ownership, 3=maintenance, 4=end_of_life
    
    /// @dev Total products in each lifecycle stage
    mapping(uint8 => uint256) public productsInStage;
    
    // ============ EVENTS ============
    
    event WEGSchemaRegistered(
        string indexed schemaName,
        bytes32 schemaId,
        uint256 timestamp
    );
    
    event WEGStakeholderMapped(
        string indexed stakeholderName,
        address indexed stakeholderAddress,
        string role,
        uint256 timestamp
    );
    
    event ProductLifecycleUpdated(
        string indexed productId,
        uint8 oldStage,
        uint8 newStage,
        address updatedBy,
        uint256 timestamp
    );
    
    event WEGSystemInitialized(
        uint256 totalSchemas,
        uint256 totalRoles,
        uint256 totalStakeholders,
        uint256 timestamp
    );
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Initialize WEG Manager with eIDAS support
     * @param _factory Address of DigitalPassportFactory
     * @param _eidasAttestor Address of eIDASQualifiedAttestor
     * @param _wegWallet WEG primary wallet address
     */
    constructor(
        address _factory,
        address _eidasAttestor,
        address _wegWallet
    ) ManufacturerManager(
        _factory,
        _eidasAttestor,
        _wegWallet,
        WEG_COMPANY_NAME,
        WEG_COUNTRY_CODE
    ) {
        // Initialize WEG-specific schemas and roles
        _initializeWEGSchemas();
        _initializeWEGRoles();
        _mapWEGStakeholders();
        
        emit WEGSystemInitialized(5, 8, 8, block.timestamp);
    }
    
    // ============ WEG SPECIFIC FUNCTIONS ============
    
    /**
     * @dev Create a WEG product with initial attestation
     * @param productId Unique product identifier (e.g., "WEG-W22-2024-001")
     * @param productModel Product model (e.g., "W22 100HP")
     * @param serialNumber Serial number
     * @param composition Material composition
     * @param suppliers Array of supplier names
     * @param manufacturingLocation Manufacturing location
     * @param qualityStandards Quality standards met
     * @param useQualifiedSignature Whether to use eIDAS qualified signature
     */
    function createWEGProduct(
        string memory productId,
        string memory productModel,
        string memory serialNumber,
        string memory composition,
        string[] memory suppliers,
        string memory manufacturingLocation,
        string memory qualityStandards,
        bool useQualifiedSignature
    ) external onlyOwner nonReentrant returns (address) {
        
        // Create passport through factory
        address passportAddress = factory.createProduct(productId, address(this));
        
        // Prepare initial attestation data
        bytes memory attestationData = abi.encode(
            productModel,
            serialNumber,
            block.timestamp,
            composition,
            suppliers,
            manufacturingLocation,
            qualityStandards
        );
        
        // Create initial attestation
        attestToProduct(
            passportAddress,
            "WEG_PRODUCT_INIT",
            attestationData,
            useQualifiedSignature,
            "CAdES" // European standard for digital signatures
        );
        
        // Initialize product lifecycle
        productLifecycleStage[productId] = 0; // init stage
        productsInStage[0]++;
        
        return passportAddress;
    }
    
    /**
     * @dev Record transport event with eIDAS qualified signature
     * @param productId Product identifier
     * @param title Event title
     * @param responsible Responsible party address
     * @param recipient Recipient address
     * @param description Event description
     * @param origin Origin location
     * @param destination Destination location
     * @param trackingInfo Tracking information
     * @param useQualifiedSignature Whether to use eIDAS qualified signature
     */
    function addTransportEvent(
        string memory productId,
        string memory title,
        address responsible,
        address recipient,
        string memory description,
        string memory origin,
        string memory destination,
        string memory trackingInfo,
        bool useQualifiedSignature
    ) external onlyAuthorizedStakeholder nonReentrant {
        
        address passportAddress = factory.getPassportAddress(productId);
        require(passportAddress != address(0), "Product passport not found");
        
        bytes memory attestationData = abi.encode(
            title,
            responsible,
            recipient,
            block.timestamp,
            description,
            origin,
            destination,
            trackingInfo
        );
        
        attestToProduct(
            passportAddress,
            "WEG_TRANSPORT_EVENT",
            attestationData,
            useQualifiedSignature,
            "XAdES" // XML Advanced Electronic Signatures
        );
        
        _updateProductLifecycle(productId, 1);
    }
    
    /**
     * @dev Record ownership transfer with qualified signature
     * @param productId Product identifier
     * @param previousOwner Previous owner address
     * @param newOwner New owner address
     * @param transferType Type of transfer
     * @param contractReference Contract reference
     * @param transferValue Transfer value
     * @param description Transfer description
     * @param useQualifiedSignature Whether to use eIDAS qualified signature
     */
    function addOwnershipTransfer(
        string memory productId,
        address previousOwner,
        address newOwner,
        string memory transferType,
        string memory contractReference,
        uint256 transferValue,
        string memory description,
        bool useQualifiedSignature
    ) external onlyAuthorizedStakeholder nonReentrant {
        
        address passportAddress = factory.getPassportAddress(productId);
        require(passportAddress != address(0), "Product passport not found");
        
        bytes memory attestationData = abi.encode(
            previousOwner,
            newOwner,
            block.timestamp,
            transferType,
            contractReference,
            transferValue,
            description
        );
        
        attestToProduct(
            passportAddress,
            "WEG_OWNERSHIP_TRANSFER",
            attestationData,
            useQualifiedSignature,
            "PAdES" // PDF Advanced Electronic Signatures
        );
        
        _updateProductLifecycle(productId, 2);
    }
    
    /**
     * @dev Record maintenance event with technician qualified signature
     * @param productId Product identifier
     * @param eventType Type of maintenance event
     * @param technician Technician address
     * @param maintenanceType Type of maintenance
     * @param description Maintenance description
     * @param partsReplaced Array of replaced parts
     * @param nextScheduledMaintenance Next maintenance date
     * @param useQualifiedSignature Whether to use eIDAS qualified signature
     */
    function addMaintenanceEvent(
        string memory productId,
        string memory eventType,
        address technician,
        string memory maintenanceType,
        string memory description,
        string[] memory partsReplaced,
        string memory nextScheduledMaintenance,
        bool useQualifiedSignature
    ) external onlyAuthorizedStakeholder nonReentrant {
        
        address passportAddress = factory.getPassportAddress(productId);
        require(passportAddress != address(0), "Product passport not found");
        
        bytes memory attestationData = abi.encode(
            eventType,
            technician,
            block.timestamp,
            maintenanceType,
            description,
            partsReplaced,
            nextScheduledMaintenance
        );
        
        attestToProduct(
            passportAddress,
            "WEG_MAINTENANCE_EVENT",
            attestationData,
            useQualifiedSignature,
            "CAdES"
        );
        
        _updateProductLifecycle(productId, 3);
    }
    
    /**
     * @dev Record end of life with recycler qualified signature
     * @param productId Product identifier
     * @param reason Reason for end of life
     * @param finalizer Finalizer address
     * @param condition Final condition
     * @param disposalMethod Disposal method used
     * @param recycler Recycler address
     * @param environmentalImpact Environmental impact assessment
     * @param useQualifiedSignature Whether to use eIDAS qualified signature
     */
    function addEndOfLife(
        string memory productId,
        string memory reason,
        address finalizer,
        string memory condition,
        string memory disposalMethod,
        address recycler,
        string memory environmentalImpact,
        bool useQualifiedSignature
    ) external onlyAuthorizedStakeholder nonReentrant {
        
        address passportAddress = factory.getPassportAddress(productId);
        require(passportAddress != address(0), "Product passport not found");
        
        bytes memory attestationData = abi.encode(
            block.timestamp,
            reason,
            finalizer,
            condition,
            disposalMethod,
            recycler,
            environmentalImpact
        );
        
        attestToProduct(
            passportAddress,
            "WEG_END_OF_LIFE",
            attestationData,
            useQualifiedSignature,
            "CAdES"
        );
        
        _updateProductLifecycle(productId, 4);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get WEG stakeholder address by name
     * @param stakeholderName Name of the stakeholder
     * @return address Address of the stakeholder
     */
    function getWEGStakeholder(string memory stakeholderName) external view returns (address) {
        return wegStakeholders[stakeholderName];
    }
    
    /**
     * @dev Get product lifecycle stage
     * @param productId Product identifier
     * @return uint8 Lifecycle stage
     */
    function getProductLifecycleStage(string memory productId) external view returns (uint8) {
        return productLifecycleStage[productId];
    }
    
    /**
     * @dev Get products count in each lifecycle stage
     * @return uint256[5] Array with counts for each stage
     */
    function getLifecycleStatistics() external view returns (uint256[5] memory) {
        return [
            productsInStage[0], // init
            productsInStage[1], // transport
            productsInStage[2], // ownership
            productsInStage[3], // maintenance
            productsInStage[4]  // end_of_life
        ];
    }
    
    /**
     * @dev Get all WEG schema IDs
     * @return bytes32[5] Array of schema IDs
     */
    function getWEGSchemas() external view returns (bytes32[5] memory) {
        return [
            WEG_PRODUCT_INIT_SCHEMA,
            WEG_TRANSPORT_EVENT_SCHEMA,
            WEG_OWNERSHIP_TRANSFER_SCHEMA,
            WEG_MAINTENANCE_EVENT_SCHEMA,
            WEG_END_OF_LIFE_SCHEMA
        ];
    }
    
    /**
     * @dev Get WEG system overview
     * @return company Company name
     * @return country Country code
     * @return totalSchemas Number of schemas
     * @return totalRoles Number of roles
     * @return totalStakeholders Number of stakeholders
     * @return totalProducts Total products created
     */
    function getWEGSystemOverview() external view returns (
        string memory company,
        string memory country,
        uint256 totalSchemas,
        uint256 totalRoles,
        uint256 totalStakeholders,
        uint256 totalProducts
    ) {
        return (
            WEG_COMPANY_NAME,
            WEG_COUNTRY_CODE,
            schemaNames.length,
            roleNames.length,
            stakeholderAddresses.length,
            factory.getManufacturerProductCount(address(this))
        );
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @dev Initialize WEG-specific schemas with eIDAS requirements
     */
    function _initializeSchemas() internal override {
        _initializeWEGSchemas();
    }
    
    /**
     * @dev Initialize WEG-specific roles
     */
    function _initializeRoles() internal override {
        _initializeWEGRoles();
    }
    
    /**
     * @dev Initialize WEG schemas
     */
    function _initializeWEGSchemas() internal {
        // Schema 1: Product Initialization - Requires HIGH LoA and qualified signature
        WEG_PRODUCT_INIT_SCHEMA = keccak256("WEG_PRODUCT_INIT");
        registerSchema(
            "WEG_PRODUCT_INIT",
            WEG_PRODUCT_INIT_SCHEMA,
            "string productModel,string serialNumber,uint256 timestamp,string composition,string[] suppliers,string manufacturingLocation,string qualityStandards",
            2, // HIGH LoA required
            true // Qualified attestation required
        );
        
        // Schema 2: Transport Events - Requires SUBSTANTIAL LoA
        WEG_TRANSPORT_EVENT_SCHEMA = keccak256("WEG_TRANSPORT_EVENT");
        registerSchema(
            "WEG_TRANSPORT_EVENT",
            WEG_TRANSPORT_EVENT_SCHEMA,
            "string title,address responsible,address recipient,uint256 timestamp,string description,string origin,string destination,string trackingInfo",
            1, // SUBSTANTIAL LoA required
            true // Qualified attestation recommended
        );
        
        // Schema 3: Ownership Transfer - Requires HIGH LoA for legal validity
        WEG_OWNERSHIP_TRANSFER_SCHEMA = keccak256("WEG_OWNERSHIP_TRANSFER");
        registerSchema(
            "WEG_OWNERSHIP_TRANSFER",
            WEG_OWNERSHIP_TRANSFER_SCHEMA,
            "address previousOwner,address newOwner,uint256 timestamp,string transferType,string contractReference,uint256 transferValue,string description",
            2, // HIGH LoA required for legal transfers
            true // Qualified attestation required
        );
        
        // Schema 4: Maintenance Events - Requires SUBSTANTIAL LoA
        WEG_MAINTENANCE_EVENT_SCHEMA = keccak256("WEG_MAINTENANCE_EVENT");
        registerSchema(
            "WEG_MAINTENANCE_EVENT",
            WEG_MAINTENANCE_EVENT_SCHEMA,
            "string eventType,address technician,uint256 timestamp,string maintenanceType,string description,string[] partsReplaced,string nextScheduledMaintenance",
            1, // SUBSTANTIAL LoA required
            false // Regular attestation acceptable
        );
        
        // Schema 5: End of Life - Requires HIGH LoA for environmental compliance
        WEG_END_OF_LIFE_SCHEMA = keccak256("WEG_END_OF_LIFE");
        registerSchema(
            "WEG_END_OF_LIFE",
            WEG_END_OF_LIFE_SCHEMA,
            "uint256 timestamp,string reason,address finalizer,string condition,string disposalMethod,address recycler,string environmentalImpact",
            2, // HIGH LoA required for environmental compliance
            true // Qualified attestation required
        );
        
        emit WEGSchemaRegistered("ALL_SCHEMAS", bytes32(0), block.timestamp);
    }
    
    /**
     * @dev Initialize WEG roles with proper permissions and LoA requirements
     */
    function _initializeWEGRoles() internal {
        // Manufacturer role - All permissions, HIGH LoA required
        string[] memory manufacturerSchemas = new string[](5);
        manufacturerSchemas[0] = "WEG_PRODUCT_INIT";
        manufacturerSchemas[1] = "WEG_TRANSPORT_EVENT";
        manufacturerSchemas[2] = "WEG_OWNERSHIP_TRANSFER";
        manufacturerSchemas[3] = "WEG_MAINTENANCE_EVENT";
        manufacturerSchemas[4] = "WEG_END_OF_LIFE";
        createRole("manufacturer", "Primary manufacturer with all permissions", manufacturerSchemas, 2, true);
        
        // Exporter role - Transport events only
        string[] memory exporterSchemas = new string[](1);
        exporterSchemas[0] = "WEG_TRANSPORT_EVENT";
        createRole("exporter", "Export operations", exporterSchemas, 1, true);
        
        // Technician role - Maintenance events only
        string[] memory technicianSchemas = new string[](1);
        technicianSchemas[0] = "WEG_MAINTENANCE_EVENT";
        createRole("technician", "Maintenance technician", technicianSchemas, 1, false);
        
        // Joint manufacturer role - Ownership and transport
        string[] memory jointMfgSchemas = new string[](2);
        jointMfgSchemas[0] = "WEG_OWNERSHIP_TRANSFER";
        jointMfgSchemas[1] = "WEG_TRANSPORT_EVENT";
        createRole("joint_manufacturer", "Joint manufacturing partner", jointMfgSchemas, 2, true);
        
        // Retailer role - Ownership transfer only
        string[] memory retailerSchemas = new string[](1);
        retailerSchemas[0] = "WEG_OWNERSHIP_TRANSFER";
        createRole("retailer", "Product retailer", retailerSchemas, 1, true);
        
        // Logistics role - Transport events only
        string[] memory logisticsSchemas = new string[](1);
        logisticsSchemas[0] = "WEG_TRANSPORT_EVENT";
        createRole("logistics", "Logistics provider", logisticsSchemas, 1, false);
        
        // Recycler role - End of life only
        string[] memory recyclerSchemas = new string[](1);
        recyclerSchemas[0] = "WEG_END_OF_LIFE";
        createRole("recycler", "Recycling service provider", recyclerSchemas, 2, true);
        
        // End customer role - No attestation permissions (read-only)
        string[] memory endCustomerSchemas = new string[](0);
        createRole("end_customer", "End customer (read-only)", endCustomerSchemas, 0, false);
    }
    
    /**
     * @dev Map real WEG stakeholders to their addresses
     */
    function _mapWEGStakeholders() internal {
        // This would be done with real addresses in production
        // For now, using placeholder mapping structure
        
        // Note: In production, these would be actual stakeholder addresses
        // wegStakeholders["WEG_SA"] = 0x...; // WEG S.A. main address
        // wegStakeholders["WEG_EXPORT"] = 0x...; // WEG Export Brasil
        // wegStakeholders["JOAO_SILVA"] = 0x...; // João Silva (technician)
        // wegStakeholders["THYSSENKRUPP"] = 0x...; // Thyssenkrupp Elevadores
        // wegStakeholders["CONSTRUCOES_BRASIL"] = 0x...; // Construções Brasil Ltda
        // wegStakeholders["MAERSK"] = 0x...; // Maersk Line
        // wegStakeholders["GREENRECYCLE"] = 0x...; // GreenRecycle Brasil
        // wegStakeholders["CONDOMINIO"] = 0x...; // Condomínio Minha Casa
    }
    
    /**
     * @dev Update product lifecycle stage
     * @param productId Product identifier
     * @param newStage New lifecycle stage
     */
    function _updateProductLifecycle(string memory productId, uint8 newStage) internal {
        uint8 oldStage = productLifecycleStage[productId];
        
        if (oldStage != newStage) {
            // Update counters
            if (productsInStage[oldStage] > 0) {
                productsInStage[oldStage]--;
            }
            productsInStage[newStage]++;
            
            // Update stage
            productLifecycleStage[productId] = newStage;
            
            emit ProductLifecycleUpdated(productId, oldStage, newStage, msg.sender, block.timestamp);
        }
    }
} 