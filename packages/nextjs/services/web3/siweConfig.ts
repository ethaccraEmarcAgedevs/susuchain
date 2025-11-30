import { createSIWEConfig } from "@reown/appkit-siwe";

export const siweConfig = createSIWEConfig({
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
  signOut: async () => fetch("/api/siwe/signout", { method: "POST" }),
});
