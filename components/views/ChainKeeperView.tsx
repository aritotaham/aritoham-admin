"use client";

import { useEffect, useState } from "react";
import { formatUnits, isAddress, parseUnits, type Address } from "viem";
import { useAdmin } from "../AdminContext";
import {
  Addr,
  DataTable,
  Icon,
  Mini,
  PageTitle,
  Panel,
  Pill,
  RoleRequirementBanner,
  Tabs,
  TxFeedback,
} from "../ui";
import {
  fmt18,
  inspectUserFull,
  PROTOCOL_RANK_REWARDS,
  RANK_NAMES,
  readProtocol,
  resolveUserQuery,
  writeProtocol,
} from "@/lib/contract";
import { fmtUS } from "@/lib/format";

type KeeperTab = "ranks" | "dao" | "burn-reset" | "blacklist";

export default function ChainKeeperView() {
  const { overview, users, refreshUsers, runTx } = useAdmin();
  const p = overview?.protocol;
  const r = overview?.roles;

  const [tab, setTab] = useState<KeeperTab>("ranks");

  // ───────── Tab 1: Rank & Incentive Rewards ─────────
  const [rankUserInput, setRankUserInput] = useState("");
  const [rankId, setRankId] = useState<number>(0);
  const [userPreview, setUserPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [rankTx, setRankTx] = useState<{ status: "idle" | "pending" | "ok" | "error"; message?: string; hash?: string }>({
    status: "idle",
  });

  const [incUserInput, setIncUserInput] = useState("");
  const [incAmountUsd, setIncAmountUsd] = useState("");
  const [incTx, setIncTx] = useState<{ status: "idle" | "pending" | "ok" | "error"; message?: string; hash?: string }>({
    status: "idle",
  });

  // Rank Incentive Batch state
  const [incBatchRows, setIncBatchRows] = useState<{ wallet: string; label?: string; amountUsd: string }[]>([
    { wallet: "", amountUsd: "100" },
  ]);
  const [incBatchBulkMode, setIncBatchBulkMode] = useState(false);
  const [incBatchBulkText, setIncBatchBulkText] = useState("");
  const [incBatchTx, setIncBatchTx] = useState<{
    status: "idle" | "pending" | "ok" | "error";
    message?: string;
    hash?: string;
  }>({ status: "idle" });

  // ───────── Tab 2: DAO Partner Program ─────────
  const [daoRows, setDaoRows] = useState<{ wallet: string; shares: string }[]>([
    { wallet: "", shares: "1" },
  ]);
  const [daoBulkText, setDaoBulkText] = useState("");
  const [daoBulkMode, setDaoBulkMode] = useState(false);
  const [daoEligibleTx, setDaoEligibleTx] = useState<{
    status: "idle" | "pending" | "ok" | "error";
    message?: string;
    hash?: string;
  }>({ status: "idle" });

  const [distCount, setDistCount] = useState("50");
  const [daoDistTx, setDaoDistTx] = useState<{
    status: "idle" | "pending" | "ok" | "error";
    message?: string;
    hash?: string;
  }>({ status: "idle" });

  const [inspectCycle, setInspectCycle] = useState<string>("");
  const [cycleEligibleList, setCycleEligibleList] = useState<{ wallet: string; shares: bigint }[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);

  // ───────── Tab 3: Burn & Reset ─────────
  const [burnFromAddr, setBurnFromAddr] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [burnTargetBal, setBurnTargetBal] = useState<bigint | null>(null);
  const [burnTx, setBurnTx] = useState<{ status: "idle" | "pending" | "ok" | "error"; message?: string; hash?: string }>({
    status: "idle",
  });

  const [resetUserAddr, setResetUserAddr] = useState("");
  const [resetTx, setResetTx] = useState<{ status: "idle" | "pending" | "ok" | "error"; message?: string; hash?: string }>({
    status: "idle",
  });

  // ───────── Tab 4: Blacklist (Single & Batch) ─────────
  const [blUser, setBlUser] = useState("");
  const [blStatus, setBlStatus] = useState<boolean>(true);
  const [blTx, setBlTx] = useState<{ status: "idle" | "pending" | "ok" | "error"; message?: string; hash?: string }>({
    status: "idle",
  });

  const [blBatchText, setBlBatchText] = useState("");
  const [blBatchStatus, setBlBatchStatus] = useState<boolean>(true);
  const [blBatchTx, setBlBatchTx] = useState<{
    status: "idle" | "pending" | "ok" | "error";
    message?: string;
    hash?: string;
  }>({ status: "idle" });

  useEffect(() => {
    if (p?.daoCycle && !inspectCycle) {
      setInspectCycle(p.daoCycle.toString());
    }
  }, [p?.daoCycle]);

  const loadCycleEligible = async (cycStr?: string) => {
    const c = BigInt(cycStr || inspectCycle || p?.daoCycle || 1n);
    setLoadingEligible(true);
    try {
      const res = await readProtocol("getDaoEligible", [c]);
      const wallets: string[] = res?.[0] || [];
      const shares: bigint[] = res?.[1] || [];
      setCycleEligibleList(wallets.map((w, i) => ({ wallet: w, shares: BigInt(shares[i] ?? 0n) })));
    } catch {
      setCycleEligibleList([]);
    } finally {
      setLoadingEligible(false);
    }
  };

  useEffect(() => {
    if (inspectCycle) {
      loadCycleEligible(inspectCycle);
    }
  }, [inspectCycle]);

  const handleLookupRankUser = async (query: string) => {
    if (!query.trim()) return;
    setPreviewLoading(true);
    try {
      const info = await inspectUserFull(query);
      setUserPreview(info);
      setRankUserInput(info.address);
      const curRank = Number(info.protocolUser?.currentRank ?? 0n);
      if (curRank < 8) setRankId(curRank + 1);
    } catch (e: any) {
      setUserPreview({ error: e?.message || "User not found" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleUpdateRewardIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const addr = await resolveUserQuery(rankUserInput);
      setRankTx({ status: "pending", message: `Promoting ${addr} to rank_id=${rankId}…` });
      const res = await runTx(`updateRewardIncome(${addr.slice(0, 8)}…, rank ${rankId})`, () =>
        writeProtocol("updateRewardIncome", [addr, BigInt(rankId)])
      );
      if (res.ok) {
        setRankTx({ status: "ok", message: `Promoted user to Rank #${rankId}!`, hash: res.hash });
        handleLookupRankUser(addr);
      } else {
        setRankTx({ status: "error", message: res.error });
      }
    } catch (err: any) {
      setRankTx({ status: "error", message: err?.message });
    }
  };

  const handleUpdateRankIncentive = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const addr = await resolveUserQuery(incUserInput);
      const wei = parseUnits(incAmountUsd.trim(), 18);
      if (wei <= 0n) throw new Error("Amount must be greater than 0.");
      setIncTx({ status: "pending", message: `Crediting $${incAmountUsd} rank incentive to ${addr}…` });
      const res = await runTx(`updateRankIncentive(${addr.slice(0, 8)}…, $${incAmountUsd})`, () =>
        writeProtocol("updateRankIncentive", [addr, wei])
      );
      if (res.ok) {
        setIncTx({ status: "ok", message: `Rank incentive of $${incAmountUsd} credited!`, hash: res.hash });
        setIncAmountUsd("");
      } else {
        setIncTx({ status: "error", message: res.error });
      }
    } catch (err: any) {
      setIncTx({ status: "error", message: err?.message });
    }
  };

  const handleAutoFillIncentiveBatch = () => {
    const rankedUsers = users.filter((u) => u.storeRank > 0);
    if (rankedUsers.length === 0) {
      setIncBatchTx({
        status: "error",
        message: "No ranked users (Rank ≥ 1) found on-chain yet.",
      });
      return;
    }
    const rows = rankedUsers.map((u) => {
      const sug =
        u.suggestedIncentiveDailyUsd > 0n
          ? Number(formatUnits(u.suggestedIncentiveDailyUsd, 18)).toFixed(2)
          : u.suggestedIncentiveWeeklyUsd > 0n
          ? Number(formatUnits(u.suggestedIncentiveWeeklyUsd, 18)).toFixed(2)
          : "100";
      return {
        wallet: u.address,
        label: `${u.userCode} (${u.rankName} · ${(u.rankIncentiveBps / 100).toFixed(0)}%)`,
        amountUsd: sug,
      };
    });
    setIncBatchBulkMode(false);
    setIncBatchRows(rows);
    setIncBatchTx({
      status: "idle",
    });
  };

  const handleExecuteIncentiveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const queue: { address: Address; amountStr: string }[] = [];
      if (incBatchBulkMode) {
        const lines = incBatchBulkText
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        for (const line of lines) {
          const [wRaw, amtRaw] = line.split(/[,;\s]+/);
          if (!wRaw || !isAddress(wRaw))
            throw new Error(`Invalid wallet in line: "${line}"`);
          if (!amtRaw || Number(amtRaw) <= 0)
            throw new Error(`Amount must be > 0 in line: "${line}"`);
          queue.push({ address: wRaw as Address, amountStr: amtRaw });
        }
      } else {
        for (const r of incBatchRows) {
          const w = r.wallet.trim();
          if (!isAddress(w)) throw new Error(`Invalid wallet address: "${w}"`);
          if (!r.amountUsd.trim() || Number(r.amountUsd) <= 0)
            throw new Error(`Amount must be > 0 for ${w}`);
          queue.push({ address: w as Address, amountStr: r.amountUsd.trim() });
        }
      }

      if (queue.length === 0)
        throw new Error("Add at least one wallet and USD amount.");

      let lastHash: string | undefined;
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        const wei = parseUnits(item.amountStr, 18);
        setIncBatchTx({
          status: "pending",
          message: `[${i + 1}/${queue.length}] Crediting $${item.amountStr} Rank Incentive to ${item.address.slice(0, 8)}…`,
        });
        const res = await runTx(
          `[${i + 1}/${queue.length}] updateRankIncentive(${item.address.slice(0, 8)}…, $${item.amountStr})`,
          () => writeProtocol("updateRankIncentive", [item.address, wei])
        );
        if (!res.ok) {
          setIncBatchTx({
            status: "error",
            message: `Stopped at [${i + 1}/${queue.length}]: ${res.error}`,
            hash: lastHash,
          });
          return;
        }
        lastHash = res.hash;
      }

      setIncBatchTx({
        status: "ok",
        message: `Rank Incentive Batch completed for ${queue.length} user(s)!`,
        hash: lastHash,
      });
      await refreshUsers();
    } catch (err: any) {
      setIncBatchTx({ status: "error", message: err?.message });
    }
  };

  const handleAutoFetchDaoUsers = () => {
    const eligible = users.filter((u) => u.isDaoEligibleCandidate);
    const listToUse = eligible.length > 0 ? eligible : users.filter((u) => u.isActive);
    if (listToUse.length === 0) {
      setDaoEligibleTx({
        status: "error",
        message: "No DAO eligible or active users found yet.",
      });
      return;
    }
    const rows = listToUse.map((u) => ({
      wallet: u.address,
      shares: (
        u.currentCycleDaoShares > 0n
          ? u.currentCycleDaoShares
          : u.suggestedDaoShares
      ).toString(),
    }));
    setDaoBulkMode(false);
    setDaoRows(rows);
    setDistCount(String(rows.length));
  };

  const handleSetDaoEligible = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let wallets: Address[] = [];
      let shares: bigint[] = [];

      if (daoBulkMode) {
        const lines = daoBulkText
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        for (const line of lines) {
          const [wRaw, sRaw] = line.split(/[,;\s]+/);
          if (!wRaw || !isAddress(wRaw)) throw new Error(`Invalid wallet address in line: "${line}"`);
          const sh = BigInt(sRaw || "1");
          if (sh <= 0n) throw new Error(`Shares must be > 0 in line: "${line}"`);
          wallets.push(wRaw as Address);
          shares.push(sh);
        }
      } else {
        for (const row of daoRows) {
          const w = row.wallet.trim();
          if (!isAddress(w)) throw new Error(`Invalid wallet address: "${w}"`);
          const sh = BigInt(row.shares.trim() || "0");
          if (sh <= 0n) throw new Error(`Shares must be > 0 for wallet ${w}`);
          wallets.push(w as Address);
          shares.push(sh);
        }
      }

      if (wallets.length === 0) throw new Error("Add at least one wallet and share weight.");

      setDaoEligibleTx({
        status: "pending",
        message: `Registering ${wallets.length} DAO eligible wallet(s) for Cycle #${p?.daoCycle.toString() ?? "1"}…`,
      });
      const res = await runTx(`setDaoEligible(${wallets.length} wallets)`, () =>
        writeProtocol("setDaoEligible", [wallets, shares])
      );
      if (res.ok) {
        setDaoEligibleTx({
          status: "ok",
          message: `Registered ${wallets.length} wallet(s) in DAO Cycle!`,
          hash: res.hash,
        });
        loadCycleEligible();
      } else {
        setDaoEligibleTx({ status: "error", message: res.error });
      }
    } catch (err: any) {
      setDaoEligibleTx({ status: "error", message: err?.message });
    }
  };

  const handleDistributeDao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cnt = BigInt(distCount.trim() || "0");
      if (cnt <= 0n) throw new Error("Batch count must be > 0.");
      setDaoDistTx({ status: "pending", message: `Distributing DAO pool (batch count = ${cnt.toString()})…` });
      const res = await runTx(`distributeDao(${cnt.toString()})`, () => writeProtocol("distributeDao", [cnt]));
      if (res.ok) {
        setDaoDistTx({ status: "ok", message: `DAO distribution batch processed!`, hash: res.hash });
        loadCycleEligible();
      } else {
        setDaoDistTx({ status: "error", message: res.error });
      }
    } catch (err: any) {
      setDaoDistTx({ status: "error", message: err?.message });
    }
  };

  const checkBurnBalance = async (q: string) => {
    try {
      const info = await inspectUserFull(q);
      setBurnFromAddr(info.address);
      setBurnTargetBal(info.tokenBalance);
    } catch {
      setBurnTargetBal(null);
    }
  };

  const handleBurnFrom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const addr = await resolveUserQuery(burnFromAddr);
      const wei = parseUnits(burnAmount.trim(), 18);
      if (wei <= 0n) throw new Error("Burn amount must be > 0.");
      setBurnTx({ status: "pending", message: `Burning ${burnAmount} ARITOHAM from ${addr}…` });
      const res = await runTx(`Protocol.burnFrom(${addr.slice(0, 8)}…, ${burnAmount} ARI)`, () =>
        writeProtocol("burnFrom", [addr, wei])
      );
      if (res.ok) {
        setBurnTx({ status: "ok", message: `Burned ${burnAmount} ARITOHAM from ${addr}!`, hash: res.hash });
        setBurnAmount("");
        checkBurnBalance(addr);
      } else {
        setBurnTx({ status: "error", message: res.error });
      }
    } catch (err: any) {
      setBurnTx({ status: "error", message: err?.message });
    }
  };

  const handleResetSystems = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const addr = await resolveUserQuery(resetUserAddr);
      setResetTx({ status: "pending", message: `Resetting Rank, Business & DAO systems for ${addr}…` });
      const res = await runTx(`resetRankBusinessDao(${addr.slice(0, 8)}…)`, () =>
        writeProtocol("resetRankBusinessDao", [addr])
      );
      if (res.ok) {
        setResetTx({
          status: "ok",
          message: `User ${addr} Rank, Business & DAO systems have been reset!`,
          hash: res.hash,
        });
      } else {
        setResetTx({ status: "error", message: res.error });
      }
    } catch (err: any) {
      setResetTx({ status: "error", message: err?.message });
    }
  };

  const handleSingleBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const addr = await resolveUserQuery(blUser);
      setBlTx({
        status: "pending",
        message: `${blStatus ? "Blacklisting" : "Un-blacklisting"} ${addr}…`,
      });
      const res = await runTx(`setBlacklist(${addr.slice(0, 8)}…, ${blStatus})`, () =>
        writeProtocol("setBlacklist", [addr, blStatus])
      );
      if (res.ok) {
        setBlTx({
          status: "ok",
          message: `Wallet ${addr} is now ${blStatus ? "BLACKLISTED" : "UN-BLACKLISTED"}!`,
          hash: res.hash,
        });
      } else {
        setBlTx({ status: "error", message: res.error });
      }
    } catch (err: any) {
      setBlTx({ status: "error", message: err?.message });
    }
  };

  const handleBatchBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rawList = blBatchText
        .split(/[\r\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (rawList.length === 0) throw new Error("Enter at least one wallet address.");
      const addrs: Address[] = [];
      for (const item of rawList) {
        if (!isAddress(item)) throw new Error(`Invalid address: "${item}"`);
        addrs.push(item as Address);
      }
      setBlBatchTx({
        status: "pending",
        message: `Executing setBlacklistBatch for ${addrs.length} wallet(s) (status=${blBatchStatus})…`,
      });
      const res = await runTx(`setBlacklistBatch(${addrs.length} wallets, ${blBatchStatus})`, () =>
        writeProtocol("setBlacklistBatch", [addrs, blBatchStatus])
      );
      if (res.ok) {
        setBlBatchTx({
          status: "ok",
          message: `Updated blacklist status for ${addrs.length} wallet(s)!`,
          hash: res.hash,
        });
      } else {
        setBlBatchTx({ status: "error", message: res.error });
      }
    } catch (err: any) {
      setBlBatchTx({ status: "error", message: err?.message });
    }
  };

  // Price preview after keeper burn
  const burnPreviewPrice = (() => {
    if (!p || !burnAmount || Number(burnAmount) <= 0) return null;
    try {
      const wei = parseUnits(burnAmount.trim(), 18);
      if (wei >= p.totalSupply) return 0.01;
      const newSupply = p.totalSupply - wei;
      const newPriceWei = (p.liquidityPool * parseUnits("1", 18)) / newSupply;
      return Number(formatUnits(newPriceWei, 18));
    } catch {
      return null;
    }
  })();

  const selectedRankObj = PROTOCOL_RANK_REWARDS.find((x) => x.rankId === rankId) || PROTOCOL_RANK_REWARDS[0];

  return (
    <div className="stack">
      <PageTitle
        title="Chain Keeper Console (onlyChainKeeper)"
        sub="Execute all Chain Keeper governance, rank promotions, rank incentives, DAO eligibility & distributions, keeper token burns, and user system resets."
      />

      <RoleRequirementBanner
        roleName="Chain Keeper (onlyChainKeeper)"
        requiredAddress={p?.chainKeeper}
        hasRole={Boolean(r?.isChainKeeper)}
      />

      <Tabs<KeeperTab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "ranks", label: "Rank & Incentive Rewards", icon: "crown", badge: "2 Actions" },
          { id: "dao", label: "DAO Partner Program", icon: "gem", badge: "2 Actions" },
          { id: "burn-reset", label: "Keeper Burn & System Reset", icon: "flame", badge: "2 Actions" },
          { id: "blacklist", label: "Blacklist & Batch Blacklist", icon: "lock", badge: "2 Actions" },
        ]}
      />

      {tab === "ranks" && (
        <div className="stack">
          <div className="grid g-half">
          {/* updateRewardIncome */}
          <Panel
            eyebrow="ONLY CHAIN KEEPER · ONE-TIME RANK PROMOTION"
            title="1. Promote User Rank & Credit Reward (updateRewardIncome)"
            sub="Promotes user to a strictly higher rank_id (0..8) and credits the mapped one-time reward to their balance (uncapped by remainingCap)."
            badge="updateRewardIncome"
            tone="gold"
          >
            <form onSubmit={handleUpdateRewardIncome} className="stack" style={{ gap: 14 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label className="field-l" style={{ marginBottom: 0 }}>
                    User Wallet Address or User ID (e.g. ARI1000001)
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={previewLoading || !rankUserInput.trim()}
                    onClick={() => handleLookupRankUser(rankUserInput)}
                  >
                    <Icon name="search" size={13} /> {previewLoading ? "Checking…" : "Check User"}
                  </button>
                </div>
                <input
                  className="inp"
                  placeholder="0x... or 1000001"
                  value={rankUserInput}
                  onChange={(e) => setRankUserInput(e.target.value)}
                />
              </div>

              {userPreview && !userPreview.error && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "#0c0c0f",
                    border: "1px solid var(--line-2)",
                    display: "grid",
                    gap: 6,
                    fontSize: 12.5,
                  }}
                >
                  <div className="kv" style={{ padding: "4px 0" }}>
                    <span>Resolved Wallet</span>
                    <Addr text={userPreview.address} link />
                  </div>
                  <div className="kv" style={{ padding: "4px 0" }}>
                    <span>Current Protocol Rank (currentRank)</span>
                    <Pill tone="gold">
                      rank_id = {Number(userPreview.protocolUser?.currentRank ?? 0n)} (Store Rank:{" "}
                      {RANK_NAMES[Number(userPreview.storeUser?.rank ?? 0)]})
                    </Pill>
                  </div>
                  <div className="kv" style={{ padding: "4px 0" }}>
                    <span>Total Staked / Remaining Cap</span>
                    <b>
                      ${fmt18(userPreview.protocolUser?.totalStaked)} / $
                      {fmt18(userPreview.protocolUser?.remainingCap)}
                    </b>
                  </div>
                </div>
              )}
              {userPreview?.error && <div className="alert warn">{userPreview.error}</div>}

              <div>
                <label className="field-l">Target Rank (rank_id: 0..8 — must be &gt; user.currentRank)</label>
                <select
                  className="sel"
                  value={rankId}
                  onChange={(e) => setRankId(Number(e.target.value))}
                >
                  {PROTOCOL_RANK_REWARDS.map((rk) => (
                    <option key={rk.rankId} value={rk.rankId}>
                      rank_id = {rk.rankId} → {rk.name} (DataStore Rank #{rk.storeRank}) — One-Time Reward: $
                      {rk.rewardUsd.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="kv">
                <span>One-Time Rank Reward Credited</span>
                <b className="gold-t">${selectedRankObj.rewardUsd.toLocaleString()} USDT (Internal Balance)</b>
              </div>

              <button type="submit" className="btn btn-gold btn-block" disabled={rankTx.status === "pending"}>
                <Icon name="crown" size={16} /> Execute updateRewardIncome(user, {rankId})
              </button>
              <TxFeedback state={rankTx} />
            </form>
          </Panel>

          {/* updateRankIncentive */}
          <Panel
            eyebrow="ONLY CHAIN KEEPER · RECURRING RANK INCENTIVE"
            title="2. Credit Rank Incentive (updateRankIncentive)"
            sub="Credits recurring external rank incentive to a user's withdrawable balance (clamped to user.remainingCap)."
            badge={`Nonce #${p?.rankIncentiveNonce.toString() ?? "0"}`}
            tone="gold"
          >
            <form onSubmit={handleUpdateRankIncentive} className="stack" style={{ gap: 14 }}>
              <div>
                <label className="field-l">User Wallet Address or User ID</label>
                <input
                  className="inp"
                  placeholder="0x... or 1000001"
                  value={incUserInput}
                  onChange={(e) => setIncUserInput(e.target.value)}
                />
              </div>

              <div>
                <label className="field-l">Incentive Amount (USD, 18 Decimals)</label>
                <input
                  className="inp"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 250.50"
                  value={incAmountUsd}
                  onChange={(e) => setIncAmountUsd(e.target.value)}
                />
                <div className="quick">
                  {["50", "250", "1000"].map((preset) => (
                    <button key={preset} type="button" onClick={() => setIncAmountUsd(preset)}>
                      +${preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="alert gold">
                <span>
                  <b>Note:</b> <code>updateRankIncentive</code> automatically converts your USD input to 18-decimal wei (
                  <code>parseUnits(amount, 18)</code>) and records the incentive in both Protocol and DataStore.
                </span>
              </div>

              <button type="submit" className="btn btn-gold btn-block" disabled={incTx.status === "pending"}>
                <Icon name="award" size={16} /> Execute updateRankIncentive
              </button>
              <TxFeedback state={incTx} />
            </form>
          </Panel>
          </div>

          {/* 3. Rank Incentive Batch Panel */}
          <Panel
            eyebrow="ONLY CHAIN KEEPER · BATCH RANK INCENTIVE"
            title="3. Rank Incentive Batch Executor (updateRankIncentive Batch)"
            sub="Auto-fill all ranked users with their calculated incentive (or paste bulk CSV) and credit them in sequence."
            right={
              <>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleAutoFillIncentiveBatch}
                >
                  <Icon name="spark" size={14} /> Auto-Fill All Ranked Users
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setIncBatchBulkMode((m) => !m)}
                >
                  {incBatchBulkMode ? "Switch to Row Builder" : "Bulk CSV Mode"}
                </button>
              </>
            }
          >
            <form onSubmit={handleExecuteIncentiveBatch} className="stack" style={{ gap: 14 }}>
              {incBatchBulkMode ? (
                <div>
                  <label className="field-l">
                    Paste Wallets &amp; Incentive Amounts (one per line: 0xAddress, amountUSD)
                  </label>
                  <textarea
                    className="inp"
                    rows={5}
                    placeholder={"0x1234567890abcdef1234567890abcdef12345678, 250\n0xabcdefabcdefabcdefabcdefabcdefabcdefabcd, 500"}
                    value={incBatchBulkText}
                    onChange={(e) => setIncBatchBulkText(e.target.value)}
                    style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
                  />
                </div>
              ) : (
                <div className="stack" style={{ gap: 10 }}>
                  {incBatchRows.map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 180px auto",
                        gap: 10,
                        alignItems: "end",
                      }}
                    >
                      <div>
                        {idx === 0 && (
                          <label className="field-l">Wallet Address</label>
                        )}
                        <input
                          className="inp"
                          placeholder="0x..."
                          value={row.wallet}
                          onChange={(e) => {
                            const next = [...incBatchRows];
                            next[idx].wallet = e.target.value;
                            setIncBatchRows(next);
                          }}
                          style={{ fontFamily: "ui-monospace, monospace" }}
                        />
                        {row.label && (
                          <div style={{ fontSize: 11, color: "var(--gold-hi)", marginTop: 3 }}>
                            {row.label}
                          </div>
                        )}
                      </div>
                      <div>
                        {idx === 0 && (
                          <label className="field-l">Amount (USD)</label>
                        )}
                        <input
                          className="inp"
                          type="number"
                          step="any"
                          placeholder="100"
                          value={row.amountUsd}
                          onChange={(e) => {
                            const next = [...incBatchRows];
                            next[idx].amountUsd = e.target.value;
                            setIncBatchRows(next);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: "13px 14px" }}
                        disabled={incBatchRows.length <= 1}
                        onClick={() =>
                          setIncBatchRows(
                            incBatchRows.filter((_, i) => i !== idx)
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ alignSelf: "flex-start" }}
                    onClick={() =>
                      setIncBatchRows([
                        ...incBatchRows,
                        { wallet: "", amountUsd: "100" },
                      ])
                    }
                  >
                    <Icon name="plus" size={14} /> Add Another Incentive Row
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-gold btn-block"
                disabled={incBatchTx.status === "pending"}
              >
                <Icon name="award" size={16} /> Execute Rank Incentive Batch (
                {incBatchBulkMode ? "CSV" : `${incBatchRows.length} Row(s)`})
              </button>
              <TxFeedback state={incBatchTx} />
            </form>
          </Panel>
        </div>
      )}

      {tab === "dao" && (
        <div className="stack">
          <div className="cols-5">
            <Mini
              icon="gem"
              label="Current Accruing Cycle"
              value={p ? `Cycle #${p.daoCycle.toString()}` : "—"}
              hint="5% of stakes accrue here"
            />
            <Mini
              icon="dollar"
              label="Accruing DAO Pool"
              value={p ? `$${fmt18(p.daoPoolTotal, 2)}` : "—"}
              hint="daoPoolTotal"
            />
            <Mini
              icon="users"
              label="Eligible Wallets / Shares"
              value={p ? `${p.daoEligibleCount.toString()} / ${p.daoCurrentShares.toString()}` : "—"}
              hint="Current cycle total"
            />
            <Mini
              icon="clock"
              label="Last Cycle Distribution"
              value={p && p.daoLastCycleStart > 0n ? fmtUS(Number(p.daoLastCycleStart)) : "Never"}
              hint="24h cooldown between cycles"
            />
            <Mini
              icon="refresh"
              label="Paying Cycle Status"
              value={p && p.daoPayCycle > 0n ? `Cycle #${p.daoPayCycle.toString()} Active` : "Idle (0)"}
              hint={
                p && p.daoPayCycle > 0n
                  ? `Cursor: ${p.daoPayCursor.toString()} · Pool: $${fmt18(p.daoPayPool, 2)}`
                  : "Ready for new cycle"
              }
            />
          </div>

          <div className="grid g-half">
            {/* setDaoEligible */}
            <Panel
              eyebrow="ONLY CHAIN KEEPER · DAO ELIGIBILITY"
              title="1. Register Eligible Wallets & Shares (setDaoEligible)"
              sub={`Adds eligible wallets and share weights to the current accruing cycle (Cycle #${p?.daoCycle.toString() ?? "1"}). Callable multiple times per cycle.`}
              right={
                <>
                  <button type="button" className="btn btn-sm" onClick={handleAutoFetchDaoUsers}>
                    <Icon name="spark" size={14} /> Auto-Fetch DAO Eligible Users
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => setDaoBulkMode((m) => !m)}>
                    {daoBulkMode ? "Switch to Row Builder" : "Bulk CSV / Paste Mode"}
                  </button>
                </>
              }
            >
              <form onSubmit={handleSetDaoEligible} className="stack" style={{ gap: 14 }}>
                {daoBulkMode ? (
                  <div>
                    <label className="field-l">Paste Wallets & Shares (one per line: 0xAddress, shares)</label>
                    <textarea
                      className="inp"
                      rows={6}
                      placeholder={"0x1234567890abcdef1234567890abcdef12345678, 2\n0xabcdefabcdefabcdefabcdefabcdefabcdefabcd, 1"}
                      value={daoBulkText}
                      onChange={(e) => setDaoBulkText(e.target.value)}
                      style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
                    />
                  </div>
                ) : (
                  <div className="stack" style={{ gap: 10 }}>
                    {daoRows.map((row, idx) => (
                      <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: 10, alignItems: "end" }}>
                        <div>
                          {idx === 0 && <label className="field-l">Wallet Address</label>}
                          <input
                            className="inp"
                            placeholder="0x..."
                            value={row.wallet}
                            onChange={(e) => {
                              const next = [...daoRows];
                              next[idx].wallet = e.target.value;
                              setDaoRows(next);
                            }}
                            style={{ fontFamily: "ui-monospace, monospace" }}
                          />
                        </div>
                        <div>
                          {idx === 0 && <label className="field-l">Shares</label>}
                          <input
                            className="inp"
                            type="number"
                            min="1"
                            placeholder="1"
                            value={row.shares}
                            onChange={(e) => {
                              const next = [...daoRows];
                              next[idx].shares = e.target.value;
                              setDaoRows(next);
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: "13px 14px" }}
                          disabled={daoRows.length <= 1}
                          onClick={() => setDaoRows(daoRows.filter((_, i) => i !== idx))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ alignSelf: "flex-start" }}
                      onClick={() => setDaoRows([...daoRows, { wallet: "", shares: "1" }])}
                    >
                      <Icon name="plus" size={14} /> Add Another Wallet Row
                    </button>
                  </div>
                )}

                <button type="submit" className="btn btn-gold btn-block" disabled={daoEligibleTx.status === "pending"}>
                  <Icon name="userplus" size={16} /> Execute setDaoEligible(wallets, shares)
                </button>
                <TxFeedback state={daoEligibleTx} />
              </form>
            </Panel>

            {/* distributeDao */}
            <Panel
              eyebrow="ONLY CHAIN KEEPER · PAGINATED PAYOUT"
              title="2. Distribute DAO Pool (distributeDao)"
              sub="Snapshots the accruing DAO pool, opens the next cycle, and credits share-proportional rewards to eligible wallets (paginated by count)."
              badge={p && p.daoPayCycle > 0n ? `In Progress: Cycle #${p.daoPayCycle.toString()}` : "Ready"}
              tone={p && p.daoPayCycle > 0n ? "green" : "gold"}
            >
              <form onSubmit={handleDistributeDao} className="stack" style={{ gap: 14 }}>
                <div className="kv">
                  <span>Current Cycle Eligible Wallets</span>
                  <b>{p ? p.daoEligibleCount.toString() : "0"} wallets</b>
                </div>
                <div className="kv">
                  <span>Current Cycle Total Shares</span>
                  <b>{p ? p.daoCurrentShares.toString() : "0"} shares</b>
                </div>
                <div className="kv">
                  <span>Estimated Value Per Share</span>
                  <b className="gold-t">
                    {p && p.daoCurrentShares > 0n
                      ? `$${fmt18(p.daoPoolTotal / p.daoCurrentShares, 4)} / share`
                      : "$0.00 / share"}
                  </b>
                </div>

                <div>
                  <label className="field-l">Wallets to Process in This Call (count)</label>
                  <input
                    className="inp"
                    type="number"
                    min="1"
                    placeholder="50"
                    value={distCount}
                    onChange={(e) => setDistCount(e.target.value)}
                  />
                  <div className="quick">
                    {["25", "50", "100"].map((preset) => (
                      <button key={preset} type="button" onClick={() => setDistCount(preset)}>
                        Batch {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-gold btn-block" disabled={daoDistTx.status === "pending"}>
                  <Icon name="gem" size={16} /> Execute distributeDao({distCount || "0"})
                </button>
                <TxFeedback state={daoDistTx} />
              </form>
            </Panel>
          </div>

          {/* Cycle Eligible Wallets Inspector */}
          <Panel
            eyebrow="DAO CYCLE INSPECTOR"
            title={`Registered Eligible Wallets — Cycle #${inspectCycle || "1"}`}
            sub="Reads ARITOHAMProtocol.getDaoEligible(cycle) directly from the blockchain."
            right={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  className="inp"
                  type="number"
                  min="1"
                  style={{ width: 110, padding: "8px 12px" }}
                  value={inspectCycle}
                  onChange={(e) => setInspectCycle(e.target.value)}
                />
                <button type="button" className="btn btn-sm" onClick={() => loadCycleEligible(inspectCycle)}>
                  <Icon name="refresh" size={14} /> {loadingEligible ? "Loading…" : "Load Cycle"}
                </button>
              </div>
            }
          >
            <DataTable
              columns={[
                { key: "idx", label: "#", render: (_, i) => i + 1 },
                { key: "wallet", label: "Eligible Wallet", render: (row) => <Addr text={row.wallet} link /> },
                {
                  key: "shares",
                  label: "Share Weight",
                  align: "right",
                  render: (row) => <Pill tone="gold">{row.shares.toString()} shares</Pill>,
                },
              ]}
              rows={cycleEligibleList}
              empty="No eligible wallets registered for this cycle yet."
            />
          </Panel>
        </div>
      )}

      {tab === "burn-reset" && (
        <div className="grid g-half">
          {/* burnFrom */}
          <Panel
            eyebrow="ONLY CHAIN KEEPER · KEEPER BURN"
            title="1. Burn Tokens From Any Wallet (burnFrom)"
            sub="Burns ARITOHAM straight from a wallet without requiring allowance (works on blacklisted wallets too). Decreases totalSupply, increases totalBurnedTokens, and raises the token price."
            badge="burnFrom"
            tone="gold"
          >
            <form onSubmit={handleBurnFrom} className="stack" style={{ gap: 14 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label className="field-l" style={{ marginBottom: 0 }}>
                    Target Wallet Address or User ID (from)
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={!burnFromAddr.trim()}
                    onClick={() => checkBurnBalance(burnFromAddr)}
                  >
                    Check Balance
                  </button>
                </div>
                <input
                  className="inp"
                  placeholder="0x... or 1000001"
                  value={burnFromAddr}
                  onChange={(e) => setBurnFromAddr(e.target.value)}
                />
              </div>

              {burnTargetBal !== null && (
                <div className="kv">
                  <span>Wallet Current ARITOHAM Balance</span>
                  <b className="gold-t">{fmt18(burnTargetBal, 4)} ARI</b>
                </div>
              )}

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label className="field-l" style={{ marginBottom: 0 }}>
                    ARITOHAM Amount to Burn (18 Decimals)
                  </label>
                  {burnTargetBal !== null && burnTargetBal > 0n && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => setBurnAmount(formatUnits(burnTargetBal, 18))}
                    >
                      Max ({fmt18(burnTargetBal, 2)} ARI)
                    </button>
                  )}
                </div>
                <input
                  className="inp"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 500"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                />
              </div>

              {burnPreviewPrice !== null && (
                <div className="kv">
                  <span>Projected Token Price After Burn</span>
                  <b className="up">${burnPreviewPrice.toFixed(6)}</b>
                </div>
              )}

              <button type="submit" className="btn btn-gold btn-block" disabled={burnTx.status === "pending"}>
                <Icon name="flame" size={16} /> Execute Keeper burnFrom
              </button>
              <TxFeedback state={burnTx} />
            </form>
          </Panel>

          {/* resetRankBusinessDao */}
          <Panel
            eyebrow="ONLY CHAIN KEEPER · SYSTEM RESET"
            title="2. Reset User Rank, Business & DAO (resetRankBusinessDao)"
            sub="Resets a user's currentRank to 0, clears their DAO shares from the current accruing cycle, and calls dataStore.resetRankBusinessDao(user) to clear rank history, business counters, 7-day matching buckets, and DAO lifetime status."
            badge="resetRankBusinessDao"
            tone="red"
          >
            <form onSubmit={handleResetSystems} className="stack" style={{ gap: 14 }}>
              <div>
                <label className="field-l">User Wallet Address or User ID (user)</label>
                <input
                  className="inp"
                  placeholder="0x... or 1000001"
                  value={resetUserAddr}
                  onChange={(e) => setResetUserAddr(e.target.value)}
                />
              </div>

              <div className="alert warn">
                <span>
                  <b>What this resets:</b> Sets <code>currentRank = 0</code> (so the keeper can promote the user again), removes current cycle DAO shares, resets <code>directBusiness</code>, <code>teamBusiness</code>, <code>matchingBusiness</code>, 7-day matching buckets, and restarts the user&apos;s 20-day DAO qualification window. Referral tree structure and <code>selfStaked</code> are preserved.
                </span>
              </div>

              <button type="submit" className="btn btn-gold btn-block" disabled={resetTx.status === "pending"}>
                <Icon name="refresh" size={16} /> Execute resetRankBusinessDao(user)
              </button>
              <TxFeedback state={resetTx} />
            </form>
          </Panel>
        </div>
      )}

      {tab === "blacklist" && (
        <div className="grid g-half">
          <Panel
            eyebrow="ONLY CHAIN KEEPER · SINGLE WALLET"
            title="1. Blacklist / Un-Blacklist Wallet (setBlacklist)"
            sub="Calls ARITOHAMProtocol.setBlacklist(user, status), which forwards to ARITOHAM.setBlacklisted(user, status). Blacklisted wallets cannot send or receive ARITOHAM."
            badge="setBlacklist"
            tone="gold"
          >
            <form onSubmit={handleSingleBlacklist} className="stack" style={{ gap: 14 }}>
              <div>
                <label className="field-l">Wallet Address or User ID</label>
                <input
                  className="inp"
                  placeholder="0x... or 1000001"
                  value={blUser}
                  onChange={(e) => setBlUser(e.target.value)}
                />
              </div>

              <div>
                <label className="field-l">Blacklist Status</label>
                <select
                  className="sel"
                  value={blStatus ? "true" : "false"}
                  onChange={(e) => setBlStatus(e.target.value === "true")}
                >
                  <option value="true">true — Blacklist Wallet (Block Transfers &amp; Sells)</option>
                  <option value="false">false — Un-Blacklist Wallet (Restore Access)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-gold btn-block" disabled={blTx.status === "pending"}>
                <Icon name="lock" size={16} /> Execute setBlacklist(user, {String(blStatus)})
              </button>
              <TxFeedback state={blTx} />
            </form>
          </Panel>

          <Panel
            eyebrow="ONLY CHAIN KEEPER · BATCH WALLETS"
            title="2. Batch Blacklist / Un-Blacklist (setBlacklistBatch)"
            sub="Blacklists or un-blacklists multiple wallets in a single transaction."
            badge="setBlacklistBatch"
            tone="gold"
          >
            <form onSubmit={handleBatchBlacklist} className="stack" style={{ gap: 14 }}>
              <div>
                <label className="field-l">Wallet Addresses (One per line or comma-separated)</label>
                <textarea
                  className="inp"
                  rows={5}
                  placeholder={"0x1111111111111111111111111111111111111111\n0x2222222222222222222222222222222222222222"}
                  value={blBatchText}
                  onChange={(e) => setBlBatchText(e.target.value)}
                  style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
                />
              </div>

              <div>
                <label className="field-l">Batch Status</label>
                <select
                  className="sel"
                  value={blBatchStatus ? "true" : "false"}
                  onChange={(e) => setBlBatchStatus(e.target.value === "true")}
                >
                  <option value="true">true — Blacklist All Listed Wallets</option>
                  <option value="false">false — Un-Blacklist All Listed Wallets</option>
                </select>
              </div>

              <button type="submit" className="btn btn-gold btn-block" disabled={blBatchTx.status === "pending"}>
                <Icon name="lock" size={16} /> Execute setBlacklistBatch(users[], {String(blBatchStatus)})
              </button>
              <TxFeedback state={blBatchTx} />
            </form>
          </Panel>
        </div>
      )}
    </div>
  );
}
