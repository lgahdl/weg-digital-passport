# Smart Contracts - Infraestrutura Básica
## Códigos Solidity para WEG Digital Passport

### Visão Geral
Implementação em Solidity das **3 classes fundamentais** da infraestrutura:
- ✅ **PassportRegistry**: Indexação e busca de passaportes
- ✅ **DigitalPassportFactory**: Criação controlada de passaportes  
- ✅ **DigitalPassport**: Contrato individual de cada produto

---

## 1. PassportRegistry.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PassportRegistry
 * @dev Registry centralizado para indexação e busca de Digital Passports
 * @notice Permite registrar passaportes e buscar por diferentes critérios
 */
contract PassportRegistry is Ownable, ReentrancyGuard {
    
    // ============ STRUCTS ============
    
    /**
     * @dev Informações básicas de um passaporte registrado
     */
    struct PassportInfo {
        address passportAddress;    // Endereço do contrato DigitalPassport
        address manufacturer;       // Endereço do fabricante (Manager)
        uint256 createdAt;         // Timestamp de criação
        bool isActive;             // Status ativo/inativo
    }
    
    // ============ STORAGE ============
    
    /// @dev Mapping de productId para informações do passaporte
    mapping(string => PassportInfo) public passports;
    
    /// @dev Mapping de manufacturer para array de productIds
    mapping(address => string[]) public manufacturerProducts;
    
    /// @dev Array com todos os productIds para iteração
    string[] public allProductIds;
    
    /// @dev Total de passaportes registrados
    uint256 public totalPassports;
    
    /// @dev Mapping para verificar se um productId já existe
    mapping(string => bool) public productIdExists;
    
    /// @dev Mapping para verificar se um endereço é um passaporte válido
    mapping(address => bool) public isValidPassport;
    
    // ============ EVENTS ============
    
    /**
     * @dev Emitido quando um novo passaporte é registrado
     */
    event PassportRegistered(
        string indexed productId,
        address indexed passportAddress,
        address indexed manufacturer,
        uint256 timestamp
    );
    
    /**
     * @dev Emitido quando um passaporte é desativado
     */
    event PassportDeactivated(
        string indexed productId,
        address indexed passportAddress,
        uint256 timestamp
    );
    
    /**
     * @dev Emitido quando um passaporte é reativado
     */
    event PassportReactivated(
        string indexed productId,
        address indexed passportAddress,
        uint256 timestamp
    );
    
    // ============ ERRORS ============
    
    error ProductIdAlreadyExists(string productId);
    error ProductIdNotFound(string productId);
    error PassportNotValid(address passportAddress);
    error UnauthorizedCaller(address caller);
    
    // ============ MODIFIERS ============
    
    /**
     * @dev Verifica se o productId existe
     */
    modifier productExists(string memory productId) {
        if (!productIdExists[productId]) {
            revert ProductIdNotFound(productId);
        }
        _;
    }
    
    /**
     * @dev Verifica se o productId não existe ainda
     */
    modifier productNotExists(string memory productId) {
        if (productIdExists[productId]) {
            revert ProductIdAlreadyExists(productId);
        }
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        // Inicialização feita automaticamente
        totalPassports = 0;
    }
    
    // ============ PUBLIC FUNCTIONS ============
    
    /**
     * @dev Registra um novo passaporte digital
     * @param productId ID único do produto
     * @param passportAddress Endereço do contrato DigitalPassport
     * @param manufacturer Endereço do fabricante (Manager)
     * @notice Apenas o owner pode registrar passaportes
     */
    function registerPassport(
        string memory productId,
        address passportAddress,
        address manufacturer
    ) 
        external 
        onlyOwner 
        nonReentrant 
        productNotExists(productId) 
    {
        require(passportAddress != address(0), "Invalid passport address");
        require(manufacturer != address(0), "Invalid manufacturer address");
        require(bytes(productId).length > 0, "Empty product ID");
        
        // Criar nova entrada de passaporte
        passports[productId] = PassportInfo({
            passportAddress: passportAddress,
            manufacturer: manufacturer,
            createdAt: block.timestamp,
            isActive: true
        });
        
        // Atualizar mappings auxiliares
        productIdExists[productId] = true;
        isValidPassport[passportAddress] = true;
        manufacturerProducts[manufacturer].push(productId);
        allProductIds.push(productId);
        
        // Incrementar contador
        totalPassports++;
        
        emit PassportRegistered(productId, passportAddress, manufacturer, block.timestamp);
    }
    
    /**
     * @dev Desativa um passaporte
     * @param productId ID do produto a ser desativado
     */
    function deactivatePassport(string memory productId) 
        external 
        onlyOwner 
        productExists(productId) 
    {
        require(passports[productId].isActive, "Passport already inactive");
        
        passports[productId].isActive = false;
        
        emit PassportDeactivated(
            productId, 
            passports[productId].passportAddress, 
            block.timestamp
        );
    }
    
    /**
     * @dev Reativa um passaporte
     * @param productId ID do produto a ser reativado
     */
    function reactivatePassport(string memory productId) 
        external 
        onlyOwner 
        productExists(productId) 
    {
        require(!passports[productId].isActive, "Passport already active");
        
        passports[productId].isActive = true;
        
        emit PassportReactivated(
            productId, 
            passports[productId].passportAddress, 
            block.timestamp
        );
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Retorna informações de um passaporte
     * @param productId ID do produto
     * @return PassportInfo Informações do passaporte
     */
    function getPassport(string memory productId) 
        external 
        view 
        productExists(productId) 
        returns (PassportInfo memory) 
    {
        return passports[productId];
    }
    
    /**
     * @dev Retorna todos os produtos de um fabricante
     * @param manufacturer Endereço do fabricante
     * @return string[] Array de productIds
     */
    function getPassportsByManufacturer(address manufacturer) 
        external 
        view 
        returns (string[] memory) 
    {
        return manufacturerProducts[manufacturer];
    }
    
    /**
     * @dev Verifica se um passaporte está ativo
     * @param productId ID do produto
     * @return bool Status ativo
     */
    function isPassportActive(string memory productId) 
        external 
        view 
        productExists(productId) 
        returns (bool) 
    {
        return passports[productId].isActive;
    }
    
    /**
     * @dev Retorna todos os productIds registrados
     * @return string[] Array de todos os productIds
     */
    function getAllProductIds() external view returns (string[] memory) {
        return allProductIds;
    }
    
    /**
     * @dev Retorna o número de produtos de um fabricante
     * @param manufacturer Endereço do fabricante
     * @return uint256 Número de produtos
     */
    function getManufacturerProductCount(address manufacturer) 
        external 
        view 
        returns (uint256) 
    {
        return manufacturerProducts[manufacturer].length;
    }
    
    /**
     * @dev Verifica se um endereço é um passaporte válido
     * @param passportAddress Endereço a verificar
     * @return bool Validade do passaporte
     */
    function isValidPassportAddress(address passportAddress) 
        external 
        view 
        returns (bool) 
    {
        return isValidPassport[passportAddress];
    }
    
    /**
     * @dev Retorna estatísticas gerais do registry
     * @return total Total de passaportes
     * @return active Total de passaportes ativos
     */
    function getRegistryStats() external view returns (uint256 total, uint256 active) {
        total = totalPassports;
        active = 0;
        
        // Contar passaportes ativos
        for (uint256 i = 0; i < allProductIds.length; i++) {
            if (passports[allProductIds[i]].isActive) {
                active++;
            }
        }
    }
}
```

---

## 2. DigitalPassportFactory.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PassportRegistry.sol";
import "./DigitalPassport.sol";

/**
 * @title DigitalPassportFactory
 * @dev Factory para criação controlada de Digital Passports
 * @notice Apenas fabricantes autorizados podem criar passaportes
 */
contract DigitalPassportFactory is Ownable, ReentrancyGuard {
    
    // ============ STORAGE ============
    
    /// @dev Registry onde os passaportes serão registrados
    PassportRegistry public immutable registry;
    
    /// @dev Mapping de fabricantes autorizados
    mapping(address => bool) public authorizedManufacturers;
    
    /// @dev Array de fabricantes autorizados para iteração
    address[] public authorizedManufacturersList;
    
    /// @dev Total de produtos criados
    uint256 public totalProductsCreated;
    
    /// @dev Mapping para verificar se um productId já foi usado
    mapping(string => bool) public productIdUsed;
    
    /// @dev Mapping de manufacturer para contador de produtos
    mapping(address => uint256) public manufacturerProductCount;
    
    // ============ EVENTS ============
    
    /**
     * @dev Emitido quando um fabricante é autorizado
     */
    event ManufacturerAuthorized(
        address indexed manufacturer,
        address indexed authorizedBy,
        uint256 timestamp
    );
    
    /**
     * @dev Emitido quando um fabricante é removido
     */
    event ManufacturerRemoved(
        address indexed manufacturer,
        address indexed removedBy,
        uint256 timestamp
    );
    
    /**
     * @dev Emitido quando um produto é criado
     */
    event ProductCreated(
        string indexed productId,
        address indexed passportAddress,
        address indexed manufacturer,
        uint256 timestamp
    );
    
    // ============ ERRORS ============
    
    error ManufacturerNotAuthorized(address manufacturer);
    error ManufacturerAlreadyAuthorized(address manufacturer);
    error ProductIdAlreadyUsed(string productId);
    error InvalidProductId(string productId);
    error InvalidManufacturer(address manufacturer);
    
    // ============ MODIFIERS ============
    
    /**
     * @dev Verifica se o fabricante está autorizado
     */
    modifier onlyAuthorizedManufacturer() {
        if (!authorizedManufacturers[msg.sender]) {
            revert ManufacturerNotAuthorized(msg.sender);
        }
        _;
    }
    
    /**
     * @dev Verifica se o productId é válido e não foi usado
     */
    modifier validProductId(string memory productId) {
        if (bytes(productId).length == 0) {
            revert InvalidProductId(productId);
        }
        if (productIdUsed[productId]) {
            revert ProductIdAlreadyUsed(productId);
        }
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Inicializa a factory com o registry
     * @param _registry Endereço do PassportRegistry
     */
    constructor(address _registry) {
        require(_registry != address(0), "Invalid registry address");
        registry = PassportRegistry(_registry);
        totalProductsCreated = 0;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Autoriza um fabricante a criar passaportes
     * @param manufacturer Endereço do fabricante (Manager)
     * @notice Apenas o owner pode autorizar fabricantes
     */
    function addAuthorizedManufacturer(address manufacturer) 
        external 
        onlyOwner 
    {
        if (manufacturer == address(0)) {
            revert InvalidManufacturer(manufacturer);
        }
        if (authorizedManufacturers[manufacturer]) {
            revert ManufacturerAlreadyAuthorized(manufacturer);
        }
        
        authorizedManufacturers[manufacturer] = true;
        authorizedManufacturersList.push(manufacturer);
        
        emit ManufacturerAuthorized(manufacturer, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Remove autorização de um fabricante
     * @param manufacturer Endereço do fabricante
     */
    function removeAuthorizedManufacturer(address manufacturer) 
        external 
        onlyOwner 
    {
        if (!authorizedManufacturers[manufacturer]) {
            revert ManufacturerNotAuthorized(manufacturer);
        }
        
        authorizedManufacturers[manufacturer] = false;
        
        // Remover da lista (encontrar e remover)
        for (uint256 i = 0; i < authorizedManufacturersList.length; i++) {
            if (authorizedManufacturersList[i] == manufacturer) {
                // Mover último elemento para a posição atual e diminuir array
                authorizedManufacturersList[i] = authorizedManufacturersList[
                    authorizedManufacturersList.length - 1
                ];
                authorizedManufacturersList.pop();
                break;
            }
        }
        
        emit ManufacturerRemoved(manufacturer, msg.sender, block.timestamp);
    }
    
    // ============ MANUFACTURER FUNCTIONS ============
    
    /**
     * @dev Cria um novo Digital Passport
     * @param productId ID único do produto
     * @return passportAddress Endereço do passaporte criado
     * @notice Apenas fabricantes autorizados podem criar passaportes
     */
    function createProduct(string memory productId) 
        external 
        onlyAuthorizedManufacturer 
        nonReentrant 
        validProductId(productId) 
        returns (address passportAddress) 
    {
        // Criar novo contrato DigitalPassport
        DigitalPassport passport = new DigitalPassport(
            productId,
            msg.sender  // manufacturer (Manager address)
        );
        
        passportAddress = address(passport);
        
        // Registrar no registry
        registry.registerPassport(productId, passportAddress, msg.sender);
        
        // Atualizar estado
        productIdUsed[productId] = true;
        totalProductsCreated++;
        manufacturerProductCount[msg.sender]++;
        
        emit ProductCreated(productId, passportAddress, msg.sender, block.timestamp);
        
        return passportAddress;
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Verifica se um fabricante está autorizado
     * @param manufacturer Endereço do fabricante
     * @return bool Status de autorização
     */
    function isAuthorizedManufacturer(address manufacturer) 
        external 
        view 
        returns (bool) 
    {
        return authorizedManufacturers[manufacturer];
    }
    
    /**
     * @dev Retorna todos os fabricantes autorizados
     * @return address[] Array de fabricantes autorizados
     */
    function getAuthorizedManufacturers() 
        external 
        view 
        returns (address[] memory) 
    {
        // Filtrar apenas os fabricantes ainda autorizados
        uint256 activeCount = 0;
        
        // Contar ativos
        for (uint256 i = 0; i < authorizedManufacturersList.length; i++) {
            if (authorizedManufacturers[authorizedManufacturersList[i]]) {
                activeCount++;
            }
        }
        
        // Criar array com tamanho correto
        address[] memory activeManufacturers = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < authorizedManufacturersList.length; i++) {
            if (authorizedManufacturers[authorizedManufacturersList[i]]) {
                activeManufacturers[index] = authorizedManufacturersList[i];
                index++;
            }
        }
        
        return activeManufacturers;
    }
    
    /**
     * @dev Retorna estatísticas da factory
     * @return totalProducts Total de produtos criados
     * @return totalManufacturers Total de fabricantes autorizados
     */
    function getFactoryStats() 
        external 
        view 
        returns (uint256 totalProducts, uint256 totalManufacturers) 
    {
        totalProducts = totalProductsCreated;
        
        // Contar fabricantes ativos
        totalManufacturers = 0;
        for (uint256 i = 0; i < authorizedManufacturersList.length; i++) {
            if (authorizedManufacturers[authorizedManufacturersList[i]]) {
                totalManufacturers++;
            }
        }
    }
    
    /**
     * @dev Retorna quantos produtos um fabricante criou
     * @param manufacturer Endereço do fabricante
     * @return uint256 Número de produtos criados
     */
    function getManufacturerProductCount(address manufacturer) 
        external 
        view 
        returns (uint256) 
    {
        return manufacturerProductCount[manufacturer];
    }
}
```

---

## 3. DigitalPassport.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DigitalPassport
 * @dev Contrato individual para cada produto com seu histórico de attestations
 * @notice Armazena todas as attestations de um produto específico
 */
contract DigitalPassport is ReentrancyGuard {
    
    // ============ STRUCTS ============
    
    /**
     * @dev Registro de uma attestation individual
     */
    struct AttestationRecord {
        bytes32 uid;            // UID único da attestation no EAS
        string schemaType;      // Tipo do schema (ex: "WEG_TRANSPORT_EVENT")
        address attester;       // Quem criou a attestation
        uint256 timestamp;      // Quando foi criada
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
    
    /// @dev Array de todas as attestations
    AttestationRecord[] public attestations;
    
    /// @dev Mapping de schema para array de indices de attestations
    mapping(string => uint256[]) public attestationsBySchema;
    
    /// @dev Mapping de attester para array de indices de attestations
    mapping(address => uint256[]) public attestationsByAttester;
    
    /// @dev Mapping para verificar se um UID já foi registrado
    mapping(bytes32 => bool) public uidExists;
    
    // ============ EVENTS ============
    
    /**
     * @dev Emitido quando uma nova attestation é adicionada
     */
    event AttestationAdded(
        bytes32 indexed uid,
        string indexed schemaType,
        address indexed attester,
        uint256 timestamp,
        uint256 attestationIndex
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
    
    // ============ ERRORS ============
    
    error OnlyManufacturer(address caller);
    error AttestationAlreadyExists(bytes32 uid);
    error InvalidUID(bytes32 uid);
    error InvalidSchemaType(string schemaType);
    error InvalidAttester(address attester);
    error PassportInactive();
    
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
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Inicializa o passaporte digital
     * @param _productId ID único do produto
     * @param _manufacturer Endereço do fabricante
     */
    constructor(string memory _productId, address _manufacturer) {
        require(bytes(_productId).length > 0, "Invalid product ID");
        require(_manufacturer != address(0), "Invalid manufacturer");
        
        productId = _productId;
        manufacturer = _manufacturer;
        createdAt = block.timestamp;
        isActive = true;
    }
    
    // ============ MANUFACTURER FUNCTIONS ============
    
    /**
     * @dev Adiciona uma nova attestation ao passaporte
     * @param uid UID único da attestation no EAS
     * @param schemaType Tipo do schema
     * @param attester Endereço de quem criou a attestation
     * @notice Apenas o fabricante pode adicionar attestations
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
        // Criar nova attestation
        AttestationRecord memory newAttestation = AttestationRecord({
            uid: uid,
            schemaType: schemaType,
            attester: attester,
            timestamp: block.timestamp
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
        
        emit AttestationAdded(uid, schemaType, attester, block.timestamp, attestationIndex);
    }
    
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
     * @dev Retorna o total de attestations
     * @return uint256 Número total de attestations
     */
    function getTotalAttestations() external view returns (uint256) {
        return attestations.length;
    }
    
    /**
     * @dev Retorna quantas attestations existem de um schema
     * @param schemaType Tipo do schema
     * @return uint256 Número de attestations do schema
     */
    function getAttestationCountBySchema(string memory schemaType) 
        external 
        view 
        returns (uint256) 
    {
        return attestationsBySchema[schemaType].length;
    }
    
    /**
     * @dev Retorna quantas attestations um attester criou
     * @param attester Endereço do attester
     * @return uint256 Número de attestations do attester
     */
    function getAttestationCountByAttester(address attester) 
        external 
        view 
        returns (uint256) 
    {
        return attestationsByAttester[attester].length;
    }
    
    /**
     * @dev Retorna informações básicas do passaporte
     * @return productId ID do produto
     * @return manufacturer Endereço do fabricante
     * @return createdAt Timestamp de criação
     * @return isActive Status ativo
     * @return totalAttestations Total de attestations
     */
    function getPassportInfo() 
        external 
        view 
        returns (
            string memory,
            address,
            uint256,
            bool,
            uint256
        ) 
    {
        return (
            productId,
            manufacturer,
            createdAt,
            isActive,
            attestations.length
        );
    }
    
    /**
     * @dev Verifica se uma attestation UID existe
     * @param uid UID da attestation
     * @return bool Existência da attestation
     */
    function hasAttestation(bytes32 uid) external view returns (bool) {
        return uidExists[uid];
    }
}
```

---

## Observações Técnicas

### 🔧 **Características dos Contratos:**

#### **PassportRegistry:**
- ✅ **Indexação completa**: Busca por produto, fabricante ou status
- ✅ **Controle de acesso**: Apenas owner registra passaportes  
- ✅ **Ativação/Desativação**: Controle de status dos passaportes
- ✅ **Estatísticas**: Contadores e relatórios integrados

#### **DigitalPassportFactory:**
- ✅ **Fabricantes autorizados**: Sistema de whitelist
- ✅ **Criação controlada**: Apenas fabricantes autorizados criam
- ✅ **Auto-registro**: Registra automaticamente no Registry
- ✅ **Prevenção de duplicatas**: ProductId único garantido

#### **DigitalPassport:**
- ✅ **Histórico completo**: Todas as attestations de um produto
- ✅ **Busca eficiente**: Indices por schema e attester
- ✅ **Controle do fabricante**: Apenas manufacturer adiciona attestations
- ✅ **Prevenção de duplicatas**: UIDs únicos garantidos

### 🛡️ **Segurança Implementada:**
- **ReentrancyGuard**: Proteção contra ataques de reentrância
- **Access Control**: Funções restritas com modifiers
- **Input Validation**: Validação de todos os parâmetros
- **Error Handling**: Errors customizados para debugging

### ⛽ **Otimizações de Gas:**
- **Immutable Registry**: Factory referencia registry como immutable
- **Batch Operations**: Funções que retornam arrays quando possível
- **Efficient Mappings**: Estruturas de dados otimizadas para busca

---

**Documento**: Smart Contracts - Infraestrutura Básica  
**Status**: Implementação Completa da Infraestrutura 