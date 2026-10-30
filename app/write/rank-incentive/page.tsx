"use client";

import React, { useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAdmin } from "@/components/AdminContext";
import {
  fmt18,
  PROTOCOL_RANK_REWARDS,
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

export default function WriteRankIncentivePage() {
  const { overview, users, usersLoading, refresh, refreshUsers } = useAdmin();

  // Filters
  const [search, setSearch] = useState("");
  const [eligMode, setEligMode] = useState<
    "RANKED_ELIGIBLE" | "RANKED_OR_QUALIFIED" | "ALL_USERS"
  >("RANKED_OR_QUALIFIED");
  const [rankFilter, setRankFilter] = useState<string>("ALL");

  // Selection & Amount Overrides
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [amountMap, setAmountMap] = useState<Record<string, string>>({});
  const [fixedBulkAmount, setFixedBulkAmount] = useState<string>("50");

  // Execution state
  const [txState, setTxState] = useState<{
    status: "idle" | "pending" | "ok" | "error";
    message?: string;
    hash?: string;
  } | null>(null);

  const isChainKeeper = Boolean(overview?.roles.isChainKeeper);
  const dailyRewardPpm = Number(overview?.store.dailyRewardPpm ?? 12530n);
  const dailyRewardPct = (dailyRewardPpm / 10000).toFixed(4);

  // Default formula: Current Rank Matching Business × Rank Incentive % × dailyRewardPpm
  const getEffectiveAmountStr = (u: (typeof users)[number]) => {
    const key = u.address.toLowerCase();
    if (amountMap[key] !== undefined) return amountMap[key];
    if (u.suggestedIncentiveRankMatchingPpmUsd > 0n) {
      return toNum(u.suggestedIncentiveRankMatchingPpmUsd).toFixed(4);
    }
    if (u.suggestedIncentiveUserMatchingPpmUsd > 0n) {
      return toNum(u.suggestedIncentiveUserMatchingPpmUsd).toFixed(4);
    }
    return "0";
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchAddr = u.address.toLowerCase().includes(q);
        const matchId = String(u.userId).includes(q) || u.userCode.toLowerCase().includes(q);
        if (!matchAddr && !matchId) return false;
      }
      if (eligMode === "RANKED_ELIGIBLE" && u.storeRank < 1) return false;
      if (
        eligMode === "RANKED_OR_QUALIFIED" &&
        u.storeRank < 1 &&
        u.qualifiedStoreRank < 1
      ) {
        return false;
      }
      const effectiveRank = u.storeRank > 0 ? u.storeRank : u.qualifiedStoreRank;
      if (rankFilter !== "ALL" && effectiveRank !== Number(rankFilter)) return false;
      return true;
    });
  }, [users, search, eligMode, rankFilter]);

  const selectedUsers = useMemo(() => {
    return filteredUsers.filter((u) => selectedMap[u.address.toLowerCase()]);
  }, [filteredUsers, selectedMap]);

  const totalSelectedUsd = useMemo(() => {
    return selectedUsers.reduce((acc, u) => {
      const val = Number(getEffectiveAmountStr(u) || "0");
      return acc + (Number.isFinite(val) ? val : 0);
    }, 0);
  }, [selectedUsers, amountMap]);

  const autoFillByFormula = (
    mode:
      | "RANK_MATCHING_PPM"
      | "USER_MATCHING_PPM"
      | "DAILY_MATCHING_PPM"
      | "RANK_MATCHING_BASE"
      | "DAILY_MATCHING"
      | "WEEKLY_MATCHING"
      | "FIXED"
  ) => {
    const nextAmounts = { ...amountMap };
    const nextSel = { ...selectedMap };
    filteredUsers.forEach((u) => {
      const key = u.address.toLowerCase();
      let amt = 0;
      if (mode === "RANK_MATCHING_PPM") {
        amt = toNum(u.suggestedIncentiveRankMatchingPpmUsd);
      } else if (mode === "USER_MATCHING_PPM") {
        amt = toNum(u.suggestedIncentiveUserMatchingPpmUsd);
      } else if (mode === "DAILY_MATCHING_PPM") {
        amt = toNum(u.suggestedIncentiveDailyPpmUsd);
      } else if (mode === "RANK_MATCHING_BASE") {
        amt = toNum(u.suggestedIncentiveRankMatchingUsd);
      } else if (mode === "DAILY_MATCHING") {
        amt = toNum(u.suggestedIncentiveDailyUsd);
      } else if (mode === "WEEKLY_MATCHING") {
        amt = toNum(u.suggestedIncentiveWeeklyUsd);
      } else {
        amt = Number(fixedBulkAmount || "0");
      }

      nextAmounts[key] = amt > 0 ? amt.toFixed(4) : "0";
      if (amt > 0) {
        nextSel[key] = true;
      }
    });
    setAmountMap(nextAmounts);
    setSelectedMap(nextSel);
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

  const executeSingleIncentive = async (userAddress: string, amountStr: string) => {
    const num = Number(amountStr);
    if (!num || num <= 0) {
      setTxState({
        status: "error",
        message: "Incentive amount must be greater than $0.",
      });
      return;
    }
    setTxState({
      status: "pending",
      message: `Submitting updateRankIncentive(${userAddress.slice(0, 8)}…, $${amountStr})...`,
    });
    try {
      const res = await writeProtocol("updateRankIncentive", [
        userAddress,
        parseUnits(amountStr, 18),
      ]);
      setTxState({
        status: "ok",
        message: `Credited $${amountStr} Rank Incentive to ${userAddress.slice(0, 8)}…`,
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
    const validTargets = selectedUsers.filter(
      (u) => Number(getEffectiveAmountStr(u)) > 0
    );
    if (validTargets.length === 0) {
      setTxState({
        status: "error",
        message: "Select at least one user with an incentive amount > $0.",
      });
      return;
    }
    try {
      let lastHash = "";
      for (let i = 0; i < validTargets.length; i++) {
        const u = validTargets[i];
        const amtStr = getEffectiveAmountStr(u);
        setTxState({
          status: "pending",
          message: `[${i + 1}/${validTargets.length}] Crediting $${amtStr} Rank Incentive to ${
            u.userCode
          } (${u.rankName})...`,
        });
        const res = await writeProtocol("updateRankIncentive", [
          u.address,
          parseUnits(amtStr, 18),
        ]);
        lastHash = res.hash;
      }
      setTxState({
        status: "ok",
        message: `Distributed Rank Incentive to ${validTargets.length} user(s).`,
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

  const rankedCount = users.filter((u) => u.storeRank >= 1).length;
  const rankedOrQualifiedCount = users.filter(
    (u) => u.storeRank >= 1 || u.qualifiedStoreRank >= 1
  ).length;
  const busy = txState?.status === "pending";

  return (
    <div className="stack">
      <PageTitle
        title="7. Rank Incentive Distribution (Write)"
        sub={`Write Action 7 — Auto-fill Rank Incentive by Current Rank Matching Business × Rank Incentive % × dailyRewardPpm (${dailyRewardPct}%) and execute updateRankIncentive(user, amount)`}
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-gold btn-sm"
              onClick={() => autoFillByFormula("RANK_MATCHING_PPM")}
            >
              Auto-Fill: Rank Matching × Incentive % × dailyRewardPpm (
              {dailyRewardPct}%)
            </button>
            <button
              className="btn btn-sm"
              onClick={() => refreshUsers()}
              disabled={usersLoading}
            >
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
      <div className="grid cols-5">
        <Mini
          label="Rank Incentive Eligible"
          value={`${rankedOrQualifiedCount} Users`}
          hint={`On-Chain Ranked: ${rankedCount} • Total: ${users.length}`}
        />
        <Mini
          label="dailyRewardPpm (DataStore)"
          value={`${dailyRewardPpm.toLocaleString()} ppm`}
          hint={`${dailyRewardPct}% daily reward rate`}
        />
        <Mini
          label="Filtered Candidates"
          value={String(filteredUsers.length)}
          hint="Matching current filter view"
        />
        <Mini
          label="Selected for Payout"
          value={String(selectedUsers.length)}
          hint="Checked rows in table"
        />
        <Mini
          label="Total Batch Incentive"
          value={`$${totalSelectedUsd.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })}`}
          hint="Aggregate USD to distribute"
        />
      </div>

      {/* Filter & Auto-Fill Controls */}
      <Panel
        title="Filter Eligible Users & Auto-Fill Options"
        sub="Auto-fill amounts using Current Rank Matching Business × Rank Incentive % × dailyRewardPpm, User Matching Business, or Fixed USD"
        right={
          <button
            className="btn btn-gold btn-sm"
            disabled={busy || selectedUsers.length === 0}
            onClick={executeSelectedBatch}
          >
            {busy
              ? "Executing..."
              : `Execute Selected (${
                  selectedUsers.length
                }) — $${totalSelectedUsd.toFixed(4)}`}
          </button>
        }
      >
        <div className="grid cols-4" style={{ marginBottom: 12 }}>
          <div>
            <label className="field-l">Eligibility Mode</label>
            <select
              className="sel"
              value={eligMode}
              onChange={(e) => setEligMode(e.target.value as typeof eligMode)}
            >
              <option value="RANKED_OR_QUALIFIED">
                Ranked or Qualified (Rank ≥ 1) ({rankedOrQualifiedCount})
              </option>
              <option value="RANKED_ELIGIBLE">
                On-Chain Stored Rank ≥ 1 Only ({rankedCount})
              </option>
              <option value="ALL_USERS">All Users ({users.length})</option>
            </select>
          </div>
          <div>
            <label className="field-l">Filter by Rank Tier</label>
            <select
              className="sel"
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
            >
              <option value="ALL">All Ranks (1–9)</option>
              {PROTOCOL_RANK_REWARDS.map((r) => (
                <option key={r.storeRank} value={String(r.storeRank)}>
                  Rank #{r.storeRank} — {r.name} (
                  {(r.incentiveBps / 100).toFixed(1)}%)
                </option>
              ))}
            </select>
          </div>
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
            <label className="field-l">Fixed Bulk Amount ($)</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="number"
                className="inp"
                value={fixedBulkAmount}
                onChange={(e) => setFixedBulkAmount(e.target.value)}
              />
              <button
                className="btn btn-sm"
                onClick={() => autoFillByFormula("FIXED")}
              >
                Apply Fixed
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn btn-gold btn-sm"
            onClick={() => autoFillByFormula("RANK_MATCHING_PPM")}
          >
            1. Auto-Fill: Current Rank Matching Biz × Rank Incentive % ×
            dailyRewardPpm ({dailyRewardPct}%)
          </button>
          <button
            className="btn btn-sm"
            onClick={() => autoFillByFormula("USER_MATCHING_PPM")}
          >
            2. Auto-Fill: User Actual Matching Biz × Rank Incentive % ×
            dailyRewardPpm ({dailyRewardPct}%)
          </button>
          <button
            className="btn btn-sm"
            onClick={() => autoFillByFormula("DAILY_MATCHING_PPM")}
          >
            3. Auto-Fill: Daily Matching × Rank Incentive % × dailyRewardPpm
          </button>
          <button
            className="btn btn-sm"
            onClick={() => autoFillByFormula("RANK_MATCHING_BASE")}
          >
            4. Auto-Fill: Current Rank Matching Biz × Rank Incentive %
          </button>
          <button className="btn btn-sm" onClick={toggleSelectAllFiltered}>
            {filteredUsers.length > 0 &&
            filteredUsers.every((u) => selectedMap[u.address.toLowerCase()])
              ? "Deselect All Filtered"
              : "Select All Filtered"}
          </button>
        </div>
      </Panel>

      {/* Candidates Table */}
      <Panel
        title={`Rank Incentive Eligible Users (${filteredUsers.length})`}
        sub="Displays each user's Current Rank Matching Business, Rank Incentive %, dailyRewardPpm calculation, and editable payout amount"
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
                      filteredUsers.every(
                        (u) => selectedMap[u.address.toLowerCase()]
                      )
                    }
                    onChange={toggleSelectAllFiltered}
                  />
                </th>
                <th>User</th>
                <th>Rank (Stored / Qual.)</th>
                <th className="num">Rank Matching Biz</th>
                <th className="num">User Matching Biz</th>
                <th className="num">Incentive %</th>
                <th className="num">× dailyRewardPpm ({dailyRewardPct}%)</th>
                <th>Incentive Amount ($)</th>
                <th className="num">Execute</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{ textAlign: "center", padding: 32 }}
                    className="muted"
                  >
                    No users match the selected Rank Incentive filter. Switch
                    Eligibility Mode to &quot;All Users&quot; to view all
                    accounts.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const key = u.address.toLowerCase();
                  const isChecked = Boolean(selectedMap[key]);
                  const amtStr = getEffectiveAmountStr(u);
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Pill tone="gold">{u.userCode}</Pill>
                          <Addr text={u.address} link />
                        </div>
                      </td>
                      <td>
                        <div
                          style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                        >
                          <Pill tone={u.storeRank >= 1 ? "green" : "muted"}>
                            Stored: #{u.storeRank} {u.rankName}
                          </Pill>
                          {u.qualifiedStoreRank > u.storeRank && (
                            <Pill tone="gold">
                              Qual: #{u.qualifiedStoreRank}{" "}
                              {u.qualifiedRankName}
                            </Pill>
                          )}
                        </div>
                      </td>
                      <td className="num mono">
                        ${fmt18(u.currentRankMatchingUsd, 0)}
                      </td>
                      <td className="num mono">
                        ${fmt18(u.matchingBusiness, 2)}
                      </td>
                      <td className="num mono t-gold">
                        {(u.rankIncentiveBps / 100).toFixed(1)}%
                      </td>
                      <td className="num mono t-ok">
                        ${fmt18(u.suggestedIncentiveRankMatchingPpmUsd, 4)}
                      </td>
                      <td style={{ width: 175 }}>
                        <input
                          type="number"
                          step="0.0001"
                          className="inp"
                          style={{ padding: "5px 8px", fontSize: 12 }}
                          value={amtStr}
                          onChange={(e) =>
                            setAmountMap((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="num">
                        <button
                          className="btn btn-gold btn-sm"
                          disabled={busy || Number(amtStr || "0") <= 0}
                          onClick={() =>
                            executeSingleIncentive(u.address, amtStr)
                          }
                        >
                          Send ${amtStr || "0"}
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

      {/* Reference Table for Formula: Rank Matching Business × Rank Incentive % × dailyRewardPpm */}
      <Panel
        title={`Rank Incentive Formula Reference (dailyRewardPpm = ${dailyRewardPpm} / ${dailyRewardPct}%)`}
        sub="Formula: Current Rank Matching Business × Rank Incentive % × dailyRewardPpm (1.2530%)"
      >
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Rank Name</th>
                <th className="num">Current Rank Matching Business</th>
                <th className="num">Rank Incentive %</th>
                <th className="num">Matching × Incentive %</th>
                <th className="num">
                  × dailyRewardPpm ({dailyRewardPct}%) = Daily Incentive
                </th>
              </tr>
            </thead>
            <tbody>
              {PROTOCOL_RANK_REWARDS.map((r) => {
                const base = (r.matchingUsd * r.incentiveBps) / 10000;
                const daily = (base * dailyRewardPpm) / 1_000_000;
                return (
                  <tr key={r.storeRank}>
                    <td>
                      <Pill tone="gold">Rank #{r.storeRank}</Pill>
                    </td>
                    <td style={{ fontWeight: 700 }}>{r.name}</td>
                    <td className="num mono">
                      ${r.matchingUsd.toLocaleString()}
                    </td>
                    <td className="num mono t-gold">
                      {(r.incentiveBps / 100).toFixed(1)}%
                    </td>
                    <td className="num mono">${base.toLocaleString()}</td>
                    <td className="num mono t-ok">${daily.toFixed(4)} / day</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      
    </div>
  );
}
