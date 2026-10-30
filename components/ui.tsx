"use client";

import { useEffect, useState } from "react";
import { config } from "@/lib/contract";
import { useWallet } from "./WalletProvider";

const P: Record<string, string> = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
  link: "M9 17H7A5 5 0 0 1 7 7h2 M15 7h2a5 5 0 1 1 0 10h-2 M8 12h8",
  calculator: "M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M8 7h8 M8 12h.01 M12 12h.01 M16 12h.01 M8 16h.01 M12 16h.01 M16 16h.01",
  download: "M12 3v12 M7 10l5 5 5-5 M5 21h14",
  file: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z M14 3v5h5 M9 13h6 M9 17h6",
  dollar: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M14.6 9.6c-.5-1-1.5-1.6-2.6-1.6-1.5 0-2.6.8-2.6 2s1.1 1.7 2.6 2 2.6.8 2.6 2-1.1 2-2.6 2c-1.1 0-2.1-.6-2.6-1.6 M12 6.5V8 M12 16v1.5",
  trend: "M3 17l6-6 4 4 8-8 M15 7h6v6",
  crown: "M3 8l4 4 5-7 5 7 4-4-2 11H5z",
  network: "M9 3h6v5H9z M2 16h6v5H2z M16 16h6v5h-6z M12 8v4 M5 16v-4h14v4",
  gem: "M6 3h12l4 6-10 12L2 9z M2 9h20 M10 3l-2 6 4 12 4-12-2-6",
  hand: "M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16 M7 21l-4-4 M14 15l4.2-.9a2 2 0 0 1 2.3 2.5L19 20l-6 1-3-1 M16 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
  userplus: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M19 8v6 M22 11h-6",
  usercheck: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M16 11l2 2 4-4",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3",
  refresh: "M21 12a9 9 0 0 1-15.5 6.2L3 16 M3 12a9 9 0 0 1 15.5-6.2L21 8 M21 3v5h-5 M3 21v-5h5",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2",
  percent: "M19 5L5 19 M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  briefcase: "M3 8h18v12H3z M8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3 M3 13h18",
  layers: "M12 2l10 5-10 5L2 7z M2 12l10 5 10-5 M2 17l10 5 10-5",
  bars: "M5 21V10 M12 21V4 M19 21v-8",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16v-4 M12 8h.01",
  check: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8.5 12.5l2.5 2.5 4.5-5",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8 M3 3v5h5 M12 7v5l3 2",
  lock: "M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 12h.01",
  award: "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M8.2 13.9L7 23l5-3 5 3-1.2-9.1",
  ext: "M15 3h6v6 M10 14L21 3 M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  down: "M6 9l6 6 6-6",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  arrowleft: "M19 12H5 M12 19l-7-7 7-7",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  calendar: "M3 5h18v16H3z M3 10h18 M8 3v4 M16 3v4",
  copy: "M9 9h11v11H9z M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4 M3 7v10a2 2 0 0 0 2 2h16V9H5a2 2 0 0 1-2-2z M17 14h.01",
  coins: "M9 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M18.1 10.4A6 6 0 1 1 10.4 18.1 M7 6h2v4",
  swap: "M7 7h13l-4-4 M17 17H4l4 4",
  menu: "M3 6h18M3 12h18M3 18h18",
  plus: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 8v8 M8 12h8",
  flame: "M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z",
  key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  alert: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
};

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={P[name] || P.grid} />
    </svg>
  );
}

export function PageTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {right && <div className="right">{right}</div>}
    </div>
  );
}

export type TileData = { icon: string; label: string; value: string; hint?: string };

