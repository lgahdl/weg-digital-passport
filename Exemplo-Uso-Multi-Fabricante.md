# Exemplo de Uso - Arquitetura Multi-Fabricante
## Criação da Infraestrutura e Manufacturers

### Visão Geral
Este documento mostra **exemplos práticos** de como usar a arquitetura multi-fabricante, começando pela infraestrutura base compartilhada e depois a criação dos managers específicos.

---

## 1. Criação da Infraestrutura Base

### Diagrama de Sequência - Infraestrutura Base

```mermaid
sequenceDiagram
    participant Admin as System Admin
    participant Registry as PassportRegistry
    participant Factory as DigitalPassportFactory

    Note over Admin,Factory: Passo 1: Deploy do Registry
    Admin->>Registry: new PassportRegistry()
    Registry->>Registry: initialize mapping structures
    Registry->>Registry: set totalPassports = 0
    
    Note over Admin,Factory: Passo 2: Deploy da Factory
    Admin->>Factory: new DigitalPassportFactory(registryAddress)
    Factory->>Factory: passportRegistry = registryAddress
    Factory->>Factory: initialize authorizedManufacturers mapping
    
    Note over Admin,Factory: ✅ Infraestrutura Base Criada
```

### Detalhes da Infraestrutura Base

**Componentes Criados:**
- ✅ **PassportRegistry**: Indexação e busca de passaportes
- ✅ **DigitalPassportFactory**: Criação de passaportes únicos  

**Componentes de Código (Não Deployados):**
- 📄 **ManufacturerManager.sol**: Contrato abstrato base (apenas código)

**Componentes Existentes (Arbitrum):**
- 🌐 **EAS Contract**: Já existente na rede Arbitrum
- 🌐 **Schema Registry**: Já existente na rede Arbitrum

**Estado Inicial:**
- 🔹 **authorizedManufacturers**: Vazio (nenhum fabricante autorizado)
- 🔹 **totalPassports**: 0
- 🔹 **Schemas**: Nenhum criado ainda

---

## 2. Criação do WEG Manager

### Diagrama de Sequência - WEG Manager

```mermaid
sequenceDiagram
    participant Admin as System Admin
    participant Factory as DigitalPassportFactory
    participant WEG as WEGManager
    
    Note over Admin,WEG: Infraestrutura Base Já Existe
    
    Note over Admin,WEG: Passo 1: Deploy do WEG Manager
    Note over WEG: Compilação: WEGManager + ManufacturerManager = um contrato
    Admin->>WEG: new WEGManager(factory, eas, schemaRegistry, wegWallet)
    WEG->>WEG: constructor() - inicializa herança ManufacturerManager
    WEG->>WEG: manufacturer = wegWallet
    WEG->>WEG: manufacturerName = "WEG S.A."
    WEG->>WEG: manufacturerCountry = "Brasil"
    WEG->>WEG: _addStakeholder(wegWallet, "manufacturer", [], "Original Manufacturer")
    
    Note over Admin,WEG: Passo 2: Autorização na Factory
    Admin->>Factory: addAuthorizedManufacturer(wegManagerAddress)
    Factory->>Factory: authorizedManufacturers[wegManager] = true
    
    Note over Admin,WEG: ✅ WEG Manager Criado e Autorizado
```

### Detalhes da Criação WEG

**Como Funciona a Herança:**
- 🔧 **Compilação**: `WEGManager.sol` + `ManufacturerManager.sol` = contrato único
- 📦 **Deploy**: Apenas o `WEGManager` (com código herdado embutido)
- 🎯 **Resultado**: Um contrato na blockchain com todas as funcionalidades

**Estado do WEG Manager:**
- ✅ **Endereço**: `wegManagerAddress`
- ✅ **Manufacturer**: `wegWallet`
- ✅ **Nome**: "WEG S.A."
- ✅ **País**: "Brasil"
- ✅ **Autorizado na Factory**: Sim
- ✅ **Stakeholder Principal**: wegWallet como "manufacturer"
- ⏳ **Schemas**: Nenhum criado ainda
- ⏳ **Produtos**: Nenhum criado ainda

---

## 3. Criação do Mitsubishi Manager

### Diagrama de Sequência - Mitsubishi Manager

```mermaid
sequenceDiagram
    participant Admin as System Admin
    participant Factory as DigitalPassportFactory
    participant MIT as MitsubishiManager

    Note over Admin,MIT: Infraestrutura Base e WEG Já Existem
    
    Note over Admin,MIT: Passo 1: Deploy do Mitsubishi Manager
    Note over MIT: Compilação: MitsubishiManager + ManufacturerManager = um contrato
    Admin->>MIT: new MitsubishiManager(factory, eas, schemaRegistry, mitsubishiWallet)
    MIT->>MIT: constructor() - inicializa herança ManufacturerManager
    MIT->>MIT: manufacturer = mitsubishiWallet
    MIT->>MIT: manufacturerName = "Mitsubishi Electric Corporation"
    MIT->>MIT: manufacturerCountry = "Japan"
    MIT->>MIT: _addStakeholder(mitsubishiWallet, "manufacturer", [], "Original Manufacturer")
    
    Note over Admin,MIT: Passo 2: Autorização na Factory
    Admin->>Factory: addAuthorizedManufacturer(mitsubishiManagerAddress)
    Factory->>Factory: authorizedManufacturers[mitsubishiManager] = true
    
    Note over Admin,MIT: ✅ Mitsubishi Manager Criado e Autorizado
```

### Detalhes da Criação Mitsubishi

**Como Funciona a Herança:**
- 🔧 **Compilação**: `MitsubishiManager.sol` + `ManufacturerManager.sol` = contrato único
- 📦 **Deploy**: Apenas o `MitsubishiManager` (com código herdado embutido)
- 🎯 **Resultado**: Um contrato na blockchain com todas as funcionalidades

**Estado do Mitsubishi Manager:**
- ✅ **Endereço**: `mitsubishiManagerAddress`
- ✅ **Manufacturer**: `mitsubishiWallet`
- ✅ **Nome**: "Mitsubishi Electric Corporation"
- ✅ **País**: "Japan"
- ✅ **Autorizado na Factory**: Sim
- ✅ **Stakeholder Principal**: mitsubishiWallet como "manufacturer"
- ⏳ **Schemas**: Nenhum criado ainda
- ⏳ **Produtos**: Nenhum criado ainda

---

## 4. Estado Final Após Criação

### Resultado da Configuração

```mermaid
graph TD
    subgraph "Infraestrutura Base (Compartilhada)"
        Registry[PassportRegistry]
        Factory[DigitalPassportFactory]
    end
    
    subgraph "EAS na Arbitrum (Usado Depois)"
        EAS[EAS Contract]
        SchemaReg[EAS SchemaRegistry]
    end
    
    subgraph "Fabricantes Independentes"
        WEG[WEGManager<br/>Brasil<br/>extends ManufacturerManager]
        MIT[MitsubishiManager<br/>Japan<br/>extends ManufacturerManager]
    end
    
    Factory --> |authorizes| WEG
    Factory --> |authorizes| MIT
    Factory --> Registry
    WEG -.-> |will use| EAS
    MIT -.-> |will use| EAS
    WEG -.-> |will use| SchemaReg
    MIT -.-> |will use| SchemaReg
    
    style Registry fill:#f3e5f5
    style Factory fill:#f3e5f5
    style EAS fill:#e3f2fd
    style SchemaReg fill:#e3f2fd
    style WEG fill:#e1f5fe
    style MIT fill:#fff3e0
```

