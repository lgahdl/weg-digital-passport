# Diagrama de Classes - Arquitetura Multi-Fabricante
## Sistema Completo WEG Digital Passport

### Visão Geral
Arquitetura baseada no documento **Exemplo-Uso-Multi-Fabricante** com:
- ✅ **Infraestrutura Base**: Registry + Factory
- ✅ **Sistema de Roles**: Permissões baseadas em roles, não stakeholders diretos
- ✅ **Schemas EAS**: 5 schemas para ciclo de vida completo
- ✅ **Stakeholders Reais**: 7 tipos de participantes da cadeia
- ✅ **Fluxo Completo**: Da fabricação à reciclagem

---

## Diagrama de Classes Atualizado

```mermaid
classDiagram
    class PassportRegistry {
        +mapping~string,PassportInfo~ passports
        +uint256 totalPassports
        +registerPassport(productId, passportAddress, manufacturer)
        +getPassport(productId) PassportInfo
        +getPassportsByManufacturer(manufacturer) string[]
        +isPassportActive(productId) bool
    }
    
    class DigitalPassportFactory {
        +mapping~address,bool~ authorizedManufacturers
        +PassportRegistry registry
        +uint256 totalProductsCreated
        +createProduct(productId, manufacturerManager) address
        +addAuthorizedManufacturer(manufacturer)
        +removeAuthorizedManufacturer(manufacturer)
        +isAuthorizedManufacturer(manufacturer) bool
    }
    
    class DigitalPassport {
        +string productId
        +address manufacturer
        +AttestationRecord[] attestations
        +uint256 createdAt
        +bool isActive
        +addAttestation(uid, schemaType, attester)
        +getAttestations() AttestationRecord[]
        +getAttestationsBySchema(schema) AttestationRecord[]
        +getTotalAttestations() uint256
    }
    
    class ManufacturerManager {
        <<abstract>>
        +address manufacturer
        +string manufacturerName
        +string manufacturerCountry
        +mapping~string,bytes32~ registeredSchemas
        +mapping~address,StakeholderInfo~ stakeholders
        +mapping~string,RoleInfo~ roles
        +mapping~address,bool~ isAuthorizedStakeholder
        +address easContract
        +address schemaRegistry
        +createRole(name, description, allowedSchemas)
        +addStakeholder(address, name, role, additionalInfo)
        +attestToProduct(passport, schemaName, data)
        +hasPermission(stakeholder, schema) bool
        +getStakeholderRole(address) string
    }
    
    class WEGManager {
        +constructor(factory, eas, schemaRegistry, wegWallet)
        +bytes32 WEG_PRODUCT_INIT_SCHEMA
        +bytes32 WEG_TRANSPORT_EVENT_SCHEMA
        +bytes32 WEG_OWNERSHIP_TRANSFER_SCHEMA
        +bytes32 WEG_MAINTENANCE_EVENT_SCHEMA
        +bytes32 WEG_END_OF_LIFE_SCHEMA
        -_initializeWEGSchemas()
        -_createWEGRoles()
    }
    
    class MitsubishiManager {
        +constructor(factory, eas, schemaRegistry, mitsubishiWallet)
        +bytes32 MITSUBISHI_PRODUCT_INIT_SCHEMA
        +bytes32 MITSUBISHI_CONTROL_SYSTEM_SCHEMA
        +bytes32 MITSUBISHI_CALIBRATION_SCHEMA
        +bytes32 MITSUBISHI_SOFTWARE_SCHEMA
        +bytes32 MITSUBISHI_SERVICE_SCHEMA
        -_initializeMitsubishiSchemas()
        -_createMitsubishiRoles()
    }
    
    class RoleInfo {
        +string name
        +string description
        +string[] allowedSchemas
        +uint256 createdAt
        +bool isActive
    }
    
    class StakeholderInfo {
        +string name
        +string role
        +string additionalInfo
        +uint256 registrationDate
        +bool isActive
    }
    
    class PassportInfo {
        +address passportAddress
        +address manufacturer
        +uint256 createdAt
        +bool isActive
    }
    
    class AttestationRecord {
        +bytes32 uid
        +string schemaType
        +address attester
        +uint256 timestamp
    }
    
    class EASContract {
        <<external>>
        +attest(schemaId, recipient, data) bytes32
        +getAttestation(uid) Attestation
        +isValidAttestation(uid) bool
    }
    
    class SchemaRegistry {
        <<external>>
        +register(schema, revocable, resolver) bytes32
        +getSchema(schemaId) SchemaRecord
    }

    %% Relacionamentos Principais
    PassportRegistry <-- DigitalPassportFactory : registers
    DigitalPassportFactory --> DigitalPassport : creates
    DigitalPassportFactory --> ManufacturerManager : authorizes
    
    ManufacturerManager <|-- WEGManager : extends
    ManufacturerManager <|-- MitsubishiManager : extends
    ManufacturerManager --> RoleInfo : manages
    ManufacturerManager --> StakeholderInfo : manages
    ManufacturerManager --> EASContract : uses
    ManufacturerManager --> SchemaRegistry : uses
    
    DigitalPassport --> AttestationRecord : contains
    PassportRegistry --> PassportInfo : stores
    StakeholderInfo --> RoleInfo : references
    
    %% EAS Integration
    EASContract --> AttestationRecord : creates
    SchemaRegistry --> ManufacturerManager : provides schemas
```

