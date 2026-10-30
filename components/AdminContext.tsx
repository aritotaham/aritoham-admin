"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  AdminOverviewData,
  config,
  fetchAdminOverview,
  fetchAllMonitoredUsers,
  MonitoredUserRow,
} from "@/lib/contract";
import { useWallet } from "./WalletProvider";

export type TxLogEntry = {
  id: string;
  label: string;
  status: "pending" | "success" | "error";
  hash?: string;
  error?: string;
  timestamp: number;
};

const WATCHED_USERS_KEY = "aritoham_admin:watched_users";

type AdminContextValue = {
  overview: AdminOverviewData | null;
  users: MonitoredUserRow[];
  usersLoading: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  addWatchedAddress: (addr: string) => Promise<void>;
  txLogs: TxLogEntry[];
  clearTxLogs: () => void;
  runTx: (
    label: string,
    action: () => Promise<{ hash: string }>
  ) => Promise<{ ok: boolean; hash?: string; error?: string }>;
  explorerUrl: string;
};

const AdminCtx = createContext<AdminContextValue | null>(null);

function getSavedWatched(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { address } = useWallet();
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [users, setUsers] = useState<MonitoredUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [txLogs, setTxLogs] = useState<TxLogEntry[]>([]);

  const refreshUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const extra = getSavedWatched();
      if (address) extra.push(address);
      const list = await fetchAllMonitoredUsers(extra);
      setUsers(list);
    } catch {
      // ignore
    } finally {
      setUsersLoading(false);
    }
  }, [address]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data] = await Promise.all([fetchAdminOverview(address), refreshUsers()]);
      setOverview(data);
    } catch (e: any) {
      setError(e?.message || "Failed to read on-chain state.");
    } finally {
      setLoading(false);
    }
  }, [address, refreshUsers]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addWatchedAddress = useCallback(
    async (addr: string) => {
      const clean = addr.trim();
      if (!clean) return;
      try {
        const cur = getSavedWatched();
        if (!cur.some((x) => x.toLowerCase() === clean.toLowerCase())) {
          const next = [...cur, clean];
          localStorage.setItem(WATCHED_USERS_KEY, JSON.stringify(next));
        }
      } catch {}
      await refreshUsers();
    },
    [refreshUsers]
  );

  const runTx = useCallback(
    async (label: string, action: () => Promise<{ hash: string }>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const entry: TxLogEntry = { id, label, status: "pending", timestamp: Date.now() };
      setTxLogs((prev) => [entry, ...prev.slice(0, 19)]);

      try {
        const res = await action();
        setTxLogs((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "success", hash: res.hash } : item))
        );
        await refresh();
        return { ok: true, hash: res.hash };
      } catch (err: any) {
        const msg = err?.message || String(err);
        setTxLogs((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "error", error: msg } : item))
        );
        return { ok: false, error: msg };
      }
    },
    [refresh]
  );

  const clearTxLogs = useCallback(() => setTxLogs([]), []);

  return (
    <AdminCtx.Provider
      value={{
        overview,
        users,
        usersLoading,
        loading,
        error,
        refresh,
        refreshUsers,
        addWatchedAddress,
        txLogs,
        clearTxLogs,
        runTx,
        explorerUrl: config.explorer,
      }}
    >
      {children}
    </AdminCtx.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}
