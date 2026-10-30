"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useAdmin } from "@/components/AdminContext";
import {
  fmt18,
  PROTOCOL_RANK_REWARDS,
  RANK_NAMES,
} from "@/lib/contract";
import { PageTitle, Panel, Mini, Pill, Addr } from "@/components/ui";

export default function AllUsersRanksPage() {
  const { users, usersLoading, refreshUsers } = useAdmin();

  const [search, setSearch] = useState("");
  const [qualificationFilter, setQualificationFilter] = useState<
    "ALL" | "UPGRADE_READY" | "RANKED_ONLY" | "UNRANKED_ONLY"
  >("ALL");
  const [currentRankFilter, setCurrentRankFilter] = useState<string>("ALL");
  const [qualifiedRankFilter, setQualifiedRankFilter] = useState<string>("ALL");

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchAddr = u.address.toLowerCase().includes(q);
        const matchId = String(u.userId).includes(q) || u.userCode.toLowerCase().includes(q);
        if (!matchAddr && !matchId) return false;
      }
      if (qualificationFilter === "UPGRADE_READY" && !u.isRankUpgradeReady) return false;
      if (qualificationFilter === "RANKED_ONLY" && u.storeRank === 0) return false;
      if (qualificationFilter === "UNRANKED_ONLY" && u.storeRank > 0) return false;
      if (currentRankFilter !== "ALL" && u.storeRank !== Number(currentRankFilter)) return false;
      if (qualifiedRankFilter !== "ALL" && u.qualifiedStoreRank !== Number(qualifiedRankFilter))
        return false;
      return true;
    });
  }, [users, search, qualificationFilter, currentRankFilter, qualifiedRankFilter]);

  const stats = useMemo(() => {
    const upgradeReady = users.filter((u) => u.isRankUpgradeReady).length;
    const rankedUsers = users.filter((u) => u.storeRank > 0).length;
    const qualifiedAny = users.filter((u) => u.qualifiedStoreRank > 0).length;
    const totalRankIncome = users.reduce(
      (acc, u) => acc + u.rankIncentive + u.rewardIncome,
      0n
    );
    return { upgradeReady, rankedUsers, qualifiedAny, totalRankIncome };
  }, [users]);

  return (
    <div className="stack">
      <PageTitle
        title="3. All Users Ranks & Qualification"
        sub="Read View 3 — On-chain rank requirements, current vs qualified ranks, and upgrade readiness across all users"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <Link className="btn btn-gold btn-sm" href="/write/rank-reward">
              Go to 6. Rank Reward (Write) →
            </Link>
            <button className="btn btn-sm" onClick={() => refreshUsers()} disabled={usersLoading}>
              {usersLoading ? "Refreshing..." : "Refresh Users"}
            </button>
          </div>
        }
      />

      {/* Top KPIs */}
      <div className="grid cols-4">
        <Mini
          label="Qualified to Upgrade"
          value={String(stats.upgradeReady)}
          hint="Qualified Rank > Current Stored Rank"
        />
        <Mini
          label="Ranked Users (Rank ≥ 1)"
          value={`${stats.rankedUsers} / ${users.length}`}
          hint="Eligible for Rank Incentive"
        />
        <Mini
          label="Meets Rank Criteria"
          value={String(stats.qualifiedAny)}
          hint="Users meeting ≥ Spark (#1) thresholds"
        />
        <Mini
          label="Total Rank + Reward Paid"
          value={`$${fmt18(stats.totalRankIncome, 2)}`}
          hint="Cumulative rank incentive + rewards"
        />
      </div>

      {/* Protocol Rank Matrix Reference */}
      <Panel
        title="Protocol Rank Qualification Matrix (Ranks 1–9)"
        sub="Click any rank row to filter users qualified for that rank tier"
        right={
          qualifiedRankFilter !== "ALL" ? (
            <button className="btn btn-sm" onClick={() => setQualifiedRankFilter("ALL")}>
              Clear Rank Tier Filter
            </button>
          ) : null
        }
      >
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Store Rank</th>
                <th>Protocol rank_id</th>
                <th>Rank Name</th>
                <th className="num">Req. Self Staked</th>
                <th className="num">Req. Matching Business</th>
                <th className="num">Req. Directs</th>
                <th className="num">One-Time Rank Reward</th>
                <th className="num">Rank Incentive %</th>
                <th className="num">Current Holders</th>
                <th className="num">Qualified Now</th>
              </tr>
            </thead>
            <tbody>
              {PROTOCOL_RANK_REWARDS.map((r) => {
                const currentCount = users.filter((u) => u.storeRank === r.storeRank).length;
                const qualifiedCount = users.filter(
                  (u) => u.qualifiedStoreRank === r.storeRank
                ).length;
                const isSelected = qualifiedRankFilter === String(r.storeRank);
                return (
                  <tr
                    key={r.storeRank}
                    style={{
                      cursor: "pointer",
                      background: isSelected ? "rgba(212, 169, 74, 0.12)" : undefined,
                    }}
                    onClick={() =>
                      setQualifiedRankFilter(isSelected ? "ALL" : String(r.storeRank))
                    }
                  >
                    <td>
                      <Pill tone="gold">Rank #{r.storeRank}</Pill>
                    </td>
                    <td className="mono">rank_id = {r.rankId}</td>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td className="num mono">${r.selfStakedUsd.toLocaleString()}</td>
                    <td className="num mono">${r.matchingUsd.toLocaleString()}</td>
                    <td className="num mono">{r.directsRequired}</td>
                    <td className="num mono t-gold">${r.rewardUsd.toLocaleString()}</td>
                    <td className="num mono">{(r.incentiveBps / 100).toFixed(1)}%</td>
                    <td className="num mono">{currentCount}</td>
                    <td className="num mono t-ok">{qualifiedCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Filter Bar */}
      <Panel
        title="Filter Users by Rank & Qualification"
        sub="Filter who is qualified to upgrade, current stored rank, or qualified rank tier"
        right={
          <div className="seg">
            <button
              className={qualificationFilter === "ALL" ? "active" : ""}
              onClick={() => setQualificationFilter("ALL")}
            >
              All Users ({users.length})
            </button>
            <button
              className={qualificationFilter === "UPGRADE_READY" ? "active" : ""}
              onClick={() => setQualificationFilter("UPGRADE_READY")}
            >
              Qualified to Upgrade ({stats.upgradeReady})
            </button>
            <button
              className={qualificationFilter === "RANKED_ONLY" ? "active" : ""}
              onClick={() => setQualificationFilter("RANKED_ONLY")}
            >
              Ranked (≥1)
            </button>
            <button
              className={qualificationFilter === "UNRANKED_ONLY" ? "active" : ""}
              onClick={() => setQualificationFilter("UNRANKED_ONLY")}
            >
              Unranked (0)
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
            <label className="field-l">Current On-Chain Rank</label>
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
            <label className="field-l">Qualified Rank (By Criteria)</label>
            <select
              className="sel"
              value={qualifiedRankFilter}
              onChange={(e) => setQualifiedRankFilter(e.target.value)}
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

      {/* Users Rank Table */}
      <Panel
        title={`User Rank & Upgrade Qualification Table (${filteredUsers.length})`}
        sub="Compares each user's Self Staked, Matching Business, and Active Directs against protocol rank thresholds"
      >
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Current Rank</th>
                <th>Qualified Rank</th>
                <th>Upgrade Status</th>
                <th className="num">Self Staked</th>
                <th className="num">Matching Business</th>
                <th className="num">Directs (Active/Total)</th>
                <th className="num">Reward Income</th>
                <th className="num">Rank Incentive</th>
                <th className="num">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 32 }} className="muted">
                    No users match the selected rank filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const nextTier = PROTOCOL_RANK_REWARDS.find(
                    (r) => r.storeRank === Math.min(9, u.storeRank + 1)
                  );
                  return (
                    <tr key={u.address}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Pill tone="gold">{u.userCode}</Pill>
                          <Addr text={u.address} link />
                        </div>
                      </td>
                      <td>
                        <Pill tone={u.storeRank > 0 ? "gold" : "muted"}>
                          #{u.storeRank} {u.rankName}
                        </Pill>
                      </td>
                      <td>
                        <Pill tone={u.qualifiedStoreRank > u.storeRank ? "green" : "muted"}>
                          #{u.qualifiedStoreRank} {u.qualifiedRankName}
                        </Pill>
                      </td>
                      <td>
                        {u.isRankUpgradeReady ? (
                          <Pill tone="green">
                            QUALIFIED FOR #{u.qualifiedStoreRank} ($
                            {u.qualifiedRankRewardUsd.toLocaleString()})
                          </Pill>
                        ) : u.storeRank >= 9 ? (
                          <Pill tone="gold">MAX RANK (#9)</Pill>
                        ) : (
                          <Pill tone="muted">
                            Next: #{nextTier?.storeRank} {nextTier?.name}
                          </Pill>
                        )}
                      </td>
                      <td className="num mono">
                        ${fmt18(u.totalStaked, 2)}
                        {nextTier && (
                          <div className="muted" style={{ fontSize: 10 }}>
                            Target: ${nextTier.selfStakedUsd.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="num mono">
                        ${fmt18(u.matchingBusiness, 2)}
                        {nextTier && (
                          <div className="muted" style={{ fontSize: 10 }}>
                            Target: ${nextTier.matchingUsd.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="num mono">
                        {u.activeDirects} / {u.directCount}
                        {nextTier && (
                          <div className="muted" style={{ fontSize: 10 }}>
                            Target: {nextTier.directsRequired}
                          </div>
                        )}
                      </td>
                      <td className="num mono t-gold">${fmt18(u.rewardIncome, 2)}</td>
                      <td className="num mono">${fmt18(u.rankIncentive, 2)}</td>
                      <td className="num">
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {u.isRankUpgradeReady && (
                            <Link
                              className="btn btn-gold btn-sm"
                              href={`/write/rank-reward?user=${u.address}`}
                            >
                              Upgrade
                            </Link>
                          )}
                          <Link className="btn btn-sm" href={`/users/${u.address}`}>
                            Inspect
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
    </div>
  );
}
