"use client";

import React, { useMemo, useState } from "react";
import { isAddress, type Address, type Hex } from "viem";
import { useAdmin } from "@/components/AdminContext";
import {
  computeSetChainKeeperHash,
  config,
  signSetChainKeeperHash,
  writeProtocol,
  writeToken,
} from "@/lib/contract";
import {
  PageTitle,
  Panel,
  Mini,
  Pill,
  Addr,
  TxFeedback,
} from "@/components/ui";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

function shortAddr(a?: string | null): string {
  if (!a || a === ZERO_ADDR) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function WriteGovernancePage() {
  const { overview, refresh } = useAdmin();
  const p = overview?.protocol;
  const roles = overview?.roles;

  // 1. Set Chain Keeper (2-of-2 multisig)
  const [newKeeper, setNewKeeper] = useState("");
  const [sig1, setSig1] = useState("");
  const [sig2, setSig2] = useState("");

  // 2. Renounce Protocol CA confirmation
  const [confirmProtocolText, setConfirmProtocolText] = useState("");

  // 3. Renounce Token CA confirmation
  const [confirmTokenText, setConfirmTokenText] = useState("");

  // Execution state
  const [txState, setTxState] = useState<{
    status: "idle" | "pending" | "ok" | "error";
    message?: string;
    hash?: string;
  } | null>(null);

  const computedHash: Hex | "" = useMemo(() => {
    if (!isAddress(newKeeper.trim())) return "";
    try {
      return computeSetChainKeeperHash(
        config.addresses.protocol,
        BigInt(config.chain.id),
        p?.adminSigNonce ?? 0n,
        newKeeper.trim() as Address
      );
    } catch {
      return "";
    }
  }, [newKeeper, p?.adminSigNonce]);

  const handleSignSlot = async (slot: 1 | 2) => {
    if (!computedHash) {
      setTxState({
        status: "error",
        message: "Enter a valid new ChainKeeper wallet address before signing.",
      });
      return;
    }
    setTxState({
      status: "pending",
      message: `Requesting EIP-191 signature for Slot ${slot} from connected wallet...`,
    });
    try {
      const res = await signSetChainKeeperHash(computedHash);
      if (slot === 1) setSig1(res.signature);
      else setSig2(res.signature);
      setTxState({
        status: "ok",
        message: `Signed Slot ${slot} with ${shortAddr(res.signer)}.`,
      });
    } catch (e: unknown) {
      setTxState({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const handleExecuteSetChainKeeper = async () => {
    if (!isAddress(newKeeper.trim())) {
      setTxState({
        status: "error",
        message: "Enter a valid new ChainKeeper wallet address.",
      });
      return;
    }
    if (!sig1.trim().startsWith("0x") || !sig2.trim().startsWith("0x")) {
      setTxState({
        status: "error",
        message: "Both Admin Signer 1 and Admin Signer 2 signatures are required.",
      });
      return;
    }
    setTxState({
      status: "pending",
      message: `Submitting setChainKeeper(${shortAddr(newKeeper.trim())}, [sig1, sig2])...`,
    });
    try {
      const res = await writeProtocol("setChainKeeper", [
        newKeeper.trim(),
        [sig1.trim(), sig2.trim()],
      ]);
      setTxState({
        status: "ok",
        message: `Updated ChainKeeper to ${shortAddr(newKeeper.trim())}`,
        hash: res.hash,
      });
      await refresh();
    } catch (e: unknown) {
      setTxState({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const handleRenounceProtocolOwnership = async () => {
    if (confirmProtocolText.trim() !== "RENOUNCE PROTOCOL") {
      setTxState({
        status: "error",
        message: 'Type "RENOUNCE PROTOCOL" in the confirmation field to proceed.',
      });
      return;
    }
    setTxState({
      status: "pending",
      message: "Submitting ARITOHAMProtocol.renounceOwnership()...",
    });
    try {
      const res = await writeProtocol("renounceOwnership", []);
      setTxState({
        status: "ok",
        message: "Successfully renounced ARITOHAMProtocol ownership.",
        hash: res.hash,
      });
      setConfirmProtocolText("");
      await refresh();
    } catch (e: unknown) {
      setTxState({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const handleRenounceTokenOwnership = async () => {
    if (confirmTokenText.trim() !== "RENOUNCE TOKEN") {
      setTxState({
        status: "error",
        message: 'Type "RENOUNCE TOKEN" in the confirmation field to proceed.',
      });
      return;
    }
    setTxState({
      status: "pending",
      message: "Submitting ARITOHAM (Token CA).renounceOwnership()...",
    });
    try {
      const res = await writeToken("renounceOwnership", []);
      setTxState({
        status: "ok",
        message: "Successfully renounced ARITOHAM Token CA ownership.",
        hash: res.hash,
      });
      setConfirmTokenText("");
      await refresh();
    } catch (e: unknown) {
      setTxState({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const protocolRenounced = !p?.admin || p.admin === ZERO_ADDR;
  const tokenRenounced = !p?.tokenOwner || p.tokenOwner === ZERO_ADDR;
  const busy = txState?.status === "pending";

  return (
    <div className="stack">
      <PageTitle
        title="11. Set Chain Keeper & Renounce Ownership (Protocol & Token CA)"
        sub="Write Action 11 — 2-of-2 Multisig ChainKeeper Rotation (setChainKeeper) and Ownership Renunciation for both Protocol CA and Token CA"
        right={
          <button className="btn btn-sm" onClick={() => refresh()} disabled={busy}>
            Refresh Roles
          </button>
        }
      />

      <TxFeedback state={txState} />

      {/* Current Role Matrix KPIs */}
      <div className="grid cols-5">
        <Mini
          label="Active ChainKeeper"
          value={shortAddr(p?.chainKeeper)}
          hint={
            roles?.isChainKeeper
              ? "Connected wallet is Keeper"
              : "Rotation via 2-of-2 Signers"
          }
        />
        <Mini
          label="Admin Signer 1"
          value={shortAddr(p?.adminSigners?.[0])}
          hint="Multisig Slot 1"
        />
        <Mini
          label="Admin Signer 2"
          value={shortAddr(p?.adminSigners?.[1])}
          hint="Multisig Slot 2"
        />
        <Mini
          label="Protocol CA Admin"
          value={protocolRenounced ? "RENOUNCED (0x0)" : shortAddr(p?.admin)}
          hint={`CA: ${shortAddr(config.addresses.protocol)}`}
        />
        <Mini
          label="Token CA Owner"
          value={tokenRenounced ? "RENOUNCED (0x0)" : shortAddr(p?.tokenOwner)}
          hint={`CA: ${shortAddr(config.addresses.aritoham)}`}
        />
      </div>

      {/* SECTION 1: SET CHAIN KEEPER */}
      <Panel
        title="1. Set Chain Keeper — ARITOHAMProtocol.setChainKeeper(newChainKeeper, signatures[])"
        sub="Requires 2-of-2 EIP-191 signatures from Admin Signer 1 and Admin Signer 2 over keccak256(abi.encodePacked(protocolAddress, chainId, adminSigNonce, 'setChainKeeper', newChainKeeper))"
        right={
          <Pill tone="gold">Sig Nonce: {String(p?.adminSigNonce ?? 0n)}</Pill>
        }
      >
        <div className="grid cols-2" style={{ marginBottom: 14 }}>
          <div>
            <label className="field-l">New ChainKeeper Wallet Address</label>
            <input
              className="inp"
              placeholder="0x... new ChainKeeper address"
              value={newKeeper}
              onChange={(e) => setNewKeeper(e.target.value)}
            />
          </div>
          <div>
            <label className="field-l">Computed EIP-191 Message Digest</label>
            <input
              className="inp"
              readOnly
              value={computedHash || "Enter valid 0x address to compute digest"}
            />
          </div>
        </div>

        <div className="grid cols-2" style={{ marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label className="field-l" style={{ marginBottom: 0 }}>
                Signature 1 — Admin Signer 1 ({shortAddr(p?.adminSigners?.[0])})
              </label>
              <button
                className="btn btn-sm"
                disabled={busy}
                onClick={() => handleSignSlot(1)}
              >
                Sign with Connected Wallet (Slot 1)
              </button>
            </div>
            <input
              className="inp"
              placeholder="0x... 65-byte signature from Admin Signer 1"
              value={sig1}
              onChange={(e) => setSig1(e.target.value)}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label className="field-l" style={{ marginBottom: 0 }}>
                Signature 2 — Admin Signer 2 ({shortAddr(p?.adminSigners?.[1])})
              </label>
              <button
                className="btn btn-sm"
                disabled={busy}
                onClick={() => handleSignSlot(2)}
              >
                Sign with Connected Wallet (Slot 2)
              </button>
            </div>
            <input
              className="inp"
              placeholder="0x... 65-byte signature from Admin Signer 2"
              value={sig2}
              onChange={(e) => setSig2(e.target.value)}
            />
          </div>
        </div>

        <button
          className="btn btn-gold btn-block"
          disabled={busy || !newKeeper || !sig1 || !sig2}
          onClick={handleExecuteSetChainKeeper}
        >
          {busy
            ? "Submitting setChainKeeper..."
            : "Execute setChainKeeper(newChainKeeper, [sig1, sig2])"}
        </button>
      </Panel>

      {/* SECTION 2 & 3: RENOUNCE OWNERSHIP OF PROTOCOL CA & TOKEN CA */}
      <div className="grid g-half">
        {/* RENOUNCE PROTOCOL CA */}
        <Panel
          title="2. Renounce Protocol CA Ownership"
          sub="ARITOHAMProtocol.renounceOwnership() — Permanently sets Protocol admin to 0x000...000"
          right={
            protocolRenounced ? (
              <Pill tone="green">RENOUNCED</Pill>
            ) : (
              <Pill tone={roles?.isProtocolAdmin ? "gold" : "red"}>onlyAdmin</Pill>
            )
          }
        >
          <div className="stack" style={{ gap: 12 }}>
            <div className="kv">
              <div className="kv-row">
                <span className="k">Protocol Contract (CA)</span>
                <span className="v">
                  <Addr text={config.addresses.protocol} link />
                </span>
              </div>
              <div className="kv-row">
                <span className="k">Current Protocol Admin</span>
                <span className="v">
                  {protocolRenounced ? (
                    <Pill tone="green">0x0000...0000 (Renounced)</Pill>
                  ) : (
                    <Addr text={p?.admin} link />
                  )}
                </span>
              </div>
              <div className="kv-row">
                <span className="k">Connected Wallet Permission</span>
                <span className="v">
                  {roles?.isProtocolAdmin ? (
                    <Pill tone="green">Authorized Protocol Admin</Pill>
                  ) : (
                    <Pill tone="red">Requires Protocol Admin Wallet</Pill>
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="field-l">
                Type &quot;RENOUNCE PROTOCOL&quot; to unlock irreversible action
              </label>
              <input
                className="inp"
                placeholder="RENOUNCE PROTOCOL"
                value={confirmProtocolText}
                onChange={(e) => setConfirmProtocolText(e.target.value)}
                disabled={protocolRenounced}
              />
            </div>

            <button
              className="btn btn-danger btn-block"
              disabled={
                busy ||
                protocolRenounced ||
                confirmProtocolText.trim() !== "RENOUNCE PROTOCOL"
              }
              onClick={handleRenounceProtocolOwnership}
            >
              {protocolRenounced
                ? "Protocol Ownership Already Renounced"
                : "Execute ARITOHAMProtocol.renounceOwnership()"}
            </button>
          </div>
        </Panel>

        {/* RENOUNCE TOKEN CA */}
        <Panel
          title="3. Renounce Token CA Ownership (ARITOHAM)"
          sub="ARITOHAM.renounceOwnership() — Permanently sets ERC-20 Token owner to 0x000...000"
          right={
            tokenRenounced ? (
              <Pill tone="green">RENOUNCED</Pill>
            ) : (
              <Pill tone={roles?.isTokenOwner ? "gold" : "red"}>
                onlyOwner
              </Pill>
            )
          }
        >
          <div className="stack" style={{ gap: 12 }}>
            <div className="kv">
              <div className="kv-row">
                <span className="k">ARITOHAM Token Contract (CA)</span>
                <span className="v">
                  <Addr text={config.addresses.aritoham} link />
                </span>
              </div>
              <div className="kv-row">
                <span className="k">Current Token Owner</span>
                <span className="v">
                  {tokenRenounced ? (
                    <Pill tone="green">0x0000...0000 (Renounced)</Pill>
                  ) : (
                    <Addr text={p?.tokenOwner} link />
                  )}
                </span>
              </div>
              <div className="kv-row">
                <span className="k">Connected Wallet Permission</span>
                <span className="v">
                  {roles?.isTokenOwner ? (
                    <Pill tone="green">Authorized Token Owner</Pill>
                  ) : (
                    <Pill tone="red">Requires Token Owner Wallet</Pill>
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="field-l">
                Type &quot;RENOUNCE TOKEN&quot; to unlock irreversible action
              </label>
              <input
                className="inp"
                placeholder="RENOUNCE TOKEN"
                value={confirmTokenText}
                onChange={(e) => setConfirmTokenText(e.target.value)}
                disabled={tokenRenounced}
              />
            </div>

            <button
              className="btn btn-danger btn-block"
              disabled={
                busy ||
                tokenRenounced ||
                confirmTokenText.trim() !== "RENOUNCE TOKEN"
              }
              onClick={handleRenounceTokenOwnership}
            >
              {tokenRenounced
                ? "Token CA Ownership Already Renounced"
                : "Execute ARITOHAM (Token CA).renounceOwnership()"}
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
