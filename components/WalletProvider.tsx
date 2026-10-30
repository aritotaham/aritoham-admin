"use client";

import { DEMO_ADDRESS as DEMO_ADDR } from "@/lib/brand";
import { config as apiConfig, setActiveWalletProvider } from "@/lib/contract";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type WalletId = "metamask" | "okx" | "rabby" | "trust" | "safepal" | "tokenpocket" | "coinbase";

export const WALLETS: { id: WalletId; name: string; install: string; rdns: string[] }[] = [
  { id: "metamask", name: "MetaMask", install: "https://metamask.io/download/", rdns: ["io.metamask", "io.metamask.flask"] },
  { id: "rabby", name: "Rabby Wallet", install: "https://rabby.io/", rdns: ["io.rabby"] },
  { id: "trust", name: "Trust Wallet", install: "https://trustwallet.com/download", rdns: ["com.trustwallet.app"] },
  { id: "okx", name: "OKX Wallet", install: "https://www.okx.com/web3", rdns: ["com.okex.wallet"] },
  { id: "coinbase", name: "Coinbase Wallet", install: "https://www.coinbase.com/wallet/downloads", rdns: ["com.coinbase.wallet"] },
  { id: "tokenpocket", name: "TokenPocket", install: "https://www.tokenpocket.pro/en/download/app", rdns: ["pro.tokenpocket"] },
  { id: "safepal", name: "SafePal Wallet", install: "https://www.safepal.com/download", rdns: ["com.safepal.wallet", "com.safepal"] },
];

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<any>;
  on?: (event: string, cb: (...a: any[]) => void) => void;
  removeListener?: (event: string, cb: (...a: any[]) => void) => void;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
  isTrust?: boolean;
  isTrustWallet?: boolean;
  isSafePal?: boolean;
  isTokenPocket?: boolean;
  isCoinbaseWallet?: boolean;
  isCoinbaseBrowser?: boolean;
  providers?: Eip1193[];
};

type Ctx = {
  address: string | null;
  walletId: WalletId | null;
  chainId: string | null;
  wrongChain: boolean;
  connecting: WalletId | null;
  error: string | null;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  connect: (id: WalletId) => Promise<void>;
  switchNetwork: () => Promise<void>;
  disconnect: () => void;
  isInstalled: (id: WalletId) => boolean;
};

const WalletCtx = createContext<Ctx | null>(null);

const CHAIN_HEX = "0x" + apiConfig.chain.id.toString(16);

async function ensureChain(p: Eip1193): Promise<string | null> {
  try {
    const cur: string = await p.request({ method: "eth_chainId" });
    if (cur?.toLowerCase() === CHAIN_HEX.toLowerCase()) return cur;
    try {
      await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
    } catch (e: any) {
      if (e?.code !== 4902 && e?.code !== -32603) throw e;
      await p.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_HEX,
            chainName: apiConfig.chain.name,
            nativeCurrency: apiConfig.chain.nativeCurrency,
            rpcUrls: apiConfig.rpcUrls.slice(0, 2),
            blockExplorerUrls: [apiConfig.explorer],
          },
        ],
      });
    }
    return await p.request({ method: "eth_chainId" });
  } catch {
    return null;
  }
}