---

## Schemas Definidos (WEG)

### 📋 **Schemas do Ciclo de Vida WEG**

```solidity
// Schema 1: Inicialização do Produto
WEG_PRODUCT_INIT = "string productModel,string serialNumber,uint256 timestamp,string composition,string[] suppliers,string manufacturingLocation,string qualityStandards"

// Schema 2: Eventos de Transporte
WEG_TRANSPORT_EVENT = "string title,address responsible,address recipient,uint256 timestamp,string description,string origin,string destination,string trackingInfo"

// Schema 3: Transferência de Propriedade
WEG_OWNERSHIP_TRANSFER = "address previousOwner,address newOwner,uint256 timestamp,string transferType,string contractReference,uint256 transferValue,string description"

// Schema 4: Eventos de Manutenção
WEG_MAINTENANCE_EVENT = "string eventType,address technician,uint256 timestamp,string maintenanceType,string description,string[] partsReplaced,string nextScheduledMaintenance"

// Schema 5: Fim da Vida Útil
WEG_END_OF_LIFE = "uint256 timestamp,string reason,address finalizer,string condition,string disposalMethod,address recycler,string environmentalImpact"
```

---

## Sistema de Roles e Permissões

### 🔐 **Roles WEG Definidas**

```mermaid
graph TD
    subgraph "WEG Roles e Permissões"
        MANUFACTURER[manufacturer<br/>Todas as permissões]
        EXPORTER[exporter<br/>WEG_TRANSPORT_EVENT]
        TECHNICIAN[technician<br/>WEG_MAINTENANCE_EVENT]
        JOINT_MFG[joint_manufacturer<br/>WEG_OWNERSHIP_TRANSFER<br/>WEG_TRANSPORT_EVENT]
        RETAILER[retailer<br/>WEG_OWNERSHIP_TRANSFER]
        LOGISTICS[logistics<br/>WEG_TRANSPORT_EVENT]
        RECYCLER[recycler<br/>WEG_END_OF_LIFE]
        END_CUSTOMER[end_customer<br/>Sem permissões]
    end
    
    style MANUFACTURER fill:#e1f5fe
    style EXPORTER fill:#fff3e0
    style TECHNICIAN fill:#fff3e0
    style JOINT_MFG fill:#fff3e0
    style RETAILER fill:#fff3e0
    style LOGISTICS fill:#fff3e0
    style RECYCLER fill:#fff3e0
    style END_CUSTOMER fill:#f3e5f5
```

### 👥 **Stakeholders WEG Reais**

| Stakeholder | Role | Permissões Herdadas |
|-------------|------|-------------------|
| **WEG S.A.** | `manufacturer` | Todas as permissões |
| **WEG Export Brasil** | `exporter` | `WEG_TRANSPORT_EVENT` |
| **João Silva** | `technician` | `WEG_MAINTENANCE_EVENT` |
| **Thyssenkrupp Elevadores** | `joint_manufacturer` | `WEG_OWNERSHIP_TRANSFER`, `WEG_TRANSPORT_EVENT` |
| **Construções Brasil Ltda** | `retailer` | `WEG_OWNERSHIP_TRANSFER` |
| **Maersk Line** | `logistics` | `WEG_TRANSPORT_EVENT` |
| **GreenRecycle Brasil** | `recycler` | `WEG_END_OF_LIFE` |
| **Condomínio Minha Casa** | `end_customer` | Apenas consulta |

