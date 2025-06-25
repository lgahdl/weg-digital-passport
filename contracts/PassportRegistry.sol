// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PassportRegistry
 * @dev Central registry for all Digital Passports in the system
 * @author WEG Digital Passport Team
 */
contract PassportRegistry is Ownable, ReentrancyGuard {
    struct PassportInfo {
        address passportAddress;
        address manufacturer;
        uint256 createdAt;
        bool isActive;
    }

    // Mapping from productId to PassportInfo
    mapping(string => PassportInfo) public passports;
    
    // Mapping from manufacturer to list of product IDs
    mapping(address => string[]) public manufacturerProducts;
    
    // Total number of registered passports
    uint256 public totalPassports;
    
    // Authorized factories that can register passports
    mapping(address => bool) public authorizedFactories;

    // Events
    event PassportRegistered(
        string indexed productId,
        address indexed passportAddress,
        address indexed manufacturer,
        uint256 timestamp
    );
    
    event PassportDeactivated(
        string indexed productId,
        address indexed manufacturer,
        uint256 timestamp
    );
    
    event FactoryAuthorized(address indexed factory, uint256 timestamp);
    event FactoryDeauthorized(address indexed factory, uint256 timestamp);

    // Modifiers
    modifier onlyAuthorizedFactory() {
        require(authorizedFactories[msg.sender], "PassportRegistry: Caller is not authorized factory");
        _;
    }

    modifier validProductId(string memory productId) {
        require(bytes(productId).length > 0, "PassportRegistry: Product ID cannot be empty");
        require(passports[productId].passportAddress == address(0), "PassportRegistry: Product ID already exists");
        _;
    }

    modifier passportExists(string memory productId) {
        require(passports[productId].passportAddress != address(0), "PassportRegistry: Passport does not exist");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Register a new passport in the system
     * @param productId Unique identifier for the product
     * @param passportAddress Address of the deployed passport contract
     * @param manufacturer Address of the manufacturer
     */
    function registerPassport(
        string memory productId,
        address passportAddress,
        address manufacturer
    ) external onlyAuthorizedFactory validProductId(productId) nonReentrant {
        require(passportAddress != address(0), "PassportRegistry: Invalid passport address");
        require(manufacturer != address(0), "PassportRegistry: Invalid manufacturer address");

        PassportInfo memory newPassport = PassportInfo({
            passportAddress: passportAddress,
            manufacturer: manufacturer,
            createdAt: block.timestamp,
            isActive: true
        });

        passports[productId] = newPassport;
        manufacturerProducts[manufacturer].push(productId);
        totalPassports++;

        emit PassportRegistered(productId, passportAddress, manufacturer, block.timestamp);
    }

    /**
     * @dev Get passport information by product ID
     * @param productId The product identifier
     * @return PassportInfo struct containing passport details
     */
    function getPassport(string memory productId) external view passportExists(productId) returns (PassportInfo memory) {
        return passports[productId];
    }

    /**
     * @dev Get all product IDs for a specific manufacturer
     * @param manufacturer The manufacturer address
     * @return Array of product IDs
     */
    function getPassportsByManufacturer(address manufacturer) external view returns (string[] memory) {
        return manufacturerProducts[manufacturer];
    }

    /**
     * @dev Check if a passport is active
     * @param productId The product identifier
     * @return true if passport exists and is active
     */
    function isPassportActive(string memory productId) external view returns (bool) {
        return passports[productId].passportAddress != address(0) && passports[productId].isActive;
    }

    /**
     * @dev Deactivate a passport (only by manufacturer or owner)
     * @param productId The product identifier
     */
    function deactivatePassport(string memory productId) external passportExists(productId) {
        PassportInfo storage passport = passports[productId];
        require(
            msg.sender == passport.manufacturer || msg.sender == owner(),
            "PassportRegistry: Only manufacturer or owner can deactivate"
        );
        require(passport.isActive, "PassportRegistry: Passport already inactive");

        passport.isActive = false;
        emit PassportDeactivated(productId, passport.manufacturer, block.timestamp);
    }

    /**
     * @dev Authorize a factory to register passports
     * @param factory The factory address to authorize
     */
    function authorizeFactory(address factory) external onlyOwner {
        require(factory != address(0), "PassportRegistry: Invalid factory address");
        require(!authorizedFactories[factory], "PassportRegistry: Factory already authorized");
        
        authorizedFactories[factory] = true;
        emit FactoryAuthorized(factory, block.timestamp);
    }

    /**
     * @dev Deauthorize a factory
     * @param factory The factory address to deauthorize
     */
    function deauthorizeFactory(address factory) external onlyOwner {
        require(authorizedFactories[factory], "PassportRegistry: Factory not authorized");
        
        authorizedFactories[factory] = false;
        emit FactoryDeauthorized(factory, block.timestamp);
    }

    /**
     * @dev Get total number of products for a manufacturer
     * @param manufacturer The manufacturer address
     * @return Number of products
     */
    function getManufacturerProductCount(address manufacturer) external view returns (uint256) {
        return manufacturerProducts[manufacturer].length;
    }

    /**
     * @dev Check if a factory is authorized
     * @param factory The factory address
     * @return true if factory is authorized
     */
    function isFactoryAuthorized(address factory) external view returns (bool) {
        return authorizedFactories[factory];
    }
} 