---

## 5. Próximos Passos

### ✅ **Concluído**
- ✅ **Infraestrutura Base**: Registry, Factory
- ✅ **WEG Manager**: Criado, autorizado, configurado
- ✅ **Mitsubishi Manager**: Criado, autorizado, configurado
- ✅ **Isolamento**: Cada fabricante opera independentemente

### 🔄 **Próximo: Definição de Roles e Permissões**
Definir que tipos de stakeholders cada fabricante terá:
- WEG: técnicos, exportadores, auditores
- Mitsubishi: engenheiros, calibradores, suporte técnico

### 🔄 **Depois: Criação de Schemas com Permissões**
Criar schemas específicos já sabendo quais roles podem usá-los

### 🔄 **Por Último: Adição de Stakeholders**
Adicionar pessoas/entidades específicas com roles definidas

---

## 6. Criação de Schemas EAS - WEG

### Visão Geral
Antes de cadastrar stakeholders, a WEG precisa criar os schemas EAS que serão usados para diferentes tipos de attestations durante o ciclo de vida dos produtos.

### Diagrama de Sequência - Criação de Schemas EAS

```mermaid
sequenceDiagram
    participant WEG as WEG Manager
    participant WEGM as WEGManager Contract
    participant SchemaReg as EAS SchemaRegistry
    participant EAS as EAS Contract

    Note over WEG,EAS: WEG Manager Já Existe e Está Autorizado
    
    Note over WEG,EAS: Passo 1: Schema de Inicialização do Produto
    WEG->>SchemaReg: register("WEG_PRODUCT_INIT", schema_definition, revocable=false)
    SchemaReg->>SchemaReg: schemaId = keccak256("WEG_PRODUCT_INIT" + definition)
    SchemaReg->>SchemaReg: schemas[schemaId] = SchemaRecord
    SchemaReg->>WEG: return schemaId_INIT
    WEG->>WEGM: _addSchema("WEG_PRODUCT_INIT", schemaId_INIT)
    WEGM->>WEGM: registeredSchemas["WEG_PRODUCT_INIT"] = schemaId_INIT
    
    Note over WEG,EAS: Passo 2: Schema de Evento de Transporte
    WEG->>SchemaReg: register("WEG_TRANSPORT_EVENT", schema_definition, revocable=false)
    SchemaReg->>SchemaReg: schemaId = keccak256("WEG_TRANSPORT_EVENT" + definition)
    SchemaReg->>SchemaReg: schemas[schemaId] = SchemaRecord
    SchemaReg->>WEG: return schemaId_TRANSPORT
    WEG->>WEGM: _addSchema("WEG_TRANSPORT_EVENT", schemaId_TRANSPORT)
    WEGM->>WEGM: registeredSchemas["WEG_TRANSPORT_EVENT"] = schemaId_TRANSPORT
    
    Note over WEG,EAS: Passo 3: Schema de Transferência de Propriedade
    WEG->>SchemaReg: register("WEG_OWNERSHIP_TRANSFER", schema_definition, revocable=false)
    SchemaReg->>SchemaReg: schemaId = keccak256("WEG_OWNERSHIP_TRANSFER" + definition)
    SchemaReg->>SchemaReg: schemas[schemaId] = SchemaRecord
    SchemaReg->>WEG: return schemaId_OWNERSHIP
    WEG->>WEGM: _addSchema("WEG_OWNERSHIP_TRANSFER", schemaId_OWNERSHIP)
    WEGM->>WEGM: registeredSchemas["WEG_OWNERSHIP_TRANSFER"] = schemaId_OWNERSHIP
    
    Note over WEG,EAS: Passo 4: Schema de Evento de Manutenção
    WEG->>SchemaReg: register("WEG_MAINTENANCE_EVENT", schema_definition, revocable=false)
    SchemaReg->>SchemaReg: schemaId = keccak256("WEG_MAINTENANCE_EVENT" + definition)
    SchemaReg->>SchemaReg: schemas[schemaId] = SchemaRecord
    SchemaReg->>WEG: return schemaId_MAINTENANCE
    WEG->>WEGM: _addSchema("WEG_MAINTENANCE_EVENT", schemaId_MAINTENANCE)
    WEGM->>WEGM: registeredSchemas["WEG_MAINTENANCE_EVENT"] = schemaId_MAINTENANCE
    
    Note over WEG,EAS: Passo 5: Schema de Evento de Finalização
    WEG->>SchemaReg: register("WEG_END_OF_LIFE", schema_definition, revocable=false)
    SchemaReg->>SchemaReg: schemaId = keccak256("WEG_END_OF_LIFE" + definition)
    SchemaReg->>SchemaReg: schemas[schemaId] = SchemaRecord
    SchemaReg->>WEG: return schemaId_EOL
    WEG->>WEGM: _addSchema("WEG_END_OF_LIFE", schemaId_EOL)
    WEGM->>WEGM: registeredSchemas["WEG_END_OF_LIFE"] = schemaId_EOL
    
    Note over WEG,EAS: ✅ Todos os Schemas WEG Criados
```

### Detalhes dos Schemas Criados

#### **1️⃣ Schema de Inicialização do Produto**
- **Nome**: `WEG_PRODUCT_INIT`
- **Função**: Inicializar o passaporte digital com informações de criação
- **Campos**:
  ```solidity
  string productModel,        // Modelo do produto (ex: "WEG W22 100HP")
  string serialNumber,        // Número de série único
  uint256 timestamp,          // Timestamp de fabricação
  string composition,         // Composição e materiais
  string[] suppliers,         // Fornecedores de componentes/matéria-prima
  string manufacturingLocation, // Local de fabricação
  string qualityStandards     // Padrões de qualidade aplicados
  ```

#### **2️⃣ Schema de Evento de Transporte**
- **Nome**: `WEG_TRANSPORT_EVENT`
- **Função**: Registrar eventos de transporte/movimentação
- **Campos**:
  ```solidity
  string title,               // Título do evento (ex: "Produto iniciou transferência do Brasil para Europa")
  address responsible,        // Responsável pelo transporte (ex: transportadora)
  address recipient,          // Destinatário (opcional, pode ser address(0))
  uint256 timestamp,          // Timestamp do evento
  string description,         // Descrição detalhada
  string origin,              // Local de origem
  string destination,         // Local de destino
  string trackingInfo         // Informações de rastreamento
  ```

#### **3️⃣ Schema de Transferência de Propriedade**
- **Nome**: `WEG_OWNERSHIP_TRANSFER`
- **Função**: Registrar mudanças de propriedade do produto
- **Campos**:
  ```solidity
  address previousOwner,      // Proprietário anterior
  address newOwner,           // Novo proprietário
  uint256 timestamp,          // Timestamp da transferência
  string transferType,        // Tipo de transferência (venda, doação, etc.)
  string contractReference,   // Referência do contrato de venda (opcional)
  uint256 transferValue,      // Valor da transferência (opcional)
  string description          // Descrição da transferência
  ```

