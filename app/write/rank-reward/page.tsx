"use client";

import React, { useMemo, useState } from "react";
import { useAdmin } from "@/components/AdminContext";
import {
  fmt18,
  PROTOCOL_RANK_REWARDS,
  RANK_NAMES,
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

export default function WriteRankRewardPage() {
  const { overview, users, usersLoading, refresh, refreshUsers } = useAdmin();

  // Filters
  const [search, setSearch] = useState("");
  const [qualFilter, setQualFilter] = useState<"UPGRADE_ELIGIBLE" | "ALL" | "QUALIFIED_ANY">(
    "UPGRADE_ELIGIBLE"
  );
  const [currentRankFilter, setCurrentRankFilter] = useState<string>("ALL");
  const [targetRankFilter, setTargetRankFilter] = useState<string>("ALL");

  // Selection & Overrides (protocol rank_id 0..8)
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [rankIdOverrideMap, setRankIdOverrideMap] = useState<Record<string, number>>({});

  // Execution state
  const [txState, setTxState] = useState<{
    status: "idle" | "pending" | "ok" | "error";
    message?: string;
    hash?: string;
  } | null>(null);

  const isChainKeeper = Boolean(overview?.roles.isChainKeeper);

  // Note: On ARITOHAMProtocol, updateRewardIncome(user, rank_id) requires rank_id > u.currentRank
  const getTargetRankId = (u: (typeof users)[number]) => {
    const key = u.address.toLowerCase();
    if (rankIdOverrideMap[key] !== undefined) return rankIdOverrideMap[key];
    const minValidRankId = Math.min(8, u.protocolRankId + 1);
    if (u.qualifiedProtocolRankId >= minValidRankId) {
      return u.qualifiedProtocolRankId;
    }
    return minValidRankId;
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchAddr = u.address.toLowerCase().includes(q);
        const matchId = String(u.userId).includes(q) || u.userCode.toLowerCase().includes(q);
        if (!matchAddr && !matchId) return false;
      }
      if (qualFilter === "UPGRADE_ELIGIBLE" && !u.isRankUpgradeReady) return false;
      if (qualFilter === "QUALIFIED_ANY" && u.qualifiedStoreRank === 0) return false;
      if (currentRankFilter !== "ALL" && u.storeRank !== Number(currentRankFilter)) return false;
      if (targetRankFilter !== "ALL" && u.qualifiedStoreRank !== Number(targetRankFilter))
        return false;
      return true;
    });
  }, [users, search, qualFilter, currentRankFilter, targetRankFilter]);

  const selectedUsers = useMemo(() => {
    return filteredUsers.filter((u) => selectedMap[u.address.toLowerCase()]);
  }, [filteredUsers, selectedMap]);

  const totalSelectedRewardUsd = useMemo(() => {
    return selectedUsers.reduce((acc, u) => {
      const rankId = getTargetRankId(u);
      const tier = PROTOCOL_RANK_REWARDS.find((r) => r.rankId === rankId);
      return acc + (tier?.rewardUsd ?? 0);
    }, 0);
  }, [selectedUsers, rankIdOverrideMap]);

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

  const autoSelectUpgradeReady = () => {
    const next: Record<string, boolean> = {};
    const nextOverrides = { ...rankIdOverrideMap };
    users.forEach((u) => {
      if (u.isRankUpgradeReady && u.qualifiedStoreRank > 0) {
        const minValidRankId = Math.min(8, u.protocolRankId + 1);
        const targetId = Math.max(minValidRankId, u.qualifiedProtocolRankId);
        next[u.address.toLowerCase()] = true;
        nextOverrides[u.address.toLowerCase()] = targetId;
      }
    });
    setSelectedMap(next);
    setRankIdOverrideMap(nextOverrides);
  };

  const executeSingleRankReward = async (userAddress: string, rankId: number) => {
    const tier = PROTOCOL_RANK_REWARDS.find((r) => r.rankId === rankId);
    setTxState({
      status: "pending",
      message: `Submitting updateRewardIncome(${userAddress.slice(0, 8)}…, rank_id=${rankId} / #${tier?.storeRank} ${tier?.name})...`,
    });
    try {
      const res = await writeProtocol("updateRewardIncome", [userAddress, BigInt(rankId)]);
      setTxState({
        status: "ok",
        message: `Upgraded ${userAddress.slice(0, 8)}… to Rank #${tier?.storeRank} (${tier?.name})`,
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

  const executeSelectedBatch = async () => {
    if (selectedUsers.length === 0) {
      setTxState({
        status: "error",
        message: "Select at least one user to execute rank reward upgrades.",
      });
      return;
    }
    try {
      let lastHash = "";
      for (let i = 0; i < selectedUsers.length; i++) {
        const u = selectedUsers[i];
        const rankId = getTargetRankId(u);
        const tier = PROTOCOL_RANK_REWARDS.find((r) => r.rankId === rankId);
        setTxState({
          status: "pending",
          message: `[${i + 1}/${selectedUsers.length}] Upgrading ${u.userCode} (${u.address.slice(
            0,
            8
          )}…) to Rank #${tier?.storeRank} (${tier?.name})...`,
        });
        const res = await writeProtocol("updateRewardIncome", [u.address, BigInt(rankId)]);
        lastHash = res.hash;
      }
      setTxState({
        status: "ok",
        message: `Completed Rank Reward upgrades for ${selectedUsers.length} user(s).`,
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

  const upgradeReadyCount = users.filter((u) => u.isRankUpgradeReady).length;
  const busy = txState?.status === "pending";

  return (
    <div className="stack">
      <PageTitle
        title="6. Rank Reward Upgrade (Write)"
        sub="Write Action 6 — Filter users eligible for next rank upgrade, filter by rank or qualification, select users, and execute updateRewardIncome(user, rank_id)"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-gold btn-sm" onClick={autoSelectUpgradeReady}>
              Auto-Select Eligible to Upgrade ({upgradeReadyCount})
            </button>
            <button className="btn btn-sm" onClick={() => refreshUsers()} disabled={usersLoading}>
              {usersLoading ? "Refreshing..." : "Refresh Users"}
            </button>
          </div>
        }
      />

      <RoleRequirementBanner
        roleName="ChainKeeper"
        requiredAddress={overview?.protocol.chainKeeper}
        hasRole={isChainKeeper}
      />

      <TxFeedback state={txState} />

      {/* KPIs */}
      <div className="grid cols-4">
        <Mini
          label="Eligible for Upgrade"
          value={String(upgradeReadyCount)}
          hint="Meets next rank criteria on-chain"
        />
        <Mini
          label="Filtered Candidates"
          value={String(filteredUsers.length)}
          hint={`Out of ${users.length} total users`}
        />
        <Mini
          label="Selected for Tx"
          value={String(selectedUsers.length)}
          hint="Checked rows ready to execute"
        />
        <Mini
          label="Total Selected Reward"
          value={`$${totalSelectedRewardUsd.toLocaleString()}`}
          hint="One-time Rank Reward payout"
        />
      </div>

      {/* Filter & Execution Bar */}
      <Panel
        title="Filter & Batch Execute Rank Rewards"
        sub="Filter by next rank eligible to upgrade, current rank, or qualified rank tier, then select and execute"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <div className="seg">
              <button
                className={qualFilter === "UPGRADE_ELIGIBLE" ? "active" : ""}
                onClick={() => setQualFilter("UPGRADE_ELIGIBLE")}
              >
                Next Rank Eligible ({upgradeReadyCount})
              </button>
              <button
                className={qualFilter === "QUALIFIED_ANY" ? "active" : ""}
                onClick={() => setQualFilter("QUALIFIED_ANY")}
              >
                Meets Rank ≥ 1
              </button>
              <button
                className={qualFilter === "ALL" ? "active" : ""}
                onClick={() => setQualFilter("ALL")}
              >
                All Users ({users.length})
              </button>
            </div>
            <button
              className="btn btn-gold btn-sm"
              disabled={busy || selectedUsers.length === 0}
              onClick={executeSelectedBatch}
            >
              {busy
                ? "Executing..."
                : `Execute Selected (${selectedUsers.length}) — $${totalSelectedRewardUsd.toLocaleString()}`}
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
            <label className="field-l">Filter by Current Rank</label>
            <select
              className="sel"
              value={currentRankFilter}
              onChange={(e) => setCurrentRankFilter(e.target.value)}
            >
              <option value="ALL">All Current Ranks</option>
              {RANK_NAMES.map((name, idx) => (
                <option key={name} value={String(idx)}>
                  Rank #{idx} — {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-l">Filter by Qualified Rank</label>
            <select
              className="sel"
              value={targetRankFilter}
              onChange={(e) => setTargetRankFilter(e.target.value)}
            >
              <option value="ALL">All Qualified Ranks</option>
              {RANK_NAMES.map((name, idx) => (
                <option key={name} value={String(idx)}>
                  Qualified #{idx} — {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Panel>

      {/* Candidate Table */}
      <Panel
        title={`Rank Reward Candidates (${filteredUsers.length})`}
        sub="Note: ARITOHAMProtocol.updateRewardIncome requires rank_id > user.currentRank (so rank_id must be strictly greater than current protocol rank_id)"
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
                <th>Current Rank</th>
                <th>Qualified Rank</th>
                <th className="num">Self Staked</th>
                <th className="num">Matching Biz</th>
                <th className="num">Active Directs</th>
                <th>Target rank_id (1–8)</th>
                <th className="num">Reward Payout</th>
                <th className="num">Execute Tx</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 32 }} className="muted">
                    No users match the current rank qualification filters. Switch to &quot;All Users&quot; to manually reward any user.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const key = u.address.toLowerCase();
                  const isChecked = Boolean(selectedMap[key]);
                  const targetRankId = getTargetRankId(u);
                  const tier = PROTOCOL_RANK_REWARDS.find((r) => r.rankId === targetRankId);

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
                        <Pill tone={u.storeRank > 0 ? "gold" : "muted"}>
                          #{u.storeRank} {u.rankName} (id={u.protocolRankId})
                        </Pill>
                      </td>
                      <td>
                        {u.isRankUpgradeReady ? (
                          <Pill tone="green">
                            UPGRADE READY → #{u.qualifiedStoreRank} {u.qualifiedRankName}
                          </Pill>
                        ) : (
                          <Pill tone="muted">
                            #{u.qualifiedStoreRank} {u.qualifiedRankName}
                          </Pill>
                        )}
                      </td>
                      <td className="num mono">${fmt18(u.totalStaked, 2)}</td>
                      <td className="num mono">${fmt18(u.matchingBusiness, 2)}</td>
                      <td className="num mono">{u.activeDirects}</td>
                      <td>
                        <select
                          className="sel"
                          style={{ padding: "5px 8px", fontSize: 12 }}
                          value={targetRankId}
                          onChange={(e) =>
                            setRankIdOverrideMap((prev) => ({
                              ...prev,
                              [key]: Number(e.target.value),
                            }))
                          }
                        >
                          {PROTOCOL_RANK_REWARDS.map((r) => {
                            const invalidOnChain = r.rankId <= u.protocolRankId;
                            return (
                              <option
                                key={r.rankId}
                                value={r.rankId}
                                disabled={invalidOnChain}
                              >
                                rank_id {r.rankId} → #{r.storeRank} {r.name} ($
                                {r.rewardUsd.toLocaleString()})
                                {invalidOnChain ? " [≤ currentRank]" : ""}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td className="num mono t-gold">
                        ${(tier?.rewardUsd ?? 0).toLocaleString()}
                      </td>
                      <td className="num">
                        <button
                          className="btn btn-gold btn-sm"
                          disabled={busy || targetRankId <= u.protocolRankId}
                          onClick={() => executeSingleRankReward(u.address, targetRankId)}
                        >
                          Reward #{tier?.storeRank}
                        </button>
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
