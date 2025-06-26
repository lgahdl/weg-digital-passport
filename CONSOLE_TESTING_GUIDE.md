# 🧪 WEG Digital Passport Console Testing Guide

This guide shows you how to test the deployed WEG Digital Passport system using the Hardhat console and various commands.

## 🚀 Quick Test Results

From our automated test script, we can see the system is working perfectly:

```
✅ Company: WEG S.A.
✅ Country: BR
✅ Total Schemas: 5 (WEG lifecycle schemas)
✅ Total Roles: 8 (manufacturer, exporter, technician, etc.)
✅ Total Stakeholders: 8 (including test stakeholders)
✅ Total Products: 2 (WEG-W22-2024-001, WEG-W22-2024-002)
✅ WEG Manager Authorized: true
✅ Real Arbitrum EAS Integration: Working!
```

## 📋 Contract Addresses (From Deployment)

```javascript
const addresses = {
  passportRegistry: "0xd7E3faEBd46b82B2fcf6c252958Ba0cAf4F2a387",
  eidasAttestor: "0xbaB0283f99131612aDf47e82b77Da4d90b5F5a3D",
  factory: "0x69f06407f4e29F7e80898F23701B3c02dc1C8a5e",
  wegManager: "0x87fCf136D61cC832a52df335454e0B218280bbDd",
  // Real Arbitrum EAS contracts
  eas: "0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458",
  schemaRegistry: "0xA310da9c5B885E7fb3fbA9D66E9Ba6Df512b78eB"
};
```

## 🛠️ Testing Methods

### Method 1: Run Automated Test Script

```bash
# Run the complete test suite
npx hardhat run test-system.js --network localhost
```

### Method 2: Interactive Console Testing

```bash
# Start Hardhat console
npx hardhat console --network localhost
```

Then run these commands in the console:

#### Step 1: Get Contract Instances

```javascript
// Get contract instances
const registry = await ethers.getContractAt("PassportRegistry", "0xd7E3faEBd46b82B2fcf6c252958Ba0cAf4F2a387");
const factory = await ethers.getContractAt("DigitalPassportFactory", "0x69f06407f4e29F7e80898F23701B3c02dc1C8a5e");
const wegManager = await ethers.getContractAt("WEGManager", "0x87fCf136D61cC832a52df335454e0B218280bbDd");
const eidasAttestor = await ethers.getContractAt("eIDASQualifiedAttestor", "0xbaB0283f99131612aDf47e82b77Da4d90b5F5a3D");

// Get signers
const [deployer, wegWallet, qtspProvider, ...stakeholders] = await ethers.getSigners();
console.log("Deployer:", deployer.address);
```

#### Step 2: Check System Overview

```javascript
// Get WEG system overview
const overview = await wegManager.getWEGSystemOverview();
console.log("Company:", overview.company);
console.log("Country:", overview.country);
console.log("Total Schemas:", overview.totalSchemas.toString());
console.log("Total Roles:", overview.totalRoles.toString());
console.log("Total Stakeholders:", overview.totalStakeholders.toString());
console.log("Total Products:", overview.totalProducts.toString());
```

#### Step 3: Check Existing Products

```javascript
// Check existing product
const productId = "WEG-W22-2024-001";
const passportInfo = await registry.getPassport(productId);
console.log("Product ID:", productId);
console.log("Passport Address:", passportInfo.passportAddress);
console.log("Manufacturer:", passportInfo.manufacturer);
console.log("Created At:", new Date(Number(passportInfo.createdAt) * 1000));
console.log("Is Active:", passportInfo.isActive);

// Get passport details
const passport = await ethers.getContractAt("DigitalPassport_eIDAS", passportInfo.passportAddress);
const totalAttestations = await passport.getTotalAttestations();
console.log("Total Attestations:", totalAttestations.toString());

// Get all attestations
if (totalAttestations > 0) {
  const attestations = await passport.getAttestations();
  console.log("Attestations:");
  attestations.forEach((att, index) => {
    console.log(`  ${index + 1}. Schema: ${att.schemaType}, Attester: ${att.attester}`);
  });
}
```

#### Step 4: Check WEG Schemas

```javascript
// Get all WEG schemas
const schemas = await wegManager.getWEGSchemas();
const schemaNames = [
  "WEG_PRODUCT_INIT",
  "WEG_TRANSPORT_EVENT", 
  "WEG_OWNERSHIP_TRANSFER",
  "WEG_MAINTENANCE_EVENT",
  "WEG_END_OF_LIFE"
];

console.log("WEG Schemas:");
schemas.forEach((schema, index) => {
  console.log(`  ${index + 1}. ${schemaNames[index]}: ${schema}`);
});
```

#### Step 5: Check Stakeholder Permissions

```javascript
// Check deployer permissions
const deployerRole = await wegManager.getStakeholderRole(deployer.address);
console.log("Deployer Role:", deployerRole);

// Check specific permissions
const hasMaintenancePermission = await wegManager.hasPermission(deployer.address, "WEG_MAINTENANCE_EVENT");
const hasTransportPermission = await wegManager.hasPermission(deployer.address, "WEG_TRANSPORT_EVENT");
const hasOwnershipPermission = await wegManager.hasPermission(deployer.address, "WEG_OWNERSHIP_TRANSFER");

console.log("Has Maintenance Permission:", hasMaintenancePermission);
console.log("Has Transport Permission:", hasTransportPermission);
console.log("Has Ownership Permission:", hasOwnershipPermission);
```

#### Step 6: Create New Product