export function Hero({
  eyebrow,
  title,
  desc,
  tiles,
  right,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  tiles?: TileData[];
  right?: React.ReactNode;
}) {
  return (
    <section className="hero">
      <div className="hero-head">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h2>{title}</h2>
          {desc && <p className="desc">{desc}</p>}
        </div>
        {right}
      </div>
      {tiles && (
        <div
          className="tiles"
          style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${tiles.length > 4 ? 190 : 220}px, 1fr))` }}
        >
          {tiles.map((t) => (
            <div className="tile" key={t.label}>
              <span className="ico">
                <Icon name={t.icon} size={18} />
              </span>
              <div className="lbl">{t.label}</div>
              <div className="val">{t.value}</div>
              {t.hint && <div className="hint">{t.hint}</div>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function Mini({
  icon,
  label,
  value,
  hint,
  flat,
}: {
  icon?: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
  flat?: boolean;
}) {
  return (
    <div className={`mini ${flat ? "flat" : ""}`}>
      {icon && (
        <span className="ico">
          <Icon name={icon} size={17} />
        </span>
      )}
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export type Tone = "gold" | "green" | "red" | "blue" | "muted";
export function Pill({ children, tone = "gold", dot }: { children: React.ReactNode; tone?: Tone; dot?: boolean }) {
  return (
    <span className={`pill ${tone}`}>
      {dot && <i className="dot" />}
      {children}
    </span>
  );
}

export function Panel({
  eyebrow,
  title,
  sub,
  badge,
  tone = "gold",
  right,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: string;
  sub?: string;
  badge?: React.ReactNode;
  tone?: Tone;
  right?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || eyebrow) && (
        <div className="panel-head">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h3>{title}</h3>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {right}
            {badge && <Pill tone={tone}>{badge}</Pill>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

export function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className={`cbtn ${ok ? "ok" : ""}`}
      aria-label="Copy"
      title="Copy to clipboard"
      onClick={() => {
        try {
          navigator.clipboard?.writeText(text).catch(() => {});
        } catch {}
        setOk(true);
        setTimeout(() => setOk(false), 1200);
      }}
    >
      <Icon name={ok ? "check" : "copy"} size={14} />
    </button>
  );
}

export function Addr({ text, link, explorerType = "address" }: { text?: string | null; link?: boolean; explorerType?: "address" | "tx" }) {
  if (!text || text === "—") return <span>—</span>;
  const shown = text.length > 22 ? `${text.slice(0, 8)}...${text.slice(-6)}` : text;
  const href = `${config.explorer}/${explorerType}/${text}`;
  return (
    <span className="addr">
      {link ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="link" title={text}>
          {shown}
        </a>
      ) : (
        <span title={text}>{shown}</span>
      )}
      <CopyBtn text={text} />
      {link && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="cbtn"
          title="View on Explorer"
          aria-label="View on Explorer"
        >
          <Icon name="ext" size={13} />
        </a>
      )}
    </span>
  );
}

export function Tag({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "gold" | "red" | "muted" }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" className={`toggle ${on ? "on" : ""}`} role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <i />
      {label}
    </button>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  line,
}: {
  tabs: { id: T; label: string; icon?: string; badge?: string }[];
  value: T;
  onChange: (v: T) => void;
  line?: boolean;
}) {
  return (
    <div className={`tabs ${line ? "line" : ""}`} role="tablist">
      {tabs.map((t) => (
        <button
          type="button"
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          className={value === t.id ? "on" : ""}
          onClick={() => onChange(t.id)}
        >
          {t.icon && <Icon name={t.icon} size={16} />}
          {t.label}
          {t.badge && (
            <span
              style={{
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 99,
                background: value === t.id ? "rgba(0,0,0,0.22)" : "rgba(212,175,55,0.14)",
              }}
            >
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function TxFeedback({
  state,
}: {
  state: { status: "idle" | "pending" | "ok" | "error"; message?: string; hash?: string } | null;
}) {
  if (!state || state.status === "idle") return null;
  const cls = state.status === "ok" ? "ok" : state.status === "error" ? "error" : "pending";
  return (
    <div className={`reg-msg ${cls}`} style={{ marginTop: 14 }}>
      {state.status === "pending" ? (
        <span className="reg-spin" />
      ) : (
        <span className="reg-msg-ico">{state.status === "ok" ? "✓" : "!"}</span>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div>{state.message}</div>
        {state.hash && (
          <a
            href={`${config.explorer}/tx/${state.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 4 }}
          >
            View Txn on Explorer ({state.hash.slice(0, 10)}…{state.hash.slice(-6)}) <Icon name="ext" size={13} />
          </a>
        )}
      </div>
    </div>
  );
}

export function RoleRequirementBanner({
  roleName,
  requiredAddress,
  hasRole,
}: {
  roleName: string;
  requiredAddress?: string;
  hasRole: boolean;
}) {
  const { address, openModal } = useWallet();

  if (!address) {
    return (
      <div className="alert gold" style={{ marginBottom: 18, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <span>
          <b>Wallet not connected.</b> Connect your MetaMask wallet (`{roleName}`) to execute transactions on this panel.
        </span>
        <button type="button" className="btn btn-gold btn-sm" onClick={openModal}>
          <Icon name="wallet" size={15} /> Connect MetaMask
        </button>
      </div>
    );
  }

  if (hasRole) {
    return (
      <div className="alert ok" style={{ marginBottom: 18, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <span>
          <b>Authorized as {roleName}.</b> Your connected wallet matches the on-chain role holder and can execute all actions below.
        </span>
        <Pill tone="green" dot>
          {roleName} Active
        </Pill>
      </div>
    );
  }

  return (
    <div className="alert warn" style={{ marginBottom: 18, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
      <div>
        <b>Connected wallet is not the {roleName}.</b> You can still prepare and simulate calls, but on-chain execution requires{" "}
        {requiredAddress ? <Addr text={requiredAddress} link /> : <code>{roleName}</code>}.
      </div>
      <Pill tone="red">{roleName} Required</Pill>
    </div>
  );
}

export type Col<T> = { key: string; label: React.ReactNode; align?: "right"; render?: (r: T, i: number) => React.ReactNode };

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  pageSize = 10,
  empty,
  emptyHint,
}: {
  columns: Col<T>[];
  rows: T[];
  pageSize?: number;
  empty?: string;
  emptyHint?: string;
}) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [rows]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, pages - 1);
  const slice = rows.slice(cur * pageSize, cur * pageSize + pageSize);
  const n = rows.length.toLocaleString("en-US");

  return (
    <div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={c.align === "right" ? "ta-r" : ""}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty">
                    {empty || "No records found"}
                    {emptyHint && <small>{emptyHint}</small>}
                  </div>
                </td>
              </tr>
            ) : (
              slice.map((r, i) => (
                <tr key={cur * pageSize + i}>
                  {columns.map((c) => (
                    <td key={c.key} className={c.align === "right" ? "ta-r" : ""}>
                      {c.render ? c.render(r, cur * pageSize + i) : String(r[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && pages > 1 && (
        <div className="pager">
          <span>
            Page {cur + 1} of {pages} · <b>{n}</b> record{rows.length === 1 ? "" : "s"}
          </span>
          <div className="btns">
            <button type="button" className="btn btn-sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>
              Previous
            </button>
            <button type="button" className="btn btn-sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
