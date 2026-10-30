"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/routes";
import { BRAND } from "@/lib/brand";
import { midAddr } from "@/lib/format";
import {
  config,
  ContractAddresses,
  DEFAULT_ADDRESSES,
  getActiveAddresses,
  resetCustomAddresses,
  saveCustomAddresses,
} from "@/lib/contract";
import { Icon, CopyBtn, Pill, Addr } from "./ui";
import { useWallet, WALLETS } from "./WalletProvider";
import { useAdmin } from "./AdminContext";
import WalletModal from "./WalletModal";

function ContractSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { refresh } = useAdmin();
  const [addrs, setAddrs] = useState<ContractAddresses>(DEFAULT_ADDRESSES);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAddrs(getActiveAddresses());
      setSavedMsg(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomAddresses(addrs);
    setSavedMsg("Contract addresses updated in local storage.");
    await refresh();
  };

  const handleReset = async () => {
    resetCustomAddresses();
    setAddrs(DEFAULT_ADDRESSES);
    setSavedMsg("Reset to default BSC Testnet deployment addresses.");
    await refresh();
  };

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal wide" role="dialog" aria-modal="true" aria-label="Contract Addresses">
        <div className="modal-head">
          <h3>Smart Contract Addresses</h3>
          <button className="modal-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="sub">
          Active contract addresses on <b>{config.chain.name}</b> (Chain ID {config.chain.id}).
        </p>

        <form onSubmit={handleSave} className="stack" style={{ gap: 12 }}>
          {(
            [
              ["protocol", "ARITOHAMProtocol (Main Core)"],
              ["dataStore", "AritohamDataStore (Data Store)"],
              ["aritoham", "ARITOHAM Token (ERC-20)"],
              ["usdt", "USDT Token (BEP-20)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="field-l">{label}</label>
              <input
                className="inp"
                value={addrs[key]}
                onChange={(e) => setAddrs({ ...addrs, [key]: e.target.value as any })}
                placeholder="0x..."
                style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}
              />
            </div>
          ))}

          {savedMsg && <div className="alert ok">{savedMsg}</div>}

          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 8 }}>
            <button type="button" className="btn" onClick={handleReset}>
              Reset Defaults
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="btn" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="btn btn-gold">
                Save & Reload
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [cfgOpen, setCfgOpen] = useState(false);
  const { address, walletId, wrongChain, switchNetwork, openModal, disconnect } = useWallet();
  const { overview, loading, error, refresh, txLogs, clearTxLogs } = useAdmin();

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [pathname]);

  const walletName = WALLETS.find((w) => w.id === walletId)?.name;

  const activeRoles: string[] = [];
  if (overview?.roles) {
    const r = overview.roles;
    if (r.isProtocolAdmin) activeRoles.push("Protocol Admin");
    if (r.isChainKeeper) activeRoles.push("Chain Keeper");
    if (r.isAdminSigner) activeRoles.push("Multisig Signer");
  }

  return (
    <>
      <div className="bg-fx" />
      <div className={`shell ${collapsed ? "collapsed" : ""}`}>
        <aside className={`sidebar ${open ? "open" : ""}`}>
          <div className="brand">
            <div className="brand-logo">
              <img src="/logo.png" alt={BRAND.name} />
            </div>
            <div className="brand-text">
              <div className="brand-name">{BRAND.name}</div>
              <div className="brand-sub">{BRAND.sub}</div>
            </div>
          </div>

          <nav className="nav">
            <div className="nav-label" style={{ padding: "10px 8px 6px" }}>
              <span>Read Pages (1–5)</span>
            </div>
            {NAV.filter((n) => n.group === "read").map((n) => {
              const isActive = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  title={n.label}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon name={n.icon} size={18} />
                  <div className="nav-text" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span>{n.label}</span>
                    {n.roleTag && (
                      <small
                        style={{
                          fontSize: 9.5,
                          opacity: isActive ? 0.78 : 0.55,
                          fontWeight: 700,
                          letterSpacing: "0.03em",
                        }}
                      >
                        {n.roleTag}
                      </small>
                    )}
                  </div>
                </Link>
              );
            })}

            <div className="nav-label" style={{ padding: "16px 8px 6px" }}>
              <span>Write Pages (6–11)</span>
            </div>
            {NAV.filter((n) => n.group === "write").map((n) => {
              const isActive = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  title={n.label}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon name={n.icon} size={18} />
                  <div className="nav-text" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span>{n.label}</span>
                    {n.roleTag && (
                      <small
                        style={{
                          fontSize: 9.5,
                          opacity: isActive ? 0.78 : 0.55,
                          fontWeight: 700,
                          letterSpacing: "0.03em",
                        }}
                      >
                        {n.roleTag}
                      </small>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="side-foot" style={{ display: "grid", gap: 8 }}>
            <button
              type="button"
              className="btn"
              style={{ width: "100%", justifyContent: collapsed ? "center" : "flex-start" }}
              onClick={() => setCfgOpen(true)}
              title="Contract Addresses"
            >
              <Icon name="settings" size={17} />
              <span className="nav-text">Contract Config</span>
            </button>
            {address ? (
              <button type="button" className="logout" onClick={disconnect} title="Disconnect Wallet">
                <Icon name="logout" size={19} />
                <span className="nav-text">Disconnect</span>
              </button>
            ) : (
              <button type="button" className="btn btn-gold" style={{ width: "100%" }} onClick={openModal}>
                <Icon name="wallet" size={18} />
                <span className="nav-text">Connect MetaMask</span>
              </button>
            )}
          </div>
        </aside>

        <button
          type="button"
          className="collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Toggle sidebar"
        >
          <Icon name="arrowleft" size={18} />
        </button>
        <div className={`overlay ${open ? "show" : ""}`} onClick={() => setOpen(false)} />

        <div className="main">
          <header className="topbar" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button type="button" className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
                <Icon name="menu" />
              </button>
              <Pill tone="gold" dot>
                {config.chain.name} (#{config.chain.id})
              </Pill>
              {address &&
                (activeRoles.length > 0 ? (
                  activeRoles.map((r) => (
                    <Pill key={r} tone="green" dot>
                      {r}
                    </Pill>
                  ))
                ) : (
                  <Pill tone="muted">Observer Wallet</Pill>
                ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {wrongChain && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ borderColor: "var(--red)", color: "var(--red)" }}
                  onClick={switchNetwork}
                >
                  <Icon name="alert" size={15} /> Switch to {config.chain.name}
                </button>
              )}

              <button
                type="button"
                className="btn btn-sm"
                onClick={() => refresh()}
                disabled={loading}
                title="Refresh On-Chain Data"
              >
                <Icon name="refresh" size={15} /> {loading ? "Syncing…" : "Refresh"}
              </button>

              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setCfgOpen(true)}
                title="Configure Contract Addresses"
              >
                <Icon name="settings" size={15} /> Contracts
              </button>

              {address ? (
                <>
                  <div className="acct">
                    <div className="conn-pill">
                      <span className="conn-ico">
                        <Icon name="wallet" size={17} />
                      </span>
                      <button
                        type="button"
                        style={{ background: "transparent", border: 0, textAlign: "left" }}
                        onClick={() => setMenu((m) => !m)}
                        aria-label="Wallet menu"
                      >
                        <div className="conn-l">
                          CONNECTED{walletName ? ` · ${walletName.split(" ")[0].toUpperCase()}` : ""}
                        </div>
                        <div className="conn-a">{midAddr(address)}</div>
                      </button>
                      <CopyBtn text={address} />
                    </div>
                    {menu && (
                      <div className="acct-menu">
                        <button
                          type="button"
                          onClick={() => {
                            setMenu(false);
                            openModal();
                          }}
                        >
                          Switch Wallet
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenu(false);
                            disconnect();
                          }}
                        >
                          Disconnect Wallet
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button type="button" className="top-logout" onClick={openModal}>
                  <Icon name="wallet" size={17} /> Connect MetaMask
                </button>
              )}
            </div>
          </header>

          <main className="content">
            {error && (
              <div className="alert warn" style={{ marginBottom: 16 }}>
                <span>
                  <b>RPC Read Warning:</b> {error}
                </span>
              </div>
            )}

            {txLogs.length > 0 && (
              <div className="panel" style={{ marginBottom: 20, padding: "14px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div className="eyebrow">Recent Protocol Transactions</div>
                  <button type="button" className="btn btn-sm" onClick={clearTxLogs}>
                    Clear Log
                  </button>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {txLogs.slice(0, 3).map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        padding: "8px 12px",
                        borderRadius: 12,
                        background: "#0c0c0f",
                        border: "1px solid var(--line)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Pill
                          tone={tx.status === "success" ? "green" : tx.status === "error" ? "red" : "gold"}
                          dot={tx.status === "pending"}
                        >
                          {tx.status === "pending" ? "Pending" : tx.status === "success" ? "Confirmed" : "Failed"}
                        </Pill>
                        <b>{tx.label}</b>
                        {tx.error && <span style={{ color: "var(--red)", fontSize: 12.5 }}>{tx.error}</span>}
                      </div>
                      {tx.hash && <Addr text={tx.hash} link explorerType="tx" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {children}
          </main>
        </div>
      </div>
      <WalletModal />
      <ContractSettingsModal open={cfgOpen} onClose={() => setCfgOpen(false)} />
    </>
  );
}
