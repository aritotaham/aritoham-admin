import { bsc, bscTestnet } from "viem/chains";
import type { Address, Chain } from "viem";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 97);

const CHAINS: Record<number, Chain> = { 56: bsc, 97: bscTestnet };

export const chain: Chain = CHAINS[chainId] ?? bscTestnet;

const PUBLIC_RPCS: Record<number, string[]> = {
  97: [
    "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
    "https://data-seed-prebsc-2-s1.bnbchain.org:8545",
    "https://bsc-testnet-rpc.publicnode.com",
    "https://bsc-testnet.drpc.org",
  ],
  56: ["https://bsc-dataseed.bnbchain.org", "https://bsc-rpc.publicnode.com", "https://bsc.drpc.org"],
};

const custom = process.env.NEXT_PUBLIC_RPC_URL;

export const DEFAULT_ADDRESSES = {
  protocol: (process.env.NEXT_PUBLIC_PROTOCOL_ADDRESS || "0x19917311089743650a2CC724E44CDc60718F8fCb") as Address,
  dataStore: (process.env.NEXT_PUBLIC_DATASTORE_ADDRESS || "0xfeF49Ca6Ce14A858770832b807aca4E0EE7e1032") as Address,
  reader: (process.env.NEXT_PUBLIC_READER_ADDRESS || "0xf0C3238ad9d4913d143485497BeCeC9Ebb64da3A") as Address,
  readerTeamDao: (process.env.NEXT_PUBLIC_READER_TEAMDAO_ADDRESS || "0x8360E207cd5bC0CdBD0Fb979cC121df45436a51A") as Address,
  usdt: (process.env.NEXT_PUBLIC_USDT || "0x458db055c7304CB2520ef8d6760E184517d67658") as Address,
  aritoham: (process.env.NEXT_PUBLIC_ARITOHAM || "0xDfC104BA8e66E3349A93d231edBAf9b62bfD6178") as Address,
};

export type ContractAddresses = typeof DEFAULT_ADDRESSES;

const CUSTOM_ADDR_KEY = "aritoham_admin:addresses";

export function getActiveAddresses(): ContractAddresses {
  if (typeof window === "undefined") return DEFAULT_ADDRESSES;
  try {
    const raw = localStorage.getItem(CUSTOM_ADDR_KEY);
    if (!raw) return DEFAULT_ADDRESSES;
    const parsed = JSON.parse(raw);
    return {
      protocol: (parsed.protocol || DEFAULT_ADDRESSES.protocol) as Address,
      dataStore: (parsed.dataStore || DEFAULT_ADDRESSES.dataStore) as Address,
      reader: (parsed.reader || DEFAULT_ADDRESSES.reader) as Address,
      readerTeamDao: (parsed.readerTeamDao || DEFAULT_ADDRESSES.readerTeamDao) as Address,
      usdt: (parsed.usdt || DEFAULT_ADDRESSES.usdt) as Address,
      aritoham: (parsed.aritoham || DEFAULT_ADDRESSES.aritoham) as Address,
    };
  } catch {
    return DEFAULT_ADDRESSES;
  }
}

export function saveCustomAddresses(addrs: Partial<ContractAddresses>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_ADDR_KEY, JSON.stringify({ ...getActiveAddresses(), ...addrs }));
  } catch {}
}

export function resetCustomAddresses() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CUSTOM_ADDR_KEY);
  } catch {}
}

export const config = {
  chain,
  rpcUrls: [...(custom ? [custom] : []), ...(PUBLIC_RPCS[chain.id] ?? chain.rpcUrls.default.http)],
  explorer: chain.blockExplorers?.default.url ?? "https://testnet.bscscan.com",
  get addresses(): ContractAddresses {
    return getActiveAddresses();
  },
  deployBlock: BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK || 139203328),
  logChunk: BigInt(process.env.NEXT_PUBLIC_LOG_CHUNK || 5000),
  userPrefix: process.env.NEXT_PUBLIC_USER_PREFIX || "ARI",
  decimals: 18,
};
