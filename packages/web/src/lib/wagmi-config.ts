import { http, createConfig, cookieStorage, createStorage } from "wagmi";
import type { CreateConnectorFn } from "wagmi";
import { sepolia, baseSepolia, hardhat } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { clientEnv } from "@/lib/env";

const projectId = clientEnv.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

// WalletConnect Core accesses indexedDB at init time, which doesn't exist in
// Node.  Avoid importing the module on the server by using a lazy require
// guarded behind a `typeof window` check.
function buildConnectors(): CreateConnectorFn[] {
  const list: CreateConnectorFn[] = [injected()];

  if (typeof window !== "undefined" && projectId) {

    const { walletConnect } = require("wagmi/connectors") as typeof import("wagmi/connectors");
    list.push(walletConnect({ projectId }));
  }

  return list;
}

export const wagmiConfig = createConfig({
  chains: [sepolia, baseSepolia, hardhat],
  connectors: buildConnectors(),
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
});
