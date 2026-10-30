"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { type Address } from "viem";
import { useAdmin } from "@/components/AdminContext";
import {
  fmt18,
  readProtocol,
  writeProtocol,
} from "@/lib/contract";
import {
  PageTitle,
  Panel,
  Mini,
  Pill,
  Addr,
  RoleRequirementBanner,
  TxFeedback,
} from "@/components/ui";

interface RegisteredDaoRow {
  index: number;
  wallet: Address;
  shares: bigint;
  sharePct: number;
  estRewardWei: bigint;
  isPaid: boolean;
}

export default function WriteDaoDistributePage() {
  const { overview, refresh, refreshUsers } = useAdmin();

  const [inspectCycle, setInspectCycle] = useState<number>(1);
  const [rows, setRows] = useState<RegisteredDaoRow[]>([]);
  const [loadingCycle, setLoadingCycle] = useState<boolean>(false);

  const [batchCount, setBatchCount] = useState<string>("50");
  const [txState, setTxState] = useState<{
    status: "idle" | "pending" | "ok" | "error";
    message?: string;
    hash?: string;
  } | null>(null);

  const isChainKeeper = Boolean(overview?.roles.isChainKeeper);
  const p = overview?.protocol;

  const loadCycleState = useCallback(
    async (targetCycle: number) => {
      setLoadingCycle(true);
      try {
        const cyc = BigInt(targetCycle);
        const eligibleTuple = (await readProtocol("getDaoEligible", [cyc]).catch(
          () => [[], []]
        )) as [Address[], bigint[]];

        const wallets = eligibleTuple?.[0] ?? [];
        const sharesArr = eligibleTuple?.[1] ?? [];

        const totShares = sharesArr.reduce((acc, s) => acc + BigInt(s), 0n);
        const effectivePool =
          p && p.daoPayPool > 0n && Number(p.daoPayCycle) === targetCycle
            ? p.daoPayPool
            : p?.daoPoolTotal ?? 0n;
        const paidCursor =
          p && Number(p.daoPayCycle) === targetCycle ? Number(p.daoPayCursor) : 0;

        const mapped: RegisteredDaoRow[] = wallets.map((w, idx) => {
          const sh = BigInt(sharesArr[idx] ?? 0n);
          const pct =
            totShares > 0n ? (Number(sh) / Number(totShares)) * 100 : 0;
          const rewardWei =
            totShares > 0n ? (effectivePool * sh) / totShares : 0n;
          return {
            index: idx + 1,
            wallet: w,
            shares: sh,
            sharePct: pct,
            estRewardWei: rewardWei,
            isPaid: idx < paidCursor,
          };
        });

        setRows(mapped);
        const remaining = Math.max(1, wallets.length - paidCursor);
        setBatchCount(String(Math.min(100, remaining)));
      } finally {
        setLoadingCycle(false);
      }
    },
    [p]
  );

  useEffect(() => {
    if (p) {
      const activeCyc =
        p.daoPayCycle > 0n ? Number(p.daoPayCycle) : Number(p.daoCycle || 1n);
      setInspectCycle(activeCyc);
      loadCycleState(activeCyc);
    }
  }, [p, loadCycleState]);

  const executeDistributeDao = async () => {
    const countNum = Math.floor(Number(batchCount || "0"));
    if (!countNum || countNum <= 0) {
      setTxState({
        status: "error",
        message: "Enter a valid batch count >= 1.",
      });
      return;
    }
    setTxState({
      status: "pending",
      message: `Submitting distributeDao(count=${countNum}) for Cycle #${inspectCycle}...`,
    });
    try {
      const res = await writeProtocol("distributeDao", [BigInt(countNum)]);
      setTxState({
        status: "ok",
        message: `Executed distributeDao(${countNum}) for Cycle #${inspectCycle}.`,
        hash: res.hash,
      });
      await Promise.all([refresh(), refreshUsers(), loadCycleState(inspectCycle)]);
    } catch (e: unknown) {
      setTxState({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const paidCursor =
    p && Number(p.daoPayCycle) === inspectCycle ? Number(p.daoPayCursor) : 0;
  const remainingWallets = Math.max(0, rows.length - paidCursor);
  const totalShares = rows.reduce((acc, r) => acc + r.shares, 0n);
  const effectivePool =
    p && p.daoPayPool > 0n && Number(p.daoPayCycle) === inspectCycle
      ? p.daoPayPool
      : p?.daoPoolTotal ?? 0n;
  const busy = txState?.status === "pending";

  return (
    <div className="stack">
      <PageTitle
        title="9. Distribute DAO Share (Write)"
        sub="Write Action 9 — Inspect registered DAO cycle wallets & shares and execute distributeDao(count) to distribute the DAO pool"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <Link className="btn btn-sm" href="/write/dao-eligible">
              ← 8. Set DAO Eligible
            </Link>
            <button
              className="btn btn-sm"
              onClick={() => loadCycleState(inspectCycle)}
              disabled={loadingCycle}
            >
              {loadingCycle ? "Refreshing Cycle..." : "Refresh Cycle"}
            </button>
          </div>
        }
      />

      <RoleRequirementBanner
        roleName="ChainKeeper"
        requiredAddress={p?.chainKeeper}
        hasRole={isChainKeeper}
      />

      <TxFeedback state={txState} />

      {/* KPIs */}
      <div className="grid cols-5">
        <Mini
          label="Active DAO Cycle"
          value={`Cycle #${String(p?.daoCycle ?? 1n)}`}
          hint={`Paying Cycle: #${String(p?.daoPayCycle ?? 0n)}`}
        />
        <Mini
          label="DAO Pool to Distribute"
          value={`$${fmt18(effectivePool, 2)}`}
          hint={`Accruing Pool: $${fmt18(p?.daoPoolTotal, 2)}`}
        />
        <Mini
          label="Registered Wallets"
          value={String(rows.length)}
          hint={`Paid: ${paidCursor} • Remaining: ${remainingWallets}`}
        />
        <Mini
          label="Total Cycle Shares"
          value={String(totalShares)}
          hint="Sum of registered shares"
        />
        <Mini
          label="Payout Per Share"
          value={
            totalShares > 0n
              ? `$${fmt18(effectivePool / totalShares, 4)}`
              : "$0.0000"
          }
          hint="Pool ÷ Total Shares"
        />
      </div>

      {/* Execute Distribution Panel */}
      <Panel
        title="Execute DAO Share Distribution (distributeDao)"
        sub="Specify the number of registered wallets to process in this transaction batch (automatic cursor tracking on-chain)"
      >
        <div className="grid cols-3">
          <div>
            <label className="field-l">Inspect DAO Cycle #</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="number"
                min={1}
                className="inp"
                value={inspectCycle}
                onChange={(e) => setInspectCycle(Number(e.target.value))}
              />
              <button
                className="btn btn-sm"
                onClick={() => loadCycleState(inspectCycle)}
                disabled={loadingCycle}
              >
                Load Cycle
              </button>
            </div>
          </div>

          <div>
            <label className="field-l">Batch Count (Wallets to Pay Now)</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="number"
                min={1}
                className="inp"
                value={batchCount}
                onChange={(e) => setBatchCount(e.target.value)}
              />
              <button
                className="btn btn-sm"
                onClick={() => setBatchCount(String(Math.max(1, remainingWallets)))}
              >
                All Remaining ({remainingWallets})
              </button>
            </div>
          </div>

          <div>
            <label className="field-l">Dispatch Payout Transaction</label>
            <button
              className="btn btn-gold btn-block"
              disabled={busy}
              onClick={executeDistributeDao}
            >
              {busy
                ? "Distributing DAO Pool..."
                : `Execute distributeDao(${batchCount}) — $${fmt18(effectivePool, 2)} Pool`}
            </button>
          </div>
        </div>
      </Panel>

      {/* Registered Wallets & Shares Table */}
      <Panel
        title={`Cycle #${inspectCycle} Registered DAO Wallets & Share Breakdown (${rows.length})`}
        sub="Wallets registered via setDaoEligible for this cycle and their exact share of the DAO pool"
      >
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Registered Wallet</th>
                <th className="num">Registered Shares</th>
                <th className="num">Pool Share %</th>
                <th className="num">Estimated Payout ($)</th>
                <th>Distribution Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingCycle ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 32 }} className="muted">
                    Loading registered DAO wallets for Cycle #{inspectCycle}...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 32 }} className="muted">
                    No wallets are registered in Cycle #{inspectCycle} yet. Go to{" "}
                    <Link href="/write/dao-eligible" className="t-gold">
                      8. Set DAO Eligible
                    </Link>{" "}
                    first to register eligible wallets and shares.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.wallet}>
                    <td className="mono">{r.index}</td>
                    <td>
                      <Addr text={r.wallet} link />
                    </td>
                    <td className="num mono t-gold">{String(r.shares)}</td>
                    <td className="num mono">{r.sharePct.toFixed(2)}%</td>
                    <td className="num mono t-ok">${fmt18(r.estRewardWei, 2)}</td>
                    <td>
                      {r.isPaid ? (
                        <Pill tone="green">PAID</Pill>
                      ) : (
                        <Pill tone="gold">PENDING DISTRIBUTION</Pill>
                      )}
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
