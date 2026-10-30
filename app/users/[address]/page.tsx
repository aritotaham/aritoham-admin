"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  Tag,
} from "@/components/ui";
import {
  fetchMonitoredUser,
  fmt18,
  inspectUserFull,
  type MonitoredUserRow,
} from "@/lib/contract";

export default function UserDetailMonitorPage() {
  const params = useParams<{ address: string }>();
  const rawQuery = decodeURIComponent(params?.address ?? "");
  const { overview, users, refreshUsers } = useAdmin();

  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof inspectUserFull>
  > | null>(null);
  const [monitoredRow, setMonitoredRow] = useState<MonitoredUserRow | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadUserDetail = useCallback(async () => {
    if (!rawQuery) return;
    setLoading(true);
    setError(null);
    try {
      const inspected = await inspectUserFull(rawQuery);
      setDetail(inspected);
      const row = await fetchMonitoredUser(
        inspected.address,
        overview?.protocol.daoCycle ?? 1n
      );
      setMonitoredRow(row);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load user details"
      );
    } finally {
      setLoading(false);
    }
  }, [rawQuery, overview?.protocol.daoCycle]);

  useEffect(() => {
    loadUserDetail();
  }, [loadUserDetail, users]);

  const maxCapUsd = monitoredRow
    ? monitoredRow.totalStaked * BigInt(Math.max(1, monitoredRow.maxPayout))
    : 0n;

  return (
    <div className="stack">
      <PageTitle
        title={
          monitoredRow
            ? `User Monitor · ${monitoredRow.userCode}`
            : `User Monitor · ${rawQuery}`
        }
        sub="Detailed on-chain telemetry, reward stream breakdown, individual stakes, and Chain Keeper operations."
        right={
          <>
            <Link href="/" className="btn">
              <Icon name="arrowleft" size={16} /> Back to All Users
            </Link>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  loadUserDetail();
                  refreshUsers();
                }}
                disabled={loading}
              >
                <Icon name="refresh" size={16} />{" "}
                {loading ? "Refreshing..." : "Refresh Telemetry"}
              </button>
              {monitoredRow && (
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => setModalOpen(true)}
                >
                  <Icon name="shield" size={16} /> Chain Keeper Actions
                </button>
              )}
            </>
          }
        />

        {error && (
          <div className="alert warn">
            <Icon name="alert" size={18} />
            <div>
              <b>Error loading user profile:</b> {error}
            </div>
          </div>
        )}

        {loading && !monitoredRow ? (
          <Panel>
            <div className="empty">
              <span
                className="reg-spin"
                style={{
                  position: "static",
                  display: "inline-block",
                  marginBottom: 10,
                }}
              />
              <div>Fetching complete on-chain state for {rawQuery}...</div>
            </div>
          </Panel>
        ) : monitoredRow && detail ? (
          <>
            <Hero
              eyebrow={`USER TELEMETRY · ${monitoredRow.userCode}`}
              title={`${monitoredRow.rankName} (Rank #${monitoredRow.storeRank})`}
              desc={`Wallet: ${monitoredRow.address} · Referrer: ${monitoredRow.referrer}`}
              right={
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {monitoredRow.isBlacklisted ? (
                    <Pill tone="red" dot>
                      Blacklisted
                    </Pill>
                  ) : monitoredRow.isActive ? (
                    <Pill tone="green" dot>
                      Active Staker
                    </Pill>
                  ) : (
                    <Pill tone="muted">Inactive</Pill>
                  )}
                  {monitoredRow.daoLifetime && (
                    <Pill tone="gold">DAO Lifetime Partner</Pill>
                  )}
                </div>
              }
              tiles={[
                {
                  icon: "wallet",
                  label: "Withdrawable Balance",
                  value: `$${fmt18(monitoredRow.balance, 4)}`,
                  hint: "Available to claim or reinvest",
                },
                {
                  icon: "briefcase",
                  label: "Total Staked Volume",
                  value: `$${fmt18(monitoredRow.totalStaked, 2)}`,
                  hint: `${monitoredRow.stakeCount} Stake Position(s)`,
                },
                {
                  icon: "target",
                  label: "Remaining Cap",
                  value: `$${fmt18(monitoredRow.remainingCap, 2)}`,
                  hint: `Max Cap: $${fmt18(maxCapUsd, 2)} (${monitoredRow.maxPayout}x)`,
                },
                {
                  icon: "trend",
                  label: "Total Income Earned",
                  value: `$${fmt18(monitoredRow.totalIncome, 4)}`,
                  hint: `${monitoredRow.openLevels} Open Generation Levels`,
                },
                {
                  icon: "coins",
                  label: "Wallet ARI Balance",
                  value: `${fmt18(monitoredRow.tokenBalance, 2)} ARI`,
                  hint: `USDT Balance: $${fmt18(monitoredRow.usdtBalance, 2)}`,
                },
              ]}
            />

            {/* Income Streams + Team/DAO Telemetry */}
            <div className="grid g-half">
              <Panel
                eyebrow="REWARD STREAMS"
                title="Protocol Income Breakdown (USD)"
                sub="Cumulative earnings recorded in ARITOHAMProtocol.users"
                badge={`$${fmt18(monitoredRow.totalIncome, 2)} Total`}
                tone="gold"
              >
                <div className="cols-3">
                  <Mini
                    icon="userplus"
                    label="1. Direct Referral"
                    value={`$${fmt18(monitoredRow.directIncome, 4)}`}
                  />
                  <Mini
                    icon="layers"
                    label="2. Generation"
                    value={`$${fmt18(monitoredRow.generationIncome, 4)}`}
                  />
                  <Mini
                    icon="trend"
                    label="3. Daily ROI Accrued"
                    value={
                      <span className="up">
                        ${fmt18(monitoredRow.roiAccrued, 4)}
                      </span>
                    }
                  />
                  <Mini
                    icon="gem"
                    label="4. DAO Pool Income"
                    value={`$${fmt18(monitoredRow.daoIncome, 4)}`}
                  />
                  <Mini
                    icon="crown"
                    label="5. Rank Reward"
                    value={
                      <span className="gold-t">
                        ${fmt18(monitoredRow.rewardIncome, 4)}
                      </span>
                    }
                  />
                  <Mini
                    icon="award"
                    label="6. Rank Incentive"
                    value={
                      <span className="gold-t">
                        ${fmt18(monitoredRow.rankIncentive, 4)}
                      </span>
                    }
                  />
                </div>
              </Panel>

              <Panel
                eyebrow="NETWORK & DAO METRICS"
                title="Team, Business & DAO Telemetry"
                sub="Synchronized state from AritohamDataStore & ARITOHAMProtocol"
                badge={
                  monitoredRow.daoLifetime ? "DAO Partner" : "Standard Member"
                }
                tone={monitoredRow.daoLifetime ? "green" : "muted"}
              >
                <div className="cols-3">
                  <Mini
                    icon="users"
                    label="Direct Referrals"
                    value={`${monitoredRow.directCount}`}
                    hint={`${monitoredRow.activeDirects} Active · ${monitoredRow.qualifiedDirects} Qual`}
                  />
                  <Mini
                    icon="network"
                    label="Total Team Size"
                    value={`${monitoredRow.teamCount}`}
                    hint="Across 20 Generations"
                  />
                  <Mini
                    icon="dollar"
                    label="Direct Business"
                    value={`$${fmt18(monitoredRow.directBusiness, 2)}`}
                  />
                  <Mini
                    icon="bars"
                    label="Total Team Business"
                    value={`$${fmt18(monitoredRow.teamBusiness, 2)}`}
                  />
                  <Mini
                    icon="calendar"
                    label="Weekly Matching"
                    value={`$${fmt18(monitoredRow.weeklyMatching, 2)}`}
                  />
                  <Mini
                    icon="gem"
                    label="Cycle DAO Shares"
                    value={`${monitoredRow.currentCycleDaoShares.toString()}`}
                    hint={`Lifetime: ${monitoredRow.daoLifetime ? "Yes" : "No"}`}
                  />
                </div>

                <div style={{ marginTop: 16 }}>
                  <div className="kv">
                    <span>User Wallet Address</span>
                    <b>
                      <Addr text={monitoredRow.address} link />
                    </b>
                  </div>
                  <div className="kv">
                    <span>Referrer Wallet Address</span>
                    <b>
                      <Addr text={monitoredRow.referrer} link />
                    </b>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Individual User Stakes Table */}
            <Panel
              eyebrow="STAKING POSITIONS"
              title={`Individual User Stakes (${detail.stakesList.length})`}
              sub="All stake records stored in ARITOHAMProtocol.userStakes(user, index)"
              right={
                <button
                  type="button"
                  className="btn btn-gold btn-sm"
                  onClick={() => setModalOpen(true)}
                >
                  <Icon name="shield" size={14} /> Open Chain Keeper Actions
                </button>
              }
            >
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Stake #</th>
                      <th>Total Investment</th>
                      <th>Net Staked USD</th>
                      <th>Minted ARI</th>
                      <th>Daily / Total ROI</th>
                      <th>Claimed ROI</th>
                      <th>Start Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.stakesList.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="empty">
                            This user has no stake positions recorded on-chain.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      detail.stakesList.map((st) => (
                        <tr key={st.index}>
                          <td>
                            <span className="gold-t" style={{ fontWeight: 800 }}>
                              #{st.index}
                            </span>
                          </td>
                          <td>${fmt18(st.totalInvestment, 2)}</td>
                          <td>${fmt18(st.tokenUsdValue, 2)}</td>
                          <td className="gold-t">
                            {fmt18(st.mintedTokens, 2)} ARI
                          </td>
                          <td>
                            ${fmt18(st.dailyRoi, 2)} / ${fmt18(st.totalRoi, 2)} (
                            {st.totalDays}d)
                          </td>
                          <td className="up">${fmt18(st.claimedRoi, 4)}</td>
                          <td>
                            {st.startTime > 0
                              ? new Date(st.startTime * 1000).toLocaleString()
                              : "—"}
                          </td>
                          <td>
                            {!st.completed ? (
                              <Tag tone="green">Active</Tag>
                            ) : (
                              <Tag tone="muted">Completed</Tag>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        ) : null}

      {/* Chain Keeper Actions Modal */}
      <UserKeeperModal
        user={modalOpen ? monitoredRow : null}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