const STORE_KEY = "aritoham_admin:wallet";
const DEMO = process.env.NEXT_PUBLIC_DEMO_WALLET === "1";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<WalletId | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<WalletId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [announced, setAnnounced] = useState<Record<string, Eip1193>>({});
  const active = useRef<Eip1193 | null>(null);

  useEffect(() => {
    const onAnnounce = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.info?.rdns && d?.provider) setAnnounced((p) => ({ ...p, [d.info.rdns]: d.provider }));
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () => window.removeEventListener("eip6963:announceProvider", onAnnounce);
  }, []);

  const getProvider = useCallback(
    (id: WalletId): Eip1193 | null => {
      if (typeof window === "undefined") return null;
      const meta = WALLETS.find((w) => w.id === id)!;
      for (const r of meta.rdns) if (announced[r]) return announced[r];

      const w = window as any;
      const eth: Eip1193 | undefined = w.ethereum;
      const list: Eip1193[] = eth?.providers?.length ? eth.providers : eth ? [eth] : [];

      switch (id) {
        case "okx":
          return w.okxwallet || list.find((p) => p.isOkxWallet || p.isOKExWallet) || null;
        case "rabby":
          return w.rabby || list.find((p) => p.isRabby) || null;
        case "trust":
          return w.trustwallet || list.find((p) => p.isTrust || p.isTrustWallet) || null;
        case "safepal":
          return w.safepalProvider || list.find((p) => p.isSafePal) || null;
        case "tokenpocket":
          return w.tokenpocket?.ethereum || list.find((p) => p.isTokenPocket) || null;
        case "coinbase":
          return w.coinbaseWalletExtension || list.find((p) => p.isCoinbaseWallet || p.isCoinbaseBrowser) || null;
        default:
          return (
            list.find(
              (p) =>
                p.isMetaMask &&
                !p.isRabby &&
                !p.isOkxWallet &&
                !p.isOKExWallet &&
                !p.isTrust &&
                !p.isTrustWallet &&
                !p.isSafePal &&
                !p.isTokenPocket &&
                !p.isCoinbaseWallet &&
                !p.isCoinbaseBrowser
            ) ||
            eth ||
            null
          );
      }
    },
    [announced]
  );

  const isInstalled = useCallback((id: WalletId) => DEMO || !!getProvider(id), [getProvider]);

  const clear = useCallback(() => {
    setAddress(null);
    setWalletId(null);
    setChainId(null);
    active.current = null;
    setActiveWalletProvider(null);
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {}
  }, []);

  const bind = useCallback(
    (p: Eip1193) => {
      active.current = p;
      setActiveWalletProvider(p);
      p.on?.("accountsChanged", (accs: string[]) => (accs?.length ? setAddress(accs[0]) : clear()));
      p.on?.("chainChanged", (c: string) => setChainId(c));
    },
    [clear]
  );

  const connect = useCallback(
    async (id: WalletId) => {
      setError(null);
      setConnecting(id);
      try {
        const p = getProvider(id);
        if (!p) {
          if (DEMO) {
            setAddress(DEMO_ADDR);
            setWalletId(id);
            setChainId(CHAIN_HEX);
            setModalOpen(false);
            return;
          }
          const meta = WALLETS.find((w) => w.id === id)!;
          setError(`${meta.name} is not installed in this browser.`);
          window.open(meta.install, "_blank", "noopener,noreferrer");
          return;
        }
        const accounts: string[] = await p.request({ method: "eth_requestAccounts" });
        if (!accounts?.length) throw new Error("No account returned from wallet.");
        const chain: string = (await ensureChain(p)) ?? (await p.request({ method: "eth_chainId" }));
        bind(p);
        setAddress(accounts[0]);
        setWalletId(id);
        setChainId(chain);
        setModalOpen(false);
        try {
          localStorage.setItem(STORE_KEY, id);
        } catch {}
      } catch (e: any) {
        setError(e?.code === 4001 ? "Connection request was rejected." : e?.message || "Failed to connect wallet.");
      } finally {
        setConnecting(null);
      }
    },
    [bind, getProvider]
  );

  const switchNetwork = useCallback(async () => {
    if (!active.current) return;
    const c = await ensureChain(active.current);
    if (c) setChainId(c);
  }, []);

  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORE_KEY);
    } catch {}
    if (!saved) return;
    const t = setTimeout(async () => {
      const id = saved as WalletId;
      const p = getProvider(id);
      if (!p) return;
      restored.current = true;
      try {
        const accs: string[] = await p.request({ method: "eth_accounts" });
        if (accs?.length) {
          bind(p);
          setAddress(accs[0]);
          setWalletId(id);
          setChainId(await p.request({ method: "eth_chainId" }));
        }
      } catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [getProvider, bind]);

  const wrongChain = Boolean(chainId && chainId.toLowerCase() !== CHAIN_HEX.toLowerCase());

  const value = useMemo<Ctx>(
    () => ({
      address,
      walletId,
      chainId,
      wrongChain,
      connecting,
      error,
      modalOpen,
      openModal: () => {
        setError(null);
        setModalOpen(true);
      },
      closeModal: () => setModalOpen(false),
      connect,
      switchNetwork,
      disconnect: clear,
      isInstalled,
    }),
    [address, walletId, chainId, wrongChain, connecting, error, modalOpen, connect, switchNetwork, clear, isInstalled]
  );

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
}

export function useWallet() {
  const c = useContext(WalletCtx);
  if (!c) throw new Error("useWallet must be used inside <WalletProvider>");
  return c;
}
