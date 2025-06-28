const { ethers } = require("hardhat");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

// Contract addresses (will be loaded from deployment)
let contractAddresses = {
  passportRegistry: "",
  eidasAttestor: "",
  factory: "",
  wegManager: "",
  easContract: "0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458", // Arbitrum EAS
  schemaRegistry: "0xA310da9c5B885E7fb3fbA9D66E9Ba6Df512b78eB" // Arbitrum Schema Registry
};

// Contract instances
let contracts = {};
let signers = [];
let currentSigner = null;
let currentSignerIndex = 0;

// Terminal interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for better UX
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function loadContracts() {
  console.log(colorize("\n🔄 Loading contract addresses...", "yellow"));
  
  try {
    // Get signers
    signers = await ethers.getSigners();
    currentSigner = signers[0];
    
    console.log(colorize(`✅ Loaded ${signers.length} signers`, "green"));
    
    // Try to load saved contract addresses
    const addressesPath = path.join(__dirname, "..", "deployed-addresses.json");
    
    if (fs.existsSync(addressesPath)) {
      console.log(colorize("📋 Found saved contract addresses!", "green"));
      
      const savedData = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
      console.log(colorize(`📅 Deployment from: ${savedData.timestamp}`, "cyan"));
      console.log(colorize(`🌐 Network: ${savedData.network.name} (Chain ID: ${savedData.network.chainId})`, "cyan"));
      
      const useExisting = await promptForInput("Use saved addresses? (y/n): ");
      
      if (useExisting.toLowerCase() === "y") {
        contractAddresses.passportRegistry = savedData.contracts.passportRegistry;
        contractAddresses.eidasAttestor = savedData.contracts.eidasAttestor;
        contractAddresses.factory = savedData.contracts.factory;
        contractAddresses.wegManager = savedData.contracts.wegManager;
        contractAddresses.easContract = savedData.contracts.easContract;
        contractAddresses.schemaRegistry = savedData.contracts.schemaRegistry;
        
        console.log(colorize("✅ Loaded saved contract addresses!", "green"));
      } else {
        await promptForAddresses();
      }
    } else {
      console.log(colorize("📋 No saved addresses found. Please provide contract addresses:", "cyan"));
      await promptForAddresses();
    }
    
    // Connect to contracts
    contracts.passportRegistry = await ethers.getContractAt("PassportRegistry", contractAddresses.passportRegistry);
    contracts.eidasAttestor = await ethers.getContractAt("eIDASQualifiedAttestor", contractAddresses.eidasAttestor);
    contracts.factory = await ethers.getContractAt("DigitalPassportFactory", contractAddresses.factory);
    contracts.wegManager = await ethers.getContractAt("WEGManager", contractAddresses.wegManager);
    contracts.eas = await ethers.getContractAt("IEAS", contractAddresses.easContract);
    contracts.schemaRegistry = await ethers.getContractAt("ISchemaRegistry", contractAddresses.schemaRegistry);
    
    console.log(colorize("✅ All contracts loaded successfully!", "green"));
    
  } catch (error) {
    console.error(colorize("❌ Error loading contracts:", "red"), error.message);
    throw error;
  }
}

async function promptForAddresses() {
  contractAddresses.passportRegistry = await promptForInput("PassportRegistry address: ");
  contractAddresses.eidasAttestor = await promptForInput("eIDASQualifiedAttestor address: ");
  contractAddresses.factory = await promptForInput("DigitalPassportFactory address: ");
  contractAddresses.wegManager = await promptForInput("WEGManager address: ");
}

function promptForInput(question) {
  return new Promise((resolve) => {
    rl.question(colorize(question, "cyan"), (answer) => {
      resolve(answer.trim());
    });
  });
}

async function displayHeader() {
  console.clear();
  console.log(colorize("╔═══════════════════════════════════════════════════════════════╗", "blue"));
  console.log(colorize("║                    WEG DIGITAL PASSPORT                       ║", "blue"));
  console.log(colorize("║                   Interactive Terminal                        ║", "blue"));
  console.log(colorize("╚═══════════════════════════════════════════════════════════════╝", "blue"));
  console.log(colorize(`\n👤 Current Signer: ${currentSigner.address} (${currentSignerIndex})`, "yellow"));
  
  try {
    const balance = await currentSigner.provider.getBalance(currentSigner.address);
    console.log(colorize(`💰 Balance: ${ethers.formatEther(balance)} ETH`, "yellow"));
  } catch (error) {
    console.log(colorize(`💰 Balance: Error loading balance`, "yellow"));
  }
}

function displayMainMenu() {
  console.log(colorize("\n📋 MAIN MENU", "bright"));
  console.log(colorize("══════════════════════════════════════════════════════════════", "blue"));
  console.log("1. 👤 Account Management");
  console.log("2. 🏭 Product Management");
  console.log("3. 📦 Passport Operations");
  console.log("4. 👥 Stakeholder Management");
  console.log("5. 🔐 eIDAS Operations");
  console.log("6. 📊 System Information");
  console.log("7. 🚚 Transport & Lifecycle");
  console.log("8. 🔍 Query & Search");
  console.log("0. ❌ Exit");
  console.log(colorize("══════════════════════════════════════════════════════════════", "blue"));
}

async function handleAccountManagement() {
  console.log(colorize("\n👤 ACCOUNT MANAGEMENT", "bright"));
  console.log("1. Switch Account");
  console.log("2. View All Accounts");
  console.log("3. Check Account Balance");
  console.log("0. Back to Main Menu");
  
  const choice = await promptForInput("\nSelect option: ");
  
  switch(choice) {
    case "1":
      await switchAccount();
      break;
    case "2":
      await viewAllAccounts();
      break;
    case "3":
      await checkAccountBalance();
      break;
    case "0":
      return;
    default:
      console.log(colorize("❌ Invalid option", "red"));
  }
  
  await promptForInput("\nPress Enter to continue...");
}

async function switchAccount() {
  console.log(colorize("\n🔄 Available Accounts:", "cyan"));
  
  signers.forEach((signer, index) => {
    const marker = index === currentSignerIndex ? colorize("👈 CURRENT", "green") : "";
    console.log(`${index}. ${signer.address} ${marker}`);
  });
  
  const choice = await promptForInput("\nSelect account (0-" + (signers.length - 1) + "): ");
  const index = parseInt(choice);
  
  if (index >= 0 && index < signers.length) {
    currentSignerIndex = index;
    currentSigner = signers[index];
    
    // Reconnect contracts with new signer
    contracts.passportRegistry = contracts.passportRegistry.connect(currentSigner);
    contracts.eidasAttestor = contracts.eidasAttestor.connect(currentSigner);
    contracts.factory = contracts.factory.connect(currentSigner);
    contracts.wegManager = contracts.wegManager.connect(currentSigner);
    
    console.log(colorize(`✅ Switched to account ${currentSigner.address}`, "green"));
  } else {
    console.log(colorize("❌ Invalid account index", "red"));
  }
}

async function viewAllAccounts() {
  console.log(colorize("\n👥 ALL ACCOUNTS:", "cyan"));
  
  for (let i = 0; i < signers.length; i++) {
    const balance = await signers[i].provider.getBalance(signers[i].address);
    const marker = i === currentSignerIndex ? colorize("👈 CURRENT", "green") : "";
    console.log(`${i}. ${signers[i].address} - ${ethers.formatEther(balance)} ETH ${marker}`);
  }
}

async function checkAccountBalance() {
  const address = await promptForInput("Enter address (or press Enter for current): ");
  const targetAddress = address || currentSigner.address;
  
  try {
    const balance = await currentSigner.provider.getBalance(targetAddress);
    console.log(colorize(`💰 Balance for ${targetAddress}: ${ethers.formatEther(balance)} ETH`, "green"));
  } catch (error) {
    console.log(colorize("❌ Error checking balance:", "red"), error.message);
  }
}

async function handleProductManagement() {
  console.log(colorize("\n🏭 PRODUCT MANAGEMENT", "bright"));
  console.log("1. Create New WEG Product");
  console.log("2. View Product Details");
  console.log("3. List All Products by Manufacturer");
  console.log("4. Check Product Status");
  console.log("0. Back to Main Menu");
  
  const choice = await promptForInput("\nSelect option: ");
  
  switch(choice) {
    case "1":
      await createWEGProduct();
      break;
    case "2":
      await viewProductDetails();
      break;
    case "3":
      await listProductsByManufacturer();
      break;
    case "4":
      await checkProductStatus();
      break;
    case "0":
      return;
    default:
      console.log(colorize("❌ Invalid option", "red"));
  }
  
  await promptForInput("\nPress Enter to continue...");
}

