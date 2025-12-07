import { OnchainProviders } from "~~/components/OnchainProviders";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "SusuChain - Decentralized Savings on Base",
  description: "Join rotating savings groups on Base blockchain with Coinbase Smart Wallet",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider enableSystem>
          <OnchainProviders>
            <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
          </OnchainProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
