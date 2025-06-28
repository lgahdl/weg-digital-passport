const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting WEG Digital Passport + eIDAS Local Deployment...\n");

  // Get signers
  const [deployer, wegWallet, qtspProvider, ...stakeholders] = await ethers.getSigners();
  
  console.log("📋 Deployment Configuration:");
  console.log("- Deployer:", deployer.address);
  console.log("- WEG Wallet:", wegWallet.address);
  console.log("- QTSP Provider:", qtspProvider.address);
  console.log("- Available stakeholders:", stakeholders.length);
  console.log("- Network:", await ethers.provider.getNetwork());
  console.log("");

  // Use existing EAS contracts from forked Arbitrum
  console.log("📦 Step 1: Connecting to Arbitrum EAS Infrastructure...");
  
  // Arbitrum One EAS contract addresses
  const EAS_CONTRACT_ADDRESS = "0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458";
  const SCHEMA_REGISTRY_ADDRESS = "0xA310da9c5B885E7fb3fbA9D66E9Ba6Df512b78eB";
  
  // Connect to existing contracts
  const eas = await ethers.getContractAt("IEAS", EAS_CONTRACT_ADDRESS);
  const schemaRegistry = await ethers.getContractAt("ISchemaRegistry", SCHEMA_REGISTRY_ADDRESS);
  
  console.log("✅ Connected to EAS at:", EAS_CONTRACT_ADDRESS);
  console.log("✅ Connected to SchemaRegistry at:", SCHEMA_REGISTRY_ADDRESS);

  // Deploy PassportRegistry
  console.log("\n📦 Step 2: Deploying Core Infrastructure...");
  const PassportRegistry = await ethers.getContractFactory("PassportRegistry");
  const passportRegistry = await PassportRegistry.deploy();
  await passportRegistry.waitForDeployment();
  console.log("✅ PassportRegistry deployed to:", await passportRegistry.getAddress());

  // Deploy eIDASQualifiedAttestor
  const eIDASQualifiedAttestor = await ethers.getContractFactory("eIDASQualifiedAttestor");
  const eidasAttestor = await eIDASQualifiedAttestor.deploy();
  await eidasAttestor.waitForDeployment();
  console.log("✅ eIDASQualifiedAttestor deployed to:", await eidasAttestor.getAddress());

  // Deploy DigitalPassportFactory
  const DigitalPassportFactory = await ethers.getContractFactory("DigitalPassportFactory");
  const factory = await DigitalPassportFactory.deploy(
    await passportRegistry.getAddress(),
    await eidasAttestor.getAddress()
  );
  await factory.waitForDeployment();
  console.log("✅ DigitalPassportFactory deployed to:", await factory.getAddress());

  // Deploy WEGManager
  console.log("\n📦 Step 3: Deploying WEG Manager...");
  const WEGManager = await ethers.getContractFactory("WEGManager");
  const wegManager = await WEGManager.deploy(
    await factory.getAddress(),
    await eidasAttestor.getAddress(),
    wegWallet.address
  );
  await wegManager.waitForDeployment();
  console.log("✅ WEGManager deployed to:", await wegManager.getAddress());

  // Configure system
  console.log("\n⚙️  Step 4: Configuring System...");
  
  // Authorize factory in passport registry
  await passportRegistry.authorizeFactory(await factory.getAddress());
  console.log("✅ Factory authorized in passport registry");

  // Authorize WEG Manager in factory
  await factory.addAuthorizedManufacturer(await wegManager.getAddress());
  console.log("✅ WEG Manager authorized in factory");

  // Register a QTSP for testing
  await eidasAttestor.connect(deployer).registerQTSP(
    qtspProvider.address,
    "Test QTSP",
    "DE", // Germany
    ["qualified_certificates", "qualified_timestamps"], // supportedServices
    "https://test-qtsp.eu/trust-list" // trustListURL
  );
  console.log("✅ Test QTSP registered");

  // Add some test stakeholders to WEG Manager
  console.log("\n👥 Step 5: Adding Test Stakeholders...");
  
  const testStakeholders = [
    { address: stakeholders[0].address, name: "WEG Export Brasil", role: "exporter" },
    { address: stakeholders[1].address, name: "João Silva", role: "technician" },
    { address: stakeholders[2].address, name: "Thyssenkrupp Elevadores", role: "joint_manufacturer" },
    { address: stakeholders[3].address, name: "Construções Brasil Ltda", role: "retailer" },
    { address: stakeholders[4].address, name: "Maersk Line", role: "logistics" },
    { address: stakeholders[5].address, name: "GreenRecycle Brasil", role: "recycler" },
  ];

  // Add deployer as manufacturer stakeholder for testing
  await wegManager.connect(deployer).addStakeholder(
    deployer.address,
    "Deployer (Test)",
    "manufacturer",
    "Test deployer account with manufacturer permissions"
  );
  console.log("✅ Added deployer as manufacturer stakeholder");

  // Validate a qualified certificate for deployer in eIDAS system  
  console.log("🔐 Setting up eIDAS certificate for deployer...");
  console.log("👤 Deployer Address:", deployer.address);
  
  // Use a simple, predictable certificate hash for testing
  const certHash = ethers.keccak256(ethers.toUtf8Bytes(`WEG-eIDAS-CERT-${deployer.address.slice(2, 10)}`));
  console.log("📋 Certificate Hash:", certHash);
  
  await eidasAttestor.connect(qtspProvider).validateQualifiedCertificate(
    certHash,
    deployer.address,
    2, // Corporate certificate
    2  // High LoA
  );
  console.log("✅ Validated qualified certificate for deployer");
  
  // Verify the LoA was set correctly
  const loa = await eidasAttestor.levelOfAssurance(deployer.address);
  console.log("🕐 LoA Validation Timestamp:", loa.validatedAt.toString());
  console.log("✅ LoA Level:", loa.level.toString());
  console.log("✅ LoA Valid:", loa.isValid);

  // Assign qualified certificate to deployer for testing
  await wegManager.connect(deployer).assignQualifiedCertificate(
    deployer.address,
    certHash,
    "Test QTSP",
    2 // High LoA
  );
  console.log("✅ Assigned qualified certificate to deployer");
  
  // Verify the assignment worked
  console.log("🔍 Verifying LoA assignment...");
  const deployerLoA = await eidasAttestor.getAttesterLoA(deployer.address);
  const isQualified = await eidasAttestor.isQualifiedAttester(deployer.address);
  console.log(`✅ eIDAS LoA: ${deployerLoA} (${isQualified ? "Qualified" : "Not Qualified"})`);
  
  // Also verify stakeholder status
  const isAuthorizedStakeholder = await wegManager.isAuthorizedStakeholder(deployer.address);
  console.log(`✅ Stakeholder Status: ${isAuthorizedStakeholder ? "Authorized" : "Not Authorized"}`);
  
  // Check ManufacturerManager internal LoA (this might be different from eIDAS LoA)
  try {
    const stakeholderRole = await wegManager.getStakeholderRole(deployer.address);
    console.log(`✅ Stakeholder Role: ${stakeholderRole}`);
    
    // Check permissions for product creation schema
    const hasPermission = await wegManager.hasPermission(deployer.address, "WEG_PRODUCT_INIT");
    console.log(`✅ WEG_PRODUCT_INIT Permission: ${hasPermission ? "YES" : "NO"}`);
    
  } catch (error) {
    console.log("⚠️ Could not fetch stakeholder details:", error.message);
  }

  for (const stakeholder of testStakeholders) {
    await wegManager.connect(deployer).addStakeholder(
      stakeholder.address,
      stakeholder.name,
      stakeholder.role,
      `Test stakeholder: ${stakeholder.name}`
    );
    console.log(`✅ Added ${stakeholder.name} as ${stakeholder.role}`);
  }

  // Create a test product
  console.log("\n🏭 Step 6: Creating Test Product...");
  
  const productId = "WEG-W22-2024-001";
  // Create test product WITH qualified signature (should work now with correct cert hash)
  console.log("🔐 Creating test product with qualified signature...");
  const tx = await wegManager.connect(deployer).createWEGProduct(
    productId,
    "W22 Three-Phase Motor",
    "2024001",
    "95% recyclable materials",
    ["Supplier A", "Supplier B"],
    "Jaraguá do Sul, SC, Brasil",
    "IEC 60034-1, NEMA MG1",
    true // useQualifiedSignature - now enabled with correct certificate hash
  );
  
  console.log("✅ Qualified signature product creation successful!");
  
  // Create a second test product for variety
  console.log("🧪 Creating second test product...");
  try {
    const secondProductId = "WEG-W50-2024-002";
    const secondTx = await wegManager.connect(deployer).createWEGProduct(
      secondProductId,
      "W50 High Efficiency Motor",
      "2024002",
      "90% recyclable materials",
      ["Supplier C", "Supplier D"],
      "Gravataí, RS, Brasil",
      "IEC 60034-1, IEEE 841",
      false // useQualifiedSignature - create one without for comparison
    );
    await secondTx.wait();
    console.log("✅ Second test product created successfully!");
  } catch (error) {
    console.log("⚠️ Second product creation failed:", error.message);
  }
  
  const receipt = await tx.wait();
  console.log("✅ Test product created:", productId);

  // Get the passport address from events
  let passportAddress = null;
  const passportCreatedEvent = receipt.logs.find(
    log => log.fragment && log.fragment.name === "PassportCreated"
  );
  
  if (passportCreatedEvent) {
    passportAddress = passportCreatedEvent.args[1];
    console.log("✅ Digital Passport deployed to:", passportAddress);
  }

  // Save contract addresses to file
  console.log("\n💾 Step 7: Saving Contract Addresses...");
  
  const network = await ethers.provider.getNetwork();
  const contractAddresses = {
    network: {
      name: network.name,
      chainId: Number(network.chainId)
    },
    timestamp: new Date().toISOString(),
    deployedBy: deployer.address,
    contracts: {
      passportRegistry: await passportRegistry.getAddress(),
      eidasAttestor: await eidasAttestor.getAddress(),
      factory: await factory.getAddress(),
      wegManager: await wegManager.getAddress(),
      easContract: EAS_CONTRACT_ADDRESS,
      schemaRegistry: SCHEMA_REGISTRY_ADDRESS
    },
    testData: {
      testProductId: productId,
      testProductPassport: passportAddress,
      wegWallet: wegWallet.address,
      qtspProvider: qtspProvider.address,
      testStakeholders: testStakeholders,
      deployerCertificateHash: certHash
    },
    accounts: {
      deployer: deployer.address,
      wegWallet: wegWallet.address,
      qtspProvider: qtspProvider.address,
      stakeholders: stakeholders.slice(0, 6).map(s => s.address)
    }
  };

  const addressesPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(addressesPath, JSON.stringify(contractAddresses, null, 2));
  console.log("✅ Contract addresses saved to:", addressesPath);

  // Display summary
  console.log("\n🎉 Deployment Complete!");
  console.log("==========================================");
  console.log("📋 Contract Addresses:");
  console.log("- SchemaRegistry (Arbitrum):", SCHEMA_REGISTRY_ADDRESS);
  console.log("- EAS (Arbitrum):", EAS_CONTRACT_ADDRESS);
  console.log("- PassportRegistry:", await passportRegistry.getAddress());
  console.log("- eIDASQualifiedAttestor:", await eidasAttestor.getAddress());
  console.log("- DigitalPassportFactory:", await factory.getAddress());
  console.log("- WEGManager:", await wegManager.getAddress());
  console.log("");
  console.log("👥 Test Accounts:");
  console.log("- Deployer:", deployer.address);
  console.log("- WEG Wallet:", wegWallet.address);
  console.log("- QTSP Provider:", qtspProvider.address);
  console.log("");
  console.log("🧪 Next Steps:");
  console.log("1. Run: npm run interactive");
  console.log("2. Or use: npx hardhat console --network localhost");
  console.log("");
  console.log("📝 Example Console Commands:");
  console.log(`const wegManager = await ethers.getContractAt("WEGManager", "${await wegManager.getAddress()}");`);
  console.log(`const registry = await ethers.getContractAt("PassportRegistry", "${await passportRegistry.getAddress()}");`);
  console.log(`await registry.getPassport("${productId}");`);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 