"use client";

import React, { useMemo, useState } from "react";
import { formatUnits, isAddress, parseUnits } from "viem";
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

function toNum(wei: bigint): number {
  return Number(formatUnits(wei, 18));
}

export default function WriteTokensSecurityPage() {
  const { overview, users, usersLoading, refresh, refreshUsers } = useAdmin();

  // Table Filters
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<
    "ALL" | "HAS_TOKENS" | "BLACKLISTED" | "HAS_INCOME" | "RANK_OR_DAO"
  >("ALL");

  // Selection & Per-row Burn Amount
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [burnAmountMap, setBurnAmountMap] = useState<Record<string, string>>({});

  // Single Action Form States
  const [singleTarget, setSingleTarget] = useState("");
  const [singleBurnAmount, setSingleBurnAmount] = useState("100");
  const [singleBlacklistStatus, setSingleBlacklistStatus] = useState<boolean>(true);

  // Tx Execution State
  const [txState, setTxState] = useState<{
    status: "idle" | "pending" | "ok" | "error";
    message?: string;
    hash?: string;
  } | null>(null);

  const isChainKeeper = Boolean(overview?.roles.isChainKeeper);
  const p = overview?.protocol;

  const getBurnAmountStr = (u: (typeof users)[number]) => {
    const key = u.address.toLowerCase();
    if (burnAmountMap[key] !== undefined) return burnAmountMap[key];
    return u.tokenBalance > 0n ? toNum(u.tokenBalance).toFixed(2) : "0";
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchAddr = u.address.toLowerCase().includes(q);
        const matchId = String(u.userId).includes(q) || u.userCode.toLowerCase().includes(q);
        if (!matchAddr && !matchId) return false;
      }
      if (filterMode === "HAS_TOKENS" && u.tokenBalance <= 0n) return false;
      if (filterMode === "BLACKLISTED" && !u.isBlacklisted) return false;
      if (filterMode === "HAS_INCOME" && u.totalIncome <= 0n && u.balance <= 0n) return false;
      if (
        filterMode === "RANK_OR_DAO" &&
        u.storeRank === 0 &&
        !u.daoLifetime &&
        u.matchingBusiness <= 0n
      ) {
        return false;
      }
      return true;
    });
  }, [users, search, filterMode]);

  const selectedUsers = useMemo(() => {
    return filteredUsers.filter((u) => selectedMap[u.address.toLowerCase()]);
  }, [filteredUsers, selectedMap]);

  const summary = useMemo(() => {
    return users.reduce(
      (acc, u) => {
        acc.totalTokenBalance += u.tokenBalance;
        acc.totalIncomeBalance += u.totalIncome;
        acc.totalWithdrawable += u.balance;
        if (u.isBlacklisted) acc.blacklistedCount += 1;
        return acc;
      },
      {
        totalTokenBalance: 0n,
        totalIncomeBalance: 0n,
        totalWithdrawable: 0n,
        blacklistedCount: 0,
      }
    );
  }, [users]);

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

  // --- SINGLE ACTIONS ---
  const handleSingleBurnFrom = async (address: string, amountStr: string) => {
    if (!isAddress(address.trim())) {
      setTxState({
        status: "error",
        message: "Valid user wallet address is required for burnFrom.",
      });
      return;
    }
    const amt = Number(amountStr);
    if (!amt || amt <= 0) {
      setTxState({
        status: "error",
        message: "Burn amount must be greater than 0 ARI.",
      });
      return;
    }
    setTxState({
      status: "pending",
      message: `Burning ${amountStr} ARI from ${address.trim().slice(0, 8)}…`,
    });
    try {
      const res = await writeProtocol("burnFrom", [
        address.trim(),
        parseUnits(amountStr, 18),
      ]);
      setTxState({
        status: "ok",
        message: `Burned ${amountStr} ARI from ${address.trim().slice(0, 8)}…`,
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

  const handleSingleBlacklist = async (address: string, status: boolean) => {
    if (!isAddress(address.trim())) {
      setTxState({
        status: "error",
        message: "Valid user wallet address is required for setBlacklist.",
      });
      return;
    }
    setTxState({
      status: "pending",
      message: `${status ? "Blacklisting" : "Unblacklisting"} ${address.trim().slice(0, 8)}…`,
    });
    try {
      const res = await writeProtocol("setBlacklist", [address.trim(), status]);
      setTxState({
        status: "ok",
        message: `Updated blacklist status (${status}) for ${address.trim().slice(0, 8)}…`,
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

  const handleSingleDaoRankReset = async (address: string) => {
    if (!isAddress(address.trim())) {
      setTxState({
        status: "error",
        message: "Valid user wallet address is required for resetRankBusinessDao.",
      });
      return;
    }
    setTxState({
      status: "pending",
      message: `Resetting Rank, Business & DAO for ${address.trim().slice(0, 8)}…`,
    });
    try {
      const res = await writeProtocol("resetRankBusinessDao", [address.trim()]);
      setTxState({
        status: "ok",
        message: `Executed resetRankBusinessDao for ${address.trim().slice(0, 8)}…`,
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

  // --- BATCH ACTIONS ---
  const handleBatchBlacklist = async (status: boolean) => {
    if (selectedUsers.length === 0) {
      setTxState({
        status: "error",
        message: "Select at least one user in the table for setBlacklistBatch.",
      });
      return;
    }
    const addresses = selectedUsers.map((u) => u.address);
    setTxState({
      status: "pending",
      message: `Submitting setBlacklistBatch for ${addresses.length} wallet(s) (status=${status})...`,
    });
    try {
      const res = await writeProtocol("setBlacklistBatch", [addresses, status]);
      setTxState({
        status: "ok",
        message: `Executed setBlacklistBatch for ${addresses.length} wallet(s) → ${
          status ? "BLACKLISTED" : "UNBLACKLISTED"
        }`,
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

  const handleBatchBurnFrom = async () => {
    const validTargets = selectedUsers.filter(
      (u) => Number(getBurnAmountStr(u)) > 0
    );
    if (validTargets.length === 0) {
      setTxState({
        status: "error",
        message: "Select at least one user with a Burn ARI amount > 0.",
      });
      return;
    }
    try {
      let lastHash = "";
      for (let i = 0; i < validTargets.length; i++) {
        const u = validTargets[i];
        const amtStr = getBurnAmountStr(u);
        setTxState({
          status: "pending",
          message: `[${i + 1}/${validTargets.length}] Burning ${amtStr} ARI from ${u.userCode} (${u.address.slice(
            0,
            8
          )}…)`,
        });
        const res = await writeProtocol("burnFrom", [
          u.address,
          parseUnits(amtStr, 18),
        ]);
        lastHash = res.hash;
      }
      setTxState({
        status: "ok",
        message: `Completed batch burnFrom for ${validTargets.length} wallet(s).`,
        hash: lastHash,
      });
      await Promise.all([refresh(), refreshUsers()]);
    } catch (e: unknown) {
      setTxState({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const handleBatchDaoRankReset = async () => {
    if (selectedUsers.length === 0) {
      setTxState({
        status: "error",
        message: "Select at least one user to execute batch resetRankBusinessDao.",
      });
      return;
    }
    try {
      let lastHash = "";
      for (let i = 0; i < selectedUsers.length; i++) {
        const u = selectedUsers[i];
        setTxState({
          status: "pending",
          message: `[${i + 1}/${selectedUsers.length}] Executing resetRankBusinessDao(${
            u.userCode
          })...`,
        });
        const res = await writeProtocol("resetRankBusinessDao", [u.address]);
        lastHash = res.hash;
      }
      setTxState({
        status: "ok",
        message: `Completed resetRankBusinessDao for ${selectedUsers.length} wallet(s).`,
        hash: lastHash,
      });
      await Promise.all([refresh(), refreshUsers()]);
    } catch (e: unknown) {
      setTxState({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const busy = txState?.status === "pending";

  return (
    <div className="stack">
      <PageTitle
        title="10. Token Balance, Burn, Blacklist & DAO Rank Reset"
        sub="Write Action 10 — All users ARI token balance & total income balance, plus Single & Batch execution for burnFrom, Blacklist, and DAO/Rank/Business Reset"
        right={
          <button className="btn btn-sm" onClick={() => refreshUsers()} disabled={usersLoading}>
            {usersLoading ? "Refreshing..." : "Refresh Users"}
          </button>
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
          label="Total User Token Balance"
          value={`${fmt18(summary.totalTokenBalance, 2)} ARI`}
          hint={`Total Supply: ${fmt18(p?.totalSupply, 2)} ARI`}
        />
        <Mini
          label="Total User Income Balance"
          value={`$${fmt18(summary.totalIncomeBalance, 2)}`}
          hint={`Withdrawable: $${fmt18(summary.totalWithdrawable, 2)}`}
        />
        <Mini
          label="Blacklisted Wallets"
          value={`${summary.blacklistedCount} / ${users.length}`}
          hint="Frozen on ARITOHAM token"
        />
        <Mini
          label="Selected for Batch"
          value={`${selectedUsers.length} Wallets`}
          hint="Ready for Batch Burn / Blacklist / Reset"
        />
      </div>

      {/* Single Wallet Direct Execution Panel */}
      <Panel
        title="Single Wallet Direct Execution (burnFrom / setBlacklist / resetRankBusinessDao)"
        sub="Execute any of the 3 security & reset operations on a single target wallet address"
      >
        <div className="grid cols-4">
          <div>
            <label className="field-l">Target User Wallet</label>
            <input
              className="inp"
              placeholder="0x..."
              value={singleTarget}
              onChange={(e) => setSingleTarget(e.target.value)}
            />
          </div>
          <div>
            <label className="field-l">1. Single burnFrom (ARI Amount)</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="number"
                className="inp"
                value={singleBurnAmount}
                onChange={(e) => setSingleBurnAmount(e.target.value)}
              />
              <button
                className="btn btn-danger btn-sm"
                disabled={busy}
                onClick={() => handleSingleBurnFrom(singleTarget, singleBurnAmount)}
              >
                Burn ARI
              </button>
            </div>
          </div>
          <div>
            <label className="field-l">2. Single setBlacklist</label>
            <div style={{ display: "flex", gap: 6 }}>
              <select
                className="sel"
                value={singleBlacklistStatus ? "true" : "false"}
                onChange={(e) => setSingleBlacklistStatus(e.target.value === "true")}
              >
                <option value="true">Blacklist (Freeze)</option>
                <option value="false">Unblacklist (Unfreeze)</option>
              </select>
              <button
                className="btn btn-gold btn-sm"
                disabled={busy}
                onClick={() => handleSingleBlacklist(singleTarget, singleBlacklistStatus)}
              >
                Apply
              </button>
            </div>
          </div>
          <div>
            <label className="field-l">3. Single DAO & Rank Reset</label>
            <button
              className="btn btn-danger btn-block"
              disabled={busy}
              onClick={() => handleSingleDaoRankReset(singleTarget)}
            >
              resetRankBusinessDao
            </button>
          </div>
        </div>
      </Panel>

      {/* Batch Toolbar + Filters */}
      <Panel
        title={`Batch Actions & User Filter (${selectedUsers.length} Selected)`}
        sub="Select multiple users in the table below and execute Batch Burn, Batch Blacklist/Unblacklist, or Batch DAO & Rank Reset"
        right={
          <div className="seg">
            <button
              className={filterMode === "ALL" ? "active" : ""}
              onClick={() => setFilterMode("ALL")}
            >
              All ({users.length})
            </button>
            <button
              className={filterMode === "HAS_TOKENS" ? "active" : ""}
              onClick={() => setFilterMode("HAS_TOKENS")}
            >
              Has ARI Tokens
            </button>
            <button
              className={filterMode === "HAS_INCOME" ? "active" : ""}
              onClick={() => setFilterMode("HAS_INCOME")}
            >
              Has Income
            </button>
            <button
              className={filterMode === "BLACKLISTED" ? "active" : ""}
              onClick={() => setFilterMode("BLACKLISTED")}
            >
              Blacklisted ({summary.blacklistedCount})
            </button>
            <button
              className={filterMode === "RANK_OR_DAO" ? "active" : ""}
              onClick={() => setFilterMode("RANK_OR_DAO")}
            >
              Ranked / DAO
            </button>
          </div>
        }
      >
        <div className="grid cols-5">
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
            <label className="field-l">Batch Burn ARI</label>
            <button
              className="btn btn-danger btn-block"
              disabled={busy || selectedUsers.length === 0}
              onClick={handleBatchBurnFrom}
            >
              Batch burnFrom ({selectedUsers.length})
            </button>
          </div>
          <div>
            <label className="field-l">Batch Blacklist (Native Tx)</label>
            <button
              className="btn btn-danger btn-block"
              disabled={busy || selectedUsers.length === 0}
              onClick={() => handleBatchBlacklist(true)}
            >
              Blacklist Selected ({selectedUsers.length})
            </button>
          </div>
          <div>
            <label className="field-l">Batch Unblacklist (Native Tx)</label>
            <button
              className="btn btn-gold btn-block"
              disabled={busy || selectedUsers.length === 0}
              onClick={() => handleBatchBlacklist(false)}
            >
              Unblacklist Selected ({selectedUsers.length})
            </button>
          </div>
          <div>
            <label className="field-l">Batch DAO & Rank Reset</label>
            <button
              className="btn btn-danger btn-block"
              disabled={busy || selectedUsers.length === 0}
              onClick={handleBatchDaoRankReset}
            >
              Batch DAO/Rank Reset ({selectedUsers.length})
            </button>
          </div>
        </div>
      </Panel>

      {/* All Users Token Balance & Income Balance Table */}
      <Panel
        title={`All Users Token Balance, Total Income Balance & Security Controls (${filteredUsers.length})`}
        sub="Every row displays ARI Token Balance, Total Income Balance, Withdrawable Balance, Rank/DAO state, and instant Single Action buttons"
        right={
          <button className="btn btn-sm" onClick={toggleSelectAllFiltered}>
            {filteredUsers.length > 0 &&
            filteredUsers.every((u) => selectedMap[u.address.toLowerCase()])
              ? "Deselect All Filtered"
              : "Select All Filtered"}
          </button>
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
                <th className="num">ARI Token Balance</th>
                <th className="num">Total Income Balance</th>
                <th className="num">Available Balance</th>
                <th>Rank & DAO State</th>
                <th>Blacklist Status</th>
                <th>Burn Amount (ARI)</th>
                <th className="num">Single Row Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 32 }} className="muted">
                    No users match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const key = u.address.toLowerCase();
                  const isChecked = Boolean(selectedMap[key]);
                  const burnAmt = getBurnAmountStr(u);

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
                      <td className="num mono t-gold">
                        {fmt18(u.tokenBalance, 2)} ARI
                      </td>
                      <td className="num mono t-ok">
                        ${fmt18(u.totalIncome, 2)}
                      </td>
                      <td className="num mono">
                        ${fmt18(u.balance, 2)}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <Pill tone={u.storeRank > 0 ? "gold" : "muted"}>
                            #{u.storeRank} {u.rankName}
                          </Pill>
                          {u.daoLifetime && <Pill tone="green">DAO Lifetime</Pill>}
                        </div>
                      </td>
                      <td>
                        {u.isBlacklisted ? (
                          <Pill tone="red">BLACKLISTED</Pill>
                        ) : (
                          <Pill tone="green">CLEAN</Pill>
                        )}
                      </td>
                      <td style={{ width: 145 }}>
                        <input
                          type="number"
                          step="0.01"
                          className="inp"
                          style={{ padding: "5px 8px", fontSize: 12 }}
                          value={burnAmt}
                          onChange={(e) =>
                            setBurnAmountMap((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="num">
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={busy || Number(burnAmt) <= 0}
                            onClick={() => handleSingleBurnFrom(u.address, burnAmt)}
                          >
                            Burn
                          </button>
                          <button
                            className="btn btn-sm"
                            disabled={busy}
                            onClick={() => handleSingleBlacklist(u.address, !u.isBlacklisted)}
                          >
                            {u.isBlacklisted ? "Unblacklist" : "Blacklist"}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={busy}
                            onClick={() => handleSingleDaoRankReset(u.address)}
                          >
                            DAO/Rank Reset
                          </button>
                        </div>
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