#### **4️⃣ Schema de Evento de Manutenção**
- **Nome**: `WEG_MAINTENANCE_EVENT`
- **Função**: Registrar início e fim de manutenções
- **Campos**:
  ```solidity
  string eventType,           // Tipo do evento ("START" ou "COMPLETE")
  address technician,         // Técnico responsável
  uint256 timestamp,          // Timestamp do evento
  string maintenanceType,     // Tipo de manutenção (preventiva, corretiva, etc.)
  string description,         // Descrição dos serviços
  string[] partsReplaced,     // Peças substituídas (se houver)
  string nextScheduledMaintenance // Próxima manutenção programada
  ```

#### **5️⃣ Schema de Evento de Finalização**
- **Nome**: `WEG_END_OF_LIFE`
- **Função**: Registrar quando produto chega ao fim da vida útil
- **Campos**:
  ```solidity
  uint256 timestamp,          // Timestamp da finalização
  string reason,              // Motivo da finalização (desgaste, obsolescência, etc.)
  address finalizer,          // Quem declarou o fim da vida útil
  string condition,           // Condição final do produto
  string disposalMethod,      // Método de descarte/reciclagem
  address recycler,           // Recicladora responsável (se aplicável)
  string environmentalImpact  // Impacto ambiental do descarte
  ```

---

## 7. Estado dos Schemas Criados

### Resultado da Configuração

```mermaid
graph TD
    subgraph "WEG Manager"
        WEGM[WEGManager Contract]
    end
    
    subgraph "EAS SchemaRegistry (Arbitrum)"
        SR[SchemaRegistry]
    end
    
    subgraph "Schemas WEG Registrados"
        INIT[WEG_PRODUCT_INIT<br/>Inicialização]
        TRANS[WEG_TRANSPORT_EVENT<br/>Transporte]
        OWN[WEG_OWNERSHIP_TRANSFER<br/>Propriedade]
        MAINT[WEG_MAINTENANCE_EVENT<br/>Manutenção]
        EOL[WEG_END_OF_LIFE<br/>Finalização]
    end
    
    WEGM --> |registers| SR
    SR --> |creates| INIT
    SR --> |creates| TRANS
    SR --> |creates| OWN
    SR --> |creates| MAINT
    SR --> |creates| EOL
    WEGM --> |stores| INIT
    WEGM --> |stores| TRANS
    WEGM --> |stores| OWN
    WEGM --> |stores| MAINT
    WEGM --> |stores| EOL
    
    style WEGM fill:#e8f5e8
    style SR fill:#e3f2fd
    style INIT fill:#fff3e0
    style TRANS fill:#fff3e0
    style OWN fill:#fff3e0
    style MAINT fill:#fff3e0
    style EOL fill:#fff3e0
```

### Observações Importantes

#### **🔐 Sistema de Permissões Baseado em Roles:**
- **Roles definem permissões**: Cada role tem schemas específicos que pode usar
- **Stakeholders herdam permissões**: Quando atribuído a uma role, stakeholder ganha suas permissões
- **Gerenciamento centralizado**: Mudanças na role afetam todos os stakeholders dessa role
- **Escalabilidade**: Novos stakeholders só precisam ser atribuídos a roles existentes

#### **🎯 Mapeamento Role → Permissões:**
- **`exporter`** → `["WEG_TRANSPORT_EVENT"]`
- **`technician`** → `["WEG_MAINTENANCE_EVENT"]`
- **`joint_manufacturer`** → `["WEG_OWNERSHIP_TRANSFER", "WEG_TRANSPORT_EVENT"]`
- **`retailer`** → `["WEG_OWNERSHIP_TRANSFER"]`
- **`logistics`** → `["WEG_TRANSPORT_EVENT"]`
- **`recycler`** → `["WEG_END_OF_LIFE"]`
- **`end_customer`** → `[]` (apenas consulta)

#### **🏭 Cadeia de Valor com Roles:**
1. **WEG** (manufacturer) → Fabrica motor (`WEG_PRODUCT_INIT`)
2. **Thyssenkrupp** (joint_manufacturer) → Recebe motor e transporta elevador
3. **Construções Brasil** (retailer) → Vende elevador
4. **Condomínio** (end_customer) → Usa o elevador (consulta apenas)
5. **Maersk/WEG Export** (logistics/exporter) → Transporta
6. **João Silva** (technician) → Faz manutenções
7. **GreenRecycle** (recycler) → Recicla no fim da vida

#### **✅ Vantagens do Sistema de Roles:**
- **Consistência**: Todos stakeholders da mesma role têm mesmas permissões
- **Manutenibilidade**: Alterar uma role atualiza todos seus stakeholders
- **Segurança**: Permissões centralizadas e auditáveis
- **Flexibilidade**: Stakeholders podem mudar de role se necessário

#### **🎯 Próximos Passos:**
- ⏳ **Criação de Produtos**: Usando a factory para criar passaportes
- ⏳ **Attestations Práticas**: Stakeholders criam attestations baseados em suas roles
- ⏳ **Consultas**: Demonstrar como consultar o histórico completo

---

## 8. Criação de Roles - WEG

### Visão Geral
Antes de cadastrar stakeholders, a WEG precisa definir as roles (funções) que existirão no seu ecossistema. Cada role define um tipo de participante e suas responsabilidades gerais.

### Diagrama de Sequência - Criação de Roles WEG

```mermaid
sequenceDiagram
    participant WEG as WEG Manager
    participant WEGM as WEGManager Contract

    Note over WEG,WEGM: Schemas EAS Já Foram Criados
    
    Note over WEG,WEGM: Passo 1: Criar Role de Exportador
    WEG->>WEGM: createRole("exporter", "Responsável por exportação e documentação internacional", ["WEG_TRANSPORT_EVENT"])
    WEGM->>WEGM: roles["exporter"] = RoleInfo{description, allowedSchemas}
    WEGM->>WEGM: roleExists["exporter"] = true
    WEGM->>WEG: emit RoleCreated("exporter")
    
    Note over WEG,WEGM: Passo 2: Criar Role de Técnico
    WEG->>WEGM: createRole("technician", "Técnico certificado para manutenção e reparos", ["WEG_MAINTENANCE_EVENT"])
    WEGM->>WEGM: roles["technician"] = RoleInfo{description, allowedSchemas}
    WEGM->>WEGM: roleExists["technician"] = true
    WEGM->>WEG: emit RoleCreated("technician")
    
    Note over WEG,WEGM: Passo 3: Criar Role de Fabricante Conjunta
    WEG->>WEGM: createRole("joint_manufacturer", "Fabricante que integra produtos WEG em seus sistemas", ["WEG_OWNERSHIP_TRANSFER", "WEG_TRANSPORT_EVENT"])
    WEGM->>WEGM: roles["joint_manufacturer"] = RoleInfo{description, allowedSchemas}
    WEGM->>WEGM: roleExists["joint_manufacturer"] = true
    WEGM->>WEG: emit RoleCreated("joint_manufacturer")
    
    Note over WEG,WEGM: Passo 4: Criar Role de Distribuidor
    WEG->>WEGM: createRole("retailer", "Distribuidor ou loja autorizada para venda", ["WEG_OWNERSHIP_TRANSFER"])
    WEGM->>WEGM: roles["retailer"] = RoleInfo{description, allowedSchemas}
    WEGM->>WEGM: roleExists["retailer"] = true
    WEGM->>WEG: emit RoleCreated("retailer")
    
    Note over WEG,WEGM: Passo 5: Criar Role de Cliente Final
    WEG->>WEGM: createRole("end_customer", "Cliente final que compra e usa o produto", [])
    WEGM->>WEGM: roles["end_customer"] = RoleInfo{description, allowedSchemas}
    WEGM->>WEGM: roleExists["end_customer"] = true
    WEGM->>WEG: emit RoleCreated("end_customer")
    
    Note over WEG,WEGM: Passo 6: Criar Role de Logística
    WEG->>WEGM: createRole("logistics", "Responsável por transporte e logística", ["WEG_TRANSPORT_EVENT"])
    WEGM->>WEGM: roles["logistics"] = RoleInfo{description, allowedSchemas}
    WEGM->>WEGM: roleExists["logistics"] = true
    WEGM->>WEG: emit RoleCreated("logistics")
    
    Note over WEG,WEGM: Passo 7: Criar Role de Recicladora
    WEG->>WEGM: createRole("recycler", "Empresa responsável por reciclagem e descarte sustentável", ["WEG_END_OF_LIFE"])
    WEGM->>WEGM: roles["recycler"] = RoleInfo{description, allowedSchemas}
    WEGM->>WEGM: roleExists["recycler"] = true
    WEGM->>WEG: emit RoleCreated("recycler")
    
    Note over WEG,WEGM: ✅ Todas as Roles WEG Criadas com Permissões
```