---

## Fluxo de Trabalho Completo

### 🔄 **Sequência de Inicialização**

```mermaid
sequenceDiagram
    participant Admin as System Admin
    participant Registry as PassportRegistry
    participant Factory as DigitalPassportFactory
    participant WEG as WEGManager
    participant EAS as EAS/SchemaRegistry

    Note over Admin,EAS: 1. Infraestrutura Base
    Admin->>Registry: deploy PassportRegistry()
    Admin->>Factory: deploy DigitalPassportFactory(registry)
    
    Note over Admin,EAS: 2. WEG Manager
    Admin->>WEG: deploy WEGManager(factory, eas, schemaRegistry, wegWallet)
    WEG->>EAS: register 5 WEG schemas
    WEG->>WEG: create 7 roles with permissions
    
    Note over Admin,EAS: 3. Autorização
    Admin->>Factory: addAuthorizedManufacturer(wegManager)
    
    Note over Admin,EAS: 4. Stakeholders
    WEG->>WEG: addStakeholder(...) x7 stakeholders
```

### 🏭 **Fluxo de Produto (Motor WEG W22 100HP)**

```mermaid
sequenceDiagram
    participant WEG as WEG S.A.
    participant EXP as WEG Export
    participant THYS as Thyssenkrupp
    participant CONST as Construções
    participant TECH as João Silva
    participant REC as GreenRecycle
    participant Product as Motor WEG-W22-2024-001

    WEG->>Product: create + WEG_PRODUCT_INIT
    EXP->>Product: WEG_TRANSPORT_EVENT (export)
    THYS->>Product: WEG_OWNERSHIP_TRANSFER (purchase)
    THYS->>Product: WEG_TRANSPORT_EVENT (integration)
    CONST->>Product: WEG_OWNERSHIP_TRANSFER (sale)
    TECH->>Product: WEG_MAINTENANCE_EVENT (maintenance)
    REC->>Product: WEG_END_OF_LIFE (recycling)
```

---

## Vantagens da Arquitetura Atualizada

### ✅ **Sistema de Roles Escalável**
- Permissões centralizadas nas roles, não nos stakeholders
- Fácil adicionar novos stakeholders à roles existentes
- Mudanças na role afetam todos os stakeholders automaticamente

### ✅ **Rastreabilidade Completa**
- 5 schemas cobrem todo o ciclo de vida
- Dados estruturados para cada tipo de evento
- Histórico imutável na blockchain

### ✅ **Independência entre Fabricantes**
- WEG e Mitsubishi operam completamente separados
- Schemas próprios para cada fabricante
- Impossibilidade de interferência cruzada

### ✅ **Compliance Regulatório**
- Schemas atendem regulamentações europeias
- Rastreabilidade completa origem → descarte
- Dados auditáveis e verificáveis

### ✅ **Infraestrutura Robusta**
- Registry centralizado para indexação
- Factory controlada para criação
- EAS para imutabilidade das attestations

---

## Estado Atual do Sistema

### 📊 **Exemplo Real - Motor WEG W22 100HP**

- **Product ID**: `WEG-W22-2024-001`
- **Passport Address**: `0x123...abc`
- **Total Attestations**: 9 attestations
- **Ciclo de Vida**: 15 anos (2024-2039)
- **Stakeholders Envolvidos**: 7 diferentes
- **Países**: Brasil → Alemanha
- **Status Final**: Reciclado (95% materiais recuperados)

### 🔍 **Capacidades de Consulta**

```solidity
// Consultas por produto
registry.getPassport("WEG-W22-2024-001")
passport.getAttestations()
passport.getAttestationsBySchema("WEG_MAINTENANCE_EVENT")

// Consultas por fabricante
registry.getPassportsByManufacturer(wegManager)
wegManager.getStakeholders()
wegManager.getStakeholderRole(joaoSilvaAddress)

// Verificações de permissão
wegManager.hasPermission(joaoSilvaAddress, "WEG_MAINTENANCE_EVENT") // true
wegManager.hasPermission(joaoSilvaAddress, "WEG_OWNERSHIP_TRANSFER") // false
```

---

**Documento**: Diagrama de Classes Multi-Fabricante  
**Status**: Atualizado com Base no Exemplo de Uso Completo 