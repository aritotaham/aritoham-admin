"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatUnits, isAddress, parseUnits, type Address } from "viem";
import { useAdmin } from "@/components/AdminContext";
import { UserKeeperModal } from "@/components/UserKeeperModal";
import {
  Addr,
  Hero,
  Icon,
  Mini,
  PageTitle,
  Panel,
  Pill,
  RoleRequirementBanner,
  Tabs,
  Tag,
  TxFeedback,
} from "@/components/ui";
import {
  fmt18,
  PROTOCOL_RANK_REWARDS,
  RANK_NAMES,
  writeProtocol,
  type MonitoredUserRow,
} from "@/lib/contract";

type EngineMode = "rank-qualify" | "incentive-batch" | "dao-auto" | "custom-batch";

type PresetFilter =
  | "all"
  | "rank_ready"
  | "dao_eligible"
  | "ranked_only"
  | "has_matching"
  | "active_only"
  | "blacklisted_only";

type IncentiveFormula =
  | "daily_matching_bps"
  | "weekly_matching_bps"
  | "matching_biz_pct"
  | "fixed_usd";

function numVal(wei: bigint): number {
  return Number(formatUnits(wei, 18));
}

export function BatchEngineView() {
  const { overview, users, usersLoading, refreshUsers, runTx } = useAdmin();
  const p = overview?.protocol;
  const r = overview?.roles;

  const [mode, setMode] = useState<EngineMode>("dao-auto");
  const [preset, setPreset] = useState<PresetFilter>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(true);

  // ───────── Universal All-Data Filter States ─────────
  const [searchQuery, setSearchQuery] = useState("");
  const [currentRankFilter, setCurrentRankFilter] = useState<string>("all");
  const [qualifiedRankFilter, setQualifiedRankFilter] = useState<string>("all");
  const [minSelfStaked, setMinSelfStaked] = useState("");
  const [minMatchingBiz, setMinMatchingBiz] = useState("");
  const [minTeamBiz, setMinTeamBiz] = useState("");
  const [minDirectBiz, setMinDirectBiz] = useState("");
  const [minDirects, setMinDirects] = useState("");
  const [minActiveDirects, setMinActiveDirects] = useState("");
  const [minWeeklyMatching, setMinWeeklyMatching] = useState("");
  const [minDailyMatching, setMinDailyMatching] = useState("");
  const [minBalanceUsd, setMinBalanceUsd] = useState("");
  const [minTotalIncomeUsd, setMinTotalIncomeUsd] = useState("");
  const [minAriBalance, setMinAriBalance] = useState("");

  // ───────── Selection & Per-Row Auto-Filled Overrides ─────────
  const [selectedAddrs, setSelectedAddrs] = useState<Record<string, boolean>>({});
  // Per-user target protocolRankId (0..8) for updateRewardIncome
  const [targetRankOverrides, setTargetRankOverrides] = useState<Record<string, number>>({});
  // Per-user USD string for updateRankIncentive
  const [incentiveAmounts, setIncentiveAmounts] = useState<Record<string, string>>({});
  const [incentiveFormula, setIncentiveFormula] =
    useState<IncentiveFormula>("daily_matching_bps");
  const [customIncentiveInput, setCustomIncentiveInput] = useState("100");
  const [bulkIncentiveCsv, setBulkIncentiveCsv] = useState("");
  const [showBulkCsv, setShowBulkCsv] = useState(false);

  // Per-user DAO shares string for setDaoEligible
  const [daoSharesMap, setDaoSharesMap] = useState<Record<string, string>>({});
  const [distributeCountInput, setDistributeCountInput] = useState("50");

  // Custom batch action states
  const [batchBurnMode, setBatchBurnMode] = useState<"full" | "fixed">("full");
  const [batchBurnFixed, setBatchBurnFixed] = useState("100");

  // Execution state
  const [batchTxState, setBatchTxState] = useState<{
    status: "idle" | "pending" | "ok" | "error";
    message?: string;
    hash?: string;
  }>({ status: "idle" });

  const [selectedKeeperUser, setSelectedKeeperUser] =
    useState<MonitoredUserRow | null>(null);

  // Auto-populate default maps whenever `users` updates
  useEffect(() => {
    setTargetRankOverrides((prev) => {
      const next = { ...prev };
      for (const u of users) {
        const key = u.address.toLowerCase();
        if (next[key] === undefined) {
          // Default to their qualifiedProtocolRankId if higher than current, else next rank tier
          const suggestedId = u.isRankUpgradeReady
            ? u.qualifiedProtocolRankId
            : Math.min(8, Math.max(0, u.storeRank));
          next[key] = suggestedId;
        }
      }
      return next;
    });

    setDaoSharesMap((prev) => {
      const next = { ...prev };
      for (const u of users) {
        const key = u.address.toLowerCase();
        if (next[key] === undefined) {
          const sh =
            u.currentCycleDaoShares > 0n
              ? u.currentCycleDaoShares
              : u.suggestedDaoShares;
          next[key] = sh.toString();
        }
      }
      return next;
    });
  }, [users]);

  // Recompute incentive amounts helper
  const autoFillIncentiveAmounts = (
    formula: IncentiveFormula,
    customVal: string,
    targetUsers: MonitoredUserRow[]
  ) => {
    const next: Record<string, string> = { ...incentiveAmounts };
    const customNum = Number(customVal) || 0;
    for (const u of targetUsers) {
      const key = u.address.toLowerCase();
      let computed = 0;
      if (formula === "daily_matching_bps") {
        computed = numVal(u.suggestedIncentiveDailyUsd);
      } else if (formula === "weekly_matching_bps") {
        computed = numVal(u.suggestedIncentiveWeeklyUsd);
      } else if (formula === "matching_biz_pct") {
        const effMatch =
          u.matchingBusiness > 0n ? u.matchingBusiness : u.teamBusiness;
        computed = (numVal(effMatch) * customNum) / 100;
      } else if (formula === "fixed_usd") {
        computed = customNum;
      }
      next[key] =
        computed > 0
          ? computed.toFixed(4).replace(/\.?0+$/, "")
          : next[key] || "0";
    }
    setIncentiveAmounts(next);
  };

  // Summary counts for presets
  const summaryCounts = useMemo(() => {
    let rankReady = 0;
    let daoEligible = 0;
    let rankedOnly = 0;
    let hasMatching = 0;
    let activeOnly = 0;
    let blacklistedOnly = 0;

    for (const u of users) {
      if (u.isRankUpgradeReady) rankReady++;
      if (u.isDaoEligibleCandidate) daoEligible++;
      if (u.storeRank > 0) rankedOnly++;
      if (
        u.dailyMatching > 0n ||
        u.weeklyMatching > 0n ||
        u.matchingBusiness > 0n ||
        u.teamBusiness > 0n
      ) {
        hasMatching++;
      }
      if (u.isActive) activeOnly++;
      if (u.isBlacklisted) blacklistedOnly++;
    }

    return {
      all: users.length,
      rankReady,
      daoEligible,
      rankedOnly,
      hasMatching,
      activeOnly,
      blacklistedOnly,
    };
  }, [users]);

  // Filtered users based on Preset + All-Data Filters
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return users.filter((u) => {
      // Preset filter
      if (preset === "rank_ready" && !u.isRankUpgradeReady) return false;
      if (preset === "dao_eligible" && !u.isDaoEligibleCandidate) return false;
      if (preset === "ranked_only" && u.storeRank === 0) return false;
      if (
        preset === "has_matching" &&
        !(
          u.dailyMatching > 0n ||
          u.weeklyMatching > 0n ||
          u.matchingBusiness > 0n ||
          u.teamBusiness > 0n
        )
      ) {
        return false;
      }
      if (preset === "active_only" && !u.isActive) return false;
      if (preset === "blacklisted_only" && !u.isBlacklisted) return false;

      // Search query
      if (q) {
        const hitAddr = u.address.toLowerCase().includes(q);
        const hitId =
          u.userCode.toLowerCase().includes(q) ||
          u.userId.toString().includes(q);
        const hitRef = u.referrer.toLowerCase().includes(q);
        const hitRank =
          u.rankName.toLowerCase().includes(q) ||
          u.qualifiedRankName.toLowerCase().includes(q);
        if (!hitAddr && !hitId && !hitRef && !hitRank) return false;
      }

      // Rank filters
      if (
        currentRankFilter !== "all" &&
        u.storeRank !== Number(currentRankFilter)
      ) {
        return false;
      }
      if (
        qualifiedRankFilter !== "all" &&
        u.qualifiedStoreRank !== Number(qualifiedRankFilter)
      ) {
        return false;
      }

      // Numeric threshold filters
      if (minSelfStaked && numVal(u.totalStaked) < Number(minSelfStaked))
        return false;
      if (
        minMatchingBiz &&
        numVal(
          u.matchingBusiness > 0n ? u.matchingBusiness : u.teamBusiness
        ) < Number(minMatchingBiz)
      ) {
        return false;
      }
      if (minTeamBiz && numVal(u.teamBusiness) < Number(minTeamBiz))
        return false;
      if (minDirectBiz && numVal(u.directBusiness) < Number(minDirectBiz))
        return false;
      if (minDirects && u.directCount < Number(minDirects)) return false;
      if (minActiveDirects && u.activeDirects < Number(minActiveDirects))
        return false;
      if (
        minWeeklyMatching &&
        numVal(u.weeklyMatching) < Number(minWeeklyMatching)
      )
        return false;
      if (
        minDailyMatching &&
        numVal(u.dailyMatching) < Number(minDailyMatching)
      )
        return false;
      if (minBalanceUsd && numVal(u.balance) < Number(minBalanceUsd))
        return false;
      if (
        minTotalIncomeUsd &&
        numVal(u.totalIncome) < Number(minTotalIncomeUsd)
      )
        return false;
      if (minAriBalance && numVal(u.tokenBalance) < Number(minAriBalance))
        return false;

      return true;
    });
  }, [
    users,
    preset,
    searchQuery,
    currentRankFilter,
    qualifiedRankFilter,
    minSelfStaked,
    minMatchingBiz,
    minTeamBiz,
    minDirectBiz,
    minDirects,
    minActiveDirects,
    minWeeklyMatching,
    minDailyMatching,
    minBalanceUsd,
    minTotalIncomeUsd,
    minAriBalance,
  ]);

  // Selected users list from filteredUsers
  const selectedUsers = useMemo(
    () =>
      filteredUsers.filter((u) => Boolean(selectedAddrs[u.address.toLowerCase()])),
    [filteredUsers, selectedAddrs]
  );

  const toggleSelectUser = (addr: string) => {
    const k = addr.toLowerCase();
    setSelectedAddrs((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const selectAllFiltered = () => {
    const next: Record<string, boolean> = { ...selectedAddrs };
    for (const u of filteredUsers) {
      next[u.address.toLowerCase()] = true;
    }
    setSelectedAddrs(next);
  };

  const clearSelection = () => {
    setSelectedAddrs({});
  };

  // One-click Auto-Fetch & Select helpers
  const handleAutoFetchDaoEligible = () => {
    setMode("dao-auto");
    setPreset("dao_eligible");
    const nextSel: Record<string, boolean> = {};
    const nextShares: Record<string, string> = { ...daoSharesMap };
    let count = 0;
    for (const u of users) {
      if (u.isDaoEligibleCandidate) {
        const k = u.address.toLowerCase();
        nextSel[k] = true;
        const sh =
          u.currentCycleDaoShares > 0n
            ? u.currentCycleDaoShares
            : u.suggestedDaoShares;
        nextShares[k] = sh.toString();
        count++;
      }
    }
    setSelectedAddrs(nextSel);
    setDaoSharesMap(nextShares);
    if (count > 0) setDistributeCountInput(String(count));
  };

  const handleAutoFetchRankQualifiers = () => {
    setMode("rank-qualify");
    setPreset("rank_ready");
    const nextSel: Record<string, boolean> = {};
    const nextTargets: Record<string, number> = { ...targetRankOverrides };
    for (const u of users) {
      if (u.isRankUpgradeReady) {
        const k = u.address.toLowerCase();
        nextSel[k] = true;
        nextTargets[k] = u.qualifiedProtocolRankId;
      }
    }
    setSelectedAddrs(nextSel);
    setTargetRankOverrides(nextTargets);
  };

  const handleAutoFetchRankedForIncentive = (formula: IncentiveFormula) => {
    setMode("incentive-batch");
    setPreset("ranked_only");
    setIncentiveFormula(formula);
    const rankedList = users.filter((u) => u.storeRank > 0);
    autoFillIncentiveAmounts(formula, customIncentiveInput, rankedList);
    const nextSel: Record<string, boolean> = {};
    for (const u of rankedList) {
      nextSel[u.address.toLowerCase()] = true;
    }
    setSelectedAddrs(nextSel);
  };

  const resetAllFilters = () => {
    setPreset("all");
    setSearchQuery("");
    setCurrentRankFilter("all");
    setQualifiedRankFilter("all");
    setMinSelfStaked("");
    setMinMatchingBiz("");
    setMinTeamBiz("");
    setMinDirectBiz("");
    setMinDirects("");
    setMinActiveDirects("");
    setMinWeeklyMatching("");
    setMinDailyMatching("");
    setMinBalanceUsd("");
    setMinTotalIncomeUsd("");
    setMinAriBalance("");
  };

  // Calculate total DAO shares & estimated payouts for selected DAO users
  const daoBatchCalc = useMemo(() => {
    const poolUsd = p?.daoPoolTotal ?? 0n;
    let totalSelectedShares = 0n;
    for (const u of selectedUsers) {
      const sh = BigInt(
        Math.max(1, Number(daoSharesMap[u.address.toLowerCase()] || "1"))
      );
      totalSelectedShares += sh;
    }
    const perUserEst: Record<string, bigint> = {};
    for (const u of selectedUsers) {
      const sh = BigInt(
        Math.max(1, Number(daoSharesMap[u.address.toLowerCase()] || "1"))
      );
      perUserEst[u.address.toLowerCase()] =
        totalSelectedShares > 0n ? (poolUsd * sh) / totalSelectedShares : 0n;
    }
    return {
      poolUsd,
      totalSelectedShares,
      valuePerShare:
        totalSelectedShares > 0n ? poolUsd / totalSelectedShares : 0n,
      perUserEst,
    };
  }, [p?.daoPoolTotal, selectedUsers, daoSharesMap]);

  // ═════════════════════════ BATCH EXECUTION HANDLERS ═════════════════════════

  // 1. Execute setDaoEligible(wallets[], shares[]) AT ONCE in a single transaction!
  const handleExecuteSetDaoEligibleBatch = async () => {
    if (selectedUsers.length === 0) {
      setBatchTxState({
        status: "error",
        message: "Select at least 1 user to execute setDaoEligible.",
      });
      return;
    }
    const wallets: Address[] = [];
    const shares: bigint[] = [];
    for (const u of selectedUsers) {
      const shNum = Math.max(
        1,
        Math.floor(Number(daoSharesMap[u.address.toLowerCase()] || "1"))
      );
      wallets.push(u.address);
      shares.push(BigInt(shNum));
    }

    setBatchTxState({
      status: "pending",
      message: `Executing setDaoEligible for ${wallets.length} wallet(s) in a single transaction…`,
    });
    const res = await runTx(
      `Batch setDaoEligible (${wallets.length} wallets)`,
      () => writeProtocol("setDaoEligible", [wallets, shares])
    );
    if (res.ok) {
      setBatchTxState({
        status: "ok",
        message: `Successfully registered ${wallets.length} DAO eligible user(s) with ${daoBatchCalc.totalSelectedShares.toString()} total shares!`,
        hash: res.hash,
      });
      await refreshUsers();
    } else {
      setBatchTxState({ status: "error", message: res.error });
    }
  };

  // 2. Execute distributeDao(count) AT ONCE
  const handleExecuteDistributeDao = async () => {
    const cnt = Math.max(1, Number(distributeCountInput) || selectedUsers.length || 50);
    setBatchTxState({
      status: "pending",
      message: `Executing distributeDao(${cnt}) on ARITOHAMProtocol…`,
    });
    const res = await runTx(`Protocol.distributeDao(${cnt})`, () =>
      writeProtocol("distributeDao", [BigInt(cnt)])
    );
    if (res.ok) {
      setBatchTxState({
        status: "ok",
        message: `DAO Pool distributed across up to ${cnt} eligible member(s)!`,
        hash: res.hash,
      });
      await refreshUsers();
    } else {
      setBatchTxState({ status: "error", message: res.error });
    }
  };

  // 3. Execute Rank Promotions (updateRewardIncome) for all selected users
  const handleExecuteRankPromotionBatch = async () => {
    if (selectedUsers.length === 0) {
      setBatchTxState({
        status: "error",
        message: "Select at least 1 user to award Rank Reward Income.",
      });
      return;
    }

    let okCount = 0;
    let lastHash: string | undefined;
    for (let i = 0; i < selectedUsers.length; i++) {
      const u = selectedUsers[i];
      const rankId =
        targetRankOverrides[u.address.toLowerCase()] ?? u.qualifiedProtocolRankId;
      const tier =
        PROTOCOL_RANK_REWARDS.find((t) => t.rankId === rankId) ??
        PROTOCOL_RANK_REWARDS[0];

      setBatchTxState({
        status: "pending",
        message: `[${i + 1}/${selectedUsers.length}] Awarding Rank ${tier.name} (rank_id=${rankId}) to ${u.userCode}…`,
      });

      const res = await runTx(
        `[${i + 1}/${selectedUsers.length}] updateRewardIncome(${u.userCode}, ${tier.name})`,
        () => writeProtocol("updateRewardIncome", [u.address, BigInt(rankId)])
      );
      if (res.ok) {
        okCount++;
        lastHash = res.hash;
      } else {
        setBatchTxState({
          status: "error",
          message: `Stopped at [${i + 1}/${selectedUsers.length}] (${u.userCode}): ${res.error}`,
          hash: lastHash,
        });
        await refreshUsers();
        return;
      }
    }

    setBatchTxState({
      status: "ok",
      message: `Completed Rank Promotion batch for ${okCount}/${selectedUsers.length} user(s)!`,
      hash: lastHash,
    });
    await refreshUsers();
  };

  // 4. Execute Rank Incentive Batch (updateRankIncentive) for all selected users
  const handleExecuteRankIncentiveBatch = async () => {
    // If bulk CSV mode is open and has text, parse CSV lines first
    const queue: { address: Address; label: string; amountStr: string }[] = [];

    if (showBulkCsv && bulkIncentiveCsv.trim()) {
      const lines = bulkIncentiveCsv
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      for (const line of lines) {
        const [wRaw, amtRaw] = line.split(/[,;\s]+/);
        if (wRaw && isAddress(wRaw) && amtRaw && Number(amtRaw) > 0) {
          queue.push({
            address: wRaw as Address,
            label: `${wRaw.slice(0, 6)}...${wRaw.slice(-4)}`,
            amountStr: amtRaw,
          });
        }
      }
    } else {
      for (const u of selectedUsers) {
        const amtStr = (incentiveAmounts[u.address.toLowerCase()] || "").trim();
        if (amtStr && Number(amtStr) > 0) {
          queue.push({
            address: u.address,
            label: u.userCode,
            amountStr: amtStr,
          });
        }
      }
    }

    if (queue.length === 0) {
      setBatchTxState({
        status: "error",
        message:
          "Select users and enter an Incentive USD amount > 0 (or use Auto-Fill / Bulk CSV) before executing.",
      });
      return;
    }

    let okCount = 0;
    let lastHash: string | undefined;
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      const wei = parseUnits(item.amountStr, 18);
      setBatchTxState({
        status: "pending",
        message: `[${i + 1}/${queue.length}] Crediting $${item.amountStr} Rank Incentive to ${item.label}…`,
      });
      const res = await runTx(
        `[${i + 1}/${queue.length}] updateRankIncentive(${item.label}, $${item.amountStr})`,
        () => writeProtocol("updateRankIncentive", [item.address, wei])
      );
      if (res.ok) {
        okCount++;
        lastHash = res.hash;
      } else {
        setBatchTxState({
          status: "error",
          message: `Stopped at [${i + 1}/${queue.length}] (${item.label}): ${res.error}`,
          hash: lastHash,
        });
        await refreshUsers();
        return;
      }
    }

    setBatchTxState({
      status: "ok",
      message: `Successfully credited Rank Incentive to ${okCount}/${queue.length} user(s)!`,
      hash: lastHash,
    });
    await refreshUsers();
  };

  // 5. Execute Single-Tx Blacklist Batch (setBlacklistBatch)
  const handleExecuteBlacklistBatch = async (status: boolean) => {
    if (selectedUsers.length === 0) {
      setBatchTxState({
        status: "error",
        message: "Select at least 1 user first.",
      });
      return;
    }
    const addrs = selectedUsers.map((u) => u.address);
    setBatchTxState({
      status: "pending",
      message: `Submitting setBlacklistBatch (${addrs.length} wallets, status=${status})…`,
    });
    const res = await runTx(
      `Batch ${status ? "Blacklist" : "Unblacklist"} (${addrs.length} wallets)`,
      () => writeProtocol("setBlacklistBatch", [addrs, status])
    );
    if (res.ok) {
      setBatchTxState({
        status: "ok",
        message: `Updated blacklist status=${status} for ${addrs.length} wallet(s) in a single transaction!`,
        hash: res.hash,
      });
      await refreshUsers();
    } else {
      setBatchTxState({ status: "error", message: res.error });
    }
  };

  // 6. Execute Batch Burn or Reset
  const handleExecuteBatchBurn = async () => {
    if (selectedUsers.length === 0) return;
    let okCount = 0;
    let lastHash: string | undefined;
    for (let i = 0; i < selectedUsers.length; i++) {
      const u = selectedUsers[i];
      const wei =
        batchBurnMode === "full"
          ? u.tokenBalance
          : parseUnits(batchBurnFixed || "0", 18);
      if (wei <= 0n) continue;
      setBatchTxState({
        status: "pending",
        message: `[${i + 1}/${selectedUsers.length}] Burning ${fmt18(wei, 2)} ARI from ${u.userCode}…`,
      });
      const res = await runTx(
        `[${i + 1}/${selectedUsers.length}] burnFrom(${u.userCode})`,
        () => writeProtocol("burnFrom", [u.address, wei])
      );
      if (res.ok) {
        okCount++;
        lastHash = res.hash;
      } else {
        setBatchTxState({
          status: "error",
          message: `Failed on ${u.userCode}: ${res.error}`,
          hash: lastHash,
        });
        return;
      }
    }
    setBatchTxState({
      status: "ok",
      message: `Burned ARI tokens from ${okCount} wallet(s)!`,
      hash: lastHash,
    });
    await refreshUsers();
  };

  const handleExecuteBatchReset = async () => {
    if (selectedUsers.length === 0) return;
    let okCount = 0;
    let lastHash: string | undefined;
    for (let i = 0; i < selectedUsers.length; i++) {
      const u = selectedUsers[i];
      setBatchTxState({
        status: "pending",
        message: `[${i + 1}/${selectedUsers.length}] Resetting Rank, Business & DAO for ${u.userCode}…`,
      });
      const res = await runTx(
        `[${i + 1}/${selectedUsers.length}] resetRankBusinessDao(${u.userCode})`,
        () => writeProtocol("resetRankBusinessDao", [u.address])
      );
      if (res.ok) {
        okCount++;
        lastHash = res.hash;
      } else {
        setBatchTxState({
          status: "error",
          message: `Failed on ${u.userCode}: ${res.error}`,
          hash: lastHash,
        });
        return;
      }
    }
    setBatchTxState({
      status: "ok",
      message: `Reset Rank, Business & DAO completed for ${okCount} user(s)!`,
      hash: lastHash,
    });
    await refreshUsers();
  };

  const liveModalUser = useMemo(() => {
    if (!selectedKeeperUser) return null;
    return (
      users.find(
        (u) =>
          u.address.toLowerCase() === selectedKeeperUser.address.toLowerCase()
      ) ?? selectedKeeperUser
    );
  }, [users, selectedKeeperUser]);

  return (
    <div className="stack">
      <PageTitle
        title="Qualification Filter & Auto-Batch Engine"
        sub="Filter users by all on-chain data, detect who completed Rank or DAO conditions, auto-fill amounts/shares, and execute at once."
        right={
          <>
            <button
              type="button"
              className="btn"
              onClick={handleAutoFetchDaoEligible}
            >
              <Icon name="gem" size={16} /> Auto-Fetch DAO Eligible (
              {summaryCounts.daoEligible})
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleAutoFetchRankQualifiers}
            >
              <Icon name="crown" size={16} /> Auto-Fetch Rank Qualifiers (
              {summaryCounts.rankReady})
            </button>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => refreshUsers()}
              disabled={usersLoading}
            >
              <Icon name="refresh" size={16} />{" "}
              {usersLoading ? "Scanning..." : "Sync All Users"}
            </button>
          </>
        }
      />

      <RoleRequirementBanner
        roleName="Chain Keeper (onlyChainKeeper)"
        requiredAddress={p?.chainKeeper}
        hasRole={Boolean(r?.isChainKeeper)}
      />

      {/* Hero Summary Tiles */}
      <Hero
        eyebrow="AUTOMATED QUALIFICATION & BATCH EXECUTION"
        title="On-Chain Condition Scanner & One-Click Executor"
        desc="Automatically checks every user against Rank (1..9), Rank Incentive (8%..35%), and DAO Partnership (20-day window & $2,500 share step) rules."
        tiles={[
          {
            icon: "crown",
            label: "Rank Upgrade Ready",
            value: `${summaryCounts.rankReady} Users`,
            hint: "Completed Self Staked + Matching + Directs",
          },
          {
            icon: "gem",
            label: "DAO Eligible Candidates",
            value: `${summaryCounts.daoEligible} Users`,
            hint: "Lifetime or 20d Window ($3k Dir / $10k Match)",
          },
          {
            icon: "award",
            label: "Ranked for Incentive",
            value: `${summaryCounts.rankedOnly} Users`,
            hint: "Rank #1 (Spark 8%) → #9 (Emperor 35%)",
          },
          {
            icon: "dollar",
            label: `DAO Pool (Cycle #${p?.daoCycle.toString() ?? "1"})`,
            value: `$${fmt18(p?.daoPoolTotal, 2)}`,
            hint: `${p?.daoCurrentShares.toString() ?? "0"} active cycle shares`,
          },
          {
            icon: "check",
            label: "Filtered / Selected",
            value: `${selectedUsers.length} / ${filteredUsers.length}`,
            hint: `Out of ${users.length} total monitored users`,
          },
        ]}
      />

      {/* 1. ALL-DATA MULTI-CRITERIA FILTER PANEL */}
      <Panel
        eyebrow="STEP 1 · FILTER BY ALL ON-CHAIN DATA & CONDITIONS"
        title="Universal User Condition & Metric Filter"
        sub="Click a condition preset or filter by any combination of Rank, Staked, Matching, Team Business, Directs, Weekly/Daily Matching, Balance, or Income."
        right={
          <>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setShowAdvancedFilters((v) => !v)}
            >
              <Icon name="settings" size={14} />{" "}
              {showAdvancedFilters
                ? "Hide Numeric Filters"
                : "Show All 13 Numeric Filters"}
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={resetAllFilters}
            >
              Reset All Filters
            </button>
          </>
        }
      >
        {/* Condition Presets */}
        <Tabs<PresetFilter>
          value={preset}
          onChange={setPreset}
          tabs={[
            {
              id: "all",
              label: "All Users",
              icon: "users",
              badge: String(summaryCounts.all),
            },
            {
              id: "dao_eligible",
              label: "DAO Eligible (Window / Lifetime)",
              icon: "gem",
              badge: String(summaryCounts.daoEligible),
            },
            {
              id: "rank_ready",
              label: "Completed Rank Requirements",
              icon: "crown",
              badge: String(summaryCounts.rankReady),
            },
            {
              id: "ranked_only",
              label: "Ranked Users (Rank ≥ 1)",
              icon: "award",
              badge: String(summaryCounts.rankedOnly),
            },
            {
              id: "has_matching",
              label: "Has Matching / Team Biz",
              icon: "trend",
              badge: String(summaryCounts.hasMatching),
            },
            {
              id: "active_only",
              label: "Active Stakers",
              icon: "check",
              badge: String(summaryCounts.activeOnly),
            },
            {
              id: "blacklisted_only",
              label: "Blacklisted",
              icon: "lock",
              badge: String(summaryCounts.blacklistedOnly),
            },
          ]}
        />

        {showAdvancedFilters && (
          <div className="stack" style={{ gap: 14 }}>
            <div className="cols-4">
              <div>
                <label className="field-l">Search Wallet / ID / Referrer</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="ARI1000001, 0x..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <label className="field-l">Current On-Chain Rank</label>
                <select
                  className="sel"
                  value={currentRankFilter}
                  onChange={(e) => setCurrentRankFilter(e.target.value)}
                >
                  <option value="all">Any Current Rank (0..9)</option>
                  {RANK_NAMES.map((n, i) => (
                    <option key={i} value={i}>
                      Rank #{i} — {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-l">
                  Qualified Rank (Met Conditions)
                </label>
                <select
                  className="sel"
                  value={qualifiedRankFilter}
                  onChange={(e) => setQualifiedRankFilter(e.target.value)}
                >
                  <option value="all">Any Qualified Rank (0..9)</option>
                  {RANK_NAMES.map((n, i) => (
                    <option key={i} value={i}>
                      Qualified #{i} — {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-l">Min Self Staked (USD)</label>
                <input
                  type="number"
                  step="any"
                  className="inp"
                  placeholder="e.g. 100"
                  value={minSelfStaked}
                  onChange={(e) => setMinSelfStaked(e.target.value)}
                />
              </div>
            </div>

            <div className="cols-5">
              <div>
                <label className="field-l">Min Matching Business ($)</label>
                <input
                  type="number"
                  step="any"
                  className="inp"
                  placeholder="e.g. 5000"
                  value={minMatchingBiz}
                  onChange={(e) => setMinMatchingBiz(e.target.value)}
                />
              </div>
              <div>
                <label className="field-l">Min Team Business ($)</label>
                <input
                  type="number"
                  step="any"
                  className="inp"
                  placeholder="e.g. 10000"
                  value={minTeamBiz}
                  onChange={(e) => setMinTeamBiz(e.target.value)}
                />
              </div>
              <div>
                <label className="field-l">Min Direct Business ($)</label>
                <input
                  type="number"
                  step="any"
                  className="inp"
                  placeholder="e.g. 3000"
                  value={minDirectBiz}
                  onChange={(e) => setMinDirectBiz(e.target.value)}
                />
              </div>
              <div>
                <label className="field-l">Min Total Directs</label>
                <input
                  type="number"
                  step="1"
                  className="inp"
                  placeholder="e.g. 3"
                  value={minDirects}
                  onChange={(e) => setMinDirects(e.target.value)}
                />
              </div>
              <div>
                <label className="field-l">Min Active Directs ($50+)</label>
                <input
                  type="number"
                  step="1"
                  className="inp"
                  placeholder="e.g. 3"
                  value={minActiveDirects}
                  onChange={(e) => setMinActiveDirects(e.target.value)}
                />
              </div>
            </div>

            <div className="cols-5">
              <div>
                <label className="field-l">Min Weekly Matching ($)</label>
                <input
                  type="number"
                  step="any"
                  className="inp"
                  placeholder="e.g. 2500"
                  value={minWeeklyMatching}
                  onChange={(e) => setMinWeeklyMatching(e.target.value)}
                />
              </div>
              <div>
                <label className="field-l">Min Daily Matching ($)</label>
                <input
                  type="number"
                  step="any"
                  className="inp"
                  placeholder="e.g. 500"
                  value={minDailyMatching}
                  onChange={(e) => setMinDailyMatching(e.target.value)}
                />
              </div>
              <div>
                <label className="field-l">Min Withdrawable USD</label>
                <input
                  type="number"
                  step="any"
                  className="inp"
                  placeholder="e.g. 50"
                  value={minBalanceUsd}
                  onChange={(e) => setMinBalanceUsd(e.target.value)}
                />
              </div>
              <div>
                <label className="field-l">Min Total Income USD</label>
                <input
                  type="number"
                  step="any"
                  className="inp"
                  placeholder="e.g. 100"
                  value={minTotalIncomeUsd}
                  onChange={(e) => setMinTotalIncomeUsd(e.target.value)}
                />
              </div>
              <div>
                <label className="field-l">Min Wallet ARI Balance</label>
                <input
                  type="number"
                  step="any"
                  className="inp"
                  placeholder="e.g. 1000"
                  value={minAriBalance}
                  onChange={(e) => setMinAriBalance(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </Panel>

      {/* 2. STEP 2: CHOOSE AUTO-FILL & BATCH EXECUTION ENGINE */}
      <Panel
        eyebrow="STEP 2 · AUTO-FILL & EXECUTE AT ONCE"
        title="Batch Action Engine"
        sub="Select the operation to auto-fill parameters for the filtered users and execute at once."
        right={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={selectAllFiltered}
            >
              <Icon name="check" size={14} /> Select All Filtered (
              {filteredUsers.length})
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={clearSelection}
            >
              Clear Selection ({selectedUsers.length})
            </button>
          </div>
        }
      >
        <Tabs<EngineMode>
          value={mode}
          onChange={setMode}
          tabs={[
            {
              id: "dao-auto",
              label: "1. DAO Eligible Auto-Fetch & Execute",
              icon: "gem",
              badge: `${summaryCounts.daoEligible} Eligible`,
            },
            {
              id: "rank-qualify",
              label: "2. Rank Requirement Qualifier & Promote",
              icon: "crown",
              badge: `${summaryCounts.rankReady} Ready`,
            },
            {
              id: "incentive-batch",
              label: "3. Rank Incentive Batch",
              icon: "award",
              badge: `${summaryCounts.rankedOnly} Ranked`,
            },
            {
              id: "custom-batch",
              label: "4. Blacklist / Burn / Reset Batch",
              icon: "shield",
            },
          ]}
        />

        <TxFeedback state={batchTxState} />

        {/* ───────── MODE 1: DAO ELIGIBLE AUTO-FETCH & EXECUTE AT ONCE ───────── */}
        {mode === "dao-auto" && (
          <div className="stack" style={{ marginTop: 14 }}>
            <div className="alert gold" style={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <div>
                <b>DAO Qualification Rule (On-Chain):</b> User qualifies if{" "}
                <code>daoLifetime == true</code> OR within 20 days of activation{" "}
                <code>windowDirect ≥ $3,000</code> OR{" "}
                <code>windowMatching ≥ $10,000</code>. Cycle shares ={" "}
                <code>weeklyMatching / $2,500</code> (min 1 share).
              </div>
              <button
                type="button"
                className="btn btn-gold btn-sm"
                onClick={handleAutoFetchDaoEligible}
              >
                <Icon name="spark" size={14} /> Auto-Fetch &amp; Fill All DAO
                Eligible Users
              </button>
            </div>

            <div className="cols-4">
              <Mini
                flat
                label="Current DAO Pool (USD)"
                value={
                  <span className="gold-t">
                    ${fmt18(daoBatchCalc.poolUsd, 2)}
                  </span>
                }
                hint={`Cycle #${p?.daoCycle.toString() ?? "1"}`}
              />
              <Mini
                flat
                label="Selected DAO Wallets"
                value={`${selectedUsers.length} Wallets`}
                hint={`On-chain registered: ${p?.daoEligibleCount.toString() ?? "0"}`}
              />
              <Mini
                flat
                label="Total Auto-Filled Shares"
                value={`${daoBatchCalc.totalSelectedShares.toString()} Shares`}
                hint="$2,500 weekly matching = 1 share"
              />
              <Mini
                flat
                label="Est. Reward Per Share"
                value={
                  <span className="up">
                    ${fmt18(daoBatchCalc.valuePerShare, 2)} / Share
                  </span>
                }
                hint="Based on selected share weight"
              />
            </div>

            <div className="cols-2">
              <button
                type="button"
                className="btn btn-gold btn-block"
                disabled={
                  batchTxState.status === "pending" ||
                  selectedUsers.length === 0
                }
                onClick={handleExecuteSetDaoEligibleBatch}
              >
                <Icon name="gem" size={16} /> 1. Execute{" "}
                <code>
                  setDaoEligible({selectedUsers.length} wallets,{" "}
                  {daoBatchCalc.totalSelectedShares.toString()} shares)
                </code>{" "}
                At Once
              </button>

              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="inp"
                  style={{ width: 130 }}
                  value={distributeCountInput}
                  onChange={(e) => setDistributeCountInput(e.target.value)}
                  placeholder="Count"
                  title="Batch count for distributeDao(count)"
                />
                <button
                  type="button"
                  className="btn btn-gold btn-block"
                  disabled={batchTxState.status === "pending"}
                  onClick={handleExecuteDistributeDao}
                >
                  <Icon name="dollar" size={16} /> 2. Execute{" "}
                  <code>distributeDao({distributeCountInput || "50"})</code> At
                  Once
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───────── MODE 2: RANK REQUIREMENT QUALIFIER & BATCH PROMOTE ───────── */}
        {mode === "rank-qualify" && (
          <div className="stack" style={{ marginTop: 14 }}>
            <div className="alert gold" style={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <div>
                <b>On-Chain Rank Qualification Rules:</b> Checks each user&apos;s{" "}
                <code>Self Staked</code>, <code>Matching/Team Business</code>,
                and <code>Direct Referrals</code> against Ranks 1..9 (Spark →
                Emperor) and auto-fills their target <code>rank_id</code> &amp;
                one-time Rank Reward USD.
              </div>
              <button
                type="button"
                className="btn btn-gold btn-sm"
                onClick={handleAutoFetchRankQualifiers}
              >
                <Icon name="crown" size={14} /> Auto-Select Users Who Completed
                Rank Conditions ({summaryCounts.rankReady})
              </button>
            </div>

            {/* Compact 9-Rank Requirement Reference Matrix */}
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Store Rank</th>
                    <th>Protocol rank_id</th>
                    <th>Rank Name</th>
                    <th>Req. Self Staked</th>
                    <th>Req. Matching Biz</th>
                    <th>Req. Directs</th>
                    <th>Rank Reward (USD)</th>
                    <th>Rank Incentive %</th>
                  </tr>
                </thead>
                <tbody>
                  {PROTOCOL_RANK_REWARDS.map((t) => (
                    <tr key={t.rankId}>
                      <td>#{t.storeRank}</td>
                      <td>
                        <code>rank_id = {t.rankId}</code>
                      </td>
                      <td>
                        <b className="gold-t">{t.name}</b>
                      </td>
                      <td>${t.selfStakedUsd.toLocaleString()}</td>
                      <td>${t.matchingUsd.toLocaleString()}</td>
                      <td>{t.directsRequired} Directs</td>
                      <td className="up">${t.rewardUsd.toLocaleString()}</td>
                      <td>{(t.incentiveBps / 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="btn btn-gold btn-block"
              disabled={
                batchTxState.status === "pending" || selectedUsers.length === 0
              }
              onClick={handleExecuteRankPromotionBatch}
            >
              <Icon name="award" size={16} /> Execute{" "}
              <code>updateRewardIncome</code> Batch for {selectedUsers.length}{" "}
              Selected User(s)
            </button>
          </div>
        )}

        {/* ───────── MODE 3: RANK INCENTIVE BATCH AUTO-FILL & EXECUTOR ───────── */}
        {mode === "incentive-batch" && (
          <div className="stack" style={{ marginTop: 14 }}>
            <div className="alert gold" style={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <div>
                <b>Rank Incentive Batch Generator:</b> Auto-compute each user&apos;s
                incentive from their Rank Incentive % (8%..35%) × Daily/Weekly
                Matching (or set a fixed/custom USD amount), review/edit per row,
                and execute in batch.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setShowBulkCsv((v) => !v)}
                >
                  {showBulkCsv ? "Use Table Auto-Fill" : "Paste Bulk CSV"}
                </button>
                <button
                  type="button"
                  className="btn btn-gold btn-sm"
                  onClick={() =>
                    handleAutoFetchRankedForIncentive(incentiveFormula)
                  }
                >
                  <Icon name="spark" size={14} /> Auto-Fill Ranked Users (
                  {summaryCounts.rankedOnly})
                </button>
              </div>
            </div>

            {showBulkCsv ? (
              <div>
                <label className="field-l">
                  Bulk Rank Incentive CSV (One per line: wallet,amountUSD)
                </label>
                <textarea
                  className="inp"
                  placeholder={
                    "0x1234...abcd, 250\n0x5678...ef01, 500"
                  }
                  value={bulkIncentiveCsv}
                  onChange={(e) => setBulkIncentiveCsv(e.target.value)}
                  style={{ fontFamily: "ui-monospace, monospace", minHeight: 110 }}
                />
              </div>
            ) : (
              <div className="cols-3">
                <div>
                  <label className="field-l">Auto-Fill Formula</label>
                  <select
                    className="sel"
                    value={incentiveFormula}
                    onChange={(e) => {
                      const f = e.target.value as IncentiveFormula;
                      setIncentiveFormula(f);
                      autoFillIncentiveAmounts(
                        f,
                        customIncentiveInput,
                        filteredUsers
                      );
                    }}
                  >
                    <option value="daily_matching_bps">
                      Daily Matching × Rank Incentive % (8%..35%)
                    </option>
                    <option value="weekly_matching_bps">
                      Weekly Matching × Rank Incentive % (8%..35%)
                    </option>
                    <option value="matching_biz_pct">
                      Custom % of Total Matching Business
                    </option>
                    <option value="fixed_usd">
                      Fixed USD Amount for Selected Users
                    </option>
                  </select>
                </div>

                <div>
                  <label className="field-l">
                    {incentiveFormula === "matching_biz_pct"
                      ? "Custom Percentage (%)"
                      : incentiveFormula === "fixed_usd"
                      ? "Fixed Incentive Amount (USD)"
                      : "Fallback / Manual USD Amount"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="inp"
                    placeholder="e.g. 100"
                    value={customIncentiveInput}
                    onChange={(e) => setCustomIncentiveInput(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-block"
                    onClick={() =>
                      autoFillIncentiveAmounts(
                        incentiveFormula,
                        customIncentiveInput,
                        filteredUsers
                      )
                    }
                  >
                    <Icon name="calculator" size={16} /> Re-Calculate &amp; Fill{" "}
                    {filteredUsers.length} Filtered Rows
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-gold btn-block"
              disabled={batchTxState.status === "pending"}
              onClick={handleExecuteRankIncentiveBatch}
            >
              <Icon name="dollar" size={16} /> Execute{" "}
              <code>updateRankIncentive</code> Batch for Selected Users
            </button>
          </div>
        )}

        {/* ───────── MODE 4: CUSTOM MULTI-USER BATCH (BLACKLIST / BURN / RESET) ───────── */}
        {mode === "custom-batch" && (
          <div className="grid g-half" style={{ marginTop: 14 }}>
            <div className="mini flat">
              <div className="lbl">
                1. Single-Tx Batch Blacklist (setBlacklistBatch)
              </div>
              <p className="hint" style={{ marginTop: 6, marginBottom: 14 }}>
                Executes <code>ARITOHAMProtocol.setBlacklistBatch(users[], status)</code>{" "}
                for all {selectedUsers.length} selected wallet(s) in a single
                transaction.
              </p>
              <div className="cols-2">
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={
                    batchTxState.status === "pending" ||
                    selectedUsers.length === 0
                  }
                  onClick={() => handleExecuteBlacklistBatch(true)}
                >
                  <Icon name="lock" size={15} /> Blacklist {selectedUsers.length}{" "}
                  Selected
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={
                    batchTxState.status === "pending" ||
                    selectedUsers.length === 0
                  }
                  onClick={() => handleExecuteBlacklistBatch(false)}
                >
                  <Icon name="check" size={15} /> Unblacklist{" "}
                  {selectedUsers.length} Selected
                </button>
              </div>
            </div>

            <div className="mini flat">
              <div className="lbl">
                2. Batch Token Burn (burnFrom) &amp; Account Reset
                (resetRankBusinessDao)
              </div>
              <div className="cols-2" style={{ marginTop: 10, marginBottom: 10 }}>
                <select
                  className="sel"
                  value={batchBurnMode}
                  onChange={(e) =>
                    setBatchBurnMode(e.target.value as "full" | "fixed")
                  }
                >
                  <option value="full">Burn 100% Wallet ARI Balance</option>
                  <option value="fixed">Burn Fixed ARI Amount</option>
                </select>
                {batchBurnMode === "fixed" && (
                  <input
                    type="number"
                    step="any"
                    className="inp"
                    value={batchBurnFixed}
                    onChange={(e) => setBatchBurnFixed(e.target.value)}
                    placeholder="ARI to burn"
                  />
                )}
              </div>
              <div className="cols-2">
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={
                    batchTxState.status === "pending" ||
                    selectedUsers.length === 0
                  }
                  onClick={handleExecuteBatchBurn}
                >
                  <Icon name="flame" size={15} /> Burn ARI ({selectedUsers.length}{" "}
                  Selected)
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={
                    batchTxState.status === "pending" ||
                    selectedUsers.length === 0
                  }
                  onClick={handleExecuteBatchReset}
                >
                  <Icon name="alert" size={15} /> Reset Rank/Biz/DAO (
                  {selectedUsers.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </Panel>

      {/* 3. INTERACTIVE FILTERED USERS & AUTO-FILLED ACTION TABLE */}
      <Panel
        eyebrow="STEP 3 · REVIEW AUTO-FILLED USER ROWS & EXECUTE"
        title={`Filtered Users & Auto-Filled Action Parameters (${filteredUsers.length} Matching · ${selectedUsers.length} Selected)`}
        sub="Check/uncheck rows, adjust any auto-filled Rank, Incentive Amount, or DAO Share value inline, or click Chain Keeper Actions on any row."
      >
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 42 }}>
                  <input
                    type="checkbox"
                    checked={
                      filteredUsers.length > 0 &&
                      selectedUsers.length === filteredUsers.length
                    }
                    onChange={(e) =>
                      e.target.checked ? selectAllFiltered() : clearSelection()
                    }
                  />
                </th>
                <th>User ID / Wallet</th>
                <th>Current Rank &amp; Qualified Rank</th>
                <th>Staked &amp; Directs</th>
                <th>Matching &amp; Window Biz</th>
                <th>
                  {mode === "dao-auto"
                    ? "Auto-Filled DAO Shares & Est. Reward"
                    : mode === "rank-qualify"
                    ? "Auto-Filled Target Rank & Reward"
                    : mode === "incentive-batch"
                    ? "Auto-Filled Rank Incentive (USD)"
                    : "Balances & Status"}
                </th>
                <th className="ta-r">Row Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      No users match the current condition filter.
                      <small>
                        Click &quot;All Users&quot; or &quot;Reset All Filters&quot; above to view
                        all monitored wallets.
                      </small>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const key = u.address.toLowerCase();
                  const isChecked = Boolean(selectedAddrs[key]);
                  const effMatching =
                    u.matchingBusiness > 0n
                      ? u.matchingBusiness
                      : u.teamBusiness;
                  const targetRankId =
                    targetRankOverrides[key] ?? u.qualifiedProtocolRankId;
                  const targetTier =
                    PROTOCOL_RANK_REWARDS.find(
                      (t) => t.rankId === targetRankId
                    ) ?? PROTOCOL_RANK_REWARDS[0];
                  const estDaoUsd = daoBatchCalc.perUserEst[key] ?? 0n;

                  return (
                    <tr
                      key={u.address}
                      style={
                        isChecked
                          ? { background: "rgba(212, 175, 55, 0.055)" }
                          : undefined
                      }
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectUser(u.address)}
                        />
                      </td>

                      {/* User ID & Wallet */}
                      <td>
                        <div className="cell-2">
                          <span className="gold-t">{u.userCode}</span>
                          <div className="a">
                            <Addr text={u.address} link />
                          </div>
                        </div>
                      </td>

                      {/* Current Rank vs Qualified Rank */}
                      <td>
                        <div className="cell-2">
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                            <Pill tone={u.storeRank > 0 ? "gold" : "muted"}>
                              Cur: #{u.storeRank} {u.rankName}
                            </Pill>
                            {u.isRankUpgradeReady ? (
                              <Pill tone="green" dot>
                                Qual: #{u.qualifiedStoreRank}{" "}
                                {u.qualifiedRankName}
                              </Pill>
                            ) : (
                              <Tag tone="muted">
                                Qual: #{u.qualifiedStoreRank}{" "}
                                {u.qualifiedRankName}
                              </Tag>
                            )}
                          </div>
                          <span className="a" style={{ fontSize: 11.5 }}>
                            Incentive Rate:{" "}
                            <b>{(u.rankIncentiveBps / 100).toFixed(0)}%</b> ·
                            Cap Left: ${fmt18(u.remainingCap, 2)}
                          </span>
                        </div>
                      </td>

                      {/* Staked & Directs */}
                      <td>
                        <div className="cell-2">
                          <span>Self Staked: ${fmt18(u.totalStaked, 2)}</span>
                          <span className="a">
                            Directs: <b>{u.directCount}</b> ({u.activeDirects}{" "}
                            Active) · Team: {u.teamCount}
                          </span>
                        </div>
                      </td>

                      {/* Matching & Window Biz */}
                      <td>
                        <div className="cell-2">
                          <span>Matching: ${fmt18(effMatching, 2)}</span>
                          <span className="a" style={{ fontSize: 11.5 }}>
                            Weekly: ${fmt18(u.weeklyMatching, 2)} · Daily: $
                            {fmt18(u.dailyMatching, 2)}
                          </span>
                          <span className="a" style={{ fontSize: 11 }}>
                            20d Dir: ${fmt18(u.windowDirect, 0)} · 20d Match: $
                            {fmt18(u.windowMatching, 0)}
                          </span>
                        </div>
                      </td>

                      {/* Dynamic Auto-Fill Input Column based on Active Mode */}
                      <td>
                        {mode === "dao-auto" && (
                          <div className="cell-2">
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                className="inp"
                                style={{ width: 95, padding: "7px 10px", fontSize: 13 }}
                                value={daoSharesMap[key] ?? "1"}
                                onChange={(e) =>
                                  setDaoSharesMap((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                              />
                              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                                Shares
                              </span>
                              {u.daoLifetime ? (
                                <Tag tone="green">Lifetime</Tag>
                              ) : u.daoQualifiedByWindow ? (
                                <Tag tone="gold">20d Qualified</Tag>
                              ) : (
                                <Tag tone="muted">Manual</Tag>
                              )}
                            </div>
                            <span className="a">
                              Est. Pool Payout:{" "}
                              <b className="up">${fmt18(estDaoUsd, 2)} USD</b>
                            </span>
                          </div>
                        )}

                        {mode === "rank-qualify" && (
                          <div className="cell-2">
                            <select
                              className="sel"
                              style={{ padding: "8px 30px 8px 10px", fontSize: 12.5 }}
                              value={targetRankId}
                              onChange={(e) =>
                                setTargetRankOverrides((prev) => ({
                                  ...prev,
                                  [key]: Number(e.target.value),
                                }))
                              }
                            >
                              {PROTOCOL_RANK_REWARDS.map((t) => (
                                <option key={t.rankId} value={t.rankId}>
                                  rank_id {t.rankId} (#{t.storeRank} {t.name}) — $
                                  {t.rewardUsd.toLocaleString()}
                                </option>
                              ))}
                            </select>
                            <span className="a">
                              Reward:{" "}
                              <b className="gold-t">
                                ${targetTier.rewardUsd.toLocaleString()} USD
                              </b>
                            </span>
                          </div>
                        )}

                        {mode === "incentive-batch" && (
                          <div className="cell-2">
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <input
                                type="number"
                                step="any"
                                className="inp"
                                style={{ width: 135, padding: "7px 10px", fontSize: 13 }}
                                placeholder="0.00"
                                value={incentiveAmounts[key] ?? ""}
                                onChange={(e) =>
                                  setIncentiveAmounts((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                              />
                              <span style={{ fontSize: 12, color: "var(--gold-hi)" }}>
                                USD
                              </span>
                            </div>
                            <span className="a" style={{ fontSize: 11 }}>
                              Suggested Daily: $
                              {fmt18(u.suggestedIncentiveDailyUsd, 2)} · Weekly: $
                              {fmt18(u.suggestedIncentiveWeeklyUsd, 2)}
                            </span>
                          </div>
                        )}

                        {mode === "custom-batch" && (
                          <div className="cell-2">
                            <span className="up">
                              Claimable: ${fmt18(u.balance, 2)}
                            </span>
                            <span className="a gold-t">
                              Wallet: {fmt18(u.tokenBalance, 2)} ARI
                            </span>
                            {u.isBlacklisted ? (
                              <Tag tone="red">Blacklisted</Tag>
                            ) : (
                              <Tag tone="green">Not Blacklisted</Tag>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="ta-r">
                        <div
                          style={{
                            display: "inline-flex",
                            gap: 6,
                            flexWrap: "wrap",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-gold btn-sm"
                            onClick={() => setSelectedKeeperUser(u)}
                          >
                            <Icon name="shield" size={13} /> Keeper Actions
                          </button>
                          <Link
                            href={`/users/${u.address}`}
                            className="btn btn-sm"
                          >
                            Monitor <Icon name="right" size={13} />
                          </Link>
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

      <UserKeeperModal
        user={liveModalUser}
        onClose={() => setSelectedKeeperUser(null)}
      />
    </div>
  );
}

export default BatchEngineView;
