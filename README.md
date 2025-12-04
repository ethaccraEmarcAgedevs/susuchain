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
- ✅ Deployed on Base Mainnet
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
- **Next.js 15 + React 19**: Modern web framework with App Router
- **Tailwind CSS + DaisyUI**: Mobile-first responsive design
- **Reown AppKit (WalletConnect)**: Multi-wallet connectivity
- **Wagmi 2.x + Viem**: Type-safe Ethereum interactions
- **ENS Integration**: Name resolution and profiles
- **EFP Integration**: Member verification and reputation

### Blockchain
- **Base Mainnet**: L2 for low-cost, secure transactions
- **Solidity ^0.8.20**: Smart contract development
- **OpenZeppelin**: Security and standards

## 📦 Deployed Contracts

### Base Mainnet
- **Network**: Base (Chain ID: 8453)
- **SusuToken**: `0x35519d54af6F5537AB1D4FD6F4F79B3Ed86De065`
- **SusuFactory**: `0xf55B73a292C0f6CED5C919AF070673FBA94a73eF`

## 🔌 Wallet Connectivity

SusuChain uses **Reown AppKit** (formerly WalletConnect Web3Modal) for wallet connectivity:

- ✅ **Multi-wallet support**: MetaMask, Coinbase Wallet, Trust Wallet, Rainbow, and more
- ✅ **Mobile-optimized**: Deep links for mobile wallet apps
- ✅ **Network validation**: Automatic Base Mainnet detection and switching
- ✅ **Error handling**: User-friendly error messages and retry mechanisms
- ✅ **Session persistence**: Stay connected across page refreshes
- ✅ **Analytics tracking**: Built-in analytics for connection metrics

### Supported Wallets
- MetaMask (Browser Extension & Mobile)
- Coinbase Wallet
- Trust Wallet
- Rainbow Wallet
- Any WalletConnect-compatible wallet

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
   - Click "Connect Wallet" in the header
   - Select your preferred wallet from the modal
   - Approve connection and switch to Base Sepolia network

## 🚀 Deploy to Vercel

SusuChain is optimized for Vercel deployment with one-click setup:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ethaccraEmarcAgedevs/susuchain)

### Manual Deployment Steps

1. **Fork/Clone the repository**
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `susuchain` project

3. **Set Environment Variables** in Vercel Dashboard:
   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - Your WalletConnect Project ID (REQUIRED)
   - `NEXT_PUBLIC_ALCHEMY_API_KEY` - Your Alchemy API key (Optional)

4. **Deploy**: Vercel will automatically build and deploy

📖 **Detailed deployment guide**: See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete instructions.

### Post-Deployment Checklist
- ✅ Wallet connect button works
- ✅ Can open wallet selection modal
- ✅ Can connect MetaMask or other wallets
- ✅ Base Sepolia network is selected
- ✅ Can navigate to Create Group and Join Group pages

### Environment Setup

#### 1. Frontend Environment Variables

Create `.env.local` in `packages/nextjs/`:

```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key_here
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

**Get Alchemy API Key:**
1. Go to [https://dashboard.alchemyapi.io](https://dashboard.alchemyapi.io)
2. Sign up / Log in
3. Create a new app
4. Copy your API key

**Get WalletConnect Cloud Project ID (REQUIRED FOR PRODUCTION):**

> ⚠️ **Important**: The default Project ID is for development only. You MUST create your own for production!

1. Go to [https://cloud.reown.com](https://cloud.reown.com)
2. Sign up / Log in with GitHub or email
3. Click **"Create New Project"**
4. Fill in project details:
   - **Name**: SusuChain
   - **Description**: Traditional West African savings groups on blockchain
   - **URL**: Your production URL
   - **Category**: DeFi
5. Configure project settings:
   - Upload your logo (512x512 PNG)
   - Set **Allowed Origins**:
     - `https://your-production-domain.com`
     - `https://*.vercel.app` (for Vercel preview deployments)
     - `http://localhost:3000` (for local development)
   - Set **Allowed Redirect URIs** (same as origins)
6. Copy your **Project ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
7. Paste it in your `.env.local` file

**Benefits of Your Own Project ID:**
- ✅ Dedicated rate limits (no throttling)
- ✅ Access to analytics dashboard
- ✅ Custom branding in wallet connection modal
- ✅ Error tracking and monitoring
- ✅ Production-grade reliability
- ✅ Priority support

#### 2. Hardhat Environment Variables

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