### Detalhes das Roles Criadas

#### **1️⃣ Role: Exporter**
- **Nome**: `exporter`
- **Descrição**: "Responsável por exportação e documentação internacional"
- **Schemas Permitidos**: `["WEG_TRANSPORT_EVENT"]`
- **Propósito**: Gerenciar processos de exportação
- **Responsabilidades**: Documentação, certificações, conformidade internacional

#### **2️⃣ Role: Technician**
- **Nome**: `technician`
- **Descrição**: "Técnico certificado para manutenção e reparos"
- **Schemas Permitidos**: `["WEG_MAINTENANCE_EVENT"]`
- **Propósito**: Realizar manutenções técnicas
- **Responsabilidades**: Inspeções, reparos, manutenção preventiva

#### **3️⃣ Role: Joint Manufacturer**
- **Nome**: `joint_manufacturer`
- **Descrição**: "Fabricante que integra produtos WEG em seus sistemas"
- **Schemas Permitidos**: `["WEG_OWNERSHIP_TRANSFER", "WEG_TRANSPORT_EVENT"]`
- **Propósito**: Integrar componentes WEG em produtos finais
- **Responsabilidades**: Integração, testes de compatibilidade, montagem

#### **4️⃣ Role: Retailer**
- **Nome**: `retailer`
- **Descrição**: "Distribuidor ou loja autorizada para venda"
- **Schemas Permitidos**: `["WEG_OWNERSHIP_TRANSFER"]`
- **Propósito**: Comercializar produtos para clientes finais
- **Responsabilidades**: Vendas, atendimento, garantia

#### **5️⃣ Role: End Customer**
- **Nome**: `end_customer`
- **Descrição**: "Cliente final que compra e usa o produto"
- **Schemas Permitidos**: `[]` (nenhum schema - apenas consulta)
- **Propósito**: Usar o produto na operação final
- **Responsabilidades**: Operação, manutenção básica, feedback

#### **6️⃣ Role: Logistics**
- **Nome**: `logistics`
- **Descrição**: "Responsável por transporte e logística"
- **Schemas Permitidos**: `["WEG_TRANSPORT_EVENT"]`
- **Propósito**: Movimentar produtos entre locais
- **Responsabilidades**: Transporte, rastreamento, entrega

#### **7️⃣ Role: Recycler**
- **Nome**: `recycler`
- **Descrição**: "Empresa responsável por reciclagem e descarte sustentável"
- **Schemas Permitidos**: `["WEG_END_OF_LIFE"]`
- **Propósito**: Processar produtos no fim da vida útil
- **Responsabilidades**: Desmontagem, reciclagem, destinação sustentável

---

## 9. Estado das Roles Criadas

### Resultado da Configuração

```mermaid
graph TD
    subgraph "WEG Manager"
        WEGM[WEGManager Contract]
    end
    
    subgraph "Roles Definidas no Ecossistema WEG"
        EXP_ROLE[exporter<br/>Exportação e documentação]
        TECH_ROLE[technician<br/>Manutenção e reparos]
        JOINT_ROLE[joint_manufacturer<br/>Integração de produtos]
        RETAIL_ROLE[retailer<br/>Distribuição e vendas]
        CUSTOMER_ROLE[end_customer<br/>Uso final do produto]
        LOG_ROLE[logistics<br/>Transporte e logística]
        REC_ROLE[recycler<br/>Reciclagem sustentável]
    end
    
    WEGM --> |defines| EXP_ROLE
    WEGM --> |defines| TECH_ROLE
    WEGM --> |defines| JOINT_ROLE
    WEGM --> |defines| RETAIL_ROLE
    WEGM --> |defines| CUSTOMER_ROLE
    WEGM --> |defines| LOG_ROLE
    WEGM --> |defines| REC_ROLE
    
    style WEGM fill:#e8f5e8
    style EXP_ROLE fill:#fff3e0
    style TECH_ROLE fill:#fff3e0
    style JOINT_ROLE fill:#fff3e0
    style RETAIL_ROLE fill:#fff3e0
    style CUSTOMER_ROLE fill:#f3e5f5
    style LOG_ROLE fill:#fff3e0
    style REC_ROLE fill:#fff3e0
```

### Observações Importantes

#### **📋 Roles vs Stakeholders:**
- **Roles**: Definem TIPOS de participantes (templates)
- **Stakeholders**: São pessoas/empresas específicas atribuídas a uma role

#### **🔐 Hierarquia de Criação:**
1. ✅ **Schemas EAS**: Tipos de attestations possíveis
2. ✅ **Roles**: Tipos de participantes possíveis  
3. ⏳ **Stakeholders**: Pessoas/empresas específicas com roles e permissões

#### **🎯 Próximos Passos:**
- ⏳ **Cadastro de Stakeholders**: Atribuir pessoas/empresas específicas às roles criadas
- ⏳ **Definição de Permissões**: Mapear quais roles podem usar quais schemas
- ⏳ **Criação de Produtos**: Usar a factory para criar passaportes
- ⏳ **Attestations**: Stakeholders criam attestations baseados em suas permissões

---

## 10. Cadastro de Stakeholders - WEG

### Visão Geral
Agora que o WEG Manager está criado, os schemas EAS foram criados, e as roles foram definidas com suas permissões, a WEG pode cadastrar stakeholders específicos atribuindo-os às roles. As permissões vêm automaticamente da role atribuída.

### Diagrama de Sequência - Cadastro de Stakeholders WEG

