import { createSIWEConfig, formatMessage } from "@reown/appkit-siwe";

export const siweConfig = createSIWEConfig({
  createMessage: ({ nonce }) => formatMessage({
    domain: typeof window !== "undefined" ? window.location.host : "",
    uri: typeof window !== "undefined" ? window.location.origin : "",
    nonce,
    statement: "Sign in with Ethereum to SusuChain",
  }, typeof window !== "undefined" ? window.location.origin : ""),
  getNonce: async () => fetch("/api/siwe/nonce").then(r => r.text()),
  verifyMessage: async ({ message, signature }) => {
    const res = await fetch("/api/siwe/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, signature }),
    });
    return res.ok;
  },
  getSession: async () => fetch("/api/siwe/session").then(r => (r.ok ? r.json() : { authenticated: false })),
  signOut: async () => fetch("/api/siwe/signout", { method: "POST" }).then(r => r.ok),
});