async function createWEGProduct() {
  console.log(colorize("\n🏭 CREATE NEW WEG PRODUCT", "cyan"));
  
  try {
    const productId = await promptForInput("Product ID (e.g., WEG-W22-2024-001): ");
    const productModel = await promptForInput("Product Model (e.g., W22 100HP): ");
    const serialNumber = await promptForInput("Serial Number: ");
    const composition = await promptForInput("Material Composition: ");
    const suppliersInput = await promptForInput("Suppliers (comma-separated): ");
    const suppliers = suppliersInput.split(",").map(s => s.trim());
    const manufacturingLocation = await promptForInput("Manufacturing Location: ");
    const qualityStandards = await promptForInput("Quality Standards: ");
    const useQualifiedSignature = (await promptForInput("Use eIDAS Qualified Signature? (y/n): ")).toLowerCase() === "y";
    
    console.log(colorize("\n🔄 Creating product...", "yellow"));
    
    const tx = await contracts.wegManager.createWEGProduct(
      productId,
      productModel,
      serialNumber,
      composition,
      suppliers,
      manufacturingLocation,
      qualityStandards,
      useQualifiedSignature
    );
    
    console.log(colorize("⏳ Transaction submitted, waiting for confirmation...", "yellow"));
    const receipt = await tx.wait();
    
    console.log(colorize("✅ Product created successfully!", "green"));
    console.log(colorize(`📋 Transaction Hash: ${receipt.hash}`, "blue"));
    
    // Try to get the passport address from events
    const passportCreatedEvent = receipt.logs.find(log => {
      try {
        const parsed = contracts.factory.interface.parseLog(log);
        return parsed.name === "PassportCreated";
      } catch {
        return false;
      }
    });
    
    if (passportCreatedEvent) {
      const parsed = contracts.factory.interface.parseLog(passportCreatedEvent);
      console.log(colorize(`📦 Digital Passport Address: ${parsed.args[1]}`, "blue"));
    }
    
  } catch (error) {
    console.log(colorize("❌ Error creating product:", "red"), error.message);
  }
}

async function viewProductDetails() {
  const productId = await promptForInput("Enter Product ID: ");
  
  try {
    const passportInfo = await contracts.passportRegistry.getPassport(productId);
    
    console.log(colorize("\n📦 PRODUCT DETAILS:", "cyan"));
    console.log(`🏭 Manufacturer: ${passportInfo.manufacturer}`);
    console.log(`📍 Passport Address: ${passportInfo.passportAddress}`);
    console.log(`📅 Created At: ${new Date(Number(passportInfo.createdAt) * 1000).toLocaleString()}`);
    console.log(`✅ Active: ${passportInfo.isActive}`);
    
    // Get passport contract instance to view more details
    if (passportInfo.passportAddress !== ethers.ZeroAddress) {
      const passport = await ethers.getContractAt("DigitalPassport_eIDAS", passportInfo.passportAddress);
      const attestationCount = await passport.getAttestationCount ? 
        await passport.getAttestationCount() : "N/A";
      console.log(`📋 Attestations: ${attestationCount}`);
    }
    
  } catch (error) {
    console.log(colorize("❌ Error fetching product details:", "red"), error.message);
  }
}

async function listProductsByManufacturer() {
  const manufacturerAddress = await promptForInput("Enter manufacturer address (or press Enter for current): ");
  const targetAddress = manufacturerAddress || currentSigner.address;
  
  try {
    const products = await contracts.passportRegistry.getPassportsByManufacturer(targetAddress);
    
    console.log(colorize(`\n📦 PRODUCTS FOR ${targetAddress}:`, "cyan"));
    
    if (products.length === 0) {
      console.log(colorize("No products found for this manufacturer.", "yellow"));
    } else {
      for (let i = 0; i < products.length; i++) {
        console.log(`${i + 1}. ${products[i]}`);
      }
    }
    
  } catch (error) {
    console.log(colorize("❌ Error fetching products:", "red"), error.message);
  }
}

async function checkProductStatus() {
  const productId = await promptForInput("Enter Product ID: ");
  
  try {
    const isActive = await contracts.passportRegistry.isPassportActive(productId);
    console.log(colorize(`\n📋 Product Status: ${isActive ? "ACTIVE" : "INACTIVE"}`, isActive ? "green" : "red"));
  } catch (error) {
    console.log(colorize("❌ Error checking product status:", "red"), error.message);
  }
}

async function handlePassportOperations() {
  console.log(colorize("\n📦 PASSPORT OPERATIONS", "bright"));
  console.log("1. View Passport Details");
  console.log("2. List Passports by Manufacturer");
  console.log("3. Add Standard Attestation");
  console.log("4. Add Qualified Attestation");
  console.log("5. View Passport Attestations");
  console.log("6. Perform LTV Validation");
  console.log("7. Check Passport Status");
  console.log("8. Deactivate Passport");
  console.log("9. Passport Statistics");
  console.log("0. Back to Main Menu");
  
  const choice = await promptForInput("\nSelect option: ");
  
  switch(choice) {
    case "1":
      await viewPassportDetails();
      break;
    case "2":
      await listPassportsByManufacturer();
      break;
    case "3":
      await addStandardAttestation();
      break;
    case "4":
      await addQualifiedAttestation();
      break;
    case "5":
      await viewPassportAttestations();
      break;
    case "6":
      await performLTVValidation();
      break;
    case "7":
      await checkPassportStatus();
      break;
    case "8":
      await deactivatePassport();
      break;
    case "9":
      await showPassportStatistics();
      break;
    case "0":
      return;
    default:
      console.log(colorize("❌ Invalid option", "red"));
  }
  
  await promptForInput("\nPress Enter to continue...");
}

async function viewPassportDetails() {
  try {
    const productId = await promptForInput("📦 Enter Product ID: ");
    
    console.log(colorize("\n🔍 PASSPORT DETAILS", "cyan"));
    
    // Get from registry
    const passportInfo = await contracts.passportRegistry.getPassport(productId);
    console.log(`📍 Passport Address: ${passportInfo.passportAddress}`);
    console.log(`🏭 Manufacturer: ${passportInfo.manufacturer}`);
    console.log(`📅 Created: ${new Date(Number(passportInfo.createdAt) * 1000).toLocaleString()}`);
    console.log(`✅ Active: ${passportInfo.isActive ? colorize("YES", "green") : colorize("NO", "red")}`);
    
    // Connect to passport contract
    const passport = await ethers.getContractAt("DigitalPassport_eIDAS", passportInfo.passportAddress);
    
    // Get passport details
    const productIdContract = await passport.productId();
    const totalAttestations = await passport.getTotalAttestations();
    const stats = await passport.getAttestationStats();
    
    console.log(`\n📊 ATTESTATION STATISTICS:`);
    console.log(`Total Attestations: ${stats[0]}`);
    console.log(`Qualified Attestations: ${stats[1]}`);
    console.log(`Substantial LoA: ${stats[2]}`);
    console.log(`High LoA: ${stats[3]}`);
    
    // Check special features
    const hasHighAssurance = await passport.hasHighAssuranceAttestations();
    const hasCrossBorder = await passport.hasCrossBorderRecognition();
    
    console.log(`\n🔒 QUALITY FEATURES:`);
    console.log(`High Assurance: ${hasHighAssurance ? colorize("YES", "green") : colorize("NO", "red")}`);
    console.log(`Cross-Border Recognition: ${hasCrossBorder ? colorize("YES", "green") : colorize("NO", "red")}`);
    
  } catch (error) {
    console.log(colorize("❌ Error viewing passport details:", "red"), error.message);
  }
}