```mermaid
sequenceDiagram
    participant WEG as WEG Manager
    participant WEGM as WEGManager Contract

    Note over WEG,WEGM: Roles com Permissões Já Foram Criadas
    
    Note over WEG,WEGM: Passo 1: Cadastrar Exportadora
    WEG->>WEGM: addStakeholder(exportadoraAddress, "WEG Export Brasil", "exporter", "Dept. Exportação")
    WEGM->>WEGM: stakeholders[exportadoraAddress] = StakeholderInfo{name, role, info}
    WEGM->>WEGM: isAuthorizedStakeholder[exportadoraAddress] = true
    WEGM->>WEGM: inherit permissions from role "exporter" = ["WEG_TRANSPORT_EVENT"]
    WEGM->>WEG: emit StakeholderAdded(exportadoraAddress, "exporter")
    
    Note over WEG,WEGM: Passo 2: Cadastrar Técnico de Manutenção
    WEG->>WEGM: addStakeholder(tecnicoAddress, "João Silva", "technician", "Técnico Certificado IEC")
    WEGM->>WEGM: stakeholders[tecnicoAddress] = StakeholderInfo{name, role, info}
    WEGM->>WEGM: isAuthorizedStakeholder[tecnicoAddress] = true
    WEGM->>WEGM: inherit permissions from role "technician" = ["WEG_MAINTENANCE_EVENT"]
    WEGM->>WEG: emit StakeholderAdded(tecnicoAddress, "technician")
    
    Note over WEG,WEGM: Passo 3: Cadastrar Fabricante Conjunta
    WEG->>WEGM: addStakeholder(jointMfgAddress, "Thyssenkrupp Elevadores", "joint_manufacturer", "Integra motor em elevadores")
    WEGM->>WEGM: stakeholders[jointMfgAddress] = StakeholderInfo{name, role, info}
    WEGM->>WEGM: isAuthorizedStakeholder[jointMfgAddress] = true
    WEGM->>WEGM: inherit permissions from role "joint_manufacturer" = ["WEG_OWNERSHIP_TRANSFER", "WEG_TRANSPORT_EVENT"]
    WEGM->>WEG: emit StakeholderAdded(jointMfgAddress, "joint_manufacturer")
    
    Note over WEG,WEGM: Passo 4: Cadastrar Comércio/Distribuidor
    WEG->>WEGM: addStakeholder(retailerAddress, "Construções Brasil Ltda", "retailer", "Distribuidor autorizado")
    WEGM->>WEGM: stakeholders[retailerAddress] = StakeholderInfo{name, role, info}
    WEGM->>WEGM: isAuthorizedStakeholder[retailerAddress] = true
    WEGM->>WEGM: inherit permissions from role "retailer" = ["WEG_OWNERSHIP_TRANSFER"]
    WEGM->>WEG: emit StakeholderAdded(retailerAddress, "retailer")
    
    Note over WEG,WEGM: Passo 5: Cadastrar Cliente Final
    WEG->>WEGM: addStakeholder(endClientAddress, "Condomínio Residencial Minha Casa", "end_customer", "Cliente Final - Comprador do Elevador")
    WEGM->>WEGM: stakeholders[endClientAddress] = StakeholderInfo{name, role, info}
    WEGM->>WEGM: isAuthorizedStakeholder[endClientAddress] = true
    WEGM->>WEGM: inherit permissions from role "end_customer" = [] (apenas consulta)
    WEGM->>WEG: emit StakeholderAdded(endClientAddress, "end_customer")
    
    Note over WEG,WEGM: Passo 6: Cadastrar Transportadora
    WEG->>WEGM: addStakeholder(transportadoraAddress, "Maersk Line", "logistics", "Transporte Marítimo Internacional")
    WEGM->>WEGM: stakeholders[transportadoraAddress] = StakeholderInfo{name, role, info}
    WEGM->>WEGM: isAuthorizedStakeholder[transportadoraAddress] = true
    WEGM->>WEGM: inherit permissions from role "logistics" = ["WEG_TRANSPORT_EVENT"]
    WEGM->>WEG: emit StakeholderAdded(transportadoraAddress, "logistics")
    
    Note over WEG,WEGM: Passo 7: Cadastrar Recicladora
    WEG->>WEGM: addStakeholder(recicladoaAddress, "GreenRecycle Brasil", "recycler", "Reciclagem de Metais e Ímãs")
    WEGM->>WEGM: stakeholders[recicladoaAddress] = StakeholderInfo{name, role, info}
    WEGM->>WEGM: isAuthorizedStakeholder[recicladoaAddress] = true
    WEGM->>WEGM: inherit permissions from role "recycler" = ["WEG_END_OF_LIFE"]
    WEGM->>WEG: emit StakeholderAdded(recicladoaAddress, "recycler")
    
    Note over WEG,WEGM: ✅ Todos os Stakeholders Cadastrados com Roles
```

### Detalhes dos Stakeholders Cadastrados

#### **1️⃣ Exportadora WEG**
- **Nome**: "WEG Export Brasil"
- **Role Atribuída**: `exporter`
- **Permissões Herdadas**: `["WEG_TRANSPORT_EVENT"]` (da role exporter)
- **Função**: Registrar eventos de transporte para exportação
- **Info Adicional**: "Dept. Exportação"

#### **2️⃣ Técnico de Manutenção**
- **Nome**: "João Silva"
- **Role Atribuída**: `technician`
- **Permissões Herdadas**: `["WEG_MAINTENANCE_EVENT"]` (da role technician)
- **Função**: Registrar início e fim de manutenções
- **Info Adicional**: "Técnico Certificado IEC"

#### **3️⃣ Fabricante Conjunta**
- **Nome**: "Thyssenkrupp Elevadores"
- **Role Atribuída**: `joint_manufacturer`
- **Permissões Herdadas**: `["WEG_OWNERSHIP_TRANSFER", "WEG_TRANSPORT_EVENT"]` (da role joint_manufacturer)
- **Função**: Registrar recebimento do motor e transporte do elevador
- **Info Adicional**: "Integra motor em elevadores"

#### **4️⃣ Comércio/Distribuidor**
- **Nome**: "Construções Brasil Ltda"
- **Role Atribuída**: `retailer`
- **Permissões Herdadas**: `["WEG_OWNERSHIP_TRANSFER"]` (da role retailer)
- **Função**: Registrar venda do elevador para cliente final
- **Info Adicional**: "Distribuidor autorizado"

#### **5️⃣ Cliente Final**
- **Nome**: "Condomínio Residencial Minha Casa"
- **Role Atribuída**: `end_customer`
- **Permissões Herdadas**: `[]` (da role end_customer - apenas consulta)
- **Função**: Receber e usar o elevador (apenas consulta)
- **Info Adicional**: "Cliente Final - Comprador do Elevador"

#### **6️⃣ Transportadora**
- **Nome**: "Maersk Line"
- **Role Atribuída**: `logistics`
- **Permissões Herdadas**: `["WEG_TRANSPORT_EVENT"]` (da role logistics)
- **Função**: Registrar eventos de transporte internacional
- **Info Adicional**: "Transporte Marítimo Internacional"

#### **7️⃣ Recicladora**
- **Nome**: "GreenRecycle Brasil"
- **Role Atribuída**: `recycler`
- **Permissões Herdadas**: `["WEG_END_OF_LIFE"]` (da role recycler)
- **Função**: Registrar finalização e descarte do produto
- **Info Adicional**: "Reciclagem de Metais e Ímãs"

---

## 11. Estado Final dos Stakeholders WEG

### Resultado da Configuração

