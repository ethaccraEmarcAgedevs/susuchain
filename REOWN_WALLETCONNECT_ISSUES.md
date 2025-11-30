# Reown AppKit & WalletConnect Implementation Issues

This document outlines 7 strong issues for improving wallet connectivity in SusuChain using Reown AppKit and WalletConnect Cloud.

---

## Issue #1: Migrate from RainbowKit to Reown AppKit (Web3Modal)

**Priority:** HIGH
**Complexity:** High
**Estimated Time:** 2-3 days
**Impact:** Major Architecture Change

### Description

Replace RainbowKit with the official Reown AppKit (formerly WalletConnect Web3Modal v3). This provides:
- Direct WalletConnect v2 support without abstraction layers
- Better performance and smaller bundle size (~30% reduction)
- Native multi-chain support
- Built-in wallet management with better UX
- Superior customization options
- Official Reown/WalletConnect support and updates
- Better mobile wallet deep-linking

### Current State

```typescript
// Current implementation uses RainbowKit
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
```

**Dependencies:**
- `@rainbow-me/rainbowkit: 2.2.7`
- `@reown/appkit: 1.7.8` (installed as transitive dependency but NOT used)

### Proposed Solution

Migrate to Reown AppKit with Wagmi adapter:

```typescript
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { baseSepolia } from '@reown/appkit/networks'
```

### Technical Requirements

1. **Remove Dependencies:**
   - Uninstall `@rainbow-me/rainbowkit`
   - Install `@reown/appkit` and `@reown/appkit-adapter-wagmi`

2. **Refactor Files:**
   - `packages/nextjs/services/web3/wagmiConfig.tsx` - Complete rewrite
   - `packages/nextjs/services/web3/wagmiConnectors.tsx` - Convert to AppKit config
   - `packages/nextjs/components/ScaffoldEthAppWithProviders.tsx` - Use AppKit provider
   - `packages/nextjs/components/scaffold-eth/RainbowKitCustomConnectButton/` - Migrate to AppKit button

3. **Wallet Support:**
   - MetaMask
   - WalletConnect (all compatible wallets)
   - Coinbase Wallet
   - Ledger
   - Safe Wallet
   - Burner Wallet (for development)

4. **Testing:**
   - Test all wallet connections
   - Verify multi-account switching
   - Test network switching
   - Mobile wallet testing via WalletConnect
   - Verify ENS resolution still works

### Files to Modify

```
packages/nextjs/services/web3/wagmiConfig.tsx
packages/nextjs/services/web3/wagmiConnectors.tsx
packages/nextjs/components/ScaffoldEthAppWithProviders.tsx
packages/nextjs/components/scaffold-eth/RainbowKitCustomConnectButton/
packages/nextjs/app/layout.tsx
packages/nextjs/package.json
```

### Success Criteria

- [ ] All wallets connect successfully
- [ ] Bundle size reduced by at least 20%
- [ ] No regression in existing wallet functionality
- [ ] Mobile wallets work via WalletConnect QR
- [ ] Theme switching works correctly
- [ ] All existing contract interactions work
- [ ] Tests pass

### References

