# Ethereum Attestation Service (EAS)

<div class="grid grid-cols-2 gap-8">

<div>

## What is EAS?

**Decentralized protocol** on Arbitrum to create verifiable **attestations** about anything.

### Key Characteristics:
- **🌍 Universal Standard**: Open protocol used globally
- **🔒 Immutable**: Attestations cannot be changed
- **✅ Verifiable**: Anyone can confirm authenticity
- **🏗️ Flexible**: Supports any type of structured data

</div>

<div>

## Why EAS for Industry?

- **📋 Structured Events**: Each type of industrial event has specific format
- **👥 Multi-Stakeholder**: Different participants create different types of records
- **🔍 Audit**: Complete trail of who did what and when
- **🌐 Interoperability**: Standard that other companies can use

</div>

</div>

---

<style>
.schemas-slide {
  font-size: 0.9rem !important;
}
.schemas-slide h1 {
  font-size: 1.8rem !important;
  margin-bottom: 1rem !important;
}
.schemas-slide h2 {
  font-size: 1.2rem !important;
  margin-bottom: 0.5rem !important;
}
.schemas-slide h3 {
  font-size: 1rem !important;
  margin: 0.3rem 0 !important;
}
.schemas-slide pre {
  font-size: 0.7rem !important;
  padding: 0.5rem !important;
}
.schemas-slide .grid {
  gap: 1rem !important;
}
</style>

<div class="schemas-slide">

# Schemas: Defining Event Types

<div class="grid grid-cols-2">

<div>

## What are Schemas?

**Structured templates** that define what type of information can be recorded in each attestation.

### Example - Product Schema:
```typescript
{
  productModel: string,
  serialNumber: string, 
  timestamp: number,
  composition: string,
  suppliers: string[],
  manufacturingLocation: string,
  qualityStandards: string
}
```

</div>

<div>

## WEG Defined Schemas

**5 schemas** cover the complete lifecycle:

1. **🏭 WEG_PRODUCT_INIT**: Product creation
2. **🚛 WEG_TRANSPORT_EVENT**: Transport events  
3. **🤝 WEG_OWNERSHIP_TRANSFER**: Ownership changes
4. **🔧 WEG_MAINTENANCE_EVENT**: Maintenance and repairs
5. **♻️ WEG_END_OF_LIFE**: End of life and recycling

### **Each schema = Specific type of industrial event**

</div>

</div>

</div>

---

<style>
.resolvers-slide {
  font-size: 0.85rem !important;
}
.resolvers-slide h1 {
  font-size: 1.8rem !important;
  margin-bottom: 1rem !important;
}
.resolvers-slide h2 {
  font-size: 1.2rem !important;
  margin-bottom: 0.5rem !important;
}
.resolvers-slide pre {
  font-size: 0.65rem !important;
  padding: 0.4rem !important;
}
.resolvers-slide ul {
  margin: 0.3rem 0 !important;
}
.resolvers-slide li {
  margin: 0.2rem 0 !important;
}
</style>

<div class="resolvers-slide">

# Access Control: Roles and Resolvers

<div class="grid grid-cols-2 gap-6">

<div>

## Resolvers: Smart Validation

**Smart contracts** that validate **who can create** each type of attestation **before** it's recorded on blockchain.

### Features:
- **🔐 Permission Validation**: Only authorized can create
- **⚖️ Business Rules**: Custom logic per schema
- **🛡️ Security**: Prevents invalid or malicious records
- **📊 Audit**: Log of all creation attempts

</div>

<div>

## Role System

**Granular control** based on responsibilities in industrial chain:

### Main Roles:
- **🏭 Manufacturer**: Product creation and all schemas
- **🚛 Logistics**: Only transport events
- **🔧 Technician**: Only maintenance events  
- **👥 End Customer**: Only query (no creation)

### **Each role has specific permissions** for different types of industrial events

</div>

</div>

</div>

---

<style>
.eip712-compact {
  font-size: 0.85rem !important;
}
.eip712-compact h1 {
  font-size: 1.8rem !important;
  margin-bottom: 1rem !important;
}
.eip712-compact h2 {
  font-size: 1.2rem !important;
  margin-bottom: 0.5rem !important;
}
.eip712-compact h3 {
  font-size: 1rem !important;
  margin: 0.3rem 0 !important;
}
.eip712-compact ul {
  margin: 0.3rem 0 !important;
}
.eip712-compact li {
  margin: 0.15rem 0 !important;
  line-height: 1.3 !important;
}
.eip712-compact .grid {
  gap: 1.5rem !important;
}
</style>

<div class="eip712-compact">

# Digital Signatures: Security and Non-Repudiation

<div class="grid grid-cols-2">

<div>

## EIP-712: Structured Signatures

**Ethereum standard** for secure digital signatures of structured data.

### For Industrial Events:
- **🔐 Cryptographic Authentication**: Proves who created the record
- **📝 Non-repudiation**: Creator cannot deny having created
- **🛡️ Integrity**: Data cannot be modified without detection
- **⚖️ Legal Value**: Digital signatures recognized by law

</div>

<div>

## Signature Process

### **Creation Flow**:
1. **📋 Event Data**: Technician fills event information
2. **🔑 Digital Signature**: EIP-712 signature with private key
3. **📡 Blockchain Submission**: Attestation created on Arbitrum
4. **✅ Verification**: Anyone can verify signature authenticity

### **Legal Guarantee**: 
Each industrial event is **digitally signed** by its creator, providing **legal proof** of authenticity.

</div>

</div>

</div> 