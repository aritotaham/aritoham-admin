export const usd = (n: number, digits = 2) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const money = (n: number, max = 4) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: max });

export const num = (n: number, digits = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits });

export const shortAddr = (a?: string | null) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "—");
export const midAddr = (a?: string | null) => (a ? `${a.slice(0, 10)}…${a.slice(-8)}` : "—");

const p2 = (n: number) => String(n).padStart(2, "0");

export function fmtUS(ts: number) {
  if (!ts || ts <= 0) return "—";
  const d = new Date(ts > 1e12 ? ts : ts * 1000);
  let h = d.getUTCHours();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}, ${h}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())} ${ap} UTC`;
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function fmtDay(ts: number) {
  if (!ts || ts <= 0) return "—";
  const d = new Date(ts > 1e12 ? ts : ts * 1000);
  return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