```javascript
// Create a new product
const newProductId = "WEG-W22-2024-003";

try {
  const tx = await wegManager.connect(deployer).createWEGProduct(
    newProductId,
    "W22 Three-Phase Motor - Console Test",
    "SN-CONSOLE-003",
    "Aluminum housing, Copper windings, Steel laminations",
    ["Supplier X", "Supplier Y"],
    "Jaraguá do Sul, SC, Brasil",
    "IEC 60034-1, NEMA MG1",
    false // useQualifiedSignature
  );
  
  await tx.wait();
  console.log("✅ Product created successfully!");
  
  // Check the new product
  const newPassportInfo = await registry.getPassport(newProductId);
  console.log("New Passport Address:", newPassportInfo.passportAddress);
} catch (error) {
  console.log("Error:", error.message);
}
```

#### Step 7: Add Lifecycle Events

```javascript
// Add maintenance event
try {
  const tx = await wegManager.connect(deployer).addMaintenanceEvent(
    "WEG-W22-2024-001",
    "Preventive Maintenance", 
    deployer.address,
    "Routine inspection and lubrication",
    "Oil change, bearing inspection",
    ["Oil filter", "Grease"],
    "2025-01-01",
    false // useQualifiedSignature
  );
  
  await tx.wait();
  console.log("✅ Maintenance event added!");
} catch (error) {
  console.log("Maintenance Error:", error.message);
}

// Add ownership transfer
try {
  const tx = await wegManager.connect(deployer).addOwnershipTransfer(
    "WEG-W22-2024-001",
    deployer.address,
    stakeholders[0].address,
    "Sale",
    "CONTRACT-12345",
    ethers.parseEther("10"), // 10 ETH
    "Sale to end customer",
    false // useQualifiedSignature
  );
  
  await tx.wait();
  console.log("✅ Ownership transfer added!");
} catch (error) {
  console.log("Ownership Error:", error.message);
}
```

#### Step 8: Check Factory Statistics

```javascript
// Check factory statistics
const totalProducts = await factory.getManufacturerProductCount(wegManager.target);
const isAuthorized = await factory.isAuthorizedManufacturer(wegManager.target);

console.log("WEG Products Created:", totalProducts.toString());
console.log("WEG Manager Authorized:", isAuthorized);

// Get all WEG products
const wegProducts = await registry.getPassportsByManufacturer(wegManager.target);
console.log("WEG Product IDs:", wegProducts);
```

#### Step 9: Advanced Queries

```javascript
// Get attestations by schema type
const passport = await ethers.getContractAt("DigitalPassport_eIDAS", "0xe9c43716f50Cf451b7D456ABfeB95487f9FF7d41");
const maintenanceAttestations = await passport.getAttestationsBySchema("WEG_MAINTENANCE_EVENT");
console.log("Maintenance Attestations:", maintenanceAttestations.length);

// Check product lifecycle stage
const stage = await passport.getCurrentLifecycleStage();
console.log("Current Lifecycle Stage:", stage);

// Get product summary
const summary = await passport.getProductSummary();
console.log("Product Summary:");
console.log("  Product ID:", summary.productId);
console.log("  Manufacturer:", summary.manufacturer);
console.log("  Total Attestations:", summary.totalAttestations.toString());
console.log("  Is Active:", summary.isActive);
```

## 🎯 Key Test Scenarios

### Scenario 1: Complete Product Lifecycle

```javascript
// 1. Create product (MANUFACTURING stage)
// 2. Add transport event (TRANSPORT stage)  
// 3. Add ownership transfer (OWNERSHIP stage)
// 4. Add maintenance event (MAINTENANCE stage)
// 5. Add end-of-life event (END_OF_LIFE stage)
```

### Scenario 2: Multi-Stakeholder Interaction

```javascript
// Test different stakeholders with different permissions
// - Manufacturer: All permissions
// - Technician: Only maintenance events
// - Logistics: Only transport events
// - Recycler: Only end-of-life events
```

### Scenario 3: Permission Validation

```javascript
// Test permission enforcement
// Try to call functions with unauthorized stakeholders
// Should fail with proper error messages
```

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **"ReentrancyGuardReentrantCall" Error**
   - This happens when trying to call functions that have reentrancy protection
   - Solution: Use separate transactions or internal functions

2. **"InsufficientLoA" Error**
   - Stakeholder doesn't have required Level of Assurance
   - Solution: Assign qualified certificates or update LoA requirements

3. **"QualifiedSignatureRequired" Error**
   - Function requires qualified signature but it's disabled
   - Solution: Set `useQualifiedSignature: true` or modify role requirements

4. **"UnauthorizedStakeholder" Error**
   - Address is not registered as authorized stakeholder
   - Solution: Add stakeholder using `addStakeholder()` function

## 📊 Expected Test Results

After running all tests, you should see:

- ✅ **5 WEG Schemas** registered and active
- ✅ **8 Roles** with proper permissions
- ✅ **Multiple Products** created and tracked
- ✅ **Complete Lifecycle Events** recorded
- ✅ **Real EAS Integration** working on Arbitrum fork
- ✅ **eIDAS Compliance** features functional
- ✅ **Permission System** enforcing access control

## 🎉 Success Indicators

Your system is working correctly if:

1. All contract deployments succeeded
2. WEG schemas are registered in real Arbitrum EAS
3. Products can be created and tracked
4. Lifecycle events can be added
5. Permission system works as expected
6. Factory statistics show correct counts
7. No unauthorized access is possible

## 🚀 Next Steps

After successful testing, you can:

1. **Deploy to Arbitrum Testnet** for public testing
2. **Add more manufacturers** (Mitsubishi, Siemens, etc.)
3. **Integrate with frontend** for user interface
4. **Add more complex business logic**
5. **Implement qualified signatures** for production

---

**Happy Testing!** 🧪✨ 