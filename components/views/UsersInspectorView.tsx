"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { isAddress } from "viem";
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
  Tabs,
  Tag,
} from "@/components/ui";
import {
  fmt18,
  RANK_NAMES,
  type MonitoredUserRow,
} from "@/lib/contract";

type StatusFilter =
  | "all"
  | "active"
  | "inactive"
  | "ranked"
  | "dao"
  | "blacklisted"
  | "cap_reached";

type SortKey =
  | "userId"
  | "rank"
  | "staked"
  | "balance"
  | "income"
  | "business"
  | "ariBalance"
  | "directs";

export function UsersInspectorView() {
  const {
    users,
    usersLoading,
    refreshUsers,
    addWatchedAddress,
    overview,
  } = useAdmin();

  const roles = overview?.roles;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rankFilter, setRankFilter] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<SortKey>("userId");
  const [sortDesc, setSortDesc] = useState<boolean>(false);

  const [customWalletInput, setCustomWalletInput] = useState("");
  const [customWalletFeedback, setCustomWalletFeedback] = useState<
    string | null
  >(null);

  const [selectedKeeperUser, setSelectedKeeperUser] =
    useState<MonitoredUserRow | null>(null);
  const [expandedUserAddr, setExpandedUserAddr] = useState<string | null>(null);

  // Aggregate metrics across all monitored users
  const aggregates = useMemo(() => {
    let activeCount = 0;
    let rankedCount = 0;
    let daoCount = 0;
    let blacklistedCount = 0;
    let totalStakedUSD = 0n;
    let totalWithdrawableUSD = 0n;
    let totalIncomeUSD = 0n;
    let totalDirectIncomeUSD = 0n;
    let totalGenerationIncomeUSD = 0n;
    let totalRoiIncomeUSD = 0n;
    let totalDaoIncomeUSD = 0n;
    let totalRankRewardUSD = 0n;
    let totalRankIncentiveUSD = 0n;
    let totalAriHoldings = 0n;

    const rankCounts = Array<number>(RANK_NAMES.length).fill(0);

    for (const u of users) {
      if (u.isActive) activeCount++;
      if (u.storeRank > 0) rankedCount++;
      if (u.daoLifetime) daoCount++;
      if (u.isBlacklisted) blacklistedCount++;

      totalStakedUSD += u.totalStaked;
      totalWithdrawableUSD += u.balance;
      totalIncomeUSD += u.totalIncome;
      totalDirectIncomeUSD += u.directIncome;
      totalGenerationIncomeUSD += u.generationIncome;
      totalRoiIncomeUSD += u.roiAccrued;
      totalDaoIncomeUSD += u.daoIncome;
      totalRankRewardUSD += u.rewardIncome;
      totalRankIncentiveUSD += u.rankIncentive;
      totalAriHoldings += u.tokenBalance;

      const rIdx = Math.min(RANK_NAMES.length - 1, Math.max(0, u.storeRank));
      rankCounts[rIdx] = (rankCounts[rIdx] || 0) + 1;
    }

    return {
      totalUsers: users.length,
      activeCount,
      inactiveCount: users.length - activeCount,
      rankedCount,
      daoCount,
      blacklistedCount,
      totalStakedUSD,
      totalWithdrawableUSD,
      totalIncomeUSD,
      totalDirectIncomeUSD,
      totalGenerationIncomeUSD,
      totalRoiIncomeUSD,
      totalDaoIncomeUSD,
      totalRankRewardUSD,
      totalRankIncentiveUSD,
      totalAriHoldings,
      rankCounts,
    };
  }, [users]);

  // Filtered and sorted user rows
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = users.filter((u) => {
      if (q) {
        const matchesAddr = u.address.toLowerCase().includes(q);
        const matchesId =
          u.userCode.toLowerCase().includes(q) ||
          u.userId.toString().includes(q);
        const matchesRef = u.referrer.toLowerCase().includes(q);
        const matchesRank = u.rankName.toLowerCase().includes(q);
        if (!matchesAddr && !matchesId && !matchesRef && !matchesRank) {
          return false;
        }
      }

      if (rankFilter !== "all" && u.storeRank !== rankFilter) {
        return false;
      }

      if (statusFilter === "active" && !u.isActive) return false;
      if (statusFilter === "inactive" && u.isActive) return false;
      if (statusFilter === "ranked" && u.storeRank === 0) return false;
      if (statusFilter === "dao" && !u.daoLifetime) return false;
      if (statusFilter === "blacklisted" && !u.isBlacklisted) return false;
      if (
        statusFilter === "cap_reached" &&
        !(u.totalStaked > 0n && u.remainingCap === 0n)
      ) {
        return false;
      }

      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "userId":
          cmp = a.userId - b.userId;
          break;
        case "rank":
          cmp = a.storeRank - b.storeRank;
          break;
        case "staked":
          cmp =
            a.totalStaked < b.totalStaked
              ? -1
              : a.totalStaked > b.totalStaked
              ? 1
              : 0;
          break;
        case "balance":
          cmp =
            a.balance < b.balance ? -1 : a.balance > b.balance ? 1 : 0;
          break;
        case "income":
          cmp =
            a.totalIncome < b.totalIncome
              ? -1
              : a.totalIncome > b.totalIncome
              ? 1
              : 0;
          break;
        case "business":
          cmp =
            a.teamBusiness < b.teamBusiness
              ? -1
              : a.teamBusiness > b.teamBusiness
              ? 1
              : 0;
          break;
        case "ariBalance":
          cmp =
            a.tokenBalance < b.tokenBalance
              ? -1
              : a.tokenBalance > b.tokenBalance
              ? 1
              : 0;
          break;
        case "directs":
          cmp = a.directCount - b.directCount;
          break;
      }
      return sortDesc ? -cmp : cmp;
    });

    return list;
  }, [users, searchQuery, statusFilter, rankFilter, sortBy, sortDesc]);

  const handleAddCustomWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomWalletFeedback(null);
    const trimmed = customWalletInput.trim();
    if (!isAddress(trimmed)) {
      setCustomWalletFeedback("Please enter a valid 0x wallet address.");
      return;
    }
    await addWatchedAddress(trimmed);
    setCustomWalletInput("");
    setSearchQuery(trimmed);
    setCustomWalletFeedback(`Added ${trimmed} to monitored list.`);
  };

  // Keep modal user synced with latest refreshed data
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
        title="User Monitoring & Chain Keeper Console"
        sub="Live user ranks, withdrawable balances, staking caps, income streams, team business, and per-user Chain Keeper actions."
        right={
          <>
            <form
              onSubmit={handleAddCustomWallet}
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              <input
                type="text"
                className="inp"
                style={{ width: 250, padding: "10px 14px", fontSize: 13 }}
                placeholder="Track unlisted 0x wallet..."
                value={customWalletInput}
                onChange={(e) => setCustomWalletInput(e.target.value)}
              />
              <button type="submit" className="btn btn-sm">
                <Icon name="plus" size={14} /> Watch Wallet
              </button>
            </form>

            <button
              type="button"
              className="btn btn-gold"
              onClick={() => refreshUsers()}
              disabled={usersLoading}
            >
              <Icon name="refresh" size={16} />{" "}
              {usersLoading ? "Syncing Users..." : "Refresh All Users"}
            </button>
          </>
        }
      />

      {customWalletFeedback && (
        <div className="alert gold">
          <Icon name="info" size={18} />
          <div>{customWalletFeedback}</div>
        </div>
      )}

      {/* Hero KPI Tiles with Different Numbers */}
      <Hero
        eyebrow="LIVE ON-CHAIN USER TELEMETRY"
        title="Protocol User Metrics & Balances"
        desc="Aggregated across all discovered users in AritohamDataStore (ARI1000001+) and ARITOHAMProtocol."
        right={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {roles?.isChainKeeper ? (
              <Pill tone="green" dot>
                Chain Keeper Connected
              </Pill>
            ) : (
              <Pill tone="gold">
                Next ID: ARI{overview ? overview.store.nextUserId : "..."}
              </Pill>
            )}
          </div>
        }
        tiles={[
          {
            icon: "users",
            label: "Monitored Users",
            value: `${aggregates.totalUsers}`,
            hint: `${aggregates.activeCount} Active · ${aggregates.inactiveCount} Inactive`,
          },
          {
            icon: "crown",
            label: "Ranked & DAO Users",
            value: `${aggregates.rankedCount} Ranked`,
            hint: `${aggregates.daoCount} Lifetime DAO Partners`,
          },
          {
            icon: "briefcase",
            label: "Total Staked (USD)",
            value: `$${fmt18(aggregates.totalStakedUSD, 2)}`,
            hint: "Cumulative user principal",
          },
          {
            icon: "wallet",
            label: "Withdrawable Balances",
            value: `$${fmt18(aggregates.totalWithdrawableUSD, 2)}`,
            hint: "Unclaimed user USD in protocol",
          },
          {
            icon: "trend",
            label: "Total Income Earned",
            value: `$${fmt18(aggregates.totalIncomeUSD, 2)}`,
            hint: "Combined across 6 reward streams",
          },
          {
            icon: "coins",
            label: "User ARI Holdings",
            value: `${fmt18(aggregates.totalAriHoldings, 0)} ARI`,
            hint: `${aggregates.blacklistedCount} Blacklisted wallet(s)`,
          },
        ]}
      />

      {/* Rank Distribution Breakdown + Income Stream Totals */}
      <div className="grid g-half">
        <Panel
          eyebrow="RANK DISTRIBUTION (0..9)"
          title="Users by Rank Tier"
          sub="Click any rank card below to filter the user table by that rank."
          right={
            rankFilter !== "all" ? (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setRankFilter("all")}
              >
                Clear Rank Filter (#{rankFilter})
              </button>
            ) : undefined
          }
        >
          <div className="cols-5">
            {RANK_NAMES.map((rName, idx) => {
              const count = aggregates.rankCounts[idx] || 0;
              const isSelected = rankFilter === idx;
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setRankFilter(isSelected ? "all" : idx)}
                  className={`rank-pill-btn ${isSelected ? "active" : ""}`}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "var(--muted)",
                      }}
                    >
                      #{idx}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--display)",
                        fontSize: 18,
                        fontWeight: 700,
                        color: count > 0 ? "var(--gold-hi)" : "var(--dim)",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "var(--text)",
                    }}
                  >
                    {rName}
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel
          eyebrow="REWARD STREAM TOTALS"
          title="Aggregate Income by Category (USD)"
          sub="Sum of all 6 protocol reward streams across monitored users."
          badge={`$${fmt18(aggregates.totalIncomeUSD, 2)} Total`}
          tone="gold"
        >
          <div className="cols-3">
            <Mini
              flat
              label="Direct Referral"
              value={`$${fmt18(aggregates.totalDirectIncomeUSD, 2)}`}
            />
            <Mini
              flat
              label="Generation"
              value={`$${fmt18(aggregates.totalGenerationIncomeUSD, 2)}`}
            />
            <Mini
              flat
              label="ROI Accrued"
              value={
                <span className="up">
                  ${fmt18(aggregates.totalRoiIncomeUSD, 2)}
                </span>
              }
            />
            <Mini
              flat
              label="DAO Income"
              value={`$${fmt18(aggregates.totalDaoIncomeUSD, 2)}`}
            />
            <Mini
              flat
              label="Rank Reward"
              value={
                <span className="gold-t">
                  ${fmt18(aggregates.totalRankRewardUSD, 2)}
                </span>
              }
            />
            <Mini
              flat
              label="Rank Incentive"
              value={
                <span className="gold-t">
                  ${fmt18(aggregates.totalRankIncentiveUSD, 2)}
                </span>
              }
            />
          </div>
        </Panel>
      </div>

      {/* Main Directory Panel */}
      <Panel
        eyebrow="USER MONITORING DIRECTORY"
        title={`Registered Protocol Users (${filteredUsers.length} of ${users.length})`}
        sub="Every user row has a Chain Keeper Actions button to execute rank rewards, incentives, DAO shares, token burns, blacklist, or resets."
      >
        {/* Status Tabs */}
        <Tabs<StatusFilter>
          value={statusFilter}
          onChange={setStatusFilter}
          tabs={[
            {
              id: "all",
              label: "All Users",
              icon: "users",
              badge: String(users.length),
            },
            {
              id: "active",
              label: "Active Stakers",
              icon: "check",
              badge: String(aggregates.activeCount),
            },
            {
              id: "inactive",
              label: "Inactive",
              icon: "clock",
              badge: String(aggregates.inactiveCount),
            },
            {
              id: "ranked",
              label: "Ranked",
              icon: "crown",
              badge: String(aggregates.rankedCount),
            },
            {
              id: "dao",
              label: "DAO Partners",
              icon: "gem",
              badge: String(aggregates.daoCount),
            },
            {
              id: "blacklisted",
              label: "Blacklisted",
              icon: "lock",
              badge: String(aggregates.blacklistedCount),
            },
            {
              id: "cap_reached",
              label: "Cap Reached",
              icon: "target",
            },
          ]}
        />

        {/* Search & Sort Filter Bar */}
        <div className="filters three">
          <div>
            <label className="field-l">Search User ID / Wallet / Referrer / Rank</label>
            <div className="search">
              <Icon name="search" size={16} />
              <input
                type="text"
                className="inp"
                placeholder="Search ARI1000001, 0x wallet, Spark..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-l">Filter by Rank</label>
            <select
              className="sel"
              value={rankFilter === "all" ? "all" : String(rankFilter)}
              onChange={(e) =>
                setRankFilter(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                )
              }
            >
              <option value="all">All Ranks (0 - 9)</option>
              {RANK_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  Rank #{idx} — {name} ({aggregates.rankCounts[idx] || 0})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-l">Sort Directory By</label>
            <select
              className="sel"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
            >
              <option value="userId">User ID</option>
              <option value="rank">Rank Level</option>
              <option value="balance">Withdrawable Balance (USD)</option>
              <option value="staked">Total Staked (USD)</option>
              <option value="income">Total Income Earned (USD)</option>
              <option value="business">Team Business Volume (USD)</option>
              <option value="ariBalance">Wallet ARI Token Balance</option>
              <option value="directs">Direct Referrals Count</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              className="btn"
              onClick={() => setSortDesc((prev) => !prev)}
            >
              <Icon name="swap" size={15} />{" "}
              {sortDesc ? "High → Low" : "Low → High"}
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>User ID / Wallet</th>
                <th>Rank &amp; Status</th>
                <th>Staked &amp; Cap (USD)</th>
                <th>Withdrawable &amp; Wallet</th>
                <th>Total &amp; Stream Incomes</th>
                <th>Team &amp; Business</th>
                <th>DAO Status</th>
                <th className="ta-r">Chain Keeper &amp; Monitor Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">
                      Loading registered users from AritohamDataStore &amp;
                      ARITOHAMProtocol...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">
                      No users match the active filters.
                      <small>
                        Try clearing the search query or watching a custom wallet
                        address above.
                      </small>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isExpanded = expandedUserAddr === u.address;
                  const maxCapUsd =
                    u.totalStaked * BigInt(Math.max(1, u.maxPayout));
                  return (
                    <React.Fragment key={u.address}>
                      <tr>
                        {/* 1. User ID & Wallet */}
                        <td>
                          <div className="cell-2">
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span className="gold-t" style={{ fontWeight: 800 }}>
                                {u.userCode}
                              </span>
                              {overview?.protocol.rootUser.toLowerCase() ===
                                u.address.toLowerCase() && (
                                <Tag tone="gold">ROOT</Tag>
                              )}
                            </div>
                            <div className="a">
                              <Addr text={u.address} link />
                            </div>
                            <div className="a" style={{ fontSize: 11 }}>
                              Ref: <Addr text={u.referrer} />
                            </div>
                          </div>
                        </td>

                        {/* 2. Rank & Status */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                            <Pill tone={u.storeRank > 0 ? "gold" : "muted"}>
                              #{u.storeRank} {u.rankName}
                            </Pill>
                            {u.isBlacklisted ? (
                              <Tag tone="red">Blacklisted</Tag>
                            ) : u.isActive ? (
                              <Tag tone="green">Active</Tag>
                            ) : (
                              <Tag tone="muted">Inactive</Tag>
                            )}
                          </div>
                        </td>

                        {/* 3. Staked & Cap */}
                        <td>
                          <div className="cell-2">
                            <span>${fmt18(u.totalStaked, 2)}</span>
                            <span className="a">
                              Cap Left:{" "}
                              <b className="gold-t">${fmt18(u.remainingCap, 2)}</b>{" "}
                              / ${fmt18(maxCapUsd, 0)}
                            </span>
                            <span className="a" style={{ fontSize: 11 }}>
                              {u.stakeCount} stake(s) · {u.openLevels} open lvl
                            </span>
                          </div>
                        </td>

                        {/* 4. Withdrawable & Wallet Balances */}
                        <td>
                          <div className="cell-2">
                            <span className="up">${fmt18(u.balance, 2)} USD</span>
                            <span className="a gold-t">
                              {fmt18(u.tokenBalance, 2)} ARI
                            </span>
                            <span className="a" style={{ fontSize: 11 }}>
                              {fmt18(u.usdtBalance, 2)} USDT
                            </span>
                          </div>
                        </td>

                        {/* 5. Total & Stream Incomes */}
                        <td>
                          <div className="cell-2">
                            <span className="gold-t">${fmt18(u.totalIncome, 2)}</span>
                            <span className="a" style={{ fontSize: 11.5 }}>
                              Dir: ${fmt18(u.directIncome, 1)} · Gen: $
                              {fmt18(u.generationIncome, 1)}
                            </span>
                            <span className="a" style={{ fontSize: 11.5 }}>
                              ROI: ${fmt18(u.roiAccrued, 1)} · Rnk: $
                              {fmt18(u.rewardIncome + u.rankIncentive, 1)}
                            </span>
                          </div>
                        </td>

                        {/* 6. Team & Business */}
                        <td>
                          <div className="cell-2">
                            <span>
                              {u.directCount} Directs / {u.teamCount} Team
                            </span>
                            <span className="a">
                              Team Biz: <b>${fmt18(u.teamBusiness, 2)}</b>
                            </span>
                            <span className="a" style={{ fontSize: 11 }}>
                              Direct Biz: ${fmt18(u.directBusiness, 2)}
                            </span>
                          </div>
                        </td>

                        {/* 7. DAO Status */}
                        <td>
                          {u.daoLifetime ? (
                            <div className="cell-2">
                              <Pill tone="green" dot>
                                DAO Partner
                              </Pill>
                              <span className="a">
                                {u.currentCycleDaoShares.toString()} Cycle Shares
                              </span>
                              <span className="a" style={{ fontSize: 11 }}>
                                Earned: ${fmt18(u.daoIncome, 2)}
                              </span>
                            </div>
                          ) : (
                            <Tag tone="muted">Standard</Tag>
                          )}
                        </td>

                        {/* 8. Chain Keeper Actions Button & Monitor Link */}
                        <td className="ta-r">
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: 8,
                            }}
                          >
                            <button
                              type="button"
                              className="btn btn-gold btn-sm"
                              onClick={() => setSelectedKeeperUser(u)}
                            >
                              <Icon name="shield" size={14} /> Chain Keeper Actions
                            </button>

                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() =>
                                  setExpandedUserAddr(
                                    isExpanded ? null : u.address
                                  )
                                }
                              >
                                {isExpanded ? "Hide Numbers" : "Quick Numbers"}
                              </button>

                              <Link
                                href={`/users/${u.address}`}
                                className="btn btn-sm"
                              >
                                Full Monitor <Icon name="right" size={13} />
                              </Link>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Quick Breakdown Row */}
                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={8}
                            style={{
                              background: "#0a0a0d",
                              padding: "18px 20px",
                            }}
                          >
                            <div className="cols-4">
                              <Mini
                                flat
                                label="1. Direct Referral Income"
                                value={`$${fmt18(u.directIncome, 4)}`}
                              />
                              <Mini
                                flat
                                label="2. Generation Income"
                                value={`$${fmt18(u.generationIncome, 4)}`}
                              />
                              <Mini
                                flat
                                label="3. Daily ROI Accrued"
                                value={
                                  <span className="up">
                                    ${fmt18(u.roiAccrued, 4)}
                                  </span>
                                }
                              />
                              <Mini
                                flat
                                label="4. DAO Pool Income"
                                value={`$${fmt18(u.daoIncome, 4)}`}
                              />
                              <Mini
                                flat
                                label="5. Rank Reward Income"
                                value={
                                  <span className="gold-t">
                                    ${fmt18(u.rewardIncome, 4)}
                                  </span>
                                }
                              />
                              <Mini
                                flat
                                label="6. Rank Incentive"
                                value={
                                  <span className="gold-t">
                                    ${fmt18(u.rankIncentive, 4)}
                                  </span>
                                }
                              />
                              <Mini
                                flat
                                label="Weekly Matching Volume"
                                value={`$${fmt18(u.weeklyMatching, 2)}`}
                              />
                              <Mini
                                flat
                                label="Active / Qualified Directs"
                                value={`${u.activeDirects} Active / ${u.qualifiedDirects} Qualified`}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Interactive Chain Keeper Modal for the Selected User Row */}
      <UserKeeperModal
        user={liveModalUser}
        onClose={() => setSelectedKeeperUser(null)}
      />
    </div>
  );
}

export default UsersInspectorView;
