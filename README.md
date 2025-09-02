# 🏗️ SusuChain

**Your Traditional Susu, Now on Blockchain**

SusuChain is a decentralized platform that digitizes traditional West African rotating savings circles (Susu/Tontine) using smart contracts, ENS-based group identification, and EFP member verification on Base L2.

## 🌟 Overview

Traditional Susu groups have been a cornerstone of financial security in Ghanaian communities for generations. SusuChain brings this trusted system to the blockchain, providing transparency, automation, and security while maintaining the community spirit that makes Susu so effective.

### 🎯 Target Users
- Ghanaian communities already familiar with Susu
- Market women, teachers, drivers, office workers
- Age group: 25-55 years, smartphone users

## 🏆 Hackathon Bounties Integration

SusuChain integrates with multiple ETH Accra hackathon bounties:

1. **ENS Integration** ($4,800 pool): Group naming `teachers.susu.eth`, member profiles
2. **EFP Integration** ($1,000 pool): Member verification and reputation system
3. **Buidl Guidl** ($1,000 pool): Built with Scaffold-ETH 2
4. **Base Integration**: L2 for low-cost transactions
5. **Open Track**: DeFi/ReFi category (traditional finance digitization)

## 🚀 Features

### Core Functionality
- ✅ Create Susu groups with ENS names
- ✅ Join groups with EFP profile verification
- ✅ Automated weekly/monthly contributions
- ✅ Smart contract-based beneficiary selection
- ✅ Secure payout distribution
- ✅ Mobile-responsive interface

### Bounty Integrations
- ✅ ENS group naming (`groupname.susu.eth`)
- ✅ ENS member profiles (`member.groupname.susu.eth`)
- ✅ EFP profile verification and reputation tracking
- ✅ Built with Scaffold-ETH 2 framework
- ✅ Deployed on Base Sepolia testnet
- ✅ Open source on GitHub

### User Experience
- ✅ Intuitive onboarding flow
- ✅ Clear group dashboard
- ✅ Easy contribution process
- ✅ Transaction history
- ✅ Group member management

## 🛠️ Technical Architecture

### Smart Contracts
- **SusuGroup.sol**: Manages individual Susu groups
- **SusuFactory.sol**: Creates and manages multiple groups
- **SusuToken.sol**: Governance token for future DAO features

### Frontend
- **Next.js + React**: Modern web framework
- **Tailwind CSS**: Mobile-first responsive design
- **Wagmi + Viem**: Ethereum interactions
- **ENS Integration**: Name resolution and profiles
- **EFP Integration**: Member verification and reputation

### Blockchain
- **Base Sepolia**: L2 testnet for low-cost transactions
- **Solidity ^0.8.20**: Smart contract development
- **OpenZeppelin**: Security and standards

## 📦 Deployed Contracts

### Base Sepolia Testnet
- **SusuToken**: `0xf33ad6405169ca16C32C0C2E1508B9742888B2Ed`
- **SusuFactory**: `0x8cBDa19492Aa069AAf4FA4d1534851BcB7276EA2`

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Yarn package manager
- Git
- MetaMask wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/susuchain
   cd susuchain
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Start the development server**
   ```bash
   yarn start
   ```

4. **Access the application**
   - Open http://localhost:3000
   - Connect your MetaMask wallet
   - Switch to Base Sepolia network

### Environment Setup

