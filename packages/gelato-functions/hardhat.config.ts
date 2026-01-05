import { HardhatUserConfig } from "hardhat/config";
import "@gelatonetwork/web3-functions-sdk/hardhat-plugin";

const config: HardhatUserConfig = {
  web3Functions: {
    rootDir: "./",
  },
  solidity: "0.8.20",
  networks: {
    base: {
      url: "https://mainnet.base.org",
      chainId: 8453,
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      chainId: 84532,
    },
  },
};

export default config;
