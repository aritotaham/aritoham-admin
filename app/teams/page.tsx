"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatUnits, isAddress, type Address } from "viem";
import { useAdmin } from "@/components/AdminContext";
import {
  fetchDownlineTeam,
  fmt18,
  RANK_NAMES,
  TeamMemberRow,
} from "@/lib/contract";
import { PageTitle, Panel, Mini, Pill, Addr } from "@/components/ui";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

function toNum(wei: bigint): number {
  return Number(formatUnits(wei, 18));
}

function fmtDate(ts: number): string {
  if (!ts || ts <= 0) return "—";
  return new Date(ts * 1000).toLocaleDateString();
}

export default function AllUsersTeamViewPage() {
  const { users, usersLoading, refreshUsers } = useAdmin();

  // Table Filters
  const [search, setSearch] = useState("");
  const [minTeamMembers, setMinTeamMembers] = useState("");
  const [minTeamBusiness, setMinTeamBusiness] = useState("");
  const [minDirectCount, setMinDirectCount] = useState("");
  const [sortBy, setSortBy] = useState<"TEAM_BIZ" | "MATCHING" | "MEMBERS" | "DIRECTS">("TEAM_BIZ");

  // Interactive Downline Tree Explorer
  const [selectedRootUser, setSelectedRootUser] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<number>(0); // 0 = all levels 1..20
  const [onlyInvested, setOnlyInvested] = useState<boolean>(false);
  const [daoOnly, setDaoOnly] = useState<boolean>(false);
  const [rankFilter, setRankFilter] = useState<number>(255); // 255 = all ranks
  const [downlineRows, setDownlineRows] = useState<TeamMemberRow[]>([]);
  const [downlineTotal, setDownlineTotal] = useState<number>(0);
  const [downlineLoading, setDownlineLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedRootUser && users.length > 0) {
      const topTeamUser = [...users].sort((a, b) => b.teamCount - a.teamCount)[0];
      if (topTeamUser) setSelectedRootUser(topTeamUser.address);
    }
  }, [users, selectedRootUser]);

  useEffect(() => {
    let active = true;
    const loadTree = async () => {
      if (!selectedRootUser || !isAddress(selectedRootUser.trim())) {
        setDownlineRows([]);
        setDownlineTotal(0);
        return;
      }
      setDownlineLoading(true);
      try {
        const res = await fetchDownlineTeam(selectedRootUser.trim() as Address, {
          level: levelFilter,
          onlyInvested,
          daoOnly,
          rank: rankFilter,
        });
        if (active) {
          setDownlineRows(res.items);
          setDownlineTotal(res.total);
        }
      } finally {
        if (active) setDownlineLoading(false);
      }
    };
    loadTree();
    return () => {
      active = false;
    };
  }, [selectedRootUser, levelFilter, onlyInvested, daoOnly, rankFilter]);

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchAddr = u.address.toLowerCase().includes(q);
          const matchRef = u.referrer.toLowerCase().includes(q);
          const matchId = String(u.userId).includes(q) || u.userCode.toLowerCase().includes(q);
          if (!matchAddr && !matchRef && !matchId) return false;
        }
        if (minTeamMembers && u.teamCount < Number(minTeamMembers)) return false;
        if (minTeamBusiness && toNum(u.teamBusiness) < Number(minTeamBusiness)) return false;
        if (minDirectCount && u.directCount < Number(minDirectCount)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "MATCHING") return toNum(b.matchingBusiness) - toNum(a.matchingBusiness);
        if (sortBy === "MEMBERS") return b.teamCount - a.teamCount;
        if (sortBy === "DIRECTS") return b.directCount - a.directCount;
        return toNum(b.teamBusiness) - toNum(a.teamBusiness);
      });
  }, [users, search, minTeamMembers, minTeamBusiness, minDirectCount, sortBy]);

  const totals = useMemo(() => {
    return filteredUsers.reduce(
      (acc, u) => {
        acc.directs += u.directCount;
        acc.teamMembers += u.teamCount;
        acc.directBiz += u.directBusiness;
        acc.teamBiz += u.teamBusiness;
        acc.matchingBiz += u.matchingBusiness;
        acc.weeklyMatching += u.weeklyMatching;
        return acc;
      },
      {
        directs: 0,
        teamMembers: 0,
        directBiz: 0n,
        teamBiz: 0n,
        matchingBiz: 0n,
        weeklyMatching: 0n,
      }
    );
  }, [filteredUsers]);

  return (
    <div className="stack">
      <PageTitle
        title="5. All Users Team View"
        sub="Read View 5 — Comprehensive team hierarchy metrics for all users plus interactive 20-level downline explorer"
        right={
          <button className="btn btn-sm" onClick={() => refreshUsers()} disabled={usersLoading}>
            {usersLoading ? "Refreshing..." : "Refresh Team Data"}
          </button>
        }
      />

      {/* Summary KPIs */}
      <div className="grid cols-5">
        <Mini
          label="Users in View"
          value={`${filteredUsers.length} / ${users.length}`}
          hint={`Total Direct Links: ${totals.directs}`}
        />
        <Mini
          label="Total Direct Business"
          value={`$${fmt18(totals.directBiz, 2)}`}
          hint="Level 1 volume across filtered"
        />
        <Mini
          label="Aggregate Team Business"
          value={`$${fmt18(totals.teamBiz, 2)}`}
          hint="20-level cumulative business"
        />
        <Mini
          label="Aggregate Matching Biz"
          value={`$${fmt18(totals.matchingBiz, 2)}`}
          hint="Carry-forward matched leg volume"
        />
        <Mini
          label="Weekly Matching Volume"
          value={`$${fmt18(totals.weeklyMatching, 2)}`}
          hint="Active weekly matching business"
        />
      </div>

      {/* Team Filter Bar */}
      <Panel
        title="All Users Team Filters"
        sub="Filter users by wallet, referrer address, minimum team size, direct count, or team business volume"
        right={
          <button
            className="btn btn-sm"
            onClick={() => {
              setSearch("");
              setMinTeamMembers("");
              setMinTeamBusiness("");
              setMinDirectCount("");
              setSortBy("TEAM_BIZ");
            }}
          >
            Reset Filters
          </button>
        }
      >
        <div className="grid cols-5">
          <div>
            <label className="field-l">User / Referrer / ID</label>
            <input
              className="inp"
              placeholder="0x... or User ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="field-l">Min Team Members</label>
            <input
              type="number"
              className="inp"
              placeholder="0"
              value={minTeamMembers}
              onChange={(e) => setMinTeamMembers(e.target.value)}
            />
          </div>
          <div>
            <label className="field-l">Min Direct Members</label>
            <input
              type="number"
              className="inp"
              placeholder="0"
              value={minDirectCount}
              onChange={(e) => setMinDirectCount(e.target.value)}
            />
          </div>
          <div>
            <label className="field-l">Min Team Business ($)</label>
            <input
              type="number"
              className="inp"
              placeholder="0"
              value={minTeamBusiness}
              onChange={(e) => setMinTeamBusiness(e.target.value)}
            />
          </div>
          <div>
            <label className="field-l">Sort By</label>
            <select
              className="sel"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="TEAM_BIZ">Highest Team Business</option>
              <option value="MATCHING">Highest Matching Business</option>
              <option value="MEMBERS">Most Team Members</option>
              <option value="DIRECTS">Most Direct Members</option>
            </select>
          </div>
        </div>
      </Panel>

      {/* All Users Team Table */}
      <Panel
        title={`All Users Team Overview (${filteredUsers.length})`}
        sub="Click 'View Downline' on any user row to inspect their 20-level downline tree below"
      >
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Referrer</th>
                <th>Rank</th>
                <th className="num">Directs (Active / Qual.)</th>
                <th className="num">Total Team (Contrib.)</th>
                <th className="num">Open Levels</th>
                <th className="num">Direct Business</th>
                <th className="num">Team Business</th>
                <th className="num">Matching Business</th>
                <th className="num">Weekly / Daily Match</th>
                <th className="num">Downline</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 32 }} className="muted">
                    No users match the team filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedRootUser.toLowerCase() === u.address.toLowerCase();
                  return (
                    <tr
                      key={u.address}
                      style={{
                        background: isSelected ? "rgba(212, 169, 74, 0.1)" : undefined,
                      }}
                    >
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Pill tone="gold">{u.userCode}</Pill>
                          <Addr text={u.address} link />
                        </div>
                      </td>
                      <td>
                        {u.referrer && u.referrer !== ZERO_ADDR ? (
                          <Addr text={u.referrer} link />
                        ) : (
                          <Pill tone="muted">ROOT</Pill>
                        )}
                      </td>
                      <td>
                        <Pill tone={u.storeRank > 0 ? "gold" : "muted"}>{u.rankName}</Pill>
                      </td>
                      <td className="num mono">
                        {u.directCount}{" "}
                        <span className="muted">
                          ({u.activeDirects} / {u.qualifiedDirects})
                        </span>
                      </td>
                      <td className="num mono">
                        {u.teamCount}{" "}
                        <span className="muted">({u.contributingCount})</span>
                      </td>
                      <td className="num mono">{u.openLevels} / 20</td>
                      <td className="num mono">${fmt18(u.directBusiness, 2)}</td>
                      <td className="num mono t-gold">${fmt18(u.teamBusiness, 2)}</td>
                      <td className="num mono">${fmt18(u.matchingBusiness, 2)}</td>
                      <td className="num mono">
                        ${fmt18(u.weeklyMatching, 2)}
                        <div className="muted" style={{ fontSize: 10 }}>
                          Daily: ${fmt18(u.dailyMatching, 2)}
                        </div>
                      </td>
                      <td className="num">
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            className={`btn btn-sm ${isSelected ? "btn-gold" : ""}`}
                            onClick={() => setSelectedRootUser(u.address)}
                          >
                            {isSelected ? "Viewing Tree" : "View Downline"}
                          </button>
                          <Link className="btn btn-sm" href={`/users/${u.address}`}>
                            Profile
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

      {/* Interactive Downline Tree Explorer */}
      <Panel
        title="20-Level Downline Team Explorer (ARITOHAMTeamDAO.getTeam)"
        sub={
          selectedRootUser
            ? `Inspecting downline members under ${selectedRootUser} (${downlineTotal} matching members)`
            : "Select any user above or paste a wallet address to inspect their 20-level downline"
        }
      >
        <div className="grid cols-5" style={{ marginBottom: 14 }}>
          <div>
            <label className="field-l">Root User Wallet</label>
            <input
              className="inp"
              placeholder="0x..."
              value={selectedRootUser}
              onChange={(e) => setSelectedRootUser(e.target.value)}
            />
          </div>
          <div>
            <label className="field-l">Level Filter (0 = All 1–20)</label>
            <select
              className="sel"
              value={levelFilter}
              onChange={(e) => setLevelFilter(Number(e.target.value))}
            >
              <option value={0}>All Levels (1–20)</option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                <option key={lvl} value={lvl}>
                  Level {lvl} Only
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-l">Stake Status</label>
            <select
              className="sel"
              value={onlyInvested ? "1" : "0"}
              onChange={(e) => setOnlyInvested(e.target.value === "1")}
            >
              <option value="0">All Members</option>
              <option value="1">Active Staked Only</option>
            </select>
          </div>
          <div>
            <label className="field-l">Rank Filter</label>
            <select
              className="sel"
              value={rankFilter}
              onChange={(e) => setRankFilter(Number(e.target.value))}
            >
              <option value={255}>All Ranks</option>
              {RANK_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  Rank #{idx} — {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-l">DAO Filter</label>
            <button
              className={`btn btn-block ${daoOnly ? "btn-gold" : ""}`}
              onClick={() => setDaoOnly((v) => !v)}
            >
              {daoOnly ? "DAO Members Only: ON" : "DAO Members Only: OFF"}
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th>Member Wallet</th>
                <th>Rank</th>
                <th>DAO Lifetime</th>
                <th className="num">Self Staked ($)</th>
                <th className="num">Direct Business ($)</th>
                <th className="num">Directs</th>
                <th className="num">Team Size</th>
                <th className="num">Team Business</th>
                <th>Joined</th>
                <th className="num">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {downlineLoading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 28 }} className="muted">
                    Querying ARITOHAMTeamDAO.getTeam on-chain...
                  </td>
                </tr>
              ) : downlineRows.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 28 }} className="muted">
                    No downline members found for this root wallet and filter combination.
                  </td>
                </tr>
              ) : (
                downlineRows.map((m) => (
                  <tr key={`${m.level}-${m.wallet}`}>
                    <td>
                      <Pill tone="gold">L{m.level}</Pill>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Pill tone="muted">{m.userCode}</Pill>
                        <Addr text={m.wallet} link />
                      </div>
                    </td>
                    <td>
                      <Pill tone={m.rank > 0 ? "gold" : "muted"}>{m.rankName}</Pill>
                    </td>
                    <td>
                      {m.daoPartner ? <Pill tone="green">DAO</Pill> : <Pill tone="muted">No</Pill>}
                    </td>
                    <td className="num mono t-gold">${fmt18(m.selfStaked, 2)}</td>
                    <td className="num mono">${fmt18(m.directBusiness, 2)}</td>
                    <td className="num mono">{m.directCount}</td>
                    <td className="num mono">{m.teamCount}</td>
                    <td className="num mono">${fmt18(m.teamBusiness, 2)}</td>
                    <td className="mono" style={{ fontSize: 11.5 }}>
                      {fmtDate(m.joinedAt)}
                    </td>
                    <td className="num">
                      <button
                        className="btn btn-sm"
                        onClick={() => setSelectedRootUser(m.wallet)}
                      >
                        Drill Down
                      </button>
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