- [Reown AppKit Docs](https://docs.reown.com/appkit/overview)
- [Wagmi Adapter Guide](https://docs.reown.com/appkit/react/wagmi/about)
- [Migration Guide](https://docs.reown.com/appkit/migration/from-rainbowkit)

---

## Issue #2: Implement Reown AppKit Sign-In With Ethereum (SIWE) Authentication

**Priority:** HIGH
**Complexity:** Medium
**Estimated Time:** 1-2 days
**Impact:** Security & User Experience

### Description

Integrate Reown AppKit's built-in SIWE (EIP-4361) support for secure authentication. This is crucial for:
- Verifying wallet ownership before joining Susu groups
- Creating authenticated sessions for member-only actions
- Protecting sensitive operations (contributions, payouts)
- Preventing unauthorized access and Sybil attacks
- Compliance with Web3 authentication standards
- Better UX with persistent sessions

### Current State

**No authentication layer exists.** Any connected wallet can:
- View all group details
- Potentially interact with contracts
- No session management
- No verification of wallet ownership

This is a **security risk** for Susu groups handling real funds.

### Proposed Solution

Implement full SIWE authentication flow using Reown AppKit's SIWE adapter:

```typescript
import { createSIWEConfig } from '@reown/appkit-siwe'

const siweConfig = createSIWEConfig({
  getNonce: async () => {
    const res = await fetch('/api/siwe/nonce')
    return res.text()
  },
  verifyMessage: async ({ message, signature }) => {
    const res = await fetch('/api/siwe/verify', {
      method: 'POST',
      body: JSON.stringify({ message, signature })
    })
    return res.ok
  },
  getSession: async () => {
    const res = await fetch('/api/siwe/session')
    return res.json()
  },
  signOut: async () => {
    await fetch('/api/siwe/signout', { method: 'POST' })
  }
})
```

### Technical Requirements

1. **Backend API Routes (Next.js App Router):**
   - `app/api/siwe/nonce/route.ts` - Generate unique nonces
   - `app/api/siwe/verify/route.ts` - Verify signatures
   - `app/api/siwe/session/route.ts` - Check session status
   - `app/api/siwe/signout/route.ts` - Clear sessions

2. **Session Storage:**
   - Use secure HTTP-only cookies
   - Implement session expiry (24 hours)
   - Store sessions in Redis (production) or memory (dev)

3. **Frontend Integration:**
   - Configure AppKit with SIWE config
   - Add authentication guards to protected routes
   - Show authentication status in UI
   - Prompt sign-in before sensitive actions

4. **Protected Actions:**
   - Joining Susu groups
   - Making contributions
   - Claiming payouts
   - Voting in group decisions
   - Creating new groups

### Implementation Steps

1. **Install Dependencies:**
```bash
yarn workspace @se-2/nextjs add @reown/appkit-siwe iron-session
```

2. **Create SIWE Backend:**
```typescript
// app/api/siwe/nonce/route.ts
import { generateNonce } from 'siwe'
import { NextResponse } from 'next/server'

export async function GET() {
  const nonce = generateNonce()
  // Store nonce in session
  return NextResponse.json({ nonce })
}
```

3. **Configure AppKit:**
```typescript
// services/web3/siweConfig.ts
export const siweConfig = createSIWEConfig({
  // ... implementation
})
```

4. **Add Auth Guards:**
```typescript
// hooks/useRequireAuth.ts
export function useRequireAuth() {
  const { isAuthenticated } = useSIWE()
  // Redirect if not authenticated
}
```

### Files to Create

```
packages/nextjs/app/api/siwe/nonce/route.ts (NEW)
packages/nextjs/app/api/siwe/verify/route.ts (NEW)
packages/nextjs/app/api/siwe/session/route.ts (NEW)
packages/nextjs/app/api/siwe/signout/route.ts (NEW)
packages/nextjs/services/web3/siweConfig.ts (NEW)
packages/nextjs/hooks/scaffold-eth/useSIWE.ts (NEW)
packages/nextjs/hooks/scaffold-eth/useRequireAuth.ts (NEW)
packages/nextjs/lib/session.ts (NEW)
```

### Files to Modify

```
packages/nextjs/services/web3/wagmiConfig.tsx
packages/nextjs/components/ScaffoldEthAppWithProviders.tsx
packages/nextjs/app/create-group/page.tsx
packages/nextjs/components/SusuGroup/ContributionForm.tsx
```

### Success Criteria

- [ ] Users must sign message to authenticate
- [ ] Sessions persist across page refreshes
- [ ] Protected routes redirect to sign-in
- [ ] Session expires after 24 hours
- [ ] Sign-out clears session properly
- [ ] No bypass of authentication guards
- [ ] Works with all wallet types

### Security Considerations

- Use cryptographically secure nonces
- Verify message signatures on backend
- Implement CSRF protection
- Use HTTP-only cookies
- Rate limit authentication endpoints
- Log authentication attempts

### References

- [SIWE Specification (EIP-4361)](https://eips.ethereum.org/EIPS/eip-4361)
- [Reown SIWE Docs](https://docs.reown.com/appkit/react/wagmi/siwe)
- [iron-session](https://github.com/vvo/iron-session)

---

## Issue #3: Configure Production-Ready WalletConnect Cloud Project

**Priority:** HIGH
**Complexity:** Low
**Estimated Time:** 30 minutes
**Impact:** Production Readiness & Security

### Description

Replace the shared default WalletConnect Project ID with a dedicated project from WalletConnect Cloud (cloud.reown.com).

**Current Configuration:**
```typescript
// scaffold.config.ts:39
walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64"
```

This shared/default Project ID is **NOT production-ready** and poses several risks.

### Why This Matters

**Problems with Default Project ID:**
1. **Rate Limiting:** Shared across multiple projects, leading to throttling
2. **No Analytics:** Cannot track connection metrics or debug issues
3. **No Custom Branding:** Generic wallet connection experience
4. **Security Risks:** No control over allowed origins
5. **No Support:** Cannot get help from WalletConnect team
6. **Service Disruption:** Shared ID can be disabled at any time

**Benefits of Dedicated Project:**
- Dedicated rate limits (higher throughput)
- Access to analytics dashboard
- Custom branding (logo, name, colors)
- Allowed origins configuration
- Error tracking and monitoring
- DDoS protection
- Priority support
- Professional appearance

### Implementation Steps

#### 1. Create WalletConnect Cloud Project

1. Go to [https://cloud.reown.com](https://cloud.reown.com)
2. Sign up / Log in with GitHub or email
3. Click "Create New Project"
4. Fill in project details:
   - **Name:** SusuChain
   - **Description:** Digitizing traditional West African Susu savings groups on Base
   - **URL:** Your production URL
   - **Category:** DeFi / Social

#### 2. Configure Project Settings

**Project Metadata:**
- **Logo:** Upload SusuChain logo (512x512 PNG)
- **Name:** SusuChain
- **Description:** Traditional rotating savings on blockchain
- **Home Page:** https://your-domain.com
- **Terms of Service:** (if applicable)
- **Privacy Policy:** (if applicable)

**Allowed Origins:**
```
https://your-production-domain.com
https://*.vercel.app (for preview deployments)
http://localhost:3000 (for development)
```

**Allowed Redirect URIs:**
```
https://your-production-domain.com
https://*.vercel.app
http://localhost:3000
```

#### 3. Copy Project ID

After creation, copy your new Project ID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

#### 4. Update Environment Variables

**Local Development:**
```bash
# packages/nextjs/.env.local
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-new-project-id-here
```

**Vercel/Production:**
Add environment variable in Vercel dashboard:
- Variable: `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`
- Value: Your new Project ID
- Scope: Production, Preview, Development

#### 5. Update Documentation

```bash
# packages/nextjs/.env.example
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id-from-cloud.reown.com
```

**Update README:**
Add section about obtaining WalletConnect Project ID

### Files to Modify

```
packages/nextjs/.env.local (create if not exists)
packages/nextjs/.env.example
packages/nextjs/scaffold.config.ts (documentation comment)
README.md (add setup instructions)
```

### Verification Steps

After implementation:

1. **Test Connection:**
   - Clear browser cache
   - Connect with WalletConnect
   - Verify QR code works on mobile

2. **Check Analytics:**
   - Go to WalletConnect Cloud dashboard
   - Verify connections are being tracked
   - Check for any errors

3. **Test All Environments:**
   - Local development
   - Preview deployments
   - Production

### Success Criteria

- [ ] New Project ID created on WalletConnect Cloud
- [ ] Environment variables updated (local + Vercel)
- [ ] All wallet connections work
- [ ] Analytics showing in dashboard
- [ ] No rate limiting errors
- [ ] Mobile WalletConnect QR works
- [ ] Documentation updated

### Monitoring

After deployment, monitor:
- Connection success rate (should be >95%)
- Average connection time
- Most popular wallets
- Error rates by wallet type

### Cost

**Free Tier Includes:**
- Unlimited connections
- Basic analytics
- Community support

**Pro Tier ($99/month):**
- Advanced analytics
- Priority support
- Custom branding
- SLA guarantees

Start with **free tier** (sufficient for most dApps).

### References

- [WalletConnect Cloud](https://cloud.reown.com)
- [Getting Started Guide](https://docs.reown.com/cloud/relay)

---

## Issue #4: Implement Reown AppKit Multi-Chain Wallet Switching

**Priority:** MEDIUM
**Complexity:** Medium
**Estimated Time:** 1-2 days
**Impact:** User Experience & Network Support

### Description

Implement seamless multi-chain switching using Reown AppKit's native chain management. Currently, SusuChain is limited to Base Sepolia testnet. Expanding to multiple chains enables:

- **Base Mainnet** - Production deployment with real value
- **Base Sepolia** - Testing and development
- **Ethereum Mainnet** - ENS resolution (already partially supported)
- **Optimism** - Alternative L2 for lower fees
- **Arbitrum** - Another L2 option
- **Polygon** - For users preferring this chain

### Current State

```typescript
// scaffold.config.ts:16
targetNetworks: [chains.baseSepolia],
```

**Limitations:**
- Single chain only (Base Sepolia)
- No mainnet support
- Cannot switch chains in UI
- Groups isolated to one chain
- No cross-chain group discovery

### Proposed Solution

Implement multi-chain support with:
1. Chain selection during group creation
2. Chain filtering in group browsing
3. Automatic network switching prompts
4. Chain-specific contract deployments
5. Chain indicator badges on groups

### Technical Requirements

#### 1. Add Multiple Chains

```typescript
// scaffold.config.ts
import * as chains from "viem/chains";

const scaffoldConfig = {
  targetNetworks: [
    chains.base,           // Base Mainnet
    chains.baseSepolia,    // Base Sepolia Testnet
    chains.optimism,       // Optimism Mainnet
    chains.optimismSepolia,// Optimism Sepolia
    chains.mainnet,        // Ethereum Mainnet (ENS)
  ],
  // ...
}
```

#### 2. Deploy Contracts Multi-Chain

Update deployment scripts:

```typescript
// packages/hardhat/deploy/00_deploy_susu_contracts.ts
export default async function deploy(hre: HardhatRuntimeEnvironment) {
  const chainId = await hre.getChainId();

  // Chain-specific configuration
  const config = {
    "8453": { name: "Base Mainnet", initialSupply: "1000000" },
    "84532": { name: "Base Sepolia", initialSupply: "1000000" },
    "10": { name: "Optimism", initialSupply: "1000000" },
  };

  // Deploy with chain-specific params
}
```

#### 3. Add Chain Switcher UI

Create chain selector component:

```typescript
// components/ChainSwitcher.tsx
export function ChainSwitcher() {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();

  return (
    <select
      value={chain?.id}
      onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
    >
      <option value="8453">Base</option>
      <option value="84532">Base Sepolia</option>
      <option value="10">Optimism</option>
    </select>
  );
}
```

#### 4. Chain-Aware Group Filtering

Update group browsing:

```typescript
// app/groups/page.tsx
const [selectedChain, setSelectedChain] = useState<number | null>(null);

const filteredGroups = groups.filter(group =>
  !selectedChain || group.chainId === selectedChain
);
```

#### 5. Automatic Chain Switching

Prompt users to switch when needed:

```typescript
// hooks/useRequireChain.ts
export function useRequireChain(requiredChainId: number) {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (chain?.id !== requiredChainId) {
      switchChain({ chainId: requiredChainId });
    }
  }, [chain, requiredChainId]);
}
```

### Implementation Steps

1. **Update Configuration:**
   - Add chains to `scaffold.config.ts`
   - Configure RPC endpoints for each chain
   - Set up Alchemy endpoints (if using)

2. **Deploy Contracts:**
   - Deploy SusuFactory to all target chains
   - Deploy SusuToken to all target chains
   - Update deployment scripts
   - Document contract addresses per chain

3. **Update Frontend:**
   - Add chain selector to header
   - Add chain badges to group cards
   - Implement chain filtering
   - Add chain switching prompts
   - Update contract hooks to be chain-aware

4. **Testing:**
   - Test on each chain
   - Verify contract deployments
   - Test chain switching
   - Verify groups load correctly per chain

### Files to Create

```
packages/nextjs/components/ChainSwitcher.tsx (NEW)
packages/nextjs/components/ChainBadge.tsx (NEW)
packages/nextjs/hooks/scaffold-eth/useRequireChain.ts (NEW)
packages/hardhat/scripts/deploy-multichain.ts (NEW)
```

### Files to Modify

```
packages/nextjs/scaffold.config.ts
packages/nextjs/components/Header.tsx
packages/nextjs/components/SusuGroup/SusuGroupCard.tsx
packages/nextjs/app/groups/page.tsx
packages/nextjs/app/create-group/page.tsx
packages/hardhat/deploy/00_deploy_susu_contracts.ts
packages/hardhat/hardhat.config.ts
```

### Chain Configuration

| Chain | Chain ID | RPC | Explorer | Status |
|-------|----------|-----|----------|--------|
| Base Mainnet | 8453 | Alchemy/Public | basescan.org | Production |
| Base Sepolia | 84532 | Alchemy/Public | sepolia.basescan.org | Testnet |
| Optimism | 10 | Alchemy/Public | optimistic.etherscan.io | Production |
| Optimism Sepolia | 11155420 | Public | sepolia-optimism.etherscan.io | Testnet |
| Ethereum Mainnet | 1 | Alchemy | etherscan.io | ENS Only |

### UI/UX Considerations

1. **Chain Indicators:**
   - Color-coded badges (Base = blue, Optimism = red, etc.)
   - Chain logo icons
   - Clear chain name display

2. **User Guidance:**
   - Tooltip explaining why chain switch is needed
   - Loading states during chain switching
   - Error handling for failed switches

3. **Default Behavior:**
   - Default to Base Mainnet for new groups
   - Remember last selected chain
   - Show testnet warning badge

### Success Criteria

- [ ] Contracts deployed on all target chains
- [ ] Chain switcher works in UI
- [ ] Groups correctly filtered by chain
- [ ] Automatic chain switching prompts work
- [ ] Chain badges visible on group cards
- [ ] No errors when switching chains
- [ ] All wallets support chain switching
- [ ] Mobile experience works well

### Future Enhancements

- Cross-chain group discovery (The Graph)
- Bridge integration for cross-chain transfers
- Multi-chain group analytics
- Chain-specific gas optimization

### References

- [Viem Chains](https://viem.sh/docs/chains/introduction)
- [Wagmi useSwitchChain](https://wagmi.sh/react/api/hooks/useSwitchChain)
- [Reown Multi-Chain](https://docs.reown.com/appkit/react/wagmi/multichain)

---

## Issue #5: Fix Burner Wallet Type Compatibility & Re-enable for Development

**Priority:** MEDIUM
**Complexity:** Medium
**Estimated Time:** 4-6 hours
**Impact:** Developer Experience

### Description

The burner wallet connector is currently disabled due to type compatibility issues:

```typescript
// packages/nextjs/services/web3/wagmiConnectors.tsx:23-26
// Temporarily comment out burner wallet due to type compatibility issues
// ...(!targetNetworks.some(network => network.id !== (chains.hardhat as chains.Chain).id) || !onlyLocalBurnerWallet
//   ? [rainbowkitBurnerWallet]
//   : []),
```

Burner wallets are **critical** for:
- **Local Development:** Quick testing without MetaMask
- **Demo Presentations:** Instant wallet creation for showcasing
- **Testing Multi-Member Groups:** Create multiple wallets quickly
- **CI/CD Testing:** Automated testing without real wallets
- **Onboarding New Users:** Try before installing wallet

### Current State

**Dependencies:**
```json
"burner-connector": "0.0.16"
```

**Problem:**
TypeScript type incompatibility between:
- `burner-connector` types
- RainbowKit wallet connector types
- Wagmi connector types

**Error (likely):**
```
Type 'BurnerConnector' is not assignable to type 'Wallet'
```

### Root Cause Analysis

1. **Version Mismatch:**
   - `burner-connector: 0.0.16` (older)
   - `@rainbow-me/rainbowkit: 2.2.7` (latest)
   - `wagmi: 2.15.6` (latest)

2. **Breaking Changes:**
   - RainbowKit 2.x changed wallet connector interface
   - Wagmi 2.x changed connector types
   - burner-connector hasn't been updated

3. **Type System:**
   - Strict TypeScript checking
   - Missing type definitions
   - Incompatible connector interface

### Proposed Solutions

#### Option 1: Create Custom Burner Wallet Connector (Recommended)

Create a custom burner wallet that's compatible with current RainbowKit/Wagmi:

```typescript
// connectors/burnerWallet.ts
import { Wallet } from '@rainbow-me/rainbowkit';
import { createConnector } from 'wagmi';

export const burnerWallet = (): Wallet => ({
  id: 'burner',
  name: 'Burner Wallet',
  iconUrl: '/burner-icon.svg',
  iconBackground: '#ff4500',
  createConnector: () => {
    return createConnector((config) => ({
      // Implement connector interface
      id: 'burner',
      name: 'Burner Wallet',
      type: 'injected',
      async connect() {
        // Generate ephemeral private key
        const privateKey = generatePrivateKey();
        // Store in localStorage
        localStorage.setItem('burner-pk', privateKey);
        // Return account
        return { accounts: [privateKeyToAccount(privateKey).address] };
      },
      async disconnect() {
        localStorage.removeItem('burner-pk');
      },
      async getAccounts() {
        const pk = localStorage.getItem('burner-pk');
        if (!pk) return [];
        return [privateKeyToAccount(pk).address];
      },
      async isAuthorized() {
        return !!localStorage.getItem('burner-pk');
      },
      // ... other methods
    }));
  },
});
```

#### Option 2: Use Type Assertions (Quick Fix)

Add type assertions to bypass TypeScript errors:

```typescript
import { rainbowkitBurnerWallet } from "burner-connector";

const wallets = [
  metaMaskWallet,
  // ... other wallets
  rainbowkitBurnerWallet as any, // Type assertion
];
```

**Pros:** Quick fix
**Cons:** Loses type safety, may break at runtime

#### Option 3: Fork and Update burner-connector

Fork the `burner-connector` package and update it:
1. Clone repository
2. Update dependencies to Wagmi 2.x
3. Fix type definitions
4. Publish as scoped package `@susuchain/burner-connector`

**Pros:** Proper fix, can share with community
**Cons:** Maintenance burden

### Recommended Implementation (Option 1)

#### Step 1: Create Custom Burner Wallet

```typescript
// packages/nextjs/services/web3/burnerWallet.ts
import { Wallet } from '@rainbow-me/rainbowkit';
import { createConnector } from 'wagmi';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

const BURNER_STORAGE_KEY = 'susuchain.burner.pk';

export const burnerWallet = (): Wallet => ({
  id: 'burner',
  name: 'Burner Wallet',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQi...',
  iconBackground: '#ff6b35',

  createConnector: () => {
    return createConnector((config) => {
      let account: ReturnType<typeof privateKeyToAccount> | null = null;

      return {
        id: 'burner',
        name: 'Burner Wallet',
        type: 'injected' as const,

        async setup() {
          // Load existing burner or create new
          const existingPk = localStorage.getItem(BURNER_STORAGE_KEY);
          if (existingPk) {
            account = privateKeyToAccount(existingPk as `0x${string}`);
          }
        },

        async connect() {
          if (!account) {
            // Generate new burner wallet
            const privateKey = generatePrivateKey();
            account = privateKeyToAccount(privateKey);
            localStorage.setItem(BURNER_STORAGE_KEY, privateKey);
          }

          return {
            accounts: [account.address],
            chainId: config.chains[0].id,
          };
        },

        async disconnect() {
          localStorage.removeItem(BURNER_STORAGE_KEY);
          account = null;
        },

        async getAccounts() {
          if (!account) {
            const pk = localStorage.getItem(BURNER_STORAGE_KEY);
            if (pk) {
              account = privateKeyToAccount(pk as `0x${string}`);
            }
          }
          return account ? [account.address] : [];
        },

        async isAuthorized() {
          return !!localStorage.getItem(BURNER_STORAGE_KEY);
        },

        async getChainId() {
          return config.chains[0].id;
        },

        async switchChain({ chainId }) {
          // Burner wallet can switch to any chain
          return config.chains.find(x => x.id === chainId) ?? config.chains[0];
        },

        async getProvider() {
          return null; // Burner doesn't have external provider
        },

        onAccountsChanged() {},
        onChainChanged() {},
        onDisconnect() {},
      };
    });
  },
});
```

#### Step 2: Add Burner Wallet to Connectors

```typescript
// packages/nextjs/services/web3/wagmiConnectors.tsx
import { burnerWallet } from "./burnerWallet";
import scaffoldConfig from "~~/scaffold.config";

const { onlyLocalBurnerWallet, targetNetworks } = scaffoldConfig;

const wallets = [
  metaMaskWallet,
  walletConnectWallet,
  ledgerWallet,
  coinbaseWallet,
  rainbowWallet,
  safeWallet,
  // Add burner wallet for development
  ...(process.env.NODE_ENV === 'development' || !onlyLocalBurnerWallet
    ? [burnerWallet()]
    : []),
];
```

#### Step 3: Add Burner Wallet UI

Create UI to show/export burner private key:

```typescript
// components/BurnerWalletInfo.tsx
export function BurnerWalletInfo() {
  const { connector } = useAccount();
  const [privateKey, setPrivateKey] = useState<string>('');

  useEffect(() => {
    if (connector?.id === 'burner') {
      const pk = localStorage.getItem('susuchain.burner.pk');
      setPrivateKey(pk || '');
    }
  }, [connector]);

  if (connector?.id !== 'burner') return null;

  return (
    <div className="alert alert-warning">
      <span>⚠️ Burner Wallet (Development Only)</span>
      <button onClick={() => navigator.clipboard.writeText(privateKey)}>
        Copy Private Key
      </button>
      <button onClick={() => {
        if (confirm('This will delete your burner wallet. Continue?')) {
          localStorage.removeItem('susuchain.burner.pk');
          window.location.reload();
        }
      }}>
        Delete Burner
      </button>
    </div>
  );
}
```

### Files to Create

```
packages/nextjs/services/web3/burnerWallet.ts (NEW)
packages/nextjs/components/BurnerWalletInfo.tsx (NEW)
```

### Files to Modify

```
packages/nextjs/services/web3/wagmiConnectors.tsx
packages/nextjs/components/Header.tsx (add BurnerWalletInfo)
```

### Testing Checklist

- [ ] Burner wallet appears in wallet list (dev mode only)
- [ ] Can connect with burner wallet
- [ ] Private key stored in localStorage
- [ ] Can send transactions
- [ ] Can disconnect and reconnect (same wallet)
- [ ] Can create multiple burners (new browser tabs)
- [ ] Private key export works
- [ ] Delete burner works
- [ ] Doesn't appear in production builds

### Security Warnings

Add prominent warnings:

```typescript
// Only enable in development or with explicit config
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_ENABLE_BURNER) {
  // Don't include burner wallet
}
```

Warning UI:
```tsx
<div className="alert alert-error">
  ⚠️ DANGER: Burner wallets are for testing only!
  Do NOT send real funds to this address.
  Private key is stored in browser localStorage.
</div>
```

### Success Criteria

- [ ] Burner wallet works without type errors
- [ ] Can create burner wallet instantly
- [ ] Can sign transactions
- [ ] Private key management works
- [ ] Only available in development
- [ ] Clear security warnings displayed
- [ ] Documentation updated

### Alternative: Wait for Package Update

Monitor these for updates:
- [burner-connector](https://github.com/scaffold-eth/burner-connector)
- [RainbowKit Issues](https://github.com/rainbow-me/rainbowkit/issues)

### References

- [Wagmi Custom Connectors](https://wagmi.sh/core/api/connectors/custom)
- [RainbowKit Custom Wallets](https://www.rainbowkit.com/docs/custom-wallets)
- [Viem Account Utils](https://viem.sh/docs/accounts/local)

---

## Issue #6: Implement Reown AppKit Analytics & Event Tracking

**Priority:** MEDIUM
**Complexity:** Low
**Estimated Time:** 2-4 hours
**Impact:** Product Insights & Monitoring

### Description

Integrate Reown AppKit's built-in analytics to track wallet connection metrics and user behavior. This provides valuable insights for:

- **Product Analytics:** Understand user wallet preferences
- **Debugging:** Identify connection issues and error patterns
- **Performance Monitoring:** Track connection times and success rates
- **User Experience:** Optimize based on real usage data
- **Growth Metrics:** Track wallet adoption and retention

### Current State

**No analytics tracking.** Cannot answer questions like:
- Which wallets do users prefer?
- What's the connection success rate?
- How long does wallet connection take?
- Where do users drop off?
- What errors occur most frequently?

### Proposed Solution

Enable Reown AppKit analytics and integrate with WalletConnect Cloud dashboard.

#### Built-in Metrics (Automatic)

Once enabled, AppKit automatically tracks:
- Connection attempts
- Successful connections
- Failed connections
- Connection duration
- Wallet types used
- Chain switching events
- Error types and frequencies
- Session durations

#### Custom Events (Manual)

Track Susu-specific actions:
- Group creation
- Member joins group
- Contribution submitted
- Payout claimed
- ENS/EFP profile linked

### Implementation Steps

#### 1. Enable AppKit Analytics

```typescript
// services/web3/wagmiConfig.tsx
import { createAppKit } from '@reown/appkit/react'

const appKit = createAppKit({
  // ... other config

  // Enable analytics
  enableAnalytics: true,

  // Optional: Custom analytics config
  analyticsConfig: {
    // Track custom events
    enableCustomEvents: true,

    // Anonymize user data (GDPR compliance)
    anonymizeData: true,
  }
})
```

#### 2. Create Analytics Hook

```typescript
// hooks/scaffold-eth/useAppKitAnalytics.ts
import { useAppKitEvents } from '@reown/appkit/react';

export function useAppKitAnalytics() {
  const { trackEvent } = useAppKitEvents();

  return {
    trackGroupCreation: (groupAddress: string, chainId: number) => {
      trackEvent({
        name: 'group_created',
        properties: {
          groupAddress,
          chainId,
          timestamp: Date.now(),
        }
      });
    },

    trackContribution: (groupAddress: string, amount: string) => {
      trackEvent({
        name: 'contribution_submitted',
        properties: {
          groupAddress,
          amount,
          timestamp: Date.now(),
        }
      });
    },

    trackPayout: (groupAddress: string, recipient: string) => {
      trackEvent({
        name: 'payout_claimed',
        properties: {
          groupAddress,
          recipient,
          timestamp: Date.now(),
        }
      });
    },

    trackENSLinked: (address: string, ensName: string) => {
      trackEvent({
        name: 'ens_linked',
        properties: {
          address,
          ensName,
          timestamp: Date.now(),
        }
      });
    },
  };
}
```

#### 3. Track Key Events

Add tracking to critical user actions:

```typescript
// app/create-group/page.tsx
import { useAppKitAnalytics } from '~/hooks/scaffold-eth/useAppKitAnalytics';

export default function CreateGroupPage() {
  const { trackGroupCreation } = useAppKitAnalytics();

  const handleCreateGroup = async () => {
    // Create group logic...
    const groupAddress = await createGroup();

    // Track event
    trackGroupCreation(groupAddress, chainId);
  };
}
```

```typescript
// components/SusuGroup/ContributionForm.tsx
import { useAppKitAnalytics } from '~/hooks/scaffold-eth/useAppKitAnalytics';

export function ContributionForm({ groupAddress }: Props) {
  const { trackContribution } = useAppKitAnalytics();

  const handleContribute = async (amount: string) => {
    // Submit contribution...
    await contribute(amount);

    // Track event
    trackContribution(groupAddress, amount);
  };
}
```

#### 4. Set Up Dashboard

1. Go to [WalletConnect Cloud](https://cloud.reown.com)
2. Navigate to your project
3. Click "Analytics" tab
4. View metrics:
   - Real-time connections
   - Success/failure rates
   - Popular wallets
   - Custom events
   - Error logs

#### 5. Create Analytics Dashboard Component

Optional: Display analytics in admin panel:

```typescript
// app/admin/analytics/page.tsx
export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Fetch from WalletConnect API (if available)
    // Or display embedded dashboard
  }, []);

  return (
    <div>
      <h1>SusuChain Analytics</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Connections" value={metrics?.totalConnections} />
        <StatCard title="Success Rate" value={`${metrics?.successRate}%`} />
        <StatCard title="Avg Connection Time" value={`${metrics?.avgTime}ms`} />
      </div>

      {/* Embedded WalletConnect dashboard */}
      <iframe src="https://cloud.reown.com/embed/analytics/your-project-id" />
    </div>
  );
}
```

### Metrics to Track

#### Wallet Connection Metrics
- Total connection attempts
- Successful connections
- Failed connections (by error type)
- Connection duration (avg/median/p95)
- Wallet type distribution
- Mobile vs Desktop
- Chain switching frequency

#### Susu-Specific Metrics
- Groups created per day/week
- Average group size
- Total contribution volume
- Payout claim rate
- ENS/EFP adoption rate
- Member retention rate
- Average session duration

#### Error Tracking
- Connection errors (by wallet type)
- Transaction failures
- Network errors
- Contract errors
- User rejections

### Implementation Checklist

- [ ] Enable analytics in AppKit config
- [ ] Create analytics hook
- [ ] Add tracking to group creation
- [ ] Add tracking to contributions
- [ ] Add tracking to payouts
- [ ] Add tracking to ENS/EFP linking
- [ ] Set up WalletConnect Cloud dashboard
- [ ] Configure alerts for high error rates
- [ ] Create weekly analytics report
- [ ] Document tracked events

### Files to Create

```
packages/nextjs/hooks/scaffold-eth/useAppKitAnalytics.ts (NEW)
packages/nextjs/app/admin/analytics/page.tsx (NEW - optional)
packages/nextjs/lib/analytics.ts (NEW - helper functions)
```

### Files to Modify

```
packages/nextjs/services/web3/wagmiConfig.tsx
packages/nextjs/app/create-group/page.tsx
packages/nextjs/components/SusuGroup/ContributionForm.tsx
packages/nextjs/app/group/[address]/page.tsx
```

### Privacy Considerations

**GDPR Compliance:**
- Anonymize wallet addresses
- Don't track PII (personally identifiable information)
- Allow users to opt-out
- Clear data retention policy

**Implementation:**
```typescript
const analyticsConfig = {
  anonymizeData: true, // Hash addresses
  respectDoNotTrack: true, // Honor browser DNT
  consentRequired: true, // Ask for consent
}
```

**Add Privacy Notice:**
```tsx
<div className="text-sm text-gray-500">
  We collect anonymous usage analytics to improve the app.
  <a href="/privacy">Learn more</a> |
  <button onClick={optOut}>Opt out</button>
</div>
```

### Success Criteria

- [ ] Analytics enabled in production
- [ ] Custom events tracking correctly
- [ ] WalletConnect Cloud dashboard showing data
- [ ] No PII being tracked
- [ ] GDPR compliance implemented
- [ ] Error tracking working
- [ ] Performance metrics visible
- [ ] Weekly reports automated

### Dashboard KPIs

Monitor these key metrics:

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Connection Success Rate | >95% | <90% |
| Avg Connection Time | <3s | >5s |
| Error Rate | <5% | >10% |
| Mobile Connection Rate | >40% | <20% |
| Weekly Active Groups | Growing | Declining |

### Future Enhancements

- Custom analytics dashboard
- A/B testing framework
- User cohort analysis
- Funnel analysis
- Retention metrics
- Revenue tracking (if applicable)

### References

- [Reown Analytics Docs](https://docs.reown.com/cloud/analytics)
- [AppKit Events](https://docs.reown.com/appkit/react/wagmi/events)
- [WalletConnect Cloud](https://cloud.reown.com)

---

## Issue #7: Implement Reown AppKit Custom Modal Theming & Branding

**Priority:** LOW
**Complexity:** Low
**Estimated Time:** 2-4 hours
**Impact:** User Experience & Branding

### Description

Customize Reown AppKit's modal appearance to match SusuChain's branding and provide a cohesive user experience. The default AppKit modal is generic - customizing it creates a professional, branded experience that reinforces trust.

### Current State

Using default RainbowKit styling:
- Generic color scheme
- Standard fonts
- Default wallet icons
- English-only text
- No custom branding

### Proposed Solution

Implement comprehensive AppKit theming:
- Match SusuChain colors (from DaisyUI theme)
- Custom fonts matching the app
- Dark/light mode synchronization
- Custom success/error messages
- Optional localization for West African languages

### Design Goals

1. **Consistent Branding:**
   - Match app color palette
   - Use same fonts throughout
   - Consistent border radius
   - Match button styles

2. **Accessibility:**
   - WCAG 2.1 AA compliance
   - High contrast ratios
   - Focus indicators
   - Screen reader support

3. **Cultural Relevance:**
   - Optional language support (English, Pidgin, Twi, etc.)
   - Culturally appropriate messaging
   - Local payment references

### Implementation

#### 1. Create Theme Configuration

```typescript
// services/web3/appKitTheme.ts
import { type AppKitThemeConfig } from '@reown/appkit/react';

export const susuChainTheme: AppKitThemeConfig = {
  // Brand colors
  colors: {
    accent: '#2563eb', // Primary blue
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    foreground: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#94a3b8',
    },
    border: '#e2e8f0',
    error: '#ef4444',
    success: '#10b981',
  },

  // Typography
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      small: '14px',
      medium: '16px',
      large: '18px',
    },
  },

  // Border radius
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
  },

  // Shadows
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
};

export const susuChainDarkTheme: AppKitThemeConfig = {
  ...susuChainTheme,
  colors: {
    ...susuChainTheme.colors,
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
    },
    foreground: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
    },
    border: '#334155',
  },
};
```

#### 2. Apply Theme to AppKit

```typescript
// services/web3/wagmiConfig.tsx
import { createAppKit } from '@reown/appkit/react';
import { susuChainTheme, susuChainDarkTheme } from './appKitTheme';
import { useTheme } from 'next-themes';

export function WagmiProvider({ children }) {
  const { theme } = useTheme();

  const appKit = createAppKit({
    // ... other config

    // Apply theme
    theme: theme === 'dark' ? susuChainDarkTheme : susuChainTheme,

    // Custom branding
    metadata: {
      name: 'SusuChain',
      description: 'Traditional savings, blockchain-powered',
      url: 'https://susuchain.app',
      icons: ['https://susuchain.app/logo.png'],
    },
  });

  return children;
}
```

#### 3. Sync with App Theme

```typescript
// components/ThemeProvider.tsx
import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAppKit } from '@reown/appkit/react';

export function ThemeSync() {
  const { theme } = useTheme();
  const { setTheme } = useAppKit();

  useEffect(() => {
    // Sync AppKit theme with app theme
    setTheme(theme === 'dark' ? susuChainDarkTheme : susuChainTheme);
  }, [theme]);

  return null;
}
```

#### 4. Custom Text/Localization

```typescript
// services/web3/appKitTranslations.ts
export const translations = {
  en: {
    'connect.title': 'Connect Your Wallet',
    'connect.subtitle': 'Join your Susu group securely',
    'connect.terms': 'By connecting, you agree to our Terms',
    'disconnect': 'Disconnect',
    'wrong_network': 'Switch to Base Network',
  },
  pidgin: { // Nigerian Pidgin
    'connect.title': 'Connect Your Wallet',
    'connect.subtitle': 'Join your Susu group for real',
    'connect.terms': 'If you connect, you agree to our Terms',
    'disconnect': 'Disconnect',
    'wrong_network': 'Change to Base Network',
  },
};
```

#### 5. Custom Modal Components

```typescript
// components/CustomConnectModal.tsx
import { useAppKit } from '@reown/appkit/react';

export function CustomConnectModal() {
  const { open, close } = useAppKit();

  return (
    <div className="custom-modal">
      {/* Custom header */}
      <div className="modal-header">
        <img src="/logo.svg" alt="SusuChain" />
        <h2>Connect to SusuChain</h2>
        <p>Choose how you want to join your Susu group</p>
      </div>

      {/* AppKit wallet list */}
      <appkit-wallet-list />

      {/* Custom footer */}
      <div className="modal-footer">
        <span className="text-sm">New to crypto?</span>
        <a href="/learn" className="link">Learn about wallets →</a>
      </div>
    </div>
  );
}
```

### Design Specifications

#### Color Palette

**Light Mode:**
```css
--primary: #2563eb;      /* Base blue */
--secondary: #10b981;    /* Success green */
--accent: #f59e0b;       /* Warning amber */
--error: #ef4444;        /* Error red */
--background: #ffffff;   /* White */
--surface: #f8fafc;      /* Light gray */
--text: #0f172a;         /* Dark slate */
```

**Dark Mode:**
```css
--primary: #3b82f6;      /* Lighter blue */
--secondary: #34d399;    /* Lighter green */
--accent: #fbbf24;       /* Lighter amber */
--error: #f87171;        /* Lighter red */
--background: #0f172a;   /* Dark slate */
--surface: #1e293b;      /* Darker slate */
--text: #f8fafc;         /* Light gray */
```

#### Typography

```css
--font-heading: 'Inter', -apple-system, sans-serif;
--font-body: 'Inter', -apple-system, sans-serif;
--font-mono: 'Fira Code', monospace;

--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-lg: 1.125rem;  /* 18px */
--text-xl: 1.25rem;   /* 20px */
```

#### Spacing & Layout

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;

--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

### Responsive Design

Ensure modal works well on all devices:

```typescript
const responsiveTheme = {
  ...susuChainTheme,

  // Mobile adjustments
  mobile: {
    maxWidth: '100vw',
    borderRadius: '16px 16px 0 0', // Bottom sheet on mobile
    padding: '24px 16px',
  },

  // Desktop
  desktop: {
    maxWidth: '480px',
    borderRadius: '16px',
    padding: '32px',
  },
};
```

### Implementation Checklist

- [ ] Create theme configuration file
- [ ] Match colors with DaisyUI theme
- [ ] Implement dark mode support
- [ ] Add custom fonts
- [ ] Sync theme with app
- [ ] Test on mobile devices
- [ ] Test on different screen sizes
- [ ] Verify accessibility (WCAG 2.1 AA)
- [ ] Add custom branding assets
- [ ] Optional: Add localization

### Files to Create

```
packages/nextjs/services/web3/appKitTheme.ts (NEW)
packages/nextjs/services/web3/appKitTranslations.ts (NEW)
packages/nextjs/components/CustomConnectModal.tsx (NEW - optional)
packages/nextjs/styles/appkit-overrides.css (NEW)
```

### Files to Modify

```
packages/nextjs/services/web3/wagmiConfig.tsx
packages/nextjs/components/ThemeProvider.tsx
packages/nextjs/app/globals.css
```

### Testing Matrix

| Device | Theme | Browser | Status |
|--------|-------|---------|--------|
| Desktop | Light | Chrome | ☐ |
| Desktop | Dark | Chrome | ☐ |
| Desktop | Light | Safari | ☐ |
| Desktop | Dark | Safari | ☐ |
| Mobile | Light | Mobile Safari | ☐ |
| Mobile | Dark | Mobile Safari | ☐ |
| Mobile | Light | Chrome Android | ☐ |
| Mobile | Dark | Chrome Android | ☐ |

### Accessibility Checklist

- [ ] Color contrast ratios meet WCAG AA (4.5:1 minimum)
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] Screen reader labels present
- [ ] No motion for users with `prefers-reduced-motion`
- [ ] Large enough touch targets (44x44px minimum)
- [ ] Text remains readable at 200% zoom

### Custom Branding Assets

Create and add:
```
public/
  ├── logo.svg (Full logo)
  ├── logo-icon.svg (Icon only)
  ├── wallet-bg.png (Background image)
  └── og-image.png (Social sharing)
```

### Success Criteria

- [ ] Modal matches app theme perfectly
- [ ] Dark mode works seamlessly
- [ ] Custom branding visible
- [ ] Responsive on all devices
- [ ] Accessible (WCAG 2.1 AA)
- [ ] No visual glitches
- [ ] Theme switching smooth
- [ ] All wallets display correctly

### Before/After Comparison

**Before (Default):**
- Generic blue color scheme
- Standard fonts
- No branding
- Light mode only

**After (Custom):**
- SusuChain blue (#2563eb)
- Inter font family
- SusuChain logo and branding
- Dark/light mode support
- Cultural customization

### Future Enhancements

- Animated wallet connections
- Custom wallet icons
- Sound effects (optional)
- Success confetti animation
- Multi-language support
- Wallet recommendations based on location
- Educational tooltips for new users

### References

- [Reown AppKit Theming](https://docs.reown.com/appkit/react/wagmi/theming)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [DaisyUI Themes](https://daisyui.com/docs/themes/)

---

## Summary

| # | Issue | Priority | Time | Type |
|---|-------|----------|------|------|
| 1 | Migrate to Reown AppKit | HIGH | 2-3 days | Architecture |
| 2 | SIWE Authentication | HIGH | 1-2 days | Security |
| 3 | Production WalletConnect ID | HIGH | 30 mins | Config |
| 4 | Multi-Chain Support | MEDIUM | 1-2 days | Feature |
| 5 | Fix Burner Wallet | MEDIUM | 4-6 hours | Bug Fix |
| 6 | Analytics & Tracking | MEDIUM | 2-4 hours | Monitoring |
| 7 | Custom Theming | LOW | 2-4 hours | UX |

**Total Estimated Time:** 5-8 days

**Recommended Priority Order:**
1. Issue #3 (30 mins - quick win)
2. Issue #1 (2-3 days - foundation)
3. Issue #2 (1-2 days - security)
4. Issue #5 (4-6 hours - dev experience)
5. Issue #4 (1-2 days - expansion)
6. Issue #6 (2-4 hours - insights)
7. Issue #7 (2-4 hours - polish)