```mermaid
graph TD
    subgraph "WEG Manager"
        WEGM[WEGManager Contract]
    end
    
    subgraph "Stakeholders com Permissões de Attestation"
        WEG[WEG S.A.<br/>manufacturer<br/>Todas as permissões]
        EXP[WEG Export Brasil<br/>exporter<br/>WEG_TRANSPORT_EVENT]
        TECH[João Silva<br/>technician<br/>WEG_MAINTENANCE_EVENT]
        JOIN[Thyssenkrupp<br/>joint_manufacturer<br/>WEG_OWNERSHIP_TRANSFER<br/>WEG_TRANSPORT_EVENT]
        RETAIL[Construções<br/>retailer<br/>WEG_OWNERSHIP_TRANSFER]
        TRANS[Maersk Line<br/>logistics<br/>WEG_TRANSPORT_EVENT]
        RECIC[GreenRecycle<br/>recycler<br/>WEG_END_OF_LIFE]
    end
    
    subgraph "Stakeholder sem Permissões de Attestation"
        ENDC[Condomínio<br/>end_customer<br/>Sem permissões]
    end
    
    WEGM --> |manages| WEG
    WEGM --> |manages| EXP
    WEGM --> |manages| TECH
    WEGM --> |manages| JOIN
    WEGM --> |manages| RETAIL
    WEGM --> |manages| ENDC
    WEGM --> |manages| TRANS
    WEGM --> |manages| RECIC
    
    style WEG fill:#e1f5fe
    style EXP fill:#fff3e0
    style TECH fill:#fff3e0
    style JOIN fill:#fff3e0
    style RETAIL fill:#fff3e0
    style ENDC fill:#f3e5f5
    style TRANS fill:#fff3e0
    style RECIC fill:#fff3e0
```

### Observações Importantes

#### **🔐 Sistema de Permissões Baseado em Roles:**
- **Roles definem permissões**: Cada role tem schemas específicos que pode usar
- **Stakeholders herdam permissões**: Quando atribuído a uma role, stakeholder ganha suas permissões
- **Gerenciamento centralizado**: Mudanças na role afetam todos os stakeholders dessa role
- **Escalabilidade**: Novos stakeholders só precisam ser atribuídos a roles existentes

#### **🎯 Mapeamento Role → Permissões:**
- **`exporter`** → `["WEG_TRANSPORT_EVENT"]`
- **`technician`** → `["WEG_MAINTENANCE_EVENT"]`
- **`joint_manufacturer`** → `["WEG_OWNERSHIP_TRANSFER", "WEG_TRANSPORT_EVENT"]`
- **`retailer`** → `["WEG_OWNERSHIP_TRANSFER"]`
- **`logistics`** → `["WEG_TRANSPORT_EVENT"]`
- **`recycler`** → `["WEG_END_OF_LIFE"]`
- **`end_customer`** → `[]` (apenas consulta)

#### **🏭 Cadeia de Valor com Roles:**
1. **WEG** (manufacturer) → Fabrica motor (`WEG_PRODUCT_INIT`)
2. **Thyssenkrupp** (joint_manufacturer) → Recebe motor e transporta elevador
3. **Construções Brasil** (retailer) → Vende elevador
4. **Condomínio** (end_customer) → Usa o elevador (consulta apenas)
5. **Maersk/WEG Export** (logistics/exporter) → Transporta
6. **João Silva** (technician) → Faz manutenções
7. **GreenRecycle** (recycler) → Recicla no fim da vida

#### **✅ Vantagens do Sistema de Roles:**
- **Consistência**: Todos stakeholders da mesma role têm mesmas permissões
- **Manutenibilidade**: Alterar uma role atualiza todos seus stakeholders
- **Segurança**: Permissões centralizadas e auditáveis
- **Flexibilidade**: Stakeholders podem mudar de role se necessário

#### **🎯 Próximos Passos:**
- ⏳ **Criação de Produtos**: Usando a factory para criar passaportes
- ⏳ **Attestations Práticas**: Stakeholders criam attestations baseados em suas roles
- ⏳ **Consultas**: Demonstrar como consultar o histórico completo

---

## 12. Criação de um Produto - Motor WEG W22 100HP

### Visão Geral
Agora que toda a infraestrutura está pronta (schemas, roles, stakeholders), a WEG pode criar um produto específico usando a DigitalPassportFactory e inicializar seu passaporte digital com a primeira attestation.

### Diagrama de Sequência - Criação de Produto

```mermaid
sequenceDiagram
    participant WEG as WEG S.A.
    participant WEGM as WEGManager Contract
    participant Factory as DigitalPassportFactory
    participant Registry as PassportRegistry
    participant EAS as EAS Contract
    participant Passport as DigitalPassport Contract

    Note over WEG,Passport: Infraestrutura Completa Já Existe
    
    Note over WEG,Passport: Passo 1: Criar Produto na Factory
    WEG->>Factory: createProduct(productId="WEG-W22-2024-001", wegManagerAddress)
    Factory->>Factory: require(authorizedManufacturers[wegManager] == true)
    Factory->>Passport: new DigitalPassport(productId, wegManager)
    Passport->>Passport: initialize(productId, manufacturer)
    Passport->>Factory: return passportAddress
    Factory->>Registry: registerPassport(productId, passportAddress, wegManager)
    Registry->>Registry: passports[productId] = PassportInfo
    Registry->>Registry: totalPassports++
    Factory->>WEG: return passportAddress
    
    Note over WEG,Passport: Passo 2: Criar Attestation Inicial
    WEG->>WEGM: attestToProduct(passportAddress, "WEG_PRODUCT_INIT", attestationData)
    WEGM->>WEGM: require(hasPermission(msg.sender, "WEG_PRODUCT_INIT"))
    WEGM->>WEGM: schemaId = registeredSchemas["WEG_PRODUCT_INIT"]
    WEGM->>EAS: attest(schemaId, passportAddress, attestationData)
    EAS->>EAS: create attestation with unique UID
    EAS->>WEGM: return attestationUID
    WEGM->>Passport: addAttestation(attestationUID, "WEG_PRODUCT_INIT", msg.sender)
    Passport->>Passport: attestations.push(AttestationRecord)
    WEGM->>WEG: emit AttestationCreated(passportAddress, attestationUID)
    
    Note over WEG,Passport: ✅ Produto Criado e Inicializado
```

### Detalhes do Produto Criado

#### **📋 Informações do Produto:**
- **Product ID**: `WEG-W22-2024-001`
- **Modelo**: Motor Elétrico WEG W22 100HP
- **Número de Série**: `WEG2024001`
- **Manufacturer**: WEG S.A.
- **Passport Address**: `0x123...abc` (endereço único do contrato)

#### **🏭 Dados da Attestation Inicial (WEG_PRODUCT_INIT):**
```json
{
  "productModel": "WEG W22 100HP",
  "serialNumber": "WEG2024001", 
  "timestamp": 1704067200,
  "composition": "Motor trifásico, carcaça ferro fundido, rotor alumínio, imãs neodímio",
  "suppliers": [
    "Fornecedor Aço Brasil Ltda",
    "Magnetos do Sul S.A.",
    "Bobinagem Técnica Jaraguá"
  ],
  "manufacturingLocation": "Jaraguá do Sul, Santa Catarina, Brasil",
  "qualityStandards": "IEC 60034, NEMA MG-1, ISO 9001:2015"
}
```

### Estados dos Sistemas Após Criação

#### **🏗️ PassportRegistry:**
- `totalPassports`: 1
- `passports["WEG-W22-2024-001"]`: 
  - `passportAddress`: `0x123...abc`
  - `manufacturer`: `wegManagerAddress`
  - `createdAt`: timestamp
  - `isActive`: true

