// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PassportRegistry.sol";
import "./eIDAS/DigitalPassport_eIDAS.sol";
import "./eIDAS/eIDASQualifiedAttestor.sol";

/**
 * @title DigitalPassportFactory
 * @dev Factory contract for creating Digital Passports with eIDAS support
 * @author WEG Digital Passport Team
 */
contract DigitalPassportFactory is Ownable, ReentrancyGuard {
    
    // ============ STORAGE ============
    
    /// @dev Reference to the passport registry
    PassportRegistry public immutable registry;
    
    /// @dev Reference to the eIDAS qualified attestor
    eIDASQualifiedAttestor public immutable eidasAttestor;
    
    /// @dev Mapping of authorized manufacturers (ManufacturerManager contracts)
    mapping(address => bool) public authorizedManufacturers;
    
    /// @dev Array of all authorized manufacturer addresses for iteration
    address[] public manufacturerAddresses;
    
    /// @dev Total number of products created
    uint256 public totalProductsCreated;
    
    /// @dev Mapping from productId to passport address
    mapping(string => address) public productPassports;
    
    /// @dev Mapping from manufacturer to their created products
    mapping(address => string[]) public manufacturerProducts;
    
    /// @dev Mapping to check if productId already exists
    mapping(string => bool) public productExists;
    
    // ============ EVENTS ============
    
    event ProductCreated(
        string indexed productId,
        address indexed passportAddress,
        address indexed manufacturer,
        uint256 timestamp
    );
    
    event ManufacturerAuthorized(
        address indexed manufacturer,
        uint256 timestamp
    );
    
    event ManufacturerDeauthorized(
        address indexed manufacturer,
        uint256 timestamp
    );
    
    event FactoryConfigurationUpdated(
        address registry,
        address eidasAttestor,
        uint256 timestamp
    );
    
    // ============ ERRORS ============
    
    error OnlyAuthorizedManufacturer(address caller);
    error ManufacturerAlreadyAuthorized(address manufacturer);
    error ManufacturerNotAuthorized(address manufacturer);
    error ProductAlreadyExists(string productId);
    error InvalidProductId(string productId);
    error InvalidManufacturerAddress(address manufacturer);
    error PassportCreationFailed(string productId);
    
    // ============ MODIFIERS ============
    
    modifier onlyAuthorizedManufacturer() {
        if (!authorizedManufacturers[msg.sender]) {
            revert OnlyAuthorizedManufacturer(msg.sender);
        }
        _;
    }
    
    modifier validProductId(string memory productId) {
        if (bytes(productId).length == 0) {
            revert InvalidProductId(productId);
        }
        if (productExists[productId]) {
            revert ProductAlreadyExists(productId);
        }
        _;
    }
    
    modifier validManufacturer(address manufacturer) {
        if (manufacturer == address(0)) {
            revert InvalidManufacturerAddress(manufacturer);
        }
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Initialize the factory with registry and eIDAS support
     * @param _registry Address of the PassportRegistry contract
     * @param _eidasAttestor Address of the eIDASQualifiedAttestor contract
     */
    constructor(
        address _registry,
        address _eidasAttestor
    ) Ownable(msg.sender) {
        require(_registry != address(0), "Invalid registry address");
        require(_eidasAttestor != address(0), "Invalid eIDAS attestor address");
        
        registry = PassportRegistry(_registry);
        eidasAttestor = eIDASQualifiedAttestor(_eidasAttestor);
        totalProductsCreated = 0;
        
        emit FactoryConfigurationUpdated(_registry, _eidasAttestor, block.timestamp);
    }
    
    // ============ PRODUCT CREATION ============
    
    /**
     * @dev Create a new digital passport for a product
     * @param productId Unique identifier for the product
     * @param manufacturerManager Address of the manufacturer manager contract
     * @return address Address of the created passport contract
     */
    function createProduct(
        string memory productId,
        address manufacturerManager
    ) 
        external
        onlyAuthorizedManufacturer
        nonReentrant
        validProductId(productId)
        validManufacturer(manufacturerManager)
        returns (address)
    {
        // Create new eIDAS-compatible passport
        DigitalPassport_eIDAS newPassport = new DigitalPassport_eIDAS(
            productId,
            manufacturerManager,
            address(eidasAttestor)
        );
        
        address passportAddress = address(newPassport);
        
        // Verify passport was created successfully
        if (passportAddress == address(0)) {
            revert PassportCreationFailed(productId);
        }
        
        // Register in the central registry
        registry.registerPassport(productId, passportAddress, manufacturerManager);
        
        // Update internal mappings
        productPassports[productId] = passportAddress;
        manufacturerProducts[manufacturerManager].push(productId);
        productExists[productId] = true;
        totalProductsCreated++;
        
        emit ProductCreated(productId, passportAddress, manufacturerManager, block.timestamp);
        
        return passportAddress;
    }
    
    /**
     * @dev Batch create multiple products for efficiency
     * @param productIds Array of product identifiers
     * @param manufacturerManager Address of the manufacturer manager
     * @return address[] Array of created passport addresses
     */
    function batchCreateProducts(
        string[] memory productIds,
        address manufacturerManager
    )
        external
        onlyAuthorizedManufacturer
        nonReentrant
        validManufacturer(manufacturerManager)
        returns (address[] memory)
    {
        require(productIds.length > 0, "Empty product array");
        require(productIds.length <= 50, "Too many products in batch"); // Prevent gas limit issues
        
        address[] memory passportAddresses = new address[](productIds.length);
        
        for (uint256 i = 0; i < productIds.length; i++) {
            string memory productId = productIds[i];
            
            // Validate each product ID
            if (bytes(productId).length == 0) {
                revert InvalidProductId(productId);
            }
            if (productExists[productId]) {
                revert ProductAlreadyExists(productId);
            }
            
            // Create passport
            DigitalPassport_eIDAS newPassport = new DigitalPassport_eIDAS(
                productId,
                manufacturerManager,
                address(eidasAttestor)
            );
            
            address passportAddress = address(newPassport);
            
            if (passportAddress == address(0)) {
                revert PassportCreationFailed(productId);
            }
            
            // Register in registry
            registry.registerPassport(productId, passportAddress, manufacturerManager);
            
            // Update mappings
            productPassports[productId] = passportAddress;
            manufacturerProducts[manufacturerManager].push(productId);
            productExists[productId] = true;
            
            passportAddresses[i] = passportAddress;
            
            emit ProductCreated(productId, passportAddress, manufacturerManager, block.timestamp);
        }
        
        totalProductsCreated += productIds.length;
        
        return passportAddresses;
    }
    
    // ============ MANUFACTURER MANAGEMENT ============
    
    /**
     * @dev Authorize a manufacturer to create products
     * @param manufacturer Address of the manufacturer (ManufacturerManager contract)
     */
    function addAuthorizedManufacturer(address manufacturer) 
        external 
        onlyOwner 
        validManufacturer(manufacturer)
    {
        if (authorizedManufacturers[manufacturer]) {
            revert ManufacturerAlreadyAuthorized(manufacturer);
        }
        
        authorizedManufacturers[manufacturer] = true;
        manufacturerAddresses.push(manufacturer);
        
        emit ManufacturerAuthorized(manufacturer, block.timestamp);
    }
    
    /**
     * @dev Remove authorization from a manufacturer
     * @param manufacturer Address of the manufacturer to deauthorize
     */
    function removeAuthorizedManufacturer(address manufacturer) 
        external 
        onlyOwner
    {
        if (!authorizedManufacturers[manufacturer]) {
            revert ManufacturerNotAuthorized(manufacturer);
        }
        
        authorizedManufacturers[manufacturer] = false;
        
        // Remove from array (expensive operation, but manufacturers are few)
        for (uint256 i = 0; i < manufacturerAddresses.length; i++) {
            if (manufacturerAddresses[i] == manufacturer) {
                manufacturerAddresses[i] = manufacturerAddresses[manufacturerAddresses.length - 1];
                manufacturerAddresses.pop();
                break;
            }
        }
        
        emit ManufacturerDeauthorized(manufacturer, block.timestamp);
    }
    
    /**
     * @dev Batch authorize multiple manufacturers
     * @param manufacturers Array of manufacturer addresses to authorize
     */
    function batchAuthorizeManufacturers(address[] memory manufacturers) 
        external 
        onlyOwner
    {
        require(manufacturers.length > 0, "Empty manufacturers array");
        
        for (uint256 i = 0; i < manufacturers.length; i++) {
            address manufacturer = manufacturers[i];
            
            if (manufacturer == address(0)) {
                revert InvalidManufacturerAddress(manufacturer);
            }
            
            if (!authorizedManufacturers[manufacturer]) {
                authorizedManufacturers[manufacturer] = true;
                manufacturerAddresses.push(manufacturer);
                
                emit ManufacturerAuthorized(manufacturer, block.timestamp);
            }
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Check if a manufacturer is authorized
     * @param manufacturer Address to check
     * @return bool True if authorized
     */
    function isAuthorizedManufacturer(address manufacturer) external view returns (bool) {
        return authorizedManufacturers[manufacturer];
    }
    
    /**
     * @dev Get passport address for a product
     * @param productId Product identifier
     * @return address Passport contract address
     */
    function getPassportAddress(string memory productId) external view returns (address) {
        return productPassports[productId];
    }
    
    /**
     * @dev Get all products created by a manufacturer
     * @param manufacturer Manufacturer address
     * @return string[] Array of product IDs
     */
    function getManufacturerProducts(address manufacturer) external view returns (string[] memory) {
        return manufacturerProducts[manufacturer];
    }
    
    /**
     * @dev Get all authorized manufacturers
     * @return address[] Array of authorized manufacturer addresses
     */
    function getAuthorizedManufacturers() external view returns (address[] memory) {
        // Filter only active manufacturers
        uint256 activeCount = 0;
        for (uint256 i = 0; i < manufacturerAddresses.length; i++) {
            if (authorizedManufacturers[manufacturerAddresses[i]]) {
                activeCount++;
            }
        }
        
        address[] memory activeManufacturers = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < manufacturerAddresses.length; i++) {
            if (authorizedManufacturers[manufacturerAddresses[i]]) {
                activeManufacturers[index] = manufacturerAddresses[i];
                index++;
            }
        }
        
        return activeManufacturers;
    }
    
    /**
     * @dev Get number of products created by a manufacturer
     * @param manufacturer Manufacturer address
     * @return uint256 Number of products
     */
    function getManufacturerProductCount(address manufacturer) external view returns (uint256) {
        return manufacturerProducts[manufacturer].length;
    }
    
    /**
     * @dev Get factory statistics
     * @return totalProducts Total products created
     * @return activeManufacturers Number of active manufacturers
     * @return registryAddress Address of the registry
     * @return eidasAddress Address of eIDAS attestor
     */
    function getFactoryStats() external view returns (
        uint256 totalProducts,
        uint256 activeManufacturers,
        address registryAddress,
        address eidasAddress
    ) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < manufacturerAddresses.length; i++) {
            if (authorizedManufacturers[manufacturerAddresses[i]]) {
                activeCount++;
            }
        }
        
        return (
            totalProductsCreated,
            activeCount,
            address(registry),
            address(eidasAttestor)
        );
    }
    
    /**
     * @dev Check if product exists
     * @param productId Product identifier
     * @return bool True if product exists
     */
    function doesProductExist(string memory productId) external view returns (bool) {
        return productExists[productId];
    }
    
    /**
     * @dev Get contract configuration
     * @return registry Registry contract address
     * @return eidasAttestor eIDAS attestor address
     * @return owner Factory owner address
     */
    function getConfiguration() external view returns (
        address,
        address,
        address
    ) {
        return (address(registry), address(eidasAttestor), owner());
    }
} 