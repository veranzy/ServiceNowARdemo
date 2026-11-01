// Pure helpers: money in integer cents, formatting, escaping, name/reference token matching, dates.

export const cents = v => { if (typeof v === "number") return Math.round(v * 100);
  let s = String(v ?? "").trim(); const neg = /^\(.*\)$/.test(s) || /^-/.test(s);
  s = s.replace(/[^0-9.,]/g, ""); if (/,\d{2}$/.test(s) && !/\.\d/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  s = s.replace(/,/g, ""); const n = Math.round(parseFloat(s || "0") * 100); return neg ? -n : n; };

export const fmt = c => (c < 0 ? "−" : "") + (Math.abs(c) / 100).toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const esc = s => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

export const normTok = s => String(s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

export const STOP = new Set(["PTE","LTD","LIMITED","PRIVATE","INC","LLC","CO","CORP","COMPANY","SDN","BHD","THE","GROUP","GRP","HLDGS","HOLDINGS","AND","PL","PLC","GMBH"]);

export const nameToks = s => String(s ?? "").toUpperCase().replace(/[^A-Z0-9 ]/g, " ").split(/\s+/).filter(t => t.length > 1 && !STOP.has(t));

export const nameSim = (a, b) => { const A = new Set(nameToks(a)), B = new Set(nameToks(b)); if (!A.size || !B.size) return 0;
  let hit = 0; A.forEach(t => { if (B.has(t) || [...B].some(u => (u.startsWith(t) || t.startsWith(u)) && Math.min(u.length, t.length) >= 4)) hit++; });
  return hit / Math.min(A.size, B.size); };

export const today = new Date(); today.setHours(0,0,0,0);

export const uid = p => p + Math.random().toString(36).slice(2, 8);

export function digitRuns(s) { return (String(s ?? "").toUpperCase().replace(/O(?=\d)|(?<=\d)O/g, "0").match(/\d{3,}/g) || []); }

export const DAY = 86400000;

export const addDays = (iso, n) => { const d = new Date(iso); if (isNaN(d)) return ""; d.setDate(d.getDate() + (Number(n) || 0)); return d.toISOString().slice(0, 10); };

export const isoToday = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