#### **📄 DigitalPassport Contract:**
- **Product ID**: `WEG-W22-2024-001`
- **Manufacturer**: `wegManagerAddress`
- **Total Attestations**: 1
- **Attestations Array**:
  - `[0]`: AttestationRecord{uid, schemaType, attester, timestamp}

#### **🌐 EAS Contract:**
- **Nova Attestation Criada**:
  - **UID**: Identificador único gerado pelo EAS
  - **Schema**: `WEG_PRODUCT_INIT`
  - **Recipient**: `passportAddress`
  - **Attester**: `wegAddress`
  - **Data**: Dados JSON codificados

---

## 13. Estado Atual do Ecossistema

### Resultado da Configuração

```mermaid
graph TD
    subgraph "Infraestrutura Base"
        Registry[PassportRegistry<br/>1 produto registrado]
        Factory[DigitalPassportFactory<br/>WEG autorizada]
    end
    
    subgraph "WEG Manager Ecosystem"
        WEGM[WEGManager<br/>7 stakeholders<br/>5 schemas<br/>7 roles]
        WEG[WEG S.A.<br/>manufacturer]
    end
    
    subgraph "Produto Criado"
        Motor[Motor WEG W22 100HP<br/>WEG-W22-2024-001<br/>Passport: 0x123...abc]
        InitAtt[Attestation Inicial<br/>WEG_PRODUCT_INIT<br/>Por: WEG S.A.]
    end
    
    subgraph "EAS Arbitrum"
        EAS[EAS Contract<br/>1 attestation]
        SchemaReg[Schema Registry<br/>5 schemas WEG]
    end
    
    Registry --> Motor
    Factory --> Motor
    WEGM --> WEG
    WEG --> InitAtt
    Motor --> InitAtt
    InitAtt --> EAS
    WEGM --> SchemaReg
    
    style Registry fill:#f3e5f5
    style Factory fill:#f3e5f5
    style WEGM fill:#e8f5e8
    style WEG fill:#e1f5fe
    style Motor fill:#fff3e0
    style InitAtt fill:#e3f2fd
    style EAS fill:#e3f2fd
    style SchemaReg fill:#e3f2fd
```

### Observações Importantes

#### **✅ Produto Pronto para a Cadeia:**
- ✅ **Passport Digital**: Contrato único criado na blockchain
- ✅ **Attestation Inicial**: Dados de fabricação registrados
- ✅ **Registrado**: Disponível para consulta no registry
- ✅ **Rastreável**: Pronto para receber novas attestations da cadeia

#### **🔐 Permissões Ativas:**
- **WEG S.A.**: Pode criar qualquer attestation para este produto
- **Outros Stakeholders**: Podem criar attestations conforme suas roles permitirem
- **Consultas**: Qualquer pessoa pode consultar o histórico (dados públicos)

#### **🎯 Próximos Passos:**
- ⏳ **Fluxo de Attestations**: Stakeholders da cadeia criam suas attestations
- ⏳ **Transferências de Propriedade**: Produto muda de dono na cadeia
- ⏳ **Eventos de Transporte**: Movimentação entre locais
- ⏳ **Manutenções**: Registros ao longo da vida útil
- ⏳ **Consultas**: Como diferentes stakeholders veem o produto

---

## 14. Fluxo Completo de Attestations - Ciclo de Vida do Motor

### Visão Geral
Agora vamos acompanhar o Motor WEG W22 100HP (ID: WEG-W22-2024-001) ao longo de sua vida útil, mostrando como cada stakeholder cria attestations conforme suas permissões e responsabilidades.

### Diagrama de Sequência - Ciclo de Vida Completo

```mermaid
sequenceDiagram
    participant WEG as WEG S.A.
    participant EXP as WEG Export Brasil
    participant THYS as Thyssenkrupp
    participant MAERSK as Maersk Line
    participant CONST as Construções Brasil
    participant COND as Condomínio
    participant TECH as João Silva (Técnico)
    participant REC as GreenRecycle
    participant EAS as EAS Contract
    participant MOTOR as Motor WEG-W22-2024-001

    Note over WEG,MOTOR: ✅ Produto Já Criado com Attestation Inicial
    
    Note over WEG,MOTOR: Evento 1: Preparação para Exportação (Janeiro 2024)
    EXP->>EAS: attest("WEG_TRANSPORT_EVENT")
    Note right of EAS: title: "Motor preparado para exportação"<br/>responsible: exportadoraAddress<br/>origin: "Jaraguá do Sul, BR"<br/>destination: "Porto de Itajaí, BR"
    EAS->>MOTOR: registro de transporte interno
    
    Note over WEG,MOTOR: Evento 2: Transferência para Thyssenkrupp (Fevereiro 2024)
    THYS->>EAS: attest("WEG_OWNERSHIP_TRANSFER")
    Note right of EAS: previousOwner: wegAddress<br/>newOwner: thyssenAddress<br/>transferType: "purchase"<br/>transferValue: 15000 USD
    EAS->>MOTOR: mudança de propriedade
    
    Note over WEG,MOTOR: Evento 3: Transporte Internacional (Fevereiro 2024)
    MAERSK->>EAS: attest("WEG_TRANSPORT_EVENT")
    Note right of EAS: title: "Transporte marítimo BR-DE"<br/>origin: "Porto de Itajaí, BR"<br/>destination: "Porto de Hamburgo, DE"<br/>trackingInfo: "MAERSK-001-2024"
    EAS->>MOTOR: registro de transporte internacional
    
    Note over WEG,MOTOR: Evento 4: Chegada e Integração (Março 2024)
    THYS->>EAS: attest("WEG_TRANSPORT_EVENT")
    Note right of EAS: title: "Motor integrado em elevador"<br/>origin: "Porto de Hamburgo, DE"<br/>destination: "Fábrica Thyssenkrupp, DE"<br/>description: "Motor integrado no Elevador TK-E2024-45"
    EAS->>MOTOR: registro de integração
    
    Note over WEG,MOTOR: Evento 5: Venda para Distribuidor (Abril 2024)
    CONST->>EAS: attest("WEG_OWNERSHIP_TRANSFER")
    Note right of EAS: previousOwner: thyssenAddress<br/>newOwner: construcoesAddress<br/>transferType: "sale"<br/>description: "Venda de elevador completo"
    EAS->>MOTOR: nova mudança de propriedade
    
    Note over WEG,MOTOR: Evento 6: Venda para Cliente Final (Maio 2024)
    CONST->>EAS: attest("WEG_OWNERSHIP_TRANSFER")
    Note right of EAS: previousOwner: construcoesAddress<br/>newOwner: condominioAddress<br/>transferType: "sale"<br/>contractReference: "CONTR-2024-789"
    EAS->>MOTOR: propriedade final
    
    Note over WEG,MOTOR: Evento 7: Primeira Manutenção (Janeiro 2025)
    TECH->>EAS: attest("WEG_MAINTENANCE_EVENT")
    Note right of EAS: eventType: "START"<br/>maintenanceType: "preventiva"<br/>description: "Inspeção anual obrigatória"
    EAS->>MOTOR: início de manutenção
    
    TECH->>EAS: attest("WEG_MAINTENANCE_EVENT")
    Note right of EAS: eventType: "COMPLETE"<br/>description: "Lubrificação, limpeza, testes"<br/>nextScheduledMaintenance: "Janeiro 2026"
    EAS->>MOTOR: fim de manutenção
    
    Note over WEG,MOTOR: ... Tempo passa - 15 anos de operação ...
    
    Note over WEG,MOTOR: Evento 8: Fim da Vida Útil (2039)
    REC->>EAS: attest("WEG_END_OF_LIFE")
    Note right of EAS: reason: "Fim da vida útil do edifício"<br/>condition: "Funcional, mas obsoleto"<br/>disposalMethod: "Desmontagem para reciclagem"<br/>environmentalImpact: "95% materiais recuperados"
    EAS->>MOTOR: finalização do ciclo
    
    Note over WEG,MOTOR: ✅ Ciclo de Vida Completo Registrado
```

