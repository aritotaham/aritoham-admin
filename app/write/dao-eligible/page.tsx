"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { isAddress } from "viem";
import { useAdmin } from "@/components/AdminContext";
import {
  fmt18,
  writeProtocol,
} from "@/lib/contract";
import {
  PageTitle,
  Panel,
  Mini,
  Pill,
  Addr,
  RoleRequirementBanner,
  TxFeedback,
} from "@/components/ui";

export default function WriteDaoEligiblePage() {
  const { overview, users, usersLoading, refresh, refreshUsers } = useAdmin();

  // Filters
  const [search, setSearch] = useState("");
  const [eligFilter, setEligFilter] = useState<
    "ELIGIBLE_CANDIDATES" | "LIFETIME" | "WINDOW_20D" | "ALL"
  >("ELIGIBLE_CANDIDATES");

  // Selection & Share Overrides
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [sharesMap, setSharesMap] = useState<Record<string, string>>({});

  // Manual custom wallet entry
  const [manualWallet, setManualWallet] = useState("");
  const [manualShare, setManualShare] = useState("1");

  // Tx state
  const [txState, setTxState] = useState<{
    status: "idle" | "pending" | "ok" | "error";
    message?: string;
    hash?: string;
  } | null>(null);

  const isChainKeeper = Boolean(overview?.roles.isChainKeeper);
  const p = overview?.protocol;

  const getEffectiveShares = (u: (typeof users)[number]) => {
    const key = u.address.toLowerCase();
    if (sharesMap[key] !== undefined) return sharesMap[key];
    return String(u.suggestedDaoShares > 0n ? u.suggestedDaoShares : 1n);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchAddr = u.address.toLowerCase().includes(q);
        const matchId = String(u.userId).includes(q) || u.userCode.toLowerCase().includes(q);
        if (!matchAddr && !matchId) return false;
      }
      if (eligFilter === "ELIGIBLE_CANDIDATES" && !u.isDaoEligibleCandidate) return false;
      if (eligFilter === "LIFETIME" && !u.daoLifetime) return false;
      if (eligFilter === "WINDOW_20D" && !u.daoQualifiedByWindow) return false;
      return true;
    });
  }, [users, search, eligFilter]);

  const selectedUsers = useMemo(() => {
    return filteredUsers.filter((u) => selectedMap[u.address.toLowerCase()]);
  }, [filteredUsers, selectedMap]);

  const totalSelectedShares = useMemo(() => {
    return selectedUsers.reduce((acc, u) => {
      const s = Number(getEffectiveShares(u) || "0");
      return acc + (Number.isFinite(s) && s > 0 ? Math.floor(s) : 0);
    }, 0);
  }, [selectedUsers, sharesMap]);

  const autoSelectAndFillEligible = () => {
    const nextSel: Record<string, boolean> = {};
    const nextShares: Record<string, string> = { ...sharesMap };
    users.forEach((u) => {
      if (u.isDaoEligibleCandidate) {
        const key = u.address.toLowerCase();
        nextSel[key] = true;
        nextShares[key] = String(u.suggestedDaoShares > 0n ? u.suggestedDaoShares : 1n);
      }
    });
    setSelectedMap(nextSel);
    setSharesMap(nextShares);
  };

  const toggleSelectAllFiltered = () => {
    const allSelected =
      filteredUsers.length > 0 &&
      filteredUsers.every((u) => selectedMap[u.address.toLowerCase()]);
    const next = { ...selectedMap };
    filteredUsers.forEach((u) => {
      next[u.address.toLowerCase()] = !allSelected;
    });
    setSelectedMap(next);
  };

  const executeSetDaoEligibleBatch = async () => {
    const wallets: string[] = [];
    const shares: bigint[] = [];

    selectedUsers.forEach((u) => {
      const s = Math.floor(Number(getEffectiveShares(u) || "0"));
      if (s > 0) {
        wallets.push(u.address);
        shares.push(BigInt(s));
      }
    });

    if (wallets.length === 0) {
      setTxState({
        status: "error",
        message: "Select at least one user with shares >= 1.",
      });
      return;
    }

    setTxState({
      status: "pending",
      message: `Submitting setDaoEligible for ${wallets.length} wallet(s) (${totalSelectedShares} total shares)...`,
    });
    try {
      const res = await writeProtocol("setDaoEligible", [wallets, shares]);
      setTxState({
        status: "ok",
        message: `Registered ${wallets.length} DAO eligible wallet(s) with ${totalSelectedShares} total shares.`,
        hash: res.hash,
      });
      await Promise.all([refresh(), refreshUsers()]);
    } catch (e: unknown) {
      setTxState({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const executeSingleManual = async () => {
    if (!isAddress(manualWallet.trim())) {
      setTxState({
        status: "error",
        message: "Enter a valid wallet address.",
      });
      return;
    }
    const s = Math.floor(Number(manualShare || "0"));
    if (s <= 0) {
      setTxState({
        status: "error",
        message: "Share count must be >= 1.",
      });
      return;
    }
    setTxState({
      status: "pending",
      message: `Submitting setDaoEligible([${manualWallet.trim().slice(0, 8)}…], [${s}])...`,
    });
    try {
      const res = await writeProtocol("setDaoEligible", [
        [manualWallet.trim()],
        [BigInt(s)],
      ]);
      setTxState({
        status: "ok",
        message: `Registered ${manualWallet.trim().slice(0, 8)}… with ${s} share(s).`,
        hash: res.hash,
      });
      setManualWallet("");
      await Promise.all([refresh(), refreshUsers()]);
    } catch (e: unknown) {
      setTxState({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const candidateCount = users.filter((u) => u.isDaoEligibleCandidate).length;
  const busy = txState?.status === "pending";

  return (
    <div className="stack">
      <PageTitle
        title="8. Set DAO Eligible Users (Write)"
        sub="Write Action 8 — Filter DAO eligible users, auto-fill weekly share allocations, and execute setDaoEligible(wallets[], shares[]) in a single transaction"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-gold btn-sm" onClick={autoSelectAndFillEligible}>
              Auto-Select Eligible ({candidateCount})
            </button>
            <Link className="btn btn-sm" href="/write/dao-distribute">
              Next: 9. Distribute DAO Share →
            </Link>
          </div>
        }
      />

      <RoleRequirementBanner
        roleName="ChainKeeper"
        requiredAddress={p?.chainKeeper}
        hasRole={isChainKeeper}
      />

      <TxFeedback state={txState} />

      {/* KPIs */}
      <div className="grid cols-4">
        <Mini
          label="Active DAO Cycle"
          value={`Cycle #${String(p?.daoCycle ?? 1n)}`}
          hint={`Pool: $${fmt18(p?.daoPoolTotal, 2)}`}
        />
        <Mini
          label="DAO Eligible Candidates"
          value={String(candidateCount)}
          hint="Lifetime or 20-day window met"
        />
        <Mini
          label="Selected Wallets"
          value={String(selectedUsers.length)}
          hint="Included in setDaoEligible[]"
        />
        <Mini
          label="Selected Total Shares"
          value={String(totalSelectedShares)}
          hint={
            totalSelectedShares > 0
              ? `Est. $${fmt18(
                  (p?.daoPoolTotal ?? 0n) / BigInt(totalSelectedShares),
                  2
                )} / share`
              : "1 share per $2,500 weekly match"
          }
        />
      </div>

      {/* Filter & Execute Panel */}
      <Panel
        title="Filter & Execute setDaoEligible(wallets[], shares[])"
        sub="Select eligible users, adjust share counts if needed, and execute all selected wallets in a single transaction"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <div className="seg">
              <button
                className={eligFilter === "ELIGIBLE_CANDIDATES" ? "active" : ""}
                onClick={() => setEligFilter("ELIGIBLE_CANDIDATES")}
              >
                Eligible ({candidateCount})
              </button>
              <button
                className={eligFilter === "LIFETIME" ? "active" : ""}
                onClick={() => setEligFilter("LIFETIME")}
              >
                Lifetime
              </button>
              <button
                className={eligFilter === "WINDOW_20D" ? "active" : ""}
                onClick={() => setEligFilter("WINDOW_20D")}
              >
                20d Window
              </button>
              <button
                className={eligFilter === "ALL" ? "active" : ""}
                onClick={() => setEligFilter("ALL")}
              >
                All Users ({users.length})
              </button>
            </div>
            <button
              className="btn btn-gold btn-sm"
              disabled={busy || selectedUsers.length === 0}
              onClick={executeSetDaoEligibleBatch}
            >
              {busy
                ? "Submitting setDaoEligible..."
                : `Execute setDaoEligible (${selectedUsers.length} Wallets / ${totalSelectedShares} Shares)`}
            </button>
          </div>
        }
      >
        <div className="grid cols-3">
          <div>
            <label className="field-l">Search User ID / Wallet</label>
            <input
              className="inp"
              placeholder="0x... or User ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="field-l">Quick Add Custom Wallet</label>
            <input
              className="inp"
              placeholder="0x... custom wallet"
              value={manualWallet}
              onChange={(e) => setManualWallet(e.target.value)}
            />
          </div>
          <div>
            <label className="field-l">Custom Wallet Shares & Execute</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="number"
                className="inp"
                min={1}
                value={manualShare}
                onChange={(e) => setManualShare(e.target.value)}
              />
              <button className="btn btn-gold btn-sm" disabled={busy} onClick={executeSingleManual}>
                Set Single
              </button>
            </div>
          </div>
        </div>
      </Panel>

      {/* Users Table */}
      <Panel
        title={`DAO Eligibility Candidates (${filteredUsers.length})`}
        sub="1 base share for DAO qualification; additional shares from weekly matching ($2,500 per share)"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={toggleSelectAllFiltered}>
              {filteredUsers.length > 0 &&
              filteredUsers.every((u) => selectedMap[u.address.toLowerCase()])
                ? "Deselect All Filtered"
                : "Select All Filtered"}
            </button>
            <button className="btn btn-sm" onClick={() => refreshUsers()} disabled={usersLoading}>
              {usersLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        }
      >
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 38 }}>
                  <input
                    type="checkbox"
                    checked={
                      filteredUsers.length > 0 &&
                      filteredUsers.every((u) => selectedMap[u.address.toLowerCase()])
                    }
                    onChange={toggleSelectAllFiltered}
                  />
                </th>
                <th>User</th>
                <th>DAO Qualification</th>
                <th className="num">20d Window Direct</th>
                <th className="num">20d Window Matching</th>
                <th className="num">Weekly Matching</th>
                <th className="num">Suggested Shares</th>
                <th>Shares to Register</th>
                <th className="num">Est. Pool Share</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 32 }} className="muted">
                    No users match the current DAO filter. Switch to &quot;All Users&quot; to select any user manually.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const key = u.address.toLowerCase();
                  const isChecked = Boolean(selectedMap[key]);
                  const shareStr = getEffectiveShares(u);
                  const shareNum = Math.max(0, Math.floor(Number(shareStr || "0")));
                  const estUsdWei =
                    isChecked && totalSelectedShares > 0 && shareNum > 0
                      ? ((p?.daoPoolTotal ?? 0n) * BigInt(shareNum)) /
                        BigInt(totalSelectedShares)
                      : 0n;

                  return (
                    <tr key={u.address}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setSelectedMap((prev) => ({
                              ...prev,
                              [key]: e.target.checked,
                            }))
                          }
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Pill tone="gold">{u.userCode}</Pill>
                          <Addr text={u.address} link />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {u.daoLifetime && <Pill tone="gold">Lifetime</Pill>}
                          {u.daoQualifiedByWindow && <Pill tone="green">20d Window</Pill>}
                          {!u.daoLifetime && !u.daoQualifiedByWindow && (
                            <Pill tone="muted">Manual</Pill>
                          )}
                        </div>
                      </td>
                      <td className="num mono">${fmt18(u.windowDirect, 2)}</td>
                      <td className="num mono">${fmt18(u.windowMatching, 2)}</td>
                      <td className="num mono">${fmt18(u.weeklyMatching, 2)}</td>
                      <td className="num mono t-gold">{String(u.suggestedDaoShares)}</td>
                      <td style={{ width: 150 }}>
                        <input
                          type="number"
                          min={1}
                          className="inp"
                          style={{ padding: "5px 8px", fontSize: 12 }}
                          value={shareStr}
                          onChange={(e) =>
                            setSharesMap((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="num mono t-gold">
                        {isChecked ? `$${fmt18(estUsdWei, 2)}` : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
