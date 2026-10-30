"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useAdmin } from "@/components/AdminContext";
import { fmt18 } from "@/lib/contract";
import { PageTitle, Panel, Mini, Pill, Addr } from "@/components/ui";

function fmtDate(ts: number): string {
  if (!ts || ts <= 0) return "—";
  return new Date(ts * 1000).toLocaleDateString();
}

export default function AllUsersDaoPage() {
  const { overview, users, usersLoading, refresh, refreshUsers } = useAdmin();
  const [search, setSearch] = useState("");
  const [eligFilter, setEligFilter] = useState<
    "ALL" | "ELIGIBLE" | "NOT_ELIGIBLE" | "LIFETIME" | "WINDOW_20D" | "REGISTERED_CYCLE"
  >("ALL");
  const [minShares, setMinShares] = useState("");

  const p = overview?.protocol;
  const s = overview?.store;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchAddr = u.address.toLowerCase().includes(q);
        const matchId = String(u.userId).includes(q) || u.userCode.toLowerCase().includes(q);
        if (!matchAddr && !matchId) return false;
      }
      const isEligible = u.isDaoEligibleCandidate || u.currentCycleDaoShares > 0n;
      if (eligFilter === "ELIGIBLE" && !isEligible) return false;
      if (eligFilter === "NOT_ELIGIBLE" && isEligible) return false;
      if (eligFilter === "LIFETIME" && !u.daoLifetime) return false;
      if (eligFilter === "WINDOW_20D" && !u.daoQualifiedByWindow) return false;
      if (eligFilter === "REGISTERED_CYCLE" && u.currentCycleDaoShares === 0n) return false;
      const maxS =
        u.currentCycleDaoShares > u.suggestedDaoShares
          ? u.currentCycleDaoShares
          : u.suggestedDaoShares;
      if (minShares && Number(maxS) < Number(minShares)) return false;
      return true;
    });
  }, [users, search, eligFilter, minShares]);

  const summary = useMemo(() => {
    const eligibleUsers = users.filter(
      (u) => u.isDaoEligibleCandidate || u.currentCycleDaoShares > 0n
    );
    const totalSuggestedShares = eligibleUsers.reduce(
      (acc, u) =>
        acc +
        (u.currentCycleDaoShares > 0n ? u.currentCycleDaoShares : u.suggestedDaoShares),
      0n
    );
    const totalDaoIncomePaid = users.reduce((acc, u) => acc + u.daoIncome, 0n);
    const registeredCount = users.filter((u) => u.currentCycleDaoShares > 0n).length;
    return {
      eligibleCount: eligibleUsers.length,
      notEligibleCount: users.length - eligibleUsers.length,
      totalSuggestedShares,
      totalDaoIncomePaid,
      registeredCount,
    };
  }, [users]);

  const effectiveTotalShares =
    p && p.daoCurrentShares > 0n
      ? p.daoCurrentShares
      : summary.totalSuggestedShares > 0n
      ? summary.totalSuggestedShares
      : 1n;

  const valuePerShareWei = (p?.daoPoolTotal ?? 0n) / effectiveTotalShares;

  return (
    <div className="stack">
      <PageTitle
        title="4. All Users DAO Status & Shares"
        sub="Read View 4 — DAO eligibility status, total shares, 20-day qualification window, and active cycle pool breakdown"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <Link className="btn btn-gold btn-sm" href="/write/dao-eligible">
              8. Set DAO Eligible →
            </Link>
            <Link className="btn btn-sm" href="/write/dao-distribute">
              9. Distribute DAO Share →
            </Link>
            <button
              className="btn btn-sm"
              onClick={() => {
                refresh();
                refreshUsers();
              }}
              disabled={usersLoading}
            >
              {usersLoading ? "Refreshing..." : "Refresh DAO"}
            </button>
          </div>
        }
      />

      {/* DAO Cycle KPIs */}
      <div className="grid cols-6">
        <Mini
          label="Active DAO Cycle"
          value={`Cycle #${String(p?.daoCycle ?? 1n)}`}
          hint={`Paying Cycle: #${String(p?.daoPayCycle ?? 0n)} (Cursor: ${String(
            p?.daoPayCursor ?? 0n
          )})`}
        />
        <Mini
          label="Accruing DAO Pool"
          value={`$${fmt18(p?.daoPoolTotal, 2)}`}
          hint={`Store Deposits: $${fmt18(s?.totalDeposits, 2)}`}
        />
        <Mini
          label="Eligible Users"
          value={`${summary.eligibleCount} / ${users.length}`}
          hint={`Not Eligible: ${summary.notEligibleCount}`}
        />
        <Mini
          label="Lifetime Partners"
          value={`${String(s?.lifetimeHolders ?? 0n)} / 200`}
          hint="20-day fast-track slots"
        />
        <Mini
          label="Total DAO Shares"
          value={String(effectiveTotalShares)}
          hint={`Registered On-Chain: ${String(p?.daoCurrentShares ?? 0n)} (${String(
            p?.daoEligibleCount ?? 0n
          )} wallets)`}
        />
        <Mini
          label="Value Per Share"
          value={`$${fmt18(valuePerShareWei, 4)}`}
          hint={`Total DAO Paid: $${fmt18(summary.totalDaoIncomePaid, 2)}`}
        />
      </div>

      {/* Filter Bar */}
      <Panel
        title="DAO Eligibility & Share Filters"
        sub="Filter users by DAO eligibility, lifetime partner status, 20-day qualification window, or on-chain cycle registration"
        right={
          <div className="seg">
            <button
              className={eligFilter === "ALL" ? "active" : ""}
              onClick={() => setEligFilter("ALL")}
            >
              All ({users.length})
            </button>
            <button
              className={eligFilter === "ELIGIBLE" ? "active" : ""}
              onClick={() => setEligFilter("ELIGIBLE")}
            >
              Eligible ({summary.eligibleCount})
            </button>
            <button
              className={eligFilter === "NOT_ELIGIBLE" ? "active" : ""}
              onClick={() => setEligFilter("NOT_ELIGIBLE")}
            >
              Not Eligible ({summary.notEligibleCount})
            </button>
            <button
              className={eligFilter === "LIFETIME" ? "active" : ""}
              onClick={() => setEligFilter("LIFETIME")}
            >
              Lifetime
            </button>
            <button
              className={eligFilter === "WINDOW_20D" ? "active" : ""}
              onClick={() => setEligFilter("WINDOW_20D")}
            >
              20d Window
            </button>
            <button
              className={eligFilter === "REGISTERED_CYCLE" ? "active" : ""}
              onClick={() => setEligFilter("REGISTERED_CYCLE")}
            >
              Registered in Cycle #{String(p?.daoCycle ?? 1n)}
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
            <label className="field-l">Min DAO Shares</label>
            <input
              type="number"
              className="inp"
              placeholder="0"
              value={minShares}
              onChange={(e) => setMinShares(e.target.value)}
            />
          </div>
          <div>
            <label className="field-l">Active Cycle Payout Snapshot</label>
            <div
              className="inp"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span className="muted">Snapshot Pay Pool:</span>
              <span className="mono t-gold">
                ${fmt18(p?.daoPayPool, 2)} (${fmt18(p?.daoPayPerShare, 4)}/share)
              </span>
            </div>
          </div>
        </div>
      </Panel>

      {/* DAO Users Table */}
      <Panel
        title={`All Users DAO Status & Share Allocation (${filteredUsers.length})`}
        sub="Shows whether each user is DAO Eligible or Not, their 20-day window performance, weekly matching shares, and estimated cycle payout"
      >
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Eligible or Not</th>
                <th>Qualification Source</th>
                <th className="num">20d Window Direct</th>
                <th className="num">20d Window Matching</th>
                <th className="num">Weekly Matching</th>
                <th className="num">Suggested Shares</th>
                <th className="num">Registered Shares</th>
                <th className="num">Est. Cycle Payout</th>
                <th className="num">Total DAO Earned</th>
                <th className="num">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 32 }} className="muted">
                    No users match the selected DAO filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const regShares = u.currentCycleDaoShares;
                  const isEligible = u.isDaoEligibleCandidate || regShares > 0n;
                  const activeShares = regShares > 0n ? regShares : u.suggestedDaoShares;
                  const estPayoutWei =
                    isEligible && activeShares > 0n
                      ? ((p?.daoPoolTotal ?? 0n) * activeShares) / effectiveTotalShares
                      : 0n;

                  return (
                    <tr key={u.address}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Pill tone="gold">{u.userCode}</Pill>
                          <Addr text={u.address} link />
                        </div>
                      </td>
                      <td>
                        {isEligible ? (
                          <Pill tone="green">ELIGIBLE</Pill>
                        ) : (
                          <Pill tone="muted">NOT ELIGIBLE</Pill>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {u.daoLifetime && <Pill tone="gold">Lifetime Partner</Pill>}
                          {u.daoQualifiedByWindow && <Pill tone="green">20d Window Met</Pill>}
                          {regShares > 0n && <Pill tone="gold">Registered On-Chain</Pill>}
                          {!u.daoLifetime && !u.daoQualifiedByWindow && regShares === 0n && (
                            <span className="muted" style={{ fontSize: 11 }}>
                              Joined: {fmtDate(u.registeredAt)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="num mono">
                        ${fmt18(u.windowDirect, 2)}
                        <div className="muted" style={{ fontSize: 10 }}>
                          Target: $3,000
                        </div>
                      </td>
                      <td className="num mono">
                        ${fmt18(u.windowMatching, 2)}
                        <div className="muted" style={{ fontSize: 10 }}>
                          Target: $10,000
                        </div>
                      </td>
                      <td className="num mono">${fmt18(u.weeklyMatching, 2)}</td>
                      <td className="num mono t-gold">{String(u.suggestedDaoShares)}</td>
                      <td className="num mono">
                        {regShares > 0n ? (
                          <Pill tone="green">{String(regShares)} Shares</Pill>
                        ) : (
                          <span className="muted">0</span>
                        )}
                      </td>
                      <td className="num mono t-gold">${fmt18(estPayoutWei, 2)}</td>
                      <td className="num mono">${fmt18(u.daoIncome, 2)}</td>
                      <td className="num">
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <Link
                            className="btn btn-sm"
                            href={`/write/dao-eligible?user=${u.address}`}
                          >
                            Set Share
                          </Link>
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