Create `.env.local` in `packages/nextjs/`:
```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

Create `.env` in `packages/hardhat/`:
```env
ALCHEMY_API_KEY=your_alchemy_key
DEPLOYER_PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_key
```

## 📱 How to Use

### Creating a Susu Group

1. **Connect Wallet**: Connect your MetaMask to Base Sepolia
2. **Create Group**: Click "Create a Group" on the homepage
3. **Fill Details**: 
   - Group name (e.g., "Teachers Savings Circle")
   - ENS name (auto-generated: `teachers.susu.eth`)
   - Contribution amount (e.g., 0.1 ETH)
   - Schedule (weekly/monthly)
   - Maximum members (2-20)
4. **Deploy**: Submit transaction to create your group

### Joining a Group

1. **Browse Groups**: Visit the "Join a Group" page
2. **Select Group**: Choose a group that matches your preferences
3. **Join**: Click "Join Group" and provide:
   - ENS name (optional)
   - EFP profile (for verification)
4. **Confirm**: Submit transaction to join

### Making Contributions

1. **Group Dashboard**: Navigate to your group's page
2. **Contribute**: When it's time for the next round:
   - Click "Make Contribution"
   - Confirm the transaction
3. **Automatic Payout**: When all members contribute, the beneficiary receives the full amount

## 🧪 Testing

### Smart Contract Tests
```bash
yarn test
```

### Manual Testing
1. Create a test group with 2-3 members
2. Have each member join and contribute
3. Verify automatic payouts work
4. Test ENS name resolution
5. Check EFP profile integration

## 🔧 Development

### Project Structure
```
susuchain/
├── packages/
│   ├── hardhat/          # Smart contracts
│   │   ├── contracts/    # Solidity contracts
│   │   ├── deploy/       # Deployment scripts
│   │   └── test/         # Contract tests
│   └── nextjs/           # Frontend application
│       ├── app/          # Next.js pages
│       ├── components/   # React components
│       └── utils/        # Helper functions
```

### Key Components
- `SusuGroupCard`: Group display component
- `ContributionForm`: Payment interface
- `ENSRegistration`: ENS name registration
- `EFPProfile`: Member profile with reputation

### Smart Contract Functions

#### SusuFactory
- `createSusuGroup()`: Create new group
- `getAllGroups()`: Get all groups
- `getGroupsByCreator()`: Get creator's groups

#### SusuGroup
- `joinGroup()`: Join existing group
- `contributeToRound()`: Make contribution
- `getGroupInfo()`: Get group details
- `getMemberInfo()`: Get member details

## 🌐 Deployment

### Local Development
```bash
yarn hardhat node  # Start local blockchain
yarn deploy        # Deploy to localhost
yarn start         # Start frontend
```

### Base Sepolia Testnet
```bash
yarn deploy --network baseSepolia
```

### Production (Base Mainnet)
```bash
yarn deploy --network base
yarn build
```

## 🎨 UI/UX Design

### Mobile-First Approach
- Responsive design for smartphone users
- Touch-friendly interface
- Offline capability planning
- PWA features ready

### Design Principles
- **Familiar**: Resembles traditional Susu concepts
- **Simple**: Clear navigation and actions
- **Trustworthy**: Security indicators and transparency
- **Community-Focused**: Member profiles and social features

## 🔐 Security

### Smart Contract Security
- OpenZeppelin security standards
- Reentrancy guards
- Access controls
- Emergency functions

### Frontend Security
- No private key exposure
- Secure wallet connections
- Input validation
- Error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Traditional Susu communities in Ghana
- ENS (Ethereum Name Service) team
- EFP (Ethereum Follows Protocol) team
- Scaffold-ETH 2 builders
- Base team
- ETH Accra hackathon organizers

## 📞 Contact

For demo requests, questions, or partnerships:
- GitHub: [Project Repository](https://github.com/your-repo/susuchain)
- ETH Accra Hackathon Submission
- Built with ❤️ for the Ghanaian community

---

**🎯 Demo Script (4 minutes)**

1. **Introduction** (30s): "SusuChain brings traditional Ghanaian savings to blockchain"
2. **Problem Statement** (30s): Trust issues and manual processes in traditional Susu
3. **Solution Demo** (2.5 minutes):
   - Create group with ENS name: `teachers.susu.eth`
   - Add members with EFP profiles
   - Make contribution payment on Base L2
   - Show automated payout execution
4. **Impact & Future** (30s): Scaling across West Africa with DAO governance

**Ready to revolutionize traditional savings with blockchain technology! 🚀**