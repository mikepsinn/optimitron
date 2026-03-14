import { http, createConfig } from "wagmi";
import { sepolia, hardhat } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export const wagmiConfig = createConfig({
  chains: [sepolia, hardhat],
  connectors: [
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [sepolia.id]: http(),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
});