async function listPassportsByManufacturer() {
  try {
    const manufacturer = await promptForInput("🏭 Enter Manufacturer Address (leave empty for current signer): ");
    const manufacturerAddress = manufacturer || currentSigner.address;
    
    console.log(colorize(`\n📋 PASSPORTS FOR ${manufacturerAddress}`, "cyan"));
    
    const productIds = await contracts.passportRegistry.getPassportsByManufacturer(manufacturerAddress);
    
    if (productIds.length === 0) {
      console.log(colorize("📭 No passports found for this manufacturer", "yellow"));
      return;
    }
    
    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i];
      try {
        const passportInfo = await contracts.passportRegistry.getPassport(productId);
        const isActive = await contracts.passportRegistry.isPassportActive(productId);
        
        console.log(`\n${i + 1}. 📦 Product ID: ${productId}`);
        console.log(`   📍 Address: ${passportInfo.passportAddress}`);
        console.log(`   📅 Created: ${new Date(Number(passportInfo.createdAt) * 1000).toLocaleDateString()}`);
        console.log(`   ✅ Status: ${isActive ? colorize("ACTIVE", "green") : colorize("INACTIVE", "red")}`);
        
      } catch (error) {
        console.log(`   ❌ Error loading ${productId}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(colorize("❌ Error listing passports:", "red"), error.message);
  }
}

async function addStandardAttestation() {
  console.log(colorize("\n📝 ADD STANDARD ATTESTATION", "bright"));
  console.log("Available WEG Schema Types:");
  console.log("1. 🚛 Transport Event (WEG_TRANSPORT_EVENT)");
  console.log("2. 👤 Ownership Transfer (WEG_OWNERSHIP_TRANSFER)"); 
  console.log("3. 🔧 Maintenance Event (WEG_MAINTENANCE_EVENT)");
  console.log("4. ♻️  End of Life (WEG_END_OF_LIFE)");
  console.log("0. Back to Passport Menu");
  
  const choice = await promptForInput("\nSelect schema type: ");
  
  switch(choice) {
    case "1":
      await addTransportEvent(false);
      break;
    case "2":
      await addOwnershipTransfer(false);
      break;
    case "3":
      await addMaintenanceEvent(false);
      break;
    case "4":
      await addEndOfLife(false);
      break;
    case "0":
      return;
    default:
      console.log(colorize("❌ Invalid option", "red"));
  }
}

async function addQualifiedAttestation() {
  console.log(colorize("\n🔒 ADD QUALIFIED ATTESTATION", "bright"));
  
  // Check if current signer is qualified first
  try {
    const isQualified = await contracts.eidasAttestor.isQualifiedAttester(currentSigner.address);
    if (!isQualified) {
      console.log(colorize("❌ Current signer is not qualified for eIDAS attestations", "red"));
      console.log(colorize("💡 Tip: Use 'eIDAS Operations' -> 'Certificate Management' to set up qualified certificates", "yellow"));
      return;
    }
  } catch (error) {
    console.log(colorize("❌ Error checking qualification status:", "red"), error.message);
    return;
  }
  
  console.log("Available WEG Schema Types:");
  console.log("1. 🚛 Transport Event (WEG_TRANSPORT_EVENT)");
  console.log("2. 👤 Ownership Transfer (WEG_OWNERSHIP_TRANSFER)"); 
  console.log("3. 🔧 Maintenance Event (WEG_MAINTENANCE_EVENT)");
  console.log("4. ♻️  End of Life (WEG_END_OF_LIFE)");
  console.log("0. Back to Passport Menu");
  
  const choice = await promptForInput("\nSelect schema type: ");
  
  switch(choice) {
    case "1":
      await addTransportEvent(true);
      break;
    case "2":
      await addOwnershipTransfer(true);
      break;
    case "3":
      await addMaintenanceEvent(true);
      break;
    case "4":
      await addEndOfLife(true);
      break;
    case "0":
      return;
    default:
      console.log(colorize("❌ Invalid option", "red"));
  }
}

async function addTransportEvent(useQualifiedSignature) {
  try {
    console.log(colorize("\n🚛 ADD TRANSPORT EVENT", "cyan"));
    
    const productId = await promptForInput("📦 Product ID: ");
    const title = await promptForInput("📋 Event Title: ");
    const responsibleAddress = await promptForInput("👤 Responsible Party Address (leave empty for current signer): ");
    const recipientAddress = await promptForInput("👥 Recipient Address: ");
    const description = await promptForInput("📝 Description: ");
    const origin = await promptForInput("📍 Origin Location: ");
    const destination = await promptForInput("🎯 Destination Location: ");
    const trackingInfo = await promptForInput("📦 Tracking Information: ");
    
    const responsible = responsibleAddress || currentSigner.address;
    
    console.log(colorize("\n🔄 Adding transport event...", "yellow"));
    
    const tx = await contracts.wegManager.addTransportEvent(
      productId,
      title,
      responsible,
      recipientAddress,
      description,
      origin,
      destination,
      trackingInfo,
      useQualifiedSignature
    );
    
    await tx.wait();
    
    console.log(colorize("✅ Transport event added successfully!", "green"));
    console.log(`📦 Product: ${productId}`);
    console.log(`🚛 Route: ${origin} → ${destination}`);
    console.log(`🔒 Qualified: ${useQualifiedSignature ? "YES" : "NO"}`);
    
  } catch (error) {
    console.log(colorize("❌ Error adding transport event:", "red"), error.message);
  }
}

async function addOwnershipTransfer(useQualifiedSignature) {
  try {
    console.log(colorize("\n👤 ADD OWNERSHIP TRANSFER", "cyan"));
    
    const productId = await promptForInput("📦 Product ID: ");
    const previousOwner = await promptForInput("👤 Previous Owner Address: ");
    const newOwner = await promptForInput("👥 New Owner Address: ");
    const transferType = await promptForInput("📋 Transfer Type (sale/lease/gift/inheritance): ");
    const contractReference = await promptForInput("📄 Contract Reference: ");
    const transferValueStr = await promptForInput("💰 Transfer Value (in Wei, 0 for none): ");
    const description = await promptForInput("📝 Description: ");
    
    const transferValue = transferValueStr || "0";
    
    console.log(colorize("\n🔄 Adding ownership transfer...", "yellow"));
    
    const tx = await contracts.wegManager.addOwnershipTransfer(
      productId,
      previousOwner,
      newOwner,
      transferType,
      contractReference,
      transferValue,
      description,
      useQualifiedSignature
    );
    
    await tx.wait();
    
    console.log(colorize("✅ Ownership transfer added successfully!", "green"));
    console.log(`📦 Product: ${productId}`);
    console.log(`👤 Transfer: ${previousOwner} → ${newOwner}`);
    console.log(`📋 Type: ${transferType}`);
    console.log(`🔒 Qualified: ${useQualifiedSignature ? "YES" : "NO"}`);
    
  } catch (error) {
    console.log(colorize("❌ Error adding ownership transfer:", "red"), error.message);
  }
}

async function addMaintenanceEvent(useQualifiedSignature) {
  try {
    console.log(colorize("\n🔧 ADD MAINTENANCE EVENT", "cyan"));
    
    const productId = await promptForInput("📦 Product ID: ");
    const eventType = await promptForInput("📋 Event Type (scheduled/emergency/repair/inspection): ");
    const technicianAddress = await promptForInput("👨‍🔧 Technician Address (leave empty for current signer): ");
    const maintenanceType = await promptForInput("🔧 Maintenance Type (preventive/corrective/predictive): ");
    const description = await promptForInput("📝 Description: ");
    const partsReplacedStr = await promptForInput("⚙️ Parts Replaced (comma-separated, or 'none'): ");
    const nextScheduledMaintenance = await promptForInput("📅 Next Scheduled Maintenance (date or 'TBD'): ");
    
    const technician = technicianAddress || currentSigner.address;
    const partsReplaced = partsReplacedStr === 'none' ? [] : partsReplacedStr.split(',').map(p => p.trim());
    
    console.log(colorize("\n🔄 Adding maintenance event...", "yellow"));
    
    const tx = await contracts.wegManager.addMaintenanceEvent(
      productId,
      eventType,
      technician,
      maintenanceType,
      description,
      partsReplaced,
      nextScheduledMaintenance,
      useQualifiedSignature
    );
    
    await tx.wait();
    
    console.log(colorize("✅ Maintenance event added successfully!", "green"));
    console.log(`📦 Product: ${productId}`);
    console.log(`🔧 Type: ${eventType} - ${maintenanceType}`);
    console.log(`👨‍🔧 Technician: ${technician}`);
    console.log(`🔒 Qualified: ${useQualifiedSignature ? "YES" : "NO"}`);
    
  } catch (error) {
    console.log(colorize("❌ Error adding maintenance event:", "red"), error.message);
  }
}

async function addEndOfLife(useQualifiedSignature) {
  try {
    console.log(colorize("\n♻️ ADD END OF LIFE EVENT", "cyan"));
    
    const productId = await promptForInput("📦 Product ID: ");
    const reason = await promptForInput("📋 Reason (wear/obsolescence/damage/upgrade): ");
    const finalizerAddress = await promptForInput("👤 Finalizer Address (leave empty for current signer): ");
    const condition = await promptForInput("📊 Final Condition (working/damaged/parts-only/scrap): ");
    const disposalMethod = await promptForInput("♻️ Disposal Method (recycle/refurbish/dispose/donate): ");
    const recyclerAddress = await promptForInput("🏭 Recycler Address: ");
    const environmentalImpact = await promptForInput("🌍 Environmental Impact Assessment: ");
    
    const finalizer = finalizerAddress || currentSigner.address;
    
    console.log(colorize("\n🔄 Adding end of life event...", "yellow"));
    
    const tx = await contracts.wegManager.addEndOfLife(
      productId,
      reason,
      finalizer,
      condition,
      disposalMethod,
      recyclerAddress,
      environmentalImpact,
      useQualifiedSignature
    );
    
    await tx.wait();
    
    console.log(colorize("✅ End of life event added successfully!", "green"));
    console.log(`📦 Product: ${productId}`);
    console.log(`♻️ Method: ${disposalMethod}`);
    console.log(`📊 Condition: ${condition}`);
    console.log(`🔒 Qualified: ${useQualifiedSignature ? "YES" : "NO"}`);
    
  } catch (error) {
    console.log(colorize("❌ Error adding end of life event:", "red"), error.message);
  }
}

async function viewPassportAttestations() {
  try {
    const productId = await promptForInput("📦 Enter Product ID: ");
    
    console.log(colorize("\n📋 ATTESTATION VIEWER", "bright"));
    console.log("1. All Attestations");
    console.log("2. Qualified Attestations Only");
    console.log("3. Attestations by Schema");
    console.log("4. Attestations by Attester");
    console.log("5. Attestations by Level of Assurance");
    
    const choice = await promptForInput("\nSelect view type: ");
    
    const passportInfo = await contracts.passportRegistry.getPassport(productId);
    const passport = await ethers.getContractAt("DigitalPassport_eIDAS", passportInfo.passportAddress);
    
    let attestations = [];
    
    switch(choice) {
      case "1":
        attestations = await passport.getAttestations();
        console.log(colorize("\n📋 ALL ATTESTATIONS", "cyan"));
        break;
      case "2":
        attestations = await passport.getQualifiedAttestations();
        console.log(colorize("\n🔒 QUALIFIED ATTESTATIONS", "cyan"));
        break;
      case "3":
        const schema = await promptForInput("📝 Enter Schema Type: ");
        attestations = await passport.getAttestationsBySchema(schema);
        console.log(colorize(`\n📝 ATTESTATIONS FOR SCHEMA: ${schema}`, "cyan"));
        break;
      case "4":
        const attester = await promptForInput("👤 Enter Attester Address: ");
        attestations = await passport.getAttestationsByAttester(attester);
        console.log(colorize(`\n👤 ATTESTATIONS BY: ${attester}`, "cyan"));
        break;
      case "5":
        const loa = await promptForInput("📊 Enter LoA (1=Substantial, 2=High): ");
        attestations = await passport.getAttestationsByLoA(parseInt(loa));
        console.log(colorize(`\n📊 ATTESTATIONS - LoA ${loa}`, "cyan"));
        break;
      default:
        console.log(colorize("❌ Invalid choice", "red"));
        return;
    }
    
    if (attestations.length === 0) {
      console.log(colorize("📭 No attestations found", "yellow"));
      return;
    }
    
    for (let i = 0; i < attestations.length; i++) {
      const att = attestations[i];
      console.log(`\n${i + 1}. 📋 UID: ${att.uid}`);
      console.log(`   📝 Schema: ${att.schemaType}`);
      console.log(`   👤 Attester: ${att.attester}`);
      console.log(`   📅 Date: ${new Date(Number(att.timestamp) * 1000).toLocaleString()}`);
      console.log(`   🔒 Qualified: ${att.isQualified ? colorize("YES", "green") : colorize("NO", "red")}`);
      console.log(`   📊 LoA: ${att.levelOfAssurance} ${att.levelOfAssurance === 1 ? "(Substantial)" : att.levelOfAssurance === 2 ? "(High)" : "(Standard)"}`);
      
      // Show eIDAS info for qualified attestations
      if (att.isQualified) {
        try {
          const eidasInfo = await passport.getEIDASInfo(att.uid);
          console.log(`   🏛️ QTSP: ${eidasInfo.qtspName} (${eidasInfo.qtspCountry})`);
          console.log(`   📝 Format: ${eidasInfo.signatureFormat}`);
          console.log(`   🌍 Cross-Border: ${eidasInfo.crossBorderRecognition ? "YES" : "NO"}`);
          console.log(`   ✅ Valid: ${eidasInfo.isValid ? colorize("YES", "green") : colorize("NO", "red")}`);
        } catch (error) {
          console.log(`   ❌ Error loading eIDAS info: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.log(colorize("❌ Error viewing attestations:", "red"), error.message);
  }
}

async function performLTVValidation() {
  try {
    const productId = await promptForInput("📦 Enter Product ID: ");
    const uid = await promptForInput("📋 Enter Attestation UID: ");
    
    console.log(colorize("\n🔄 Performing LTV validation...", "yellow"));
    
    const passportInfo = await contracts.passportRegistry.getPassport(productId);
    const passport = await ethers.getContractAt("DigitalPassport_eIDAS", passportInfo.passportAddress);
    
    // Check if validation is required
    const requiringLTV = await passport.getAttestationsRequiringLTV();
    const uidBytes32 = uid.startsWith('0x') ? uid : `0x${uid}`;
    
    if (!requiringLTV.includes(uidBytes32)) {
      console.log(colorize("⚠️ LTV validation not required or not yet due for this attestation", "yellow"));
      return;
    }
    
    const tx = await passport.performLTVValidation(uidBytes32);
    await tx.wait();
    
    console.log(colorize("✅ LTV validation completed!", "green"));
    
    // Show updated status
    const eidasInfo = await passport.getEIDASInfo(uidBytes32);
    console.log(`✅ Valid: ${eidasInfo.isValid ? colorize("YES", "green") : colorize("NO", "red")}`);
    console.log(`📅 Next Validation: ${new Date(Number(eidasInfo.nextValidationRequired) * 1000).toLocaleString()}`);
    
  } catch (error) {
    console.log(colorize("❌ Error performing LTV validation:", "red"), error.message);
  }
}

async function checkPassportStatus() {
  try {
    const productId = await promptForInput("📦 Enter Product ID: ");
    
    console.log(colorize("\n📊 PASSPORT STATUS", "cyan"));
    
    const isActive = await contracts.passportRegistry.isPassportActive(productId);
    const passportInfo = await contracts.passportRegistry.getPassport(productId);
    
    console.log(`📦 Product ID: ${productId}`);
    console.log(`✅ Active: ${isActive ? colorize("YES", "green") : colorize("NO", "red")}`);
    console.log(`🏭 Manufacturer: ${passportInfo.manufacturer}`);
    
    if (isActive) {
      const passport = await ethers.getContractAt("DigitalPassport_eIDAS", passportInfo.passportAddress);
      const stats = await passport.getAttestationStats();
      
      console.log(`\n📊 Attestation Summary:`);
      console.log(`Total: ${stats[0]}`);
      console.log(`Qualified: ${stats[1]}`);
      console.log(`High LoA: ${stats[3]}`);
      
      // Check for pending LTV validations
      const requiringLTV = await passport.getAttestationsRequiringLTV();
      if (requiringLTV.length > 0) {
        console.log(colorize(`⚠️ ${requiringLTV.length} attestations need LTV validation`, "yellow"));
      }
    }
    
  } catch (error) {
    console.log(colorize("❌ Error checking passport status:", "red"), error.message);
  }
}

async function deactivatePassport() {
  try {
    const productId = await promptForInput("📦 Enter Product ID: ");
    
    console.log(colorize("⚠️ WARNING: This will deactivate the passport!", "yellow"));
    const confirm = await promptForInput("Are you sure? (yes/no): ");
    
    if (confirm.toLowerCase() !== "yes") {
      console.log(colorize("❌ Operation cancelled", "yellow"));
      return;
    }
    
    console.log(colorize("\n🔄 Deactivating passport...", "yellow"));
    
    const tx = await contracts.passportRegistry.deactivatePassport(productId);
    await tx.wait();
    
    console.log(colorize("✅ Passport deactivated successfully!", "green"));
    
  } catch (error) {
    console.log(colorize("❌ Error deactivating passport:", "red"), error.message);
  }
}

async function showPassportStatistics() {
  try {
    console.log(colorize("\n📊 PASSPORT SYSTEM STATISTICS", "cyan"));
    
    // Registry statistics
    const totalPassports = await contracts.passportRegistry.totalPassports();
    const manufacturerCount = await contracts.passportRegistry.getManufacturerProductCount(currentSigner.address);
    
    console.log(`📦 Total Passports in System: ${totalPassports}`);
    console.log(`🏭 Current Manufacturer Products: ${manufacturerCount}`);
    
    // Factory statistics
    const factoryStats = await contracts.factory.totalProductsCreated();
    console.log(`🏭 Total Products Created: ${factoryStats}`);
    
    console.log(colorize("\n📋 DETAILED ANALYSIS", "blue"));
    
    // Analyze current manufacturer's passports
    if (manufacturerCount > 0) {
      const productIds = await contracts.passportRegistry.getPassportsByManufacturer(currentSigner.address);
      
      let totalAttestations = 0;
      let qualifiedAttestations = 0;
      let highLoAAttestations = 0;
      let activePassports = 0;
      
      for (const productId of productIds) {
        try {
          const isActive = await contracts.passportRegistry.isPassportActive(productId);
          if (isActive) {
            activePassports++;
            const passportInfo = await contracts.passportRegistry.getPassport(productId);
            const passport = await ethers.getContractAt("DigitalPassport_eIDAS", passportInfo.passportAddress);
            const stats = await passport.getAttestationStats();
            
            totalAttestations += Number(stats[0]);
            qualifiedAttestations += Number(stats[1]);
            highLoAAttestations += Number(stats[3]);
          }
        } catch (error) {
          // Skip problematic passports
        }
      }
      
      console.log(`\n📈 YOUR MANUFACTURER STATISTICS:`);
      console.log(`Active Passports: ${activePassports}/${productIds.length}`);
      console.log(`Total Attestations: ${totalAttestations}`);
      console.log(`Qualified Attestations: ${qualifiedAttestations}`);
      console.log(`High LoA Attestations: ${highLoAAttestations}`);
      
      if (totalAttestations > 0) {
        const qualifiedPercentage = ((qualifiedAttestations / totalAttestations) * 100).toFixed(1);
        console.log(`Qualified Percentage: ${qualifiedPercentage}%`);
      }
    }
    
  } catch (error) {
    console.log(colorize("❌ Error fetching statistics:", "red"), error.message);
  }
}

async function handleStakeholderManagement() {
  console.log(colorize("\n👥 STAKEHOLDER MANAGEMENT", "bright"));
  console.log("1. Add New Stakeholder");
  console.log("2. View Stakeholder Details");
  console.log("3. List All Stakeholders");
  console.log("4. Check Stakeholder Authorization");
  console.log("0. Back to Main Menu");
  
  const choice = await promptForInput("\nSelect option: ");
  
  switch(choice) {
    case "1":
      await addStakeholder();
      break;
    case "2":
      await viewStakeholderDetails();
      break;
    case "3":
      await listAllStakeholders();
      break;
    case "4":
      await checkStakeholderAuth();
      break;
    case "0":
      return;
    default:
      console.log(colorize("❌ Invalid option", "red"));
  }
  
  await promptForInput("\nPress Enter to continue...");
}

async function addStakeholder() {
  console.log(colorize("\n👥 ADD NEW STAKEHOLDER", "cyan"));
  
  try {
    const stakeholderAddress = await promptForInput("Stakeholder Address: ");
    const name = await promptForInput("Name: ");
    const role = await promptForInput("Role (manufacturer/exporter/technician/retailer/logistics/recycler): ");
    const description = await promptForInput("Description: ");
    
    console.log(colorize("\n🔄 Adding stakeholder...", "yellow"));
    
    const tx = await contracts.wegManager.addStakeholder(
      stakeholderAddress,
      name,
      role,
      description
    );
    
    console.log(colorize("⏳ Transaction submitted, waiting for confirmation...", "yellow"));
    await tx.wait();
    
    console.log(colorize("✅ Stakeholder added successfully!", "green"));
    
  } catch (error) {
    console.log(colorize("❌ Error adding stakeholder:", "red"), error.message);
  }
}

async function viewStakeholderDetails() {
  const stakeholderAddress = await promptForInput("Enter stakeholder address: ");
  
  try {
    console.log(colorize("🔍 Fetching stakeholder details...", "yellow"));
    
    // Check if stakeholder is authorized
    const isAuthorized = await contracts.wegManager.isAuthorizedStakeholder(stakeholderAddress);
    
    if (!isAuthorized) {
      console.log(colorize("❌ Address is not an authorized stakeholder", "red"));
      return;
    }
    
    console.log(colorize("\n👤 STAKEHOLDER DETAILS:", "cyan"));
    console.log(`📍 Address: ${stakeholderAddress}`);
    console.log(`✅ Authorized: ${isAuthorized ? colorize("YES", "green") : colorize("NO", "red")}`);
    
    try {
      // Try to get stakeholder role
      const role = await contracts.wegManager.getStakeholderRole(stakeholderAddress);
      console.log(`🎭 Role: ${role}`);
    } catch (error) {
      console.log(`🎭 Role: ${colorize("Unable to fetch", "yellow")}`);
    }
    
    // Check if has permissions for schemas
    const schemaNames = ["WEG_PRODUCT_INIT", "WEG_TRANSPORT_EVENT", "WEG_OWNERSHIP_TRANSFER", "WEG_MAINTENANCE_EVENT", "WEG_END_OF_LIFE"];
    console.log(`\n📋 SCHEMA PERMISSIONS:`);
    
    for (const schema of schemaNames) {
      try {
        const hasPermission = await contracts.wegManager.hasPermission(stakeholderAddress, schema);
        const status = hasPermission ? colorize("✅", "green") : colorize("❌", "red");
        console.log(`${status} ${schema}`);
      } catch (error) {
        console.log(`⚠️ ${schema}: Unable to check`);
      }
    }
    
    // Check eIDAS integration
    console.log(colorize("\n🔐 eIDAS STATUS:", "blue"));
    const isQualified = await contracts.eidasAttestor.isQualifiedAttester(stakeholderAddress);
    const loa = await contracts.eidasAttestor.getAttesterLoA(stakeholderAddress);
    const loaNumber = Number(loa);
    
    console.log(`✅ eIDAS Qualified: ${isQualified ? colorize("YES", "green") : colorize("NO", "red")}`);
    console.log(`📊 eIDAS LoA: ${loa} ${loaNumber === 1 ? "(Substantial)" : loaNumber === 2 ? "(High)" : "(None)"}`);
    
    // Check certificate status
    try {
      const certStatus = await contracts.eidasAttestor.getQualifiedCertificateStatus(stakeholderAddress);
      console.log(`📜 Certificate Status: ${certStatus ? colorize("VALID", "green") : colorize("INVALID/MISSING", "red")}`);
    } catch (error) {
      console.log(`📜 Certificate Status: ${colorize("Unable to check", "yellow")}`);
    }
    
    console.log(colorize("\n💡 DIAGNOSIS:", "magenta"));
    if (isQualified && loaNumber >= 2) {
      console.log(colorize("✅ This stakeholder should be able to create qualified attestations", "green"));
    } else if (isQualified && loaNumber >= 1) {
      console.log(colorize("⚠️ This stakeholder can create substantial LoA attestations only", "yellow"));
    } else {
      console.log(colorize("❌ This stakeholder cannot create qualified attestations", "red"));
      console.log(colorize("   Need to assign qualified certificate first", "yellow"));
    }
    
  } catch (error) {
    console.log(colorize("❌ Error fetching stakeholder details:", "red"), error.message);
  }
}

async function listAllStakeholders() {
  try {
    console.log(colorize("👥 Listing all stakeholders...", "yellow"));
    
    const stakeholders = await contracts.wegManager.getStakeholders();
    
    if (stakeholders.length === 0) {
      console.log(colorize("📭 No stakeholders found in the system", "yellow"));
      return;
    }
    
    console.log(colorize("\n👥 ALL STAKEHOLDERS:", "cyan"));
    
    for (let i = 0; i < stakeholders.length; i++) {
      const address = stakeholders[i];
      try {
        const isAuthorized = await contracts.wegManager.isAuthorizedStakeholder(address);
        const role = await contracts.wegManager.getStakeholderRole(address);
        const isQualified = await contracts.eidasAttestor.isQualifiedAttester(address);
        const loa = await contracts.eidasAttestor.getAttesterLoA(address);
        
        const authStatus = isAuthorized ? colorize("✅", "green") : colorize("❌", "red");
        const qualifiedStatus = isQualified ? colorize("🔐", "blue") : colorize("📝", "gray");
        
        console.log(`${i + 1}. ${address}`);
        console.log(`   ${authStatus} ${role} | ${qualifiedStatus} LoA ${loa} | ${isQualified ? "Qualified" : "Standard"}`);
        
      } catch (error) {
        console.log(`${i + 1}. ${address} - ${colorize("Error loading details", "red")}`);
      }
    }
    
    // Show summary
    const totalStakeholders = stakeholders.length;
    let qualifiedCount = 0;
    
    for (const address of stakeholders) {
      try {
        const isQualified = await contracts.eidasAttestor.isQualifiedAttester(address);
        if (isQualified) qualifiedCount++;
      } catch (error) {
        // Skip errors for summary
      }
    }
    
    console.log(colorize(`\n📊 SUMMARY:`, "blue"));
    console.log(`Total Stakeholders: ${totalStakeholders}`);
    console.log(`Qualified Attesters: ${qualifiedCount}`);
    console.log(`Standard Stakeholders: ${totalStakeholders - qualifiedCount}`);
    
  } catch (error) {
    console.log(colorize("❌ Error listing stakeholders:", "red"), error.message);
  }
}

async function checkStakeholderAuth() {
  const stakeholderAddress = await promptForInput("Enter stakeholder address: ");
  
  try {
    console.log(colorize("🔍 Checking authorization...", "yellow"));
    
    const isAuthorized = await contracts.wegManager.isAuthorizedStakeholder(stakeholderAddress);
    
    console.log(colorize("\n🔐 AUTHORIZATION STATUS:", "cyan"));
    console.log(`📍 Address: ${stakeholderAddress}`);
    console.log(`✅ Authorized: ${isAuthorized ? colorize("YES", "green") : colorize("NO", "red")}`);
    
    if (isAuthorized) {
      // Show detailed permissions
      const role = await contracts.wegManager.getStakeholderRole(stakeholderAddress);
      console.log(`🎭 Role: ${role}`);
      
      const schemaNames = ["WEG_PRODUCT_INIT", "WEG_TRANSPORT_EVENT", "WEG_OWNERSHIP_TRANSFER", "WEG_MAINTENANCE_EVENT", "WEG_END_OF_LIFE"];
      console.log(`\n📋 SCHEMA PERMISSIONS:`);
      
      let permissionCount = 0;
      for (const schema of schemaNames) {
        try {
          const hasPermission = await contracts.wegManager.hasPermission(stakeholderAddress, schema);
          const status = hasPermission ? colorize("✅", "green") : colorize("❌", "red");
          console.log(`${status} ${schema}`);
          if (hasPermission) permissionCount++;
        } catch (error) {
          console.log(`⚠️ ${schema}: Unable to check`);
        }
      }
      
      console.log(colorize(`\n📊 PERMISSION SUMMARY:`, "blue"));
      console.log(`Granted Schemas: ${permissionCount}/${schemaNames.length}`);
      
      // Check eIDAS status
      const isQualified = await contracts.eidasAttestor.isQualifiedAttester(stakeholderAddress);
      const loa = await contracts.eidasAttestor.getAttesterLoA(stakeholderAddress);
      
      console.log(colorize(`\n🔐 QUALIFIED STATUS:`, "magenta"));
      console.log(`eIDAS Qualified: ${isQualified ? colorize("YES", "green") : colorize("NO", "red")}`);
      console.log(`LoA Level: ${loa} ${Number(loa) === 1 ? "(Substantial)" : Number(loa) === 2 ? "(High)" : "(None)"}`);
      
    } else {
      console.log(colorize("\n💡 This address is not authorized as a stakeholder.", "yellow"));
      console.log(colorize("   Use 'Add Stakeholder' to authorize this address.", "yellow"));
    }
    
  } catch (error) {
    console.log(colorize("❌ Error checking authorization:", "red"), error.message);
  }
}

async function handleEidasOperations() {
  console.log(colorize("\n🔐 eIDAS OPERATIONS", "bright"));
  console.log("1. QTSP Management");
  console.log("2. Qualified Certificate Management");
  console.log("3. Level of Assurance (LoA) Management");
  console.log("4. eIDAS Compliance Check");
  console.log("5. Troubleshoot eIDAS Issues");
  console.log("6. View eIDAS System Stats");
  console.log("0. Back to Main Menu");
  
  const choice = await promptForInput("\nSelect option: ");
  
  switch(choice) {
    case "1":
      await handleQTSPManagement();
      break;
    case "2":
      await handleCertificateManagement();
      break;
    case "3":
      await handleLoAManagement();
      break;
    case "4":
      await checkEidasCompliance();
      break;
    case "5":
      await troubleshootEidasIssues();
      break;
    case "6":
      await showEidasStats();
      break;
    case "0":
      return;
    default:
      console.log(colorize("❌ Invalid option", "red"));
  }
  
  await promptForInput("\nPress Enter to continue...");
}

async function handleQTSPManagement() {
  console.log(colorize("\n🏛️ QTSP MANAGEMENT", "bright"));
  console.log("1. Register New QTSP");
  console.log("2. View QTSP Details");
  console.log("3. List All QTSPs");
  console.log("4. Update QTSP Status");
  console.log("0. Back to eIDAS Menu");
  
  const choice = await promptForInput("\nSelect option: ");
  
  switch(choice) {
    case "1":
      await registerQTSP();
      break;
    case "2":
      await viewQTSPDetails();
      break;
    case "3":
      await listAllQTSPs();
      break;
    case "4":
      await updateQTSPStatus();
      break;
    case "0":
      return;
    default:
      console.log(colorize("❌ Invalid option", "red"));
  }
  
  await promptForInput("\nPress Enter to continue...");
}

async function registerQTSP() {
  console.log(colorize("\n🏛️ REGISTER NEW QTSP", "cyan"));
  
  try {
    const qtspAddress = await promptForInput("QTSP Address: ");
    const name = await promptForInput("QTSP Name: ");
    const country = await promptForInput("Country Code (e.g., DE, FR, BR): ");
    const servicesInput = await promptForInput("Supported Services (comma-separated): ");
    const services = servicesInput.split(",").map(s => s.trim());
    const trustListURL = await promptForInput("Trust List URL: ");
    
    console.log(colorize("\n🔄 Registering QTSP...", "yellow"));
    
    const tx = await contracts.eidasAttestor.registerQTSP(
      qtspAddress,
      name,
      country,
      services,
      trustListURL
    );
    
    console.log(colorize("⏳ Transaction submitted, waiting for confirmation...", "yellow"));
    await tx.wait();
    
    console.log(colorize("✅ QTSP registered successfully!", "green"));
    
  } catch (error) {
    console.log(colorize("❌ Error registering QTSP:", "red"), error.message);
  }
}

async function viewQTSPDetails() {
  const qtspAddress = await promptForInput("Enter QTSP address: ");
  
  try {
    const qtsp = await contracts.eidasAttestor.authorizedQTSPs(qtspAddress);
    
    if (!qtsp.isActive && qtsp.name === "") {
      console.log(colorize("❌ QTSP not found or not registered", "red"));
      return;
    }
    
    console.log(colorize("\n🏛️ QTSP DETAILS:", "cyan"));
    console.log(`📛 Name: ${qtsp.name}`);
    console.log(`🌍 Country: ${qtsp.country}`);
    console.log(`📊 Status: ${qtsp.trustListStatus}`);
    console.log(`✅ Active: ${qtsp.isActive}`);
    console.log(`📅 Registration Date: ${new Date(Number(qtsp.registrationDate) * 1000).toLocaleString()}`);
    console.log(`🔄 Last Validation: ${new Date(Number(qtsp.lastValidation) * 1000).toLocaleString()}`);
    console.log(`🔗 Trust List URL: ${qtsp.trustListURL}`);
    console.log(`🛠️ Supported Services: ${qtsp.supportedServices.join(", ")}`);
    
  } catch (error) {
    console.log(colorize("❌ Error fetching QTSP details:", "red"), error.message);
  }
}

async function listAllQTSPs() {
  try {
    const qtspAddresses = await contracts.eidasAttestor.getRegisteredQTSPs();
    
    console.log(colorize("\n🏛️ ALL REGISTERED QTSPs:", "cyan"));
    
    if (qtspAddresses.length === 0) {
      console.log(colorize("No QTSPs registered in the system.", "yellow"));
      return;
    }
    
    for (let i = 0; i < qtspAddresses.length; i++) {
      const qtsp = await contracts.eidasAttestor.authorizedQTSPs(qtspAddresses[i]);
      const status = qtsp.isActive ? colorize("ACTIVE", "green") : colorize("INACTIVE", "red");
      console.log(`${i + 1}. ${qtsp.name} (${qtsp.country}) - ${status} - ${qtspAddresses[i]}`);
    }
    
  } catch (error) {
    console.log(colorize("❌ Error fetching QTSPs:", "red"), error.message);
  }
}

async function updateQTSPStatus() {
  console.log(colorize("\n🔄 UPDATE QTSP STATUS", "cyan"));
  
  try {
    const qtspAddress = await promptForInput("QTSP Address: ");
    const newStatus = await promptForInput("New Status (granted/withdrawn/suspended): ");
    
    console.log(colorize("\n🔄 Updating QTSP status...", "yellow"));
    
    const tx = await contracts.eidasAttestor.updateQTSPStatus(qtspAddress, newStatus);
    
    console.log(colorize("⏳ Transaction submitted, waiting for confirmation...", "yellow"));
    await tx.wait();
    
    console.log(colorize("✅ QTSP status updated successfully!", "green"));
    
  } catch (error) {
    console.log(colorize("❌ Error updating QTSP status:", "red"), error.message);
  }
}

async function handleCertificateManagement() {
  console.log(colorize("\n📜 CERTIFICATE MANAGEMENT", "bright"));
  console.log("1. Validate Qualified Certificate");
  console.log("2. Assign Certificate to Stakeholder");
  console.log("3. Check Certificate Status");
  console.log("4. Revoke Certificate");
  console.log("5. View Certificate Details");
  console.log("0. Back to eIDAS Menu");
  
  const choice = await promptForInput("\nSelect option: ");
  
  switch(choice) {
    case "1":
      await validateQualifiedCertificate();
      break;
    case "2":
      await assignQualifiedCertificate();
      break;
    case "3":
      await checkCertificateStatus();
      break;
    case "4":
      await revokeCertificate();
      break;
    case "5":
      await viewCertificateDetails();
      break;
    case "0":
      return;
    default:
      console.log(colorize("❌ Invalid option", "red"));
  }
  
  await promptForInput("\nPress Enter to continue...");
}

async function validateQualifiedCertificate() {
  console.log(colorize("\n📜 VALIDATE QUALIFIED CERTIFICATE", "cyan"));
  
  try {
    const certHashInput = await promptForInput("Certificate Hash (or enter text to hash): ");
    const certHash = certHashInput.startsWith("0x") ? 
      certHashInput : 
      ethers.keccak256(ethers.toUtf8Bytes(certHashInput));
    
    const holderAddress = await promptForInput("Certificate Holder Address: ");
    const certType = await promptForInput("Certificate Type (1=Personal, 2=Corporate): ");
    const loa = await promptForInput("Level of Assurance (1=Substantial, 2=High): ");
    
    console.log(colorize("\n🔄 Validating certificate...", "yellow"));
    
    const tx = await contracts.eidasAttestor.validateQualifiedCertificate(
      certHash,
      holderAddress,
      parseInt(certType),
      parseInt(loa)
    );
    
    console.log(colorize("⏳ Transaction submitted, waiting for confirmation...", "yellow"));
    await tx.wait();
    
    console.log(colorize("✅ Certificate validated successfully!", "green"));
    console.log(colorize(`📋 Certificate Hash: ${certHash}`, "blue"));
    
  } catch (error) {
    console.log(colorize("❌ Error validating certificate:", "red"), error.message);
  }
}

async function assignQualifiedCertificate() {
  console.log(colorize("\n📜 ASSIGN QUALIFIED CERTIFICATE", "cyan"));
  
  try {
    const stakeholderAddress = await promptForInput("Stakeholder Address: ");
    const certHashInput = await promptForInput("Certificate Hash (or enter text to hash): ");
    const certHash = certHashInput.startsWith("0x") ? 
      certHashInput : 
      ethers.keccak256(ethers.toUtf8Bytes(certHashInput));
    
    const qtspName = await promptForInput("QTSP Name: ");
    const loa = await promptForInput("Level of Assurance (1=Substantial, 2=High): ");
    
    console.log(colorize("\n🔄 Assigning certificate...", "yellow"));
    
    const tx = await contracts.wegManager.assignQualifiedCertificate(
      stakeholderAddress,
      certHash,
      qtspName,
      parseInt(loa)
    );
    
    console.log(colorize("⏳ Transaction submitted, waiting for confirmation...", "yellow"));
    await tx.wait();
    
    console.log(colorize("✅ Certificate assigned successfully!", "green"));
    
  } catch (error) {
    console.log(colorize("❌ Error assigning certificate:", "red"), error.message);
  }
}

async function checkCertificateStatus() {
  const certHashInput = await promptForInput("Enter Certificate Hash (or text to hash): ");
  const certHash = certHashInput.startsWith("0x") ? 
    certHashInput : 
    ethers.keccak256(ethers.toUtf8Bytes(certHashInput));
  
  try {
    const isValid = await contracts.eidasAttestor.isCertificateValid(certHash);
    const certificate = await contracts.eidasAttestor.validatedCertificates(certHash);
    
    console.log(colorize("\n📜 CERTIFICATE STATUS:", "cyan"));
    console.log(`📋 Hash: ${certHash}`);
    console.log(`✅ Valid: ${isValid ? colorize("YES", "green") : colorize("NO", "red")}`);
    
    if (certificate.certificateHolder !== ethers.ZeroAddress) {
      console.log(`👤 Holder: ${certificate.certificateHolder}`);
      console.log(`🏛️ QTSP: ${certificate.qtspName} (${certificate.qtspCountry})`);
      console.log(`📅 Issued: ${new Date(Number(certificate.issuanceDate) * 1000).toLocaleString()}`);
      console.log(`⏰ Expires: ${new Date(Number(certificate.expirationDate) * 1000).toLocaleString()}`);
      console.log(`🔒 Revoked: ${certificate.isRevoked ? colorize("YES", "red") : colorize("NO", "green")}`);
      console.log(`🏷️ Type: ${certificate.certificateType === 1 ? "Personal" : "Corporate"}`);
    } else {
      console.log(colorize("Certificate not found in registry", "yellow"));
    }
    
  } catch (error) {
    console.log(colorize("❌ Error checking certificate:", "red"), error.message);
  }
}

async function revokeCertificate() {
  console.log(colorize("\n🚫 REVOKE CERTIFICATE", "cyan"));
  
  try {
    const certHashInput = await promptForInput("Certificate Hash (or text to hash): ");
    const certHash = certHashInput.startsWith("0x") ? 
      certHashInput : 
      ethers.keccak256(ethers.toUtf8Bytes(certHashInput));
    
    const reason = await promptForInput("Revocation Reason: ");
    
    console.log(colorize("\n🔄 Revoking certificate...", "yellow"));
    
    const tx = await contracts.eidasAttestor.revokeCertificate(certHash, reason);
    
    console.log(colorize("⏳ Transaction submitted, waiting for confirmation...", "yellow"));
    await tx.wait();
    
    console.log(colorize("✅ Certificate revoked successfully!", "green"));
    
  } catch (error) {
    console.log(colorize("❌ Error revoking certificate:", "red"), error.message);
  }
}

async function viewCertificateDetails() {
  const certHashInput = await promptForInput("Enter Certificate Hash (or text to hash): ");
  const certHash = certHashInput.startsWith("0x") ? 
    certHashInput : 
    ethers.keccak256(ethers.toUtf8Bytes(certHashInput));
  
  try {
    const certificate = await contracts.eidasAttestor.validatedCertificates(certHash);
    
    if (certificate.certificateHolder === ethers.ZeroAddress) {
      console.log(colorize("❌ Certificate not found", "red"));
      return;
    }
    
    console.log(colorize("\n📜 CERTIFICATE DETAILS:", "cyan"));
    console.log(`📋 Hash: ${certHash}`);
    console.log(`👤 Holder: ${certificate.certificateHolder}`);
    console.log(`🏛️ QTSP Name: ${certificate.qtspName}`);
    console.log(`🌍 QTSP Country: ${certificate.qtspCountry}`);
    console.log(`📅 Issued: ${new Date(Number(certificate.issuanceDate) * 1000).toLocaleString()}`);
    console.log(`⏰ Expires: ${new Date(Number(certificate.expirationDate) * 1000).toLocaleString()}`);
    console.log(`🏷️ Type: ${certificate.certificateType === 1 ? "Personal" : "Corporate"}`);
    console.log(`🔍 Validation Method: ${certificate.validationMethod}`);
    console.log(`🔒 Revoked: ${certificate.isRevoked ? colorize("YES", "red") : colorize("NO", "green")}`);
    console.log(`🔄 Last Check: ${new Date(Number(certificate.lastValidationCheck) * 1000).toLocaleString()}`);
    
  } catch (error) {
    console.log(colorize("❌ Error fetching certificate details:", "red"), error.message);
  }
}

async function handleLoAManagement() {
  console.log(colorize("\n🔐 LEVEL OF ASSURANCE MANAGEMENT", "bright"));
  console.log("1. Check LoA for Address");
  console.log("2. View LoA Details");
  console.log("3. Check if Address is Qualified Attester");
  console.log("0. Back to eIDAS Menu");
  
  const choice = await promptForInput("\nSelect option: ");
  
  switch(choice) {
    case "1":
      await checkLoAForAddress();
      break;
    case "2":
      await viewLoADetails();
      break;
    case "3":
      await checkQualifiedAttester();
      break;
    case "0":
      return;
    default:
      console.log(colorize("❌ Invalid option", "red"));
  }
  
  await promptForInput("\nPress Enter to continue...");
}

async function checkLoAForAddress() {
  const address = await promptForInput("Enter address to check LoA: ");
  
  try {
    const loa = await contracts.eidasAttestor.getAttesterLoA(address);
    const isQualified = await contracts.eidasAttestor.isQualifiedAttester(address);
    
    console.log(colorize("\n🔐 LEVEL OF ASSURANCE:", "cyan"));
    console.log(`👤 Address: ${address}`);
    const loaNumber = Number(loa);
    console.log(`📊 LoA Level: ${loa} ${loaNumber === 1 ? "(Substantial)" : loaNumber === 2 ? "(High)" : "(None)"}`);
    console.log(`✅ Qualified Attester: ${isQualified ? colorize("YES", "green") : colorize("NO", "red")}`);
    
  } catch (error) {
    console.log(colorize("❌ Error checking LoA:", "red"), error.message);
  }
}

async function viewLoADetails() {
  const address = await promptForInput("Enter address for LoA details: ");
  
  try {
    const loa = await contracts.eidasAttestor.levelOfAssurance(address);
    
    if (loa.level === 0) {
      console.log(colorize("❌ No Level of Assurance found for this address", "red"));
      return;
    }
    
    console.log(colorize("\n🔐 LEVEL OF ASSURANCE DETAILS:", "cyan"));
    console.log(`👤 Address: ${address}`);
    console.log(`📊 Level: ${loa.level} ${loa.level === 1 ? "(Substantial)" : "(High)"}`);
    console.log(`✅ Valid: ${loa.isValid ? colorize("YES", "green") : colorize("NO", "red")}`);
    console.log(`📅 Validated At: ${new Date(Number(loa.validatedAt) * 1000).toLocaleString()}`);
    console.log(`⏰ Expires: ${new Date(Number(loa.expirationDate) * 1000).toLocaleString()}`);
    console.log(`🏛️ Validator: ${loa.validator}`);
    console.log(`📋 Requirements: ${loa.requirements.join(", ")}`);
    
  } catch (error) {
    console.log(colorize("❌ Error fetching LoA details:", "red"), error.message);
  }
}

async function checkQualifiedAttester() {
  const address = await promptForInput("Enter address to check: ");
  
  try {
    const isQualified = await contracts.eidasAttestor.isQualifiedAttester(address);
    const loa = await contracts.eidasAttestor.getAttesterLoA(address);
    
    console.log(colorize("\n🔍 ATTESTER QUALIFICATION CHECK:", "cyan"));
    console.log(`👤 Address: ${address}`);
    console.log(`✅ Qualified Attester: ${isQualified ? colorize("YES", "green") : colorize("NO", "red")}`);
    const loaNumber = Number(loa);
    console.log(`📊 LoA Level: ${loa} ${loaNumber === 1 ? "(Substantial)" : loaNumber === 2 ? "(High)" : "(None)"}`);
    
    if (!isQualified) {
      console.log(colorize("\n💡 To become a qualified attester:", "yellow"));
      console.log("1. Validate a qualified certificate for this address");
      console.log("2. Assign the certificate with appropriate LoA");
      console.log("3. Ensure the certificate is not expired or revoked");
    }
    
  } catch (error) {
    console.log(colorize("❌ Error checking attester status:", "red"), error.message);
  }
}

async function checkEidasCompliance() {
  console.log(colorize("\n✅ eIDAS COMPLIANCE CHECK", "cyan"));
  
  try {
    const stats = await contracts.eidasAttestor.getSystemStats();
    const totalQualifiedAttestations = stats[0];
    const totalQTSPs = stats[1];
    const totalValidCertificates = stats[2];
    
    console.log(colorize("\n📊 SYSTEM OVERVIEW:", "blue"));
    console.log(`🏛️ Total QTSPs: ${totalQTSPs}`);
    console.log(`📜 Valid Certificates: ${totalValidCertificates}`);
    console.log(`✅ Qualified Attestations: ${totalQualifiedAttestations}`);
    
    // Check current signer compliance
    console.log(colorize("\n👤 CURRENT SIGNER COMPLIANCE:", "blue"));
    const currentAddress = currentSigner.address;
    const isQualified = await contracts.eidasAttestor.isQualifiedAttester(currentAddress);
    const loa = await contracts.eidasAttestor.getAttesterLoA(currentAddress);
    
    console.log(`📍 Address: ${currentAddress}`);
    console.log(`✅ Qualified: ${isQualified ? colorize("YES", "green") : colorize("NO", "red")}`);
    console.log(`📊 LoA: ${loa} ${loa === 1 ? "(Substantial)" : loa === 2 ? "(High)" : "(None)"}`);
    
    if (isQualified) {
      console.log(colorize("\n🎉 This address is eIDAS compliant and can create qualified attestations!", "green"));
    } else {
      console.log(colorize("\n⚠️ This address is NOT eIDAS compliant. Cannot create qualified attestations.", "yellow"));
    }
    
  } catch (error) {
    console.log(colorize("❌ Error checking compliance:", "red"), error.message);
  }
}

async function troubleshootEidasIssues() {
  console.log(colorize("\n🔧 eIDAS TROUBLESHOOTING", "cyan"));
  console.log("This will help diagnose common eIDAS issues...\n");
  
  try {
    const address = await promptForInput("Enter address having issues (or current): ");
    const targetAddress = address || currentSigner.address;
    
    console.log(colorize(`\n🔍 Diagnosing issues for: ${targetAddress}`, "blue"));
    
    // Check 1: Is the address a qualified attester?
    const isQualified = await contracts.eidasAttestor.isQualifiedAttester(targetAddress);
    const loa = await contracts.eidasAttestor.getAttesterLoA(targetAddress);
    
    console.log(colorize("\n✅ CHECK 1: Qualified Attester Status", "yellow"));
    console.log(`Qualified Attester: ${isQualified ? colorize("PASS", "green") : colorize("FAIL", "red")}`);
    console.log(`Level of Assurance: ${loa} ${loa === 1 ? "(Substantial)" : loa === 2 ? "(High)" : "(None)"}`);
    
    if (!isQualified) {
      console.log(colorize("\n❌ ISSUE: Address is not a qualified attester", "red"));
      console.log(colorize("💡 SOLUTION:", "yellow"));
      console.log("1. Validate a qualified certificate for this address using a QTSP");
      console.log("2. Assign the qualified certificate with proper LoA");
      console.log("3. Ensure certificate is not expired or revoked");
    }
    
    // Check 2: Certificate status if exists
    if (loa > 0) {
      const loaDetails = await contracts.eidasAttestor.levelOfAssurance(targetAddress);
      
      console.log(colorize("\n✅ CHECK 2: Certificate Validity", "yellow"));
      const isValid = loaDetails.isValid;
      const isExpired = Number(loaDetails.expirationDate) < Date.now() / 1000;
      
      console.log(`Certificate Valid: ${isValid ? colorize("PASS", "green") : colorize("FAIL", "red")}`);
      console.log(`Certificate Expired: ${isExpired ? colorize("YES", "red") : colorize("NO", "green")}`);
      console.log(`Expires: ${new Date(Number(loaDetails.expirationDate) * 1000).toLocaleString()}`);
      
      if (!isValid || isExpired) {
        console.log(colorize("\n❌ ISSUE: Certificate is invalid or expired", "red"));
        console.log(colorize("💡 SOLUTION:", "yellow"));
        console.log("1. Renew the qualified certificate");
        console.log("2. Re-assign with updated expiration date");
      }
    }
    
    // Check 3: QTSP status for validator
    if (loa > 0) {
      const loaDetails = await contracts.eidasAttestor.levelOfAssurance(targetAddress);
      if (loaDetails.validator !== ethers.ZeroAddress) {
        console.log(colorize("\n✅ CHECK 3: QTSP Validator Status", "yellow"));
        
        try {
          const qtsp = await contracts.eidasAttestor.authorizedQTSPs(loaDetails.validator);
          console.log(`QTSP Active: ${qtsp.isActive ? colorize("PASS", "green") : colorize("FAIL", "red")}`);
          console.log(`QTSP Status: ${qtsp.trustListStatus}`);
          
          if (!qtsp.isActive) {
            console.log(colorize("\n❌ ISSUE: Validating QTSP is inactive", "red"));
            console.log(colorize("💡 SOLUTION:", "yellow"));
            console.log("1. Re-validate certificate with an active QTSP");
            console.log("2. Or reactivate the QTSP if authorized");
          }
        } catch (error) {
          console.log(`QTSP Status: ${colorize("ERROR - QTSP not found", "red")}`);
        }
      }
    }
    
    // Common issues summary
    console.log(colorize("\n📋 COMMON SOLUTIONS:", "blue"));
    console.log("• If 'No valid LoA for attester' error:");
    console.log("  1. Go to Certificate Management → Validate Qualified Certificate");
    console.log("  2. Go to Certificate Management → Assign Certificate to Stakeholder");
    console.log("• If certificate expired: Re-validate and re-assign");
    console.log("• If QTSP inactive: Use a different active QTSP");
    
  } catch (error) {
    console.log(colorize("❌ Error during troubleshooting:", "red"), error.message);
  }
}

async function showEidasStats() {
  try {
    console.log(colorize("\n📊 eIDAS SYSTEM STATISTICS", "cyan"));
    
    const stats = await contracts.eidasAttestor.getSystemStats();
    const totalQualifiedAttestations = stats[0];
    const totalQTSPs = stats[1];
    const totalValidCertificates = stats[2];
    
    console.log(`🏛️ Total QTSPs: ${totalQTSPs}`);
    console.log(`📜 Valid Certificates: ${totalValidCertificates}`);
    console.log(`✅ Qualified Attestations: ${totalQualifiedAttestations}`);
    
    // Additional info
    const qtspAddresses = await contracts.eidasAttestor.getRegisteredQTSPs();
    const currentVersion = await contracts.eidasAttestor.currentTrustListVersion();
    
    console.log(`📋 Registered QTSP Addresses: ${qtspAddresses.length}`);
    console.log(`🔄 Trust List Version: ${currentVersion}`);
    
    // Current signer status
    console.log(colorize("\n👤 CURRENT SIGNER STATUS:", "blue"));
    const isQualified = await contracts.eidasAttestor.isQualifiedAttester(currentSigner.address);
    const loa = await contracts.eidasAttestor.getAttesterLoA(currentSigner.address);
    
    console.log(`📍 Address: ${currentSigner.address}`);
    console.log(`✅ Qualified: ${isQualified ? colorize("YES", "green") : colorize("NO", "red")}`);
    console.log(`📊 LoA: ${loa} ${loa === 1 ? "(Substantial)" : loa === 2 ? "(High)" : "(None)"}`);
    
  } catch (error) {
    console.log(colorize("❌ Error fetching eIDAS stats:", "red"), error.message);
  }
}

async function handleSystemInformation() {
  console.log(colorize("\n📊 SYSTEM INFORMATION", "bright"));
  console.log("1. Contract Addresses");
  console.log("2. Network Information");
  console.log("3. Total System Statistics");
  console.log("4. Contract ABI Information");
  console.log("0. Back to Main Menu");
  
  const choice = await promptForInput("\nSelect option: ");
  
  switch(choice) {
    case "1":
      await showContractAddresses();
      break;
    case "2":
      await showNetworkInfo();
      break;
    case "3":
      await showSystemStats();
      break;
    case "4":
      await showContractABI();
      break;
    case "0":
      return;
    default:
      console.log(colorize("❌ Invalid option", "red"));
  }
  
  await promptForInput("\nPress Enter to continue...");
}

async function showContractAddresses() {
  console.log(colorize("\n📋 CONTRACT ADDRESSES:", "cyan"));
  console.log(`PassportRegistry: ${contractAddresses.passportRegistry}`);
  console.log(`eIDASQualifiedAttestor: ${contractAddresses.eidasAttestor}`);
  console.log(`DigitalPassportFactory: ${contractAddresses.factory}`);
  console.log(`WEGManager: ${contractAddresses.wegManager}`);
  console.log(`EAS Contract: ${contractAddresses.easContract}`);
  console.log(`Schema Registry: ${contractAddresses.schemaRegistry}`);
}

async function showNetworkInfo() {
  try {
    const network = await currentSigner.provider.getNetwork();
    const blockNumber = await currentSigner.provider.getBlockNumber();
    
    console.log(colorize("\n🌐 NETWORK INFORMATION:", "cyan"));
    console.log(`Chain ID: ${network.chainId}`);
    console.log(`Network Name: ${network.name}`);
    console.log(`Current Block: ${blockNumber}`);
    
  } catch (error) {
    console.log(colorize("❌ Error fetching network info:", "red"), error.message);
  }
}

async function showSystemStats() {
  try {
    console.log(colorize("\n📊 SYSTEM STATISTICS:", "cyan"));
    
    const totalPassports = await contracts.passportRegistry.totalPassports();
    console.log(`Total Passports: ${totalPassports}`);
    
    const manufacturerCount = await contracts.passportRegistry.getManufacturerProductCount(currentSigner.address);
    console.log(`Current Manufacturer Products: ${manufacturerCount}`);
    
  } catch (error) {
    console.log(colorize("❌ Error fetching system stats:", "red"), error.message);
  }
}

async function showContractABI() {
  console.log(colorize("\n📋 Available Contract Methods:", "cyan"));
  
  const contractNames = Object.keys(contracts);
  for (const name of contractNames) {
    if (contracts[name] && contracts[name].interface) {
      console.log(colorize(`\n${name.toUpperCase()}:`, "yellow"));
      const functions = contracts[name].interface.fragments.filter(f => f.type === 'function');
      functions.slice(0, 5).forEach(func => {
        console.log(`  - ${func.name}`);
      });
      if (functions.length > 5) {
        console.log(`  ... and ${functions.length - 5} more`);
      }
    }
  }
}

// Main application loop
async function main() {
  try {
    await loadContracts();
    
    while (true) {
      await displayHeader();
      displayMainMenu();
      
      const choice = await promptForInput("\nSelect option: ");
      
      switch(choice) {
        case "1":
          await handleAccountManagement();
          break;
        case "2":
          await handleProductManagement();
          break;
        case "3":
          await handlePassportOperations();
          break;
        case "4":
          await handleStakeholderManagement();
          break;
        case "5":
          await handleEidasOperations();
          break;
        case "6":
          await handleSystemInformation();
          break;
        case "7":
          console.log(colorize("🚚 Transport & Lifecycle - Coming Soon!", "yellow"));
          await promptForInput("\nPress Enter to continue...");
          break;
        case "8":
          console.log(colorize("🔍 Query & Search - Coming Soon!", "yellow"));
          await promptForInput("\nPress Enter to continue...");
          break;
        case "0":
          console.log(colorize("\n👋 Goodbye!", "green"));
          rl.close();
          return;
        default:
          console.log(colorize("❌ Invalid option. Please try again.", "red"));
          await promptForInput("\nPress Enter to continue...");
      }
    }
    
  } catch (error) {
    console.error(colorize("❌ Fatal error:", "red"), error);
    rl.close();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(colorize("\n\n👋 Goodbye!", "green"));
  rl.close();
  process.exit(0);
});

// Export for testing
module.exports = { main };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
} 