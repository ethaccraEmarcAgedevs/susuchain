# Vercel Deployment Guide for SusuChain

This guide will help you deploy SusuChain to Vercel with fully functional Reown AppKit wallet connectivity on Base network.

## Prerequisites

- Vercel account (free tier works)
- WalletConnect Cloud account (free)
- GitHub repository connected to Vercel

## Quick Deploy

### Option 1: Deploy Button (Fastest)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ethaccraEmarcAgedevs/susuchain)

### Option 2: Manual Deployment

1. **Fork or Clone Repository**
   ```bash
   git clone https://github.com/ethaccraEmarcAgedevs/susuchain
   cd susuchain
   ```

2. **Install Vercel CLI** (optional, but recommended)
   ```bash
   npm install -g vercel
   ```

3. **Deploy to Vercel**
   ```bash
   vercel
   ```

## Required Configuration

### 1. Create WalletConnect Cloud Project

**IMPORTANT:** You must create your own WalletConnect Cloud Project ID for production!

1. Visit [cloud.reown.com](https://cloud.reown.com)
2. Sign up/Login with GitHub or email
3. Click **"Create New Project"**
4. Fill in project details:
   - **Name:** SusuChain
   - **Description:** Traditional savings groups on Base blockchain
   - **Category:** DeFi
5. Configure allowed origins:
   - `https://your-app.vercel.app`
   - `https://*.vercel.app` (for preview deployments)
   - `http://localhost:3000` (for local development)
6. Copy your **Project ID**

### 2. Configure Vercel Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** > **Environment Variables**
2. Add the following variables:

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | Your Project ID from WalletConnect Cloud | ✅ Yes |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | Your Alchemy API key (optional) | ⚠️ Recommended |

**Important:** Make sure to apply these to all environments:
- ✅ Production
- ✅ Preview
- ✅ Development

### 3. Redeploy

After setting environment variables, trigger a new deployment:
- Push a commit to your repository, OR
- Click **"Redeploy"** in Vercel dashboard

## Verification Checklist

After deployment, verify these features work:

- [ ] Application loads without errors
- [ ] "Connect Wallet" button visible in header
- [ ] Clicking "Connect Wallet" opens Reown AppKit modal
- [ ] Can see popular wallets (MetaMask, Coinbase, etc.)
- [ ] Can connect with MetaMask or other wallet
- [ ] Base Sepolia network is selected by default
- [ ] Network badge shows "Base Sepolia" in header
- [ ] After connecting, wallet address appears in header
- [ ] Can access "Create a Group" and "Join a Group" pages

## Troubleshooting

### Wallet Connect Not Working

**Problem:** Modal doesn't open or shows errors

**Solutions:**
1. Verify `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` is set correctly
2. Check that your Vercel URL is added to allowed origins in WalletConnect Cloud
3. Open browser console to check for specific error messages
4. Ensure you're not using the default development Project ID

### Network Issues

**Problem:** Wrong network or can't switch to Base Sepolia

**Solutions:**
1. Click the network badge in header
2. Select "Base Sepolia" from network dropdown
3. Approve network switch in your wallet

### Build Errors

**Problem:** Deployment fails during build

**Solutions:**
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify `yarn.lock` is committed to repository

## Performance Optimization

### Recommended Vercel Settings

1. **Framework Preset:** Next.js
2. **Build Command:** `yarn build`
3. **Output Directory:** `.next`
4. **Install Command:** `yarn install`

### Edge Functions (Optional)

For better performance, consider enabling Edge Runtime for API routes.

## Base Network Configuration

SusuChain is configured for **Base Sepolia** (testnet) by default.

### Switching to Base Mainnet

To deploy on Base mainnet:

1. Update `packages/nextjs/scaffold.config.ts`:
   ```typescript
   targetNetworks: [chains.base], // Change from baseSepolia to base
   ```

2. Update smart contract deployment addresses
3. Redeploy to Vercel

## Security Notes

- ✅ All wallet interactions happen client-side
- ✅ Private keys never leave user's wallet
- ✅ No sensitive data stored on server
- ✅ Burner wallet only available in development mode

## Support

Having issues? Check these resources:

- **Reown AppKit Docs:** [docs.reown.com/appkit](https://docs.reown.com/appkit)
- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Base Docs:** [docs.base.org](https://docs.base.org)
- **GitHub Issues:** [github.com/ethaccraEmarcAgedevs/susuchain/issues](https://github.com/ethaccraEmarcAgedevs/susuchain/issues)

## Next Steps

After successful deployment:

1. ✅ Test wallet connectivity thoroughly
2. ✅ Share your deployment URL with team
3. ✅ Set up analytics in WalletConnect Cloud dashboard
4. ✅ Monitor error rates and connection success
5. ✅ Consider adding custom domain

---

**Built with:** Next.js 15 • Reown AppKit • Base Network • Scaffold-ETH 2
