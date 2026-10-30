"use client";

import { useEffect, useState } from "react";
import { isAddress, type Address } from "viem";
import { useAdmin } from "../AdminContext";
import { useWallet } from "../WalletProvider";
import {
  Addr,
  Icon,
  Mini,
  PageTitle,
  Panel,
  Pill,
  RoleRequirementBanner,
  TxFeedback,
} from "../ui";
import {
  computeSetChainKeeperHash,
  config,
  signSetChainKeeperHash,
  verifySignatureSigner,
  writeProtocol,
} from "@/lib/contract";

export default function ProtocolAdminView() {
  const { overview, runTx } = useAdmin();
  const { address } = useWallet();
  const p = overview?.protocol;
  const r = overview?.roles;

  // 1. setDataStore state
  const [newDataStore, setNewDataStore] = useState("");
  const [dsTx, setDsTx] = useState<{
    status: "idle" | "pending" | "ok" | "error";
    message?: string;
    hash?: string;
  }>({
    status: "idle",
  });

  // 2. Multisig setChainKeeper state
  const [newKeeper, setNewKeeper] = useState("");
  const [sig1, setSig1] = useState("");
  const [sig2, setSig2] = useState("");
  const [sig1Signer, setSig1Signer] = useState<Address | null>(null);
  const [sig2Signer, setSig2Signer] = useState<Address | null>(null);
  const [signError, setSignError] = useState<string | null>(null);
  const [keeperTx, setKeeperTx] = useState<{
    status: "idle" | "pending" | "ok" | "error";
    message?: string;
    hash?: string;
  }>({ status: "idle" });

  useEffect(() => {
    if (p?.dataStore && !newDataStore) {
      setNewDataStore(p.dataStore);
    }
  }, [p?.dataStore]);

  const computedHash =
    p && isAddress(newKeeper.trim())
      ? computeSetChainKeeperHash(
          p.address,
          BigInt(config.chain.id),
          p.adminSigNonce,
          newKeeper.trim() as Address
        )
      : null;

  useEffect(() => {
    let cancelled = false;
    async function checkSigs() {
      if (!computedHash) {
        setSig1Signer(null);
        setSig2Signer(null);
        return;
      }
      const [r1, r2] = await Promise.all([
        verifySignatureSigner(computedHash, sig1.trim()),
        verifySignatureSigner(computedHash, sig2.trim()),
      ]);
      if (!cancelled) {
        setSig1Signer(r1);
        setSig2Signer(r2);
      }
    }
    checkSigs();
    return () => {
      cancelled = true;
    };
  }, [computedHash, sig1, sig2]);

  const isRegisteredSigner = (addr: Address | null) => {
    if (!addr || !p) return false;
    return p.adminSigners.some((s) => s.toLowerCase() === addr.toLowerCase());
  };

  const handleSetDataStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = newDataStore.trim();
    if (!isAddress(target)) {
      setDsTx({
        status: "error",
        message: "Please enter a valid 0x contract address.",
      });
      return;
    }
    setDsTx({
      status: "pending",
      message: "Submitting setDataStore transaction…",
    });
    const res = await runTx("Protocol.setDataStore", () =>
      writeProtocol("setDataStore", [target])
    );
    if (res.ok) {
      setDsTx({
        status: "ok",
        message: "DataStore address updated successfully!",
        hash: res.hash,
      });
    } else {
      setDsTx({ status: "error", message: res.error });
    }
  };

  const handleSignWithWallet = async (slot: 1 | 2) => {
    setSignError(null);
    if (!computedHash) {
      setSignError("Enter a valid new Chain Keeper address first.");
      return;
    }
    try {
      const { signature } = await signSetChainKeeperHash(computedHash);
      if (slot === 1) setSig1(signature);
      else setSig2(signature);
    } catch (e: any) {
      setSignError(e?.message || "Signing cancelled or failed.");
    }
  };

  const handleSetChainKeeper = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = newKeeper.trim();
    if (!isAddress(target)) {
      setKeeperTx({
        status: "error",
        message: "Enter a valid new Chain Keeper address.",
      });
      return;
    }
    if (!sig1.trim().startsWith("0x") || !sig2.trim().startsWith("0x")) {
      setKeeperTx({
        status: "error",
        message:
          "Provide both Admin Signer signatures (Slot #1 and Slot #2).",
      });
      return;
    }
    setKeeperTx({
      status: "pending",
      message: "Submitting setChainKeeper (2-of-2 multisig)…",
    });
    const res = await runTx("Protocol.setChainKeeper", () =>
      writeProtocol("setChainKeeper", [target, [sig1.trim(), sig2.trim()]])
    );
    if (res.ok) {
      setKeeperTx({
        status: "ok",
        message: "Chain Keeper updated on-chain!",
        hash: res.hash,
      });
      setSig1("");
      setSig2("");
    } else {
      setKeeperTx({ status: "error", message: res.error });
    }
  };

  return (
    <div className="stack">
      <PageTitle
        title="Protocol Admin & 2-of-2 Multisig"
        sub="Manage ARITOHAMProtocol DataStore wiring (onlyAdmin) and 2-of-2 EIP-191 multisig Chain Keeper updates."
      />

      <RoleRequirementBanner
        roleName="Protocol Admin (onlyAdmin)"
        requiredAddress={p?.admin}
        hasRole={Boolean(r?.isProtocolAdmin)}
      />

      <div className="cols-4">
        <Mini
          icon="shield"
          label="Protocol Admin"
          value={<Addr text={p?.admin} link />}
          hint={
            p?.admin === "0x0000000000000000000000000000000000000000"
              ? "Ownership Renounced"
              : "onlyAdmin holder"
          }
        />
        <Mini
          icon="crown"
          label="Current Chain Keeper"
          value={<Addr text={p?.chainKeeper} link />}
          hint="onlyChainKeeper holder"
        />
        <Mini
          icon="layers"
          label="Linked DataStore"
          value={<Addr text={p?.dataStore} link />}
          hint="Protocol storage pointer"
        />
        <Mini
          icon="key"
          label="Multisig Nonce"
          value={p ? `#${p.adminSigNonce.toString()}` : "—"}
          hint={`${p?.minAdminSignatures ?? 2}-of-2 Admin Signers`}
        />
      </div>

      {/* 1. setDataStore */}
      <Panel
        eyebrow="ONLY ADMIN · ARITOHAMProtocol"
        title="1. Update DataStore Contract (setDataStore)"
        sub="Point ARITOHAMProtocol at an AritohamDataStore contract address."
        badge="onlyAdmin"
        tone="gold"
      >
        <form
          onSubmit={handleSetDataStore}
          className="stack"
          style={{ gap: 14 }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <label className="field-l" style={{ marginBottom: 0 }}>
                DataStore Address (_dataStore)
              </label>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setNewDataStore(config.addresses.dataStore)}
              >
                Fill Configured DataStore
              </button>
            </div>
            <input
              className="inp"
              placeholder="0x..."
              value={newDataStore}
              onChange={(e) => setNewDataStore(e.target.value)}
              style={{ fontFamily: "ui-monospace, monospace" }}
            />
          </div>

          <div className="kv">
            <span>Current On-Chain dataStore()</span>
            <Addr text={p?.dataStore} link />
          </div>

          <button
            type="submit"
            className="btn btn-gold btn-block"
            disabled={dsTx.status === "pending"}
          >
            <Icon name="layers" size={16} /> Execute setDataStore
          </button>
          <TxFeedback state={dsTx} />
        </form>
      </Panel>

      {/* 2. 2-of-2 Multisig Studio for setChainKeeper */}
      <Panel
        eyebrow="2-OF-2 ADMIN MULTISIG · EIP-191 PERSONAL SIGN"
        title="2. Update Chain Keeper via 2-of-2 Multisig (setChainKeeper)"
        sub='Requires 2 unique adminSigner signatures over keccak256(abi.encodePacked(address(this), block.chainid, adminSigNonce, "setChainKeeper", _newChainKeeper)).'
        badge={`Nonce #${p?.adminSigNonce.toString() ?? "0"}`}
        tone="gold"
      >
        <div className="cols-2" style={{ marginBottom: 18 }}>
          <div className="mini flat">
            <div className="lbl">Authorized Admin Signer #1</div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Addr text={p?.adminSigners[0]} link />
              {address &&
                p?.adminSigners[0] &&
                address.toLowerCase() === p.adminSigners[0].toLowerCase() && (
                  <Pill tone="green" dot>
                    Connected
                  </Pill>
                )}
            </div>
          </div>
          <div className="mini flat">
            <div className="lbl">Authorized Admin Signer #2</div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Addr text={p?.adminSigners[1]} link />
              {address &&
                p?.adminSigners[1] &&
                address.toLowerCase() === p.adminSigners[1].toLowerCase() && (
                  <Pill tone="green" dot>
                    Connected
                  </Pill>
                )}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSetChainKeeper}
          className="stack"
          style={{ gap: 16 }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <label className="field-l" style={{ marginBottom: 0 }}>
                New Chain Keeper Address (_newChainKeeper)
              </label>
              {address && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setNewKeeper(address)}
                >
                  Use Connected Wallet
                </button>
              )}
            </div>
            <input
              className="inp"
              placeholder="0x..."
              value={newKeeper}
              onChange={(e) => setNewKeeper(e.target.value)}
              style={{ fontFamily: "ui-monospace, monospace" }}
            />
          </div>

          {computedHash && (
            <div className="alert gold" style={{ alignItems: "center" }}>
              <Icon name="key" size={18} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "var(--gold-hi)",
                  }}
                >
                  Computed EIP-191 Message Hash (Raw Bytes32)
                </div>
                <div
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 12.5,
                    wordBreak: "break-all",
                    marginTop: 3,
                  }}
                >
                  {computedHash}
                </div>
              </div>
            </div>
          )}

          {signError && (
            <div className="alert warn">
              <Icon name="alert" size={18} />
              <div>{signError}</div>
            </div>
          )}

          <div className="cols-2">
            {/* Signature #1 */}
            <div className="mini flat">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <label className="field-l" style={{ marginBottom: 0 }}>
                  Signature Slot #1 (sigs[0])
                </label>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => handleSignWithWallet(1)}
                >
                  <Icon name="key" size={13} /> Sign with MetaMask
                </button>
              </div>
              <textarea
                className="inp"
                placeholder="0x... (65-byte ECDSA signature from Signer #1)"
                value={sig1}
                onChange={(e) => setSig1(e.target.value)}
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 12,
                  minHeight: 74,
                }}
              />
              {sig1.trim() && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>
                    Recovered Signer:
                  </span>
                  {sig1Signer ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Addr text={sig1Signer} />
                      <Pill
                        tone={isRegisteredSigner(sig1Signer) ? "green" : "red"}
                      >
                        {isRegisteredSigner(sig1Signer)
                          ? "Valid Signer"
                          : "Not AdminSigner"}
                      </Pill>
                    </span>
                  ) : (
                    <Pill tone="red">Invalid Signature</Pill>
                  )}
                </div>
              )}
            </div>

            {/* Signature #2 */}
            <div className="mini flat">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <label className="field-l" style={{ marginBottom: 0 }}>
                  Signature Slot #2 (sigs[1])
                </label>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => handleSignWithWallet(2)}
                >
                  <Icon name="key" size={13} /> Sign with MetaMask
                </button>
              </div>
              <textarea
                className="inp"
                placeholder="0x... (65-byte ECDSA signature from Signer #2)"
                value={sig2}
                onChange={(e) => setSig2(e.target.value)}
                style={{
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 12,
                  minHeight: 74,
                }}
              />
              {sig2.trim() && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>
                    Recovered Signer:
                  </span>
                  {sig2Signer ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Addr text={sig2Signer} />
                      <Pill
                        tone={isRegisteredSigner(sig2Signer) ? "green" : "red"}
                      >
                        {isRegisteredSigner(sig2Signer)
                          ? "Valid Signer"
                          : "Not AdminSigner"}
                      </Pill>
                    </span>
                  ) : (
                    <Pill tone="red">Invalid Signature</Pill>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-gold btn-block"
            disabled={keeperTx.status === "pending"}
          >
            <Icon name="shield" size={16} /> Submit 2-of-2 Multisig
            setChainKeeper
          </button>
          <TxFeedback state={keeperTx} />
        </form>
      </Panel>
    </div>
  );
}