### Detalhes das Attestations Criadas

#### **📋 Histórico Cronológico do Motor WEG-W22-2024-001:**

#### **Evento 1: Preparação para Exportação (Janeiro 2024)**
- **Stakeholder**: WEG Export Brasil (role: `exporter`)
- **Schema**: `WEG_TRANSPORT_EVENT`
- **Dados**:
  ```json
  {
    "title": "Motor preparado para exportação",
    "responsible": "0xExportadora...",
    "recipient": "0x0",
    "timestamp": 1704672000,
    "description": "Motor embalado e preparado para transporte ao porto",
    "origin": "Jaraguá do Sul, Santa Catarina, Brasil",
    "destination": "Porto de Itajaí, Santa Catarina, Brasil",
    "trackingInfo": "WEG-EXP-2024-001"
  }
  ```

#### **Evento 2: Transferência de Propriedade (Fevereiro 2024)**
- **Stakeholder**: Thyssenkrupp Elevadores (role: `joint_manufacturer`)
- **Schema**: `WEG_OWNERSHIP_TRANSFER`
- **Dados**:
  ```json
  {
    "previousOwner": "0xWEG...",
    "newOwner": "0xThyssenkrupp...",
    "timestamp": 1707264000,
    "transferType": "purchase",
    "contractReference": "TK-WEG-CONTRACT-2024-15",
    "transferValue": 15000,
    "description": "Compra de motor para integração em elevador modelo TK-E2024-45"
  }
  ```

#### **Evento 3: Transporte Internacional (Fevereiro 2024)**
- **Stakeholder**: Maersk Line (role: `logistics`)
- **Schema**: `WEG_TRANSPORT_EVENT`
- **Dados**:
  ```json
  {
    "title": "Transporte marítimo Brasil-Alemanha",
    "responsible": "0xMaersk...",
    "recipient": "0xThyssenkrupp...",
    "timestamp": 1707868800,
    "description": "Transporte marítimo em container refrigerado",
    "origin": "Porto de Itajaí, Santa Catarina, Brasil",
    "destination": "Porto de Hamburgo, Alemanha",
    "trackingInfo": "MAERSK-CONTAINER-2024-001"
  }
  ```

#### **Evento 4: Integração no Produto Final (Março 2024)**
- **Stakeholder**: Thyssenkrupp Elevadores (role: `joint_manufacturer`)
- **Schema**: `WEG_TRANSPORT_EVENT`
- **Dados**:
  ```json
  {
    "title": "Motor integrado em elevador completo",
    "responsible": "0xThyssenkrupp...",
    "recipient": "0xThyssenkrupp...",
    "timestamp": 1709856000,
    "description": "Motor WEG integrado no elevador TK-E2024-45 para edifício residencial",
    "origin": "Porto de Hamburgo, Alemanha",
    "destination": "Fábrica Thyssenkrupp, Neuhausen, Alemanha",
    "trackingInfo": "TK-INTEGRATION-2024-45"
  }
  ```

#### **Eventos 5-6: Vendas na Cadeia (Abril-Maio 2024)**
- **Construções Brasil** registra recebimento do elevador
- **Construções Brasil** registra venda para cliente final (Condomínio)

#### **Evento 7: Manutenção Preventiva (Janeiro 2025)**
- **Stakeholder**: João Silva (role: `technician`)
- **Schema**: `WEG_MAINTENANCE_EVENT`
- **2 Attestations**: START e COMPLETE da manutenção

#### **Evento 8: Fim da Vida Útil (2039)**
- **Stakeholder**: GreenRecycle (role: `recycler`)
- **Schema**: `WEG_END_OF_LIFE`
- **15 anos** de operação registrados

---

## 15. Estado Final do Produto

### Resultado do Ciclo Completo

```mermaid
graph TD
    subgraph "Histórico Completo - Motor WEG-W22-2024-001"
        INIT[2024/Jan: Fabricação<br/>WEG S.A.<br/>WEG_PRODUCT_INIT]
        EXP[2024/Jan: Exportação<br/>WEG Export<br/>WEG_TRANSPORT_EVENT]
        TRANS1[2024/Fev: Transferência<br/>Thyssenkrupp<br/>WEG_OWNERSHIP_TRANSFER]
        SHIP[2024/Fev: Transporte<br/>Maersk<br/>WEG_TRANSPORT_EVENT]
        INTEG[2024/Mar: Integração<br/>Thyssenkrupp<br/>WEG_TRANSPORT_EVENT]
        SALE1[2024/Abr: Venda<br/>Construções<br/>WEG_OWNERSHIP_TRANSFER]
        SALE2[2024/Mai: Cliente Final<br/>Construções<br/>WEG_OWNERSHIP_TRANSFER]
        MAINT[2025/Jan: Manutenção<br/>João Silva<br/>WEG_MAINTENANCE_EVENT]
        EOL[2039: Fim da Vida<br/>GreenRecycle<br/>WEG_END_OF_LIFE]
    end
    
    INIT --> EXP
    EXP --> TRANS1
    TRANS1 --> SHIP
    SHIP --> INTEG
    INTEG --> SALE1
    SALE1 --> SALE2
    SALE2 --> MAINT
    MAINT --> EOL
    
    style INIT fill:#e1f5fe
    style EXP fill:#fff3e0
    style TRANS1 fill:#fff3e0
    style SHIP fill:#fff3e0
    style INTEG fill:#fff3e0
    style SALE1 fill:#fff3e0
    style SALE2 fill:#fff3e0
    style MAINT fill:#fff3e0
    style EOL fill:#f3e5f5
```

### Observações Importantes

#### **📊 Estatísticas do Produto:**
- **Total de Attestations**: 9 attestations
- **Stakeholders Únicos**: 7 diferentes
- **Países Visitados**: Brasil, Alemanha
- **Tempo de Vida**: 15 anos
- **Mudanças de Propriedade**: 3 transferências
- **Manutenções**: 1 preventiva registrada

#### **🔍 Rastreabilidade Completa:**
- ✅ **Origem**: Conhecemos todos os fornecedores de matéria-prima
- ✅ **Fabricação**: Local, padrões, qualidade documentados
- ✅ **Logística**: Rotas completas Brasil → Alemanha
- ✅ **Propriedade**: Cadeia completa WEG → Thyssenkrupp → Construções → Condomínio
- ✅ **Manutenção**: Histórico de serviços técnicos
- ✅ **Descarte**: Reciclagem responsável documentada

#### **🎯 Próximos Passos:**
- ⏳ **Consultas Específicas**: Como cada stakeholder acessa informações
- ⏳ **Relatórios Regulatórios**: Compliance com regulamentações
- ⏳ **Análise de Dados**: Insights da cadeia de suprimentos

---

**Documento**: Exemplo de Uso Multi-Fabricante  
**Status**: Ciclo de Vida Completo Documentado