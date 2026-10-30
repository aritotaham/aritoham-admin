import { createPublicClient, createWalletClient, custom, fallback, http, type PublicClient } from "viem";
import { config } from "../config/env";

let _client: PublicClient | null = null;
let _activeProvider: any = null;

export function setActiveWalletProvider(provider: any) {
  _activeProvider = provider;
}

export function getActiveWalletProvider(): any {
  if (_activeProvider) return _activeProvider;
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return (window as any).ethereum;
  }
  return null;
}

export function getClient(): PublicClient {
  if (!_client) {
    _client = createPublicClient({
      chain: config.chain,
      transport: fallback(
        config.rpcUrls.map((u) => http(u, { batch: true, retryCount: 1, timeout: 20_000 })),
        { rank: false }
      ),
      batch: { multicall: true },
    }) as PublicClient;
  }
  return _client;
}

export function getWalletClient() {
  const provider = getActiveWalletProvider();
  if (!provider) {
    throw new Error("Please connect MetaMask or a Web3 wallet first.");
  }

  return createWalletClient({
    chain: config.chain,
    transport: custom(provider),
  });
}
