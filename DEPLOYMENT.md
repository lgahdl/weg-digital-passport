# WEG Digital Passport + eIDAS Deployment Guide

This guide explains how to deploy and test the WEG Digital Passport system locally using forked Arbitrum.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/luizgustavoahsc/weg-digital-passport.git
cd weg-digital-passport

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```bash
# Optional: Arbitrum RPC URL (uses public RPC by default)
ARBITRUM_ONE_RPC_URL=https://arb1.arbitrum.io/rpc

# Optional: For gas reporting
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_api_key_here

# For production deployments
PRIVATE_KEY=your_private_key_without_0x_prefix
ARBISCAN_API_KEY=your_arbiscan_api_key
```

## 🔧 Local Development

### Option 1: Using Hardhat with Forked Arbitrum (Recommended)

```bash
# Start Hardhat node with Arbitrum fork
npm run node:fork

# In another terminal, deploy contracts
npm run deploy:local

# Or use the comprehensive eIDAS deployment
npm run deploy:eidas
```

### Option 2: Using Anvil with Forked Arbitrum

```bash
# Start Anvil with Arbitrum fork
npm run anvil:fork

# In another terminal, deploy contracts
npm run deploy:local
```

## 📋 Contract Addresses

### Arbitrum One (Production)
- **EAS Contract**: `0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458`
- **Schema Registry**: `0xA310da9c5B885E7fb3fbA9D66E9Ba6Df512b78eB`

### Local Deployment (Forked)
After running deployment, you'll see output like:

```
📋 Contract Addresses:
- SchemaRegistry (Arbitrum): 0xA310da9c5B885E7fb3fbA9D66E9Ba6Df512b78eB
- EAS (Arbitrum): 0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458
- PassportRegistry: 0x...
- eIDASQualifiedAttestor: 0x...
- DigitalPassportFactory: 0x...
- WEGManager: 0x...
```

## 🧪 Testing

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Interactive Testing

```bash
# Start console
npm run console

# Example console commands:
const wegManager = await ethers.getContractAt("WEGManager", "DEPLOYED_ADDRESS");
const registry = await ethers.getContractAt("PassportRegistry", "DEPLOYED_ADDRESS");

// Check test product
await registry.getPassport("WEG-W22-2024-001");

// Get all WEG products
await registry.getPassportsByManufacturer(await wegManager.getAddress());
```

## 🏭 System Architecture

### Core Components

1. **PassportRegistry**: Central registry for all digital passports
2. **DigitalPassportFactory**: Creates new product passports
3. **eIDASQualifiedAttestor**: Handles qualified signatures and eIDAS compliance
4. **WEGManager**: WEG-specific implementation with roles and schemas
5. **DigitalPassport_eIDAS**: Individual product passport contracts

### eIDAS Features

- **Qualified Electronic Signatures**: CAdES, XAdES, PAdES support
- **Levels of Assurance**: LoA 1 (Substantial) and LoA 2 (High)
- **QTSP Integration**: European Trust Service Providers
- **Cross-border Recognition**: Valid in 27 EU countries + EEA
- **Long-term Validation**: LTV for evidence preservation

## 📊 WEG Schemas

The system includes 5 pre-configured schemas for WEG products:

1. **WEG_PRODUCT_INIT**: Product creation and initialization
2. **WEG_TRANSPORT_EVENT**: Logistics and transportation events
3. **WEG_OWNERSHIP_TRANSFER**: Legal ownership changes
4. **WEG_MAINTENANCE_EVENT**: Maintenance and service records
5. **WEG_END_OF_LIFE**: End-of-life and recycling information

## 👥 Stakeholder Roles

| Role | LoA Level | Qualified Signature | Permissions |
|------|-----------|-------------------|-------------|
| manufacturer | High (2) | Required | All schemas |
| exporter | Substantial (1) | Required | Transport events |
| technician | Substantial (1) | Optional | Maintenance events |
| joint_manufacturer | High (2) | Required | Ownership + Transport |
| retailer | Substantial (1) | Required | Ownership transfer |
| logistics | Substantial (1) | Optional | Transport events |
| recycler | High (2) | Required | End-of-life |
| end_customer | None (0) | None | Read-only access |

## 🔍 Verification Commands

After deployment, verify the system is working:

```bash
# Check contract sizes
npm run size

# Run linting
npm run lint

# Format code
npm run format

# Generate coverage report
npm run coverage
```

## 🌐 Production Deployment

### Arbitrum Sepolia (Testnet)

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# Deploy to testnet
npx hardhat run scripts/deploy-eidas-system.js --network arbitrumSepolia
```

### Arbitrum One (Mainnet)

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export ARBITRUM_ONE_RPC_URL=https://arb1.arbitrum.io/rpc

# Deploy to mainnet
npx hardhat run scripts/deploy-eidas-system.js --network arbitrumOne

# Verify contracts
npx hardhat verify --network arbitrumOne DEPLOYED_ADDRESS
```

## 📈 Gas Optimization

The contracts are optimized for gas efficiency:

- **Optimizer enabled**: 200 runs
- **Via IR**: Enabled for better optimization
- **Contract size monitoring**: Automatic size reporting

## 🛠️ Development Tools

- **Hardhat**: Development environment
- **OpenZeppelin**: Security-audited contract libraries
- **EAS**: Ethereum Attestation Service integration
- **Solhint**: Solidity linting
- **Prettier**: Code formatting
- **Hardhat Gas Reporter**: Gas usage analysis

## 🔒 Security Considerations

- All contracts inherit from OpenZeppelin's security patterns
- Role-based access control with multi-level authentication
- eIDAS qualified signature validation
- Comprehensive event logging for audit trails
- Upgradeable contract patterns where appropriate

## 📞 Support

For technical support or questions:

- **Developer**: Luiz Gustavo Abou Hatem de Liz
- **Email**: luizgustavoahsc@gmail.com
- **Repository**: https://github.com/luizgustavoahsc/weg-digital-passport

## 📄 License

MIT License - see LICENSE file for details. 