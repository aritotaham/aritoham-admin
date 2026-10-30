"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { formatUnits, isAddress } from "viem";
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

type ViewMode = "all-metrics" | "only-incomes";
type StatusFilter = "all" | "active" | "inactive" | "dao" | "blacklisted";
type SortField =
  | "userId"
  | "minted"
  | "withdrawn"
  | "balance"
  | "directIncome"
  | "teamBusiness"
  | "teamCount"
  | "totalIncome";

function toNum(wei: bigint): number {
  return Number(formatUnits(wei, 18));
}

export function OverviewView() {
  const {
    users,
    usersLoading,
    refreshUsers,
    addWatchedAddress,
  } = useAdmin();

  const [viewMode, setViewMode] = useState<ViewMode>("all-metrics");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [rankFilter, setRankFilter] = useState<string>("all");
  const [minMinted, setMinMinted] = useState("");
  const [minWithdrawn, setMinWithdrawn] = useState("");
  const [minBalance, setMinBalance] = useState("");
  const [minTeamBiz, setMinTeamBiz] = useState("");
  const [minIncome, setMinIncome] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("userId");
  const [sortDesc, setSortDesc] = useState<boolean>(false);

  const [customWallet, setCustomWallet] = useState("");
  const [selectedKeeperUser, setSelectedKeeperUser] =
    useState<MonitoredUserRow | null>(null);

  const totals = useMemo(() => {
    let totalMinted = 0n;
    let totalWithdrawn = 0n;
    let totalBalance = 0n;
    let totalDirectInc = 0n;
    let totalGenInc = 0n;
    let totalRoiInc = 0n;
    let totalDaoInc = 0n;
    let totalRankReward = 0n;
    let totalRankIncentive = 0n;
    let totalIncome = 0n;
    let totalTeamBiz = 0n;
    let activeUsers = 0;

    for (const u of users) {
      if (u.isActive) activeUsers++;
      totalMinted += u.totalStaked;
      totalWithdrawn += u.withdrawnUsd;
      totalBalance += u.balance;
      totalDirectInc += u.directIncome;
      totalGenInc += u.generationIncome;
      totalRoiInc += u.roiAccrued;
      totalDaoInc += u.daoIncome;
      totalRankReward += u.rewardIncome;
      totalRankIncentive += u.rankIncentive;
      totalIncome += u.totalIncome;
      totalTeamBiz += u.teamBusiness;
    }

    return {
      totalUsers: users.length,
      activeUsers,
      totalMinted,
      totalWithdrawn,
      totalBalance,
      totalDirectInc,
      totalGenInc,
      totalRoiInc,
      totalDaoInc,
      totalRankReward,
      totalRankIncentive,
      totalIncome,
      totalTeamBiz,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = users.filter((u) => {
      if (statusFilter === "active" && !u.isActive) return false;
      if (statusFilter === "inactive" && u.isActive) return false;
      if (statusFilter === "dao" && !u.daoLifetime) return false;
      if (statusFilter === "blacklisted" && !u.isBlacklisted) return false;

      if (rankFilter !== "all" && u.storeRank !== Number(rankFilter)) {
        return false;
      }

      if (q) {
        const hitAddr = u.address.toLowerCase().includes(q);
        const hitId =
          u.userCode.toLowerCase().includes(q) ||
          u.userId.toString().includes(q);
        const hitRef = u.referrer.toLowerCase().includes(q);
        const hitRank = u.rankName.toLowerCase().includes(q);
        if (!hitAddr && !hitId && !hitRef && !hitRank) return false;
      }

      if (minMinted && toNum(u.totalStaked) < Number(minMinted)) return false;
      if (minWithdrawn && toNum(u.withdrawnUsd) < Number(minWithdrawn))
        return false;
      if (minBalance && toNum(u.balance) < Number(minBalance)) return false;
      if (minTeamBiz && toNum(u.teamBusiness) < Number(minTeamBiz))
        return false;
      if (minIncome && toNum(u.totalIncome) < Number(minIncome)) return false;

      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "userId":
          cmp = a.userId - b.userId;
          break;
        case "minted":
          cmp =
            a.totalStaked < b.totalStaked
              ? -1
              : a.totalStaked > b.totalStaked
              ? 1
              : 0;
          break;
        case "withdrawn":
          cmp =
            a.withdrawnUsd < b.withdrawnUsd
              ? -1
              : a.withdrawnUsd > b.withdrawnUsd
              ? 1
              : 0;
          break;
        case "balance":
          cmp = a.balance < b.balance ? -1 : a.balance > b.balance ? 1 : 0;
          break;
        case "directIncome":
          cmp =
            a.directIncome < b.directIncome
              ? -1
              : a.directIncome > b.directIncome
              ? 1
              : 0;
          break;
        case "teamBusiness":
          cmp =
            a.teamBusiness < b.teamBusiness
              ? -1
              : a.teamBusiness > b.teamBusiness
              ? 1
              : 0;
          break;
        case "teamCount":
          cmp = a.teamCount - b.teamCount;
          break;
        case "totalIncome":
          cmp =
            a.totalIncome < b.totalIncome
              ? -1
              : a.totalIncome > b.totalIncome
              ? 1
              : 0;
          break;
      }
      return sortDesc ? -cmp : cmp;
    });

    return list;
  }, [
    users,
    statusFilter,
    rankFilter,
    searchQuery,
    minMinted,
    minWithdrawn,
    minBalance,
    minTeamBiz,
    minIncome,
    sortBy,
    sortDesc,
  ]);

  const handleWatchWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddress(customWallet.trim())) return;
    await addWatchedAddress(customWallet.trim());
    setSearchQuery(customWallet.trim());
    setCustomWallet("");
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setRankFilter("all");
    setSearchQuery("");
    setMinMinted("");
    setMinWithdrawn("");
    setMinBalance("");
    setMinTeamBiz("");
    setMinIncome("");
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
        title="1. All Users & Incomes View"
        sub="Total Withdraw, Balance, Direct Income, Team Business, Total Members, Total Minted, and Only Incomes View with filters."
        right={
          <>
            <form
              onSubmit={handleWatchWallet}
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              <input
                type="text"
                className="inp"
                style={{ width: 230, padding: "9px 13px", fontSize: 13 }}
                placeholder="Watch 0x wallet..."
                value={customWallet}
                onChange={(e) => setCustomWallet(e.target.value)}
              />
              <button type="submit" className="btn btn-sm">
                <Icon name="plus" size={14} /> Track
              </button>
            </form>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => refreshUsers()}
              disabled={usersLoading}
            >
              <Icon name="refresh" size={16} />{" "}
              {usersLoading ? "Syncing..." : "Refresh Users"}
            </button>
          </>
        }
      />

      {/* Aggregate Hero Metrics */}
      <Hero
        eyebrow="READ PAGE 01 · PROTOCOL USER DIRECTORY & INCOMES"
        title="All Users Financial & Network Summary"
        desc="Switch between All Users Overview (Withdraw, Balance, Direct Income, Team Business, Total Members, Total Minted) and Only Incomes View."
        tiles={[
          {
            icon: "users",
            label: "Total Users",
            value: `${totals.totalUsers}`,
            hint: `${totals.activeUsers} Active Stakers`,
          },
          {
            icon: "briefcase",
            label: "Total Minted (Staked)",
            value: `$${fmt18(totals.totalMinted, 2)}`,
            hint: "Self Staked USD",
          },
          {
            icon: "download",
            label: "Total Withdrawn",
            value: `$${fmt18(totals.totalWithdrawn, 2)}`,
            hint: "Cumulative USD Withdrawn",
          },
          {
            icon: "wallet",
            label: "Total Balance",
            value: `$${fmt18(totals.totalBalance, 2)}`,
            hint: "Available Claimable USD",
          },
          {
            icon: "userplus",
            label: "Total Direct Income",
            value: `$${fmt18(totals.totalDirectInc, 2)}`,
            hint: "Direct Referral Rewards",
          },
          {
            icon: "trend",
            label: "Total Income (All 6)",
            value: `$${fmt18(totals.totalIncome, 2)}`,
            hint: "Combined Reward Streams",
          },
        ]}
      />

      {/* Incomes Breakdown Strip when Only Incomes View is active */}
      {viewMode === "only-incomes" && (
        <div className="cols-6">
          <Mini
            icon="userplus"
            label="1. Direct Income"
            value={`$${fmt18(totals.totalDirectInc, 2)}`}
          />
          <Mini
            icon="layers"
            label="2. Generation Income"
            value={`$${fmt18(totals.totalGenInc, 2)}`}
          />
          <Mini
            icon="trend"
            label="3. ROI Accrued"
            value={<span className="up">${fmt18(totals.totalRoiInc, 2)}</span>}
          />
          <Mini
            icon="gem"
            label="4. DAO Income"
            value={`$${fmt18(totals.totalDaoInc, 2)}`}
          />
          <Mini
            icon="crown"
            label="5. Rank Reward"
            value={
              <span className="gold-t">${fmt18(totals.totalRankReward, 2)}</span>
            }
          />
          <Mini
            icon="award"
            label="6. Rank Incentive"
            value={
              <span className="gold-t">
                ${fmt18(totals.totalRankIncentive, 2)}
              </span>
            }
          />
        </div>
      )}

      {/* Main Panel with View Switcher & Filters */}
      <Panel
        eyebrow="USER TELEMETRY & FILTER ENGINE"
        title={
          viewMode === "all-metrics"
            ? `All Users Overview (${filteredUsers.length} of ${users.length})`
            : `Only Incomes View — All 6 Reward Streams (${filteredUsers.length} of ${users.length})`
        }
        sub="Filter by any metric and switch between the full user overview and the dedicated Only Incomes View."
        right={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div className="seg">
              <button
                type="button"
                className={viewMode === "all-metrics" ? "on" : ""}
                onClick={() => setViewMode("all-metrics")}
              >
                <Icon name="users" size={14} /> All Users View
              </button>
              <button
                type="button"
                className={viewMode === "only-incomes" ? "on" : ""}
                onClick={() => setViewMode("only-incomes")}
              >
                <Icon name="dollar" size={14} /> Only Incomes View
              </button>
            </div>
            <button type="button" className="btn btn-sm" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        }
      >
        {/* Status Filter Tabs */}
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
              badge: String(totals.activeUsers),
            },
            {
              id: "inactive",
              label: "Inactive",
              icon: "clock",
              badge: String(users.length - totals.activeUsers),
            },
            {
              id: "dao",
              label: "DAO Partners",
              icon: "gem",
            },
            {
              id: "blacklisted",
              label: "Blacklisted",
              icon: "lock",
            },
          ]}
        />

        {/* Multi-Field Filter Bar */}
        <div className="stack" style={{ gap: 12, marginBottom: 18 }}>
          <div className="cols-4">
            <div>
              <label className="field-l">Search Wallet / User ID / Referrer</label>
              <div className="search">
                <Icon name="search" size={16} />
                <input
                  type="text"
                  className="inp"
                  placeholder="ARI1000001, 0x..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="field-l">Filter by Rank</label>
              <select
                className="sel"
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value)}
              >
                <option value="all">All Ranks (0..9)</option>
                {RANK_NAMES.map((name, idx) => (
                  <option key={idx} value={idx}>
                    Rank #{idx} — {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-l">Sort By</label>
              <select
                className="sel"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
              >
                <option value="userId">User ID</option>
                <option value="minted">Total Minted (Staked USD)</option>
                <option value="withdrawn">Total Withdraw (USD)</option>
                <option value="balance">Withdrawable Balance (USD)</option>
                <option value="directIncome">Direct Income (USD)</option>
                <option value="teamBusiness">Team Business (USD)</option>
                <option value="teamCount">Total Members (Team Count)</option>
                <option value="totalIncome">Total Income (USD)</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                type="button"
                className="btn btn-block"
                onClick={() => setSortDesc((v) => !v)}
              >
                <Icon name="swap" size={15} />{" "}
                {sortDesc ? "Sort: High → Low" : "Sort: Low → High"}
              </button>
            </div>
          </div>

          <div className="cols-5">
            <div>
              <label className="field-l">Min Total Minted ($)</label>
              <input
                type="number"
                step="any"
                className="inp"
                placeholder="0"
                value={minMinted}
                onChange={(e) => setMinMinted(e.target.value)}
              />
            </div>
            <div>
              <label className="field-l">Min Total Withdraw ($)</label>
              <input
                type="number"
                step="any"
                className="inp"
                placeholder="0"
                value={minWithdrawn}
                onChange={(e) => setMinWithdrawn(e.target.value)}
              />
            </div>
            <div>
              <label className="field-l">Min Balance ($)</label>
              <input
                type="number"
                step="any"
                className="inp"
                placeholder="0"
                value={minBalance}
                onChange={(e) => setMinBalance(e.target.value)}
              />
            </div>
            <div>
              <label className="field-l">Min Team Business ($)</label>
              <input
                type="number"
                step="any"
                className="inp"
                placeholder="0"
                value={minTeamBiz}
                onChange={(e) => setMinTeamBiz(e.target.value)}
              />
            </div>
            <div>
              <label className="field-l">Min Total Income ($)</label>
              <input
                type="number"
                step="any"
                className="inp"
                placeholder="0"
                value={minIncome}
                onChange={(e) => setMinIncome(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table 1: All Users Overview OR Table 2: Only Incomes View */}
        {viewMode === "all-metrics" ? (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>User ID / Wallet</th>
                  <th>Rank &amp; Status</th>
                  <th>Total Minted (Staked)</th>
                  <th>Total Withdraw</th>
                  <th>Balance (Claimable)</th>
                  <th>Direct Income</th>
                  <th>Team Business</th>
                  <th>Total Members</th>
                  <th className="ta-r">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading && users.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty">Loading all users from chain...</div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty">No users match the active filters.</div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.address}>
                      <td>
                        <div className="cell-2">
                          <span className="gold-t">{u.userCode}</span>
                          <div className="a">
                            <Addr text={u.address} link />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
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
                      <td>
                        <div className="cell-2">
                          <span>${fmt18(u.totalStaked, 2)}</span>
                          <span className="a" style={{ fontSize: 11 }}>
                            {u.stakeCount} stake(s) · Cap left: $
                            {fmt18(u.remainingCap, 2)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-2">
                          <span>${fmt18(u.withdrawnUsd, 2)}</span>
                          <span className="a" style={{ fontSize: 11 }}>
                            {fmt18(u.withdrawnAritoham, 2)} ARI
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-2">
                          <span className="up">${fmt18(u.balance, 2)}</span>
                          <span className="a" style={{ fontSize: 11 }}>
                            Wallet: {fmt18(u.tokenBalance, 2)} ARI
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="gold-t">
                          ${fmt18(u.directIncome, 2)}
                        </span>
                      </td>
                      <td>
                        <div className="cell-2">
                          <span>${fmt18(u.teamBusiness, 2)}</span>
                          <span className="a" style={{ fontSize: 11 }}>
                            Direct Biz: ${fmt18(u.directBusiness, 2)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-2">
                          <span>{u.teamCount} Members</span>
                          <span className="a" style={{ fontSize: 11 }}>
                            {u.directCount} Directs ({u.activeDirects} Active)
                          </span>
                        </div>
                      </td>
                      <td className="ta-r">
                        <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn btn-gold btn-sm"
                            onClick={() => setSelectedKeeperUser(u)}
                          >
                            <Icon name="shield" size={13} /> Keeper
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ONLY INCOMES VIEW TABLE */
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>User ID / Wallet</th>
                  <th>Rank</th>
                  <th>Total Income</th>
                  <th>1. Direct Income</th>
                  <th>2. Generation</th>
                  <th>3. ROI Accrued</th>
                  <th>4. DAO Income</th>
                  <th>5. Rank Reward</th>
                  <th>6. Rank Incentive</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty">No users match the active filters.</div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.address}>
                      <td>
                        <div className="cell-2">
                          <span className="gold-t">{u.userCode}</span>
                          <div className="a">
                            <Addr text={u.address} link />
                          </div>
                        </div>
                      </td>
                      <td>
                        <Pill tone={u.storeRank > 0 ? "gold" : "muted"}>
                          #{u.storeRank} {u.rankName}
                        </Pill>
                      </td>
                      <td>
                        <b className="gold-t" style={{ fontSize: 14 }}>
                          ${fmt18(u.totalIncome, 2)}
                        </b>
                      </td>
                      <td>${fmt18(u.directIncome, 2)}</td>
                      <td>${fmt18(u.generationIncome, 2)}</td>
                      <td className="up">${fmt18(u.roiAccrued, 2)}</td>
                      <td>${fmt18(u.daoIncome, 2)}</td>
                      <td className="gold-t">${fmt18(u.rewardIncome, 2)}</td>
                      <td className="gold-t">${fmt18(u.rankIncentive, 2)}</td>
                      <td className="up">${fmt18(u.balance, 2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <UserKeeperModal
        user={liveModalUser}
        onClose={() => setSelectedKeeperUser(null)}
      />
    </div>
  );
}

export default OverviewView;
