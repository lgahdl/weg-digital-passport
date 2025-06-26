// WEG Digital Passport System Testing Script
// Run with: npx hardhat run test-system.js --network localhost

async function main() {
  console.log("🧪 WEG Digital Passport System Testing");
  console.log("=====================================\n");

  // Contract addresses from deployment
  const addresses = {
    passportRegistry: "0xd7E3faEBd46b82B2fcf6c252958Ba0cAf4F2a387",
    eidasAttestor: "0xbaB0283f99131612aDf47e82b77Da4d90b5F5a3D",
    factory: "0x69f06407f4e29F7e80898F23701B3c02dc1C8a5e",
    wegManager: "0x87fCf136D61cC832a52df335454e0B218280bbDd",
    eas: "0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458",
    schemaRegistry: "0xA310da9c5B885E7fb3fbA9D66E9Ba6Df512b78eB"
  };

  // Get contract instances
  const registry = await ethers.getContractAt("PassportRegistry", addresses.passportRegistry);
  const factory = await ethers.getContractAt("DigitalPassportFactory", addresses.factory);
  const wegManager = await ethers.getContractAt("WEGManager", addresses.wegManager);
  const eidasAttestor = await ethers.getContractAt("eIDASQualifiedAttestor", addresses.eidasAttestor);

  // Get signers
  const [deployer, wegWallet, qtspProvider, ...stakeholders] = await ethers.getSigners();

  console.log("📋 Test Accounts:");
  console.log(`- Deployer: ${deployer.address}`);
  console.log(`- WEG Wallet: ${wegWallet.address}`);
  console.log(`- QTSP Provider: ${qtspProvider.address}`);
  console.log(`- Stakeholders: ${stakeholders.length} available\n`);

  // Test 1: Check System Overview
  console.log("🔍 Test 1: System Overview");
  console.log("--------------------------");
  try {
    const overview = await wegManager.getWEGSystemOverview();
    console.log(`✅ Company: ${overview.company}`);
    console.log(`✅ Country: ${overview.country}`);
    console.log(`✅ Total Schemas: ${overview.totalSchemas}`);
    console.log(`✅ Total Roles: ${overview.totalRoles}`);
    console.log(`✅ Total Stakeholders: ${overview.totalStakeholders}`);
    console.log(`✅ Total Products: ${overview.totalProducts}\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 2: Check Existing Product
  console.log("🔍 Test 2: Check Existing Product");
  console.log("----------------------------------");
  try {
    const productId = "WEG-W22-2024-001";
    const passportInfo = await registry.getPassport(productId);
    console.log(`✅ Product ID: ${productId}`);
    console.log(`✅ Passport Address: ${passportInfo.passportAddress}`);
    console.log(`✅ Manufacturer: ${passportInfo.manufacturer}`);
    console.log(`✅ Created At: ${new Date(Number(passportInfo.createdAt) * 1000).toISOString()}`);
    console.log(`✅ Is Active: ${passportInfo.isActive}\n`);

    // Get passport contract and check attestations
    const passport = await ethers.getContractAt("DigitalPassport_eIDAS", passportInfo.passportAddress);
    const totalAttestations = await passport.getTotalAttestations();
    console.log(`✅ Total Attestations: ${totalAttestations}`);

    if (totalAttestations > 0) {
      const attestations = await passport.getAttestations();
      console.log("📝 Attestations:");
      attestations.forEach((att, index) => {
        console.log(`   ${index + 1}. Schema: ${att.schemaType}, Attester: ${att.attester}`);
      });
    }
    console.log("");
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 3: Check Stakeholder Permissions
  console.log("🔍 Test 3: Check Stakeholder Permissions");
  console.log("----------------------------------------");
  try {
    const deployerRole = await wegManager.getStakeholderRole(deployer.address);
    console.log(`✅ Deployer Role: ${deployerRole}`);

    const hasMaintenancePermission = await wegManager.hasPermission(deployer.address, "WEG_MAINTENANCE_EVENT");
    const hasTransportPermission = await wegManager.hasPermission(deployer.address, "WEG_TRANSPORT_EVENT");
    
    console.log(`✅ Has Maintenance Permission: ${hasMaintenancePermission}`);
    console.log(`✅ Has Transport Permission: ${hasTransportPermission}\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 4: Check WEG Schemas
  console.log("🔍 Test 4: Check WEG Schemas");
  console.log("----------------------------");
  try {
    const schemas = await wegManager.getWEGSchemas();
    console.log("✅ WEG Schemas:");
    const schemaNames = [
      "WEG_PRODUCT_INIT",
      "WEG_TRANSPORT_EVENT", 
      "WEG_OWNERSHIP_TRANSFER",
      "WEG_MAINTENANCE_EVENT",
      "WEG_END_OF_LIFE"
    ];
    
    schemas.forEach((schema, index) => {
      console.log(`   ${index + 1}. ${schemaNames[index]}: ${schema}`);
    });
    console.log("");
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 5: Create New Product (Optional)
  console.log("🔍 Test 5: Create New Product");
  console.log("-----------------------------");
  try {
    const newProductId = "WEG-W22-2024-002";
    
    // Check if product already exists
    try {
      await registry.getPassport(newProductId);
      console.log(`⚠️  Product ${newProductId} already exists, skipping creation\n`);
    } catch {
      // Product doesn't exist, create it
      console.log(`📦 Creating new product: ${newProductId}`);
      
      const tx = await wegManager.connect(deployer).createWEGProduct(
        newProductId,
        "W22 Three-Phase Motor - Test",
        "SN-TEST-002",
        "Aluminum housing, Copper windings, Steel laminations",
        ["Supplier A", "Supplier B"],
        "Jaraguá do Sul, SC, Brasil",
        "IEC 60034-1, NEMA MG1",
        false // useQualifiedSignature
      );
      
      await tx.wait();
      console.log(`✅ Product created successfully!`);
      
      // Check the new product
      const newPassportInfo = await registry.getPassport(newProductId);
      console.log(`✅ New Passport Address: ${newPassportInfo.passportAddress}\n`);
    }
  } catch (error) {
    console.log(`❌ Error creating product: ${error.message}\n`);
  }

  // Test 6: Add Transport Event (if stakeholder exists)
  console.log("🔍 Test 6: Add Transport Event");
  console.log("------------------------------");
  try {
    const productId = "WEG-W22-2024-001";
    
    // Try to add transport event
    const tx = await wegManager.connect(deployer).addTransportEvent(
      productId,
      "Test Transport Event",
      deployer.address,
      stakeholders[0].address,
      "Test transport from factory to warehouse",
      "Jaraguá do Sul, SC",
      "São Paulo, SP",
      "TRACK-12345",
      false // useQualifiedSignature
    );
    
    await tx.wait();
    console.log("✅ Transport event added successfully!");
    
    // Check updated attestations
    const passportInfo = await registry.getPassport(productId);
    const passport = await ethers.getContractAt("DigitalPassport_eIDAS", passportInfo.passportAddress);
    const totalAttestations = await passport.getTotalAttestations();
    console.log(`✅ Updated Total Attestations: ${totalAttestations}\n`);
    
  } catch (error) {
    console.log(`❌ Error adding transport event: ${error.message}\n`);
  }

  // Test 7: Check Factory Statistics
  console.log("🔍 Test 7: Factory Statistics");
  console.log("-----------------------------");
  try {
    const totalProducts = await factory.getManufacturerProductCount(addresses.wegManager);
    const isAuthorized = await factory.isAuthorizedManufacturer(addresses.wegManager);
    
    console.log(`✅ WEG Products Created: ${totalProducts}`);
    console.log(`✅ WEG Manager Authorized: ${isAuthorized}`);
    
    // Get all WEG products
    const wegProducts = await registry.getPassportsByManufacturer(addresses.wegManager);
    console.log(`✅ WEG Product IDs: ${wegProducts.join(", ")}\n`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 8: eIDAS System Check
  console.log("🔍 Test 8: eIDAS System Check");
  console.log("-----------------------------");
  try {
    const qtspInfo = await eidasAttestor.getQTSPInfo(qtspProvider.address);
    console.log(`✅ QTSP Name: ${qtspInfo.name}`);
    console.log(`✅ QTSP Country: ${qtspInfo.country}`);
    console.log(`✅ QTSP Active: ${qtspInfo.isActive}`);
    console.log(`✅ QTSP Services: ${qtspInfo.supportedServices.join(", ")}\n`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  console.log("🎉 Testing Complete!");
  console.log("====================");
  console.log("All major system components have been tested.");
  console.log("You can now interact with the system using the contract instances.");
}

// Helper function to format addresses
function formatAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Export for use in console
module.exports = { main };

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} 