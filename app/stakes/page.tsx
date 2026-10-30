"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { useAdmin } from "@/components/AdminContext";
import {
  fetchAllUserStakes,
  fmt18,
  GlobalStakeRow,
} from "@/lib/contract";
import { PageTitle, Panel, Mini, Pill, Addr } from "@/components/ui";

function toNum(wei: bigint): number {
  return Number(formatUnits(wei, 18));
}

function fmtDate(ts: number): string {
  if (!ts || ts <= 0) return "—";
  return new Date(ts * 1000).toLocaleString();
}

export default function AllUsersStakesPage() {
  const { users, usersLoading, refreshUsers } = useAdmin();
  const [stakes, setStakes] = useState<GlobalStakeRow[]>([]);
  const [stakesLoading, setStakesLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [minStakeUsd, setMinStakeUsd] = useState("");
  const [maxStakeUsd, setMaxStakeUsd] = useState("");
  const [minMintedAri, setMinMintedAri] = useState("");
  const [sortBy, setSortBy] = useState<"NEWEST" | "AMOUNT" | "CLAIMED" | "MINTED">("NEWEST");

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (users.length === 0) {
        setStakes([]);
        return;
      }
      setStakesLoading(true);
      try {
        const res = await fetchAllUserStakes(users);
        if (active) setStakes(res);
      } finally {
        if (active) setStakesLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [users]);

  const filteredStakes = useMemo(() => {
    return stakes
      .filter((s) => {
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchAddr = s.userAddress.toLowerCase().includes(q);
          const matchId = String(s.userId).includes(q) || s.userCode.toLowerCase().includes(q);
          if (!matchAddr && !matchId) return false;
        }
        if (statusFilter === "ACTIVE" && s.completed) return false;
        if (statusFilter === "COMPLETED" && !s.completed) return false;
        if (minStakeUsd && toNum(s.totalInvestment) < Number(minStakeUsd)) return false;
        if (maxStakeUsd && toNum(s.totalInvestment) > Number(maxStakeUsd)) return false;
        if (minMintedAri && toNum(s.mintedTokens) < Number(minMintedAri)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "AMOUNT") return toNum(b.totalInvestment) - toNum(a.totalInvestment);
        if (sortBy === "CLAIMED") return toNum(b.claimedRoi) - toNum(a.claimedRoi);
        if (sortBy === "MINTED") return toNum(b.mintedTokens) - toNum(a.mintedTokens);
        return b.startTime - a.startTime || b.userId - a.userId;
      });
  }, [stakes, search, statusFilter, minStakeUsd, maxStakeUsd, minMintedAri, sortBy]);

  const summary = useMemo(() => {
    return filteredStakes.reduce(
      (acc, s) => {
        acc.totalCount += 1;
        if (s.completed) acc.completedCount += 1;
        else acc.activeCount += 1;
        acc.investedUsd += s.totalInvestment;
        acc.stakedNetUsd += s.tokenUsdValue;
        acc.mintedAri += s.mintedTokens;
        acc.claimedRoiUsd += s.claimedRoi;
        acc.platformFeeUsd += s.ecosystemFee;
        return acc;
      },
      {
        totalCount: 0,
        activeCount: 0,
        completedCount: 0,
        investedUsd: 0n,
        stakedNetUsd: 0n,
        mintedAri: 0n,
        claimedRoiUsd: 0n,
        platformFeeUsd: 0n,
      }
    );
  }, [filteredStakes]);

  return (
    <div className="stack">
      <PageTitle
        title="2. All Users Stakes"
        sub="Read View 2 — Protocol-wide stake ledger across all users with real-time status, ROI claims, and minted token filtering"
        right={
          <button
            className="btn btn-sm"
            onClick={() => refreshUsers()}
            disabled={usersLoading || stakesLoading}
          >
            {usersLoading || stakesLoading ? "Scanning Stakes..." : `Refresh Stakes (${stakes.length})`}
          </button>
        }
      />

      {/* Summary KPIs */}
      <div className="grid cols-6">
        <Mini
          label="Filtered Stakes"
          value={`${summary.totalCount} / ${stakes.length}`}
          hint={`Active: ${summary.activeCount} • Done: ${summary.completedCount}`}
        />
        <Mini
          label="Total Invested"
          value={`$${fmt18(summary.investedUsd, 2)}`}
          hint="Gross capital deposited"
        />
        <Mini
          label="Total Net Staked"
          value={`$${fmt18(summary.stakedNetUsd, 2)}`}
          hint="Active ROI principal base"
        />
        <Mini
          label="Total Minted ARI"
          value={`${fmt18(summary.mintedAri, 2)} ARI`}
          hint="Minted on stake creation"
        />
        <Mini
          label="Claimed ROI"
          value={`$${fmt18(summary.claimedRoiUsd, 2)}`}
          hint="Cumulative staking rewards"
        />
        <Mini
          label="Ecosystem Fees"
          value={`$${fmt18(summary.platformFeeUsd, 2)}`}
          hint="Fee deductions from stakes"
        />
      </div>

      {/* Filter Bar */}
      <Panel
        title="Stake Ledger Filters"
        sub="Filter stakes across all users by wallet, user ID, active/completed status, USD amount, or minted ARI"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <div className="seg">
              <button
                className={statusFilter === "ALL" ? "active" : ""}
                onClick={() => setStatusFilter("ALL")}
              >
                All ({stakes.length})
              </button>
              <button
                className={statusFilter === "ACTIVE" ? "active" : ""}
                onClick={() => setStatusFilter("ACTIVE")}
              >
                Active Only
              </button>
              <button
                className={statusFilter === "COMPLETED" ? "active" : ""}
                onClick={() => setStatusFilter("COMPLETED")}
              >
                Completed Only
              </button>
            </div>
            <button
              className="btn btn-sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setMinStakeUsd("");
                setMaxStakeUsd("");
                setMinMintedAri("");
                setSortBy("NEWEST");
              }}
            >
              Reset
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
            <label className="field-l">Min Invested ($)</label>
            <input
              type="number"
              className="inp"
              placeholder="0"
              value={minStakeUsd}
              onChange={(e) => setMinStakeUsd(e.target.value)}
            />
          </div>
          <div>
            <label className="field-l">Max Invested ($)</label>
            <input
              type="number"
              className="inp"
              placeholder="No max"
              value={maxStakeUsd}
              onChange={(e) => setMaxStakeUsd(e.target.value)}
            />
          </div>
          <div>
            <label className="field-l">Min Minted ARI</label>
            <input
              type="number"
              className="inp"
              placeholder="0"
              value={minMintedAri}
              onChange={(e) => setMinMintedAri(e.target.value)}
            />
          </div>
          <div>
            <label className="field-l">Sort By</label>
            <select
              className="sel"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="NEWEST">Newest Stake First</option>
              <option value="AMOUNT">Highest Invested ($)</option>
              <option value="CLAIMED">Highest Claimed ROI ($)</option>
              <option value="MINTED">Highest Minted ARI</option>
            </select>
          </div>
        </div>
      </Panel>

      {/* Stakes Table */}
      <Panel
        title={`All User Stakes (${filteredStakes.length})`}
        sub="Every individual stake record stored in ARITOHAMProtocol across all discovered participants"
      >
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>User ID & Wallet</th>
                <th>Rank</th>
                <th>Stake #</th>
                <th className="num">Invested ($)</th>
                <th className="num">Net Staked ($)</th>
                <th className="num">Eco Fee ($)</th>
                <th className="num">Minted ARI</th>
                <th className="num">Daily / Total ROI</th>
                <th className="num">Claimed ROI ($)</th>
                <th>Start / Last Claim</th>
                <th>Status</th>
                <th className="num">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading || stakesLoading ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", padding: 32 }} className="muted">
                    Loading all stakes across protocol users...
                  </td>
                </tr>
              ) : filteredStakes.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", padding: 32 }} className="muted">
                    No stakes match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStakes.map((s) => (
                  <tr key={`${s.userAddress}-${s.stakeIndex}`}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Pill tone="gold">{s.userCode}</Pill>
                        <Addr text={s.userAddress} link />
                      </div>
                    </td>
                    <td>
                      <Pill tone="muted">{s.userRankName}</Pill>
                    </td>
                    <td className="mono">Stake #{s.stakeIndex}</td>
                    <td className="num mono t-gold">${fmt18(s.totalInvestment, 2)}</td>
                    <td className="num mono">${fmt18(s.tokenUsdValue, 2)}</td>
                    <td className="num mono muted">${fmt18(s.ecosystemFee, 2)}</td>
                    <td className="num mono">{fmt18(s.mintedTokens, 2)} ARI</td>
                    <td className="num mono">
                      ${fmt18(s.dailyRoi, 2)}/d
                      <div className="muted" style={{ fontSize: 10 }}>
                        Cap: ${fmt18(s.totalRoi, 2)} ({s.totalDays}d)
                      </div>
                    </td>
                    <td className="num mono t-ok">${fmt18(s.claimedRoi, 2)}</td>
                    <td className="mono" style={{ fontSize: 11.5 }}>
                      {fmtDate(s.startTime)}
                      <div className="muted" style={{ fontSize: 10 }}>
                        Claim: {fmtDate(s.lastClaimTime)}
                      </div>
                    </td>
                    <td>
                      {s.completed ? (
                        <Pill tone="muted">COMPLETED</Pill>
                      ) : (
                        <Pill tone="green">ACTIVE</Pill>
                      )}
                    </td>
                    <td className="num">
                      <Link className="btn btn-sm" href={`/users/${s.userAddress}`}>
                        Profile
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
