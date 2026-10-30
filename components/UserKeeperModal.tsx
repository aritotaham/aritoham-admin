"use client";

import React, { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAdmin } from "@/components/AdminContext";
import {
  Addr,
  Icon,
  Mini,
  Panel,
  Pill,
  RoleRequirementBanner,
  TxFeedback,
} from "@/components/ui";
import {
  fmt18,
  PROTOCOL_RANK_REWARDS,
  writeProtocol,
  type MonitoredUserRow,
} from "@/lib/contract";

interface UserKeeperModalProps {
  user: MonitoredUserRow | null;
  onClose: () => void;
}

export function UserKeeperModal({ user, onClose }: UserKeeperModalProps) {
  const { overview, runTx, refreshUsers } = useAdmin();

  const [selectedRankId, setSelectedRankId] = useState<string>(
    user
      ? String(
          Math.min(
            8,
            Math.max(
              (user.protocolRankId || 0) + 1,
              user.qualifiedProtocolRankId || 1
            )
          )
        )
      : "1"
  );
  const [incentiveAmount, setIncentiveAmount] = useState(
    user && user.suggestedIncentiveRankMatchingPpmUsd > 0n
      ? Number(formatUnits(user.suggestedIncentiveRankMatchingPpmUsd, 18)).toFixed(4)
      : ""
  );
  const [daoShares, setDaoShares] = useState(
    user && user.currentCycleDaoShares > 0n
      ? user.currentCycleDaoShares.toString()
      : "1"
  );
  const [burnAmount, setBurnAmount] = useState("");
  const [txState, setTxState] = useState<{
    status: "idle" | "pending" | "ok" | "error";
    message?: string;
    hash?: string;
  }>({ status: "idle" });

  if (!user) return null;

  const isChainKeeper = Boolean(overview?.roles.isChainKeeper);
  const selectedTier =
    PROTOCOL_RANK_REWARDS.find((r) => r.rankId === Number(selectedRankId)) ??
    PROTOCOL_RANK_REWARDS[0];

  const execAction = async (
    label: string,
    fn: () => Promise<{ hash: string }>
  ) => {
    setTxState({
      status: "pending",
      message: `Submitting ${label} to ARITOHAMProtocol...`,
    });
    const res = await runTx(label, fn);
    if (res.ok) {
      setTxState({
        status: "ok",
        message: `${label} confirmed on-chain.`,
        hash: res.hash,
      });
      await refreshUsers();
    } else {
      setTxState({
        status: "error",
        message: res.error || "Transaction failed",
      });
    }
  };

  const handleRewardIncome = async () => {
    await execAction(
      `Award Rank ${selectedTier.name} (rank_id=${selectedTier.rankId}) to ${user.userCode}`,
      () =>
        writeProtocol("updateRewardIncome", [
          user.address,
          BigInt(selectedTier.rankId),
        ])
    );
  };

  const handleRankIncentive = async () => {
    if (!incentiveAmount.trim()) return;
    const amt = parseUnits(incentiveAmount.trim(), 18);
    await execAction(
      `Credit $${incentiveAmount} Rank Incentive to ${user.userCode}`,
      () => writeProtocol("updateRankIncentive", [user.address, amt])
    );
    setIncentiveAmount("");
  };

  const handleDaoEligible = async () => {
    if (!daoShares.trim()) return;
    await execAction(
      `Set DAO Eligible (${daoShares} shares) for ${user.userCode}`,
      () =>
        writeProtocol("setDaoEligible", [
          [user.address],
          [BigInt(daoShares.trim())],
        ])
    );
  };

  const handleToggleBlacklist = async (nextStatus: boolean) => {
    await execAction(
      `${nextStatus ? "Blacklist" : "Unblacklist"} ${user.userCode}`,
      () => writeProtocol("setBlacklist", [user.address, nextStatus])
    );
  };

  const handleResetRankBusinessDao = async () => {
    await execAction(
      `Reset Rank, Business & DAO for ${user.userCode}`,
      () => writeProtocol("resetRankBusinessDao", [user.address])
    );
  };

  const handleBurnFrom = async () => {
    if (!burnAmount.trim()) return;
    const amt = parseUnits(burnAmount.trim(), 18);
    await execAction(`Burn ${burnAmount} ARI from ${user.userCode}`, () =>
      writeProtocol("burnFrom", [user.address, amt])
    );
    setBurnAmount("");
  };

  const txBusy = txState.status === "pending";

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Pill tone="gold">
              <Icon name="shield" size={14} /> Chain Keeper Actions
            </Pill>
            <Pill tone="blue">{user.userCode}</Pill>
            {user.isBlacklisted ? (
              <Pill tone="red" dot>
                Blacklisted
              </Pill>
            ) : user.isActive ? (
              <Pill tone="green" dot>
                Active Staker
              </Pill>
            ) : (
              <Pill tone="muted">Inactive</Pill>
            )}
          </div>
          <button
            type="button"
            className="modal-x"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontFamily: "var(--display)", fontSize: 22, marginBottom: 4 }}>
            Execute Chain Keeper Operations for {user.userCode}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", color: "var(--muted)", fontSize: 13 }}>
            <span>Wallet:</span>
            <Addr text={user.address} link />
            <span>· Referrer:</span>
            <Addr text={user.referrer} link />
          </div>
        </div>

        <RoleRequirementBanner
          roleName="Chain Keeper (onlyChainKeeper)"
          requiredAddress={overview?.protocol.chainKeeper}
          hasRole={isChainKeeper}
        />

        {/* User Live Snapshot */}
        <div className="cols-6" style={{ marginBottom: 18 }}>
          <Mini
            flat
            label="Current Rank"
            value={`${user.rankName} (#${user.storeRank})`}
            hint={`Protocol rank_id: ${user.protocolRankId}`}
          />
          <Mini
            flat
            label="Total Staked"
            value={`$${fmt18(user.totalStaked, 2)}`}
            hint={`${user.stakeCount} stake(s)`}
          />
          <Mini
            flat
            label="Withdrawable"
            value={<span className="up">${fmt18(user.balance, 2)}</span>}
            hint={`Cap left: $${fmt18(user.remainingCap, 2)}`}
          />
          <Mini
            flat
            label="Total Income"
            value={<span className="gold-t">${fmt18(user.totalIncome, 2)}</span>}
            hint={`ROI: $${fmt18(user.roiAccrued, 2)}`}
          />
          <Mini
            flat
            label="Wallet ARI"
            value={`${fmt18(user.tokenBalance, 2)} ARI`}
            hint={`USDT: $${fmt18(user.usdtBalance, 2)}`}
          />
          <Mini
            flat
            label="DAO Partner"
            value={user.daoLifetime ? "Lifetime Partner" : "Not Eligible"}
            hint={`${user.currentCycleDaoShares.toString()} cycle shares`}
          />
        </div>

        <TxFeedback state={txState} />

        {/* 6 Per-User Chain Keeper Action Panels */}
        <div className="grid g-half" style={{ marginTop: 16 }}>
          {/* 1. updateRewardIncome */}
          <Panel
            eyebrow="ACTION 01 · RANK PROMOTION"
            title="Award Rank Reward Income"
            sub="Updates rank in Protocol & DataStore and credits tier USD reward."
            badge="updateRewardIncome"
            tone="gold"
          >
            <div style={{ marginBottom: 14 }}>
              <label className="field-l">Select Protocol Rank Tier (0..8)</label>
              <select
                className="sel"
                value={selectedRankId}
                onChange={(e) => setSelectedRankId(e.target.value)}
              >
                {PROTOCOL_RANK_REWARDS.map((tier) => (
                  <option key={tier.rankId} value={tier.rankId}>
                    rank_id {tier.rankId} (Store #{tier.storeRank}) — {tier.name} ($
                    {tier.rewardUsd.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-gold btn-block"
              disabled={txBusy}
              onClick={handleRewardIncome}
            >
              <Icon name="award" size={16} /> Award {selectedTier.name} ($
              {selectedTier.rewardUsd.toLocaleString()}) to {user.userCode}
            </button>
          </Panel>

          {/* 2. updateRankIncentive */}
          <Panel
            eyebrow="ACTION 02 · INCENTIVE BONUS"
            title="Credit Rank Incentive (USD)"
            sub={`Credits custom rank incentive capped by remaining cap ($${fmt18(user.remainingCap, 2)}).`}
            badge="updateRankIncentive"
            tone="gold"
          >
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <label className="field-l" style={{ marginBottom: 0 }}>
                  Incentive Amount (USD, 18 Decimals)
                </label>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ padding: "3px 9px", fontSize: 11 }}
                  onClick={() =>
                    setIncentiveAmount(
                      Number(
                        formatUnits(user.suggestedIncentiveRankMatchingPpmUsd, 18)
                      ).toFixed(4)
                    )
                  }
                >
                  Auto: Rank Matching × {(user.rankIncentiveBps / 100).toFixed(1)}% ×{" "}
                  {(user.dailyRewardPpm / 10000).toFixed(3)}% ($
                  {fmt18(user.suggestedIncentiveRankMatchingPpmUsd, 4)})
                </button>
              </div>
              <input
                type="number"
                step="any"
                className="inp"
                placeholder="e.g. 5.012"
                value={incentiveAmount}
                onChange={(e) => setIncentiveAmount(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-gold btn-block"
              disabled={txBusy || !incentiveAmount.trim()}
              onClick={handleRankIncentive}
            >
              <Icon name="dollar" size={16} /> Credit Rank Incentive to{" "}
              {user.userCode}
            </button>
          </Panel>

          {/* 3. setDaoEligible */}
          <Panel
            eyebrow="ACTION 03 · DAO PARTNER"
            title="Set DAO Eligible & Cycle Shares"
            sub="Marks user as lifetime DAO partner and sets share weight for current cycle."
            badge="setDaoEligible"
            tone="blue"
          >
            <div style={{ marginBottom: 14 }}>
              <label className="field-l">DAO Shares for Current Cycle (&gt; 0)</label>
              <input
                type="number"
                min="1"
                step="1"
                className="inp"
                placeholder="e.g. 1"
                value={daoShares}
                onChange={(e) => setDaoShares(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-gold btn-block"
              disabled={txBusy || !daoShares.trim()}
              onClick={handleDaoEligible}
            >
              <Icon name="gem" size={16} /> Assign {daoShares || "0"} DAO Share(s)
              to {user.userCode}
            </button>
          </Panel>

          {/* 4. burnFrom */}
          <Panel
            eyebrow="ACTION 04 · TOKEN BURN"
            title="Burn ARI Tokens from Wallet"
            sub={`Burns ARITOHAM tokens directly from user's wallet (${fmt18(user.tokenBalance, 4)} ARI available).`}
            badge="burnFrom"
            tone="red"
          >
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <label className="field-l" style={{ marginBottom: 0 }}>
                  ARI Amount to Burn
                </label>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ padding: "3px 9px", fontSize: 11 }}
                  onClick={() =>
                    setBurnAmount(formatUnits(user.tokenBalance, 18))
                  }
                >
                  Max ({fmt18(user.tokenBalance, 2)} ARI)
                </button>
              </div>
              <input
                type="number"
                step="any"
                className="inp"
                placeholder="e.g. 500"
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-danger btn-block"
              disabled={txBusy || !burnAmount.trim()}
              onClick={handleBurnFrom}
            >
              <Icon name="flame" size={16} /> Burn {burnAmount || "0"} ARI from{" "}
              {user.userCode}
            </button>
          </Panel>

          {/* 5. setBlacklist */}
          <Panel
            eyebrow="ACTION 05 · COMPLIANCE"
            title="Protocol & Token Blacklist"
            sub="Toggles blacklist across both ARITOHAMProtocol and ARITOHAM Token."
            badge="setBlacklist"
            tone={user.isBlacklisted ? "red" : "green"}
          >
            <div className="kv" style={{ marginBottom: 12 }}>
              <span>Current Blacklist Status</span>
              <b className={user.isBlacklisted ? "down" : "up"}>
                {user.isBlacklisted ? "BLACKLISTED" : "NOT BLACKLISTED"}
              </b>
            </div>
            <div className="cols-2">
              <button
                type="button"
                className="btn btn-danger"
                disabled={txBusy || user.isBlacklisted}
                onClick={() => handleToggleBlacklist(true)}
              >
                <Icon name="lock" size={15} /> Blacklist User
              </button>
              <button
                type="button"
                className="btn"
                disabled={txBusy || !user.isBlacklisted}
                onClick={() => handleToggleBlacklist(false)}
              >
                <Icon name="check" size={15} /> Unblacklist User
              </button>
            </div>
          </Panel>

          {/* 6. resetRankBusinessDao */}
          <Panel
            eyebrow="ACTION 06 · ACCOUNT RESET"
            title="Reset Rank, Business & DAO"
            sub="Resets rank to 0, clears teamBusiness & directBusiness, and revokes DAO lifetime."
            badge="resetRankBusinessDao"
            tone="red"
          >
            <div className="kv" style={{ marginBottom: 12 }}>
              <span>Current Rank / Team Business</span>
              <b>
                {user.rankName} / ${fmt18(user.teamBusiness, 2)}
              </b>
            </div>
            <button
              type="button"
              className="btn btn-danger btn-block"
              disabled={txBusy}
              onClick={handleResetRankBusinessDao}
            >
              <Icon name="alert" size={16} /> Execute Full Reset on{" "}
              {user.userCode}
            </button>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default UserKeeperModal;
