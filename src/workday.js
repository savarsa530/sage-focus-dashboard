// The shape of the workday: when it starts, when to aim to log off, and the
// hard stop after which the page turns to its evening face. Plus what the
// work pays for, and a record of which days were closed on time.

import { safeGetJSON, safeSet, dayKey } from "./utils";

const PLAN_KEY  = "sage_workday_v1";
const CLOSE_KEY = "sage_dayclose_v1";   // { [dayKey]: { closedAt, reopened } }

export const DEFAULT_PLAN = {
  start: "08:00",
  aim:   "15:30",
  stop:  "16:00",
  days:  [1, 2, 3, 4, 5],   // Mon–Fri (Date.getDay numbering)
  buys:  [],                 // what this work pays for, in her words
};

export const toMins = (hhmm = "00:00") => { const [h, m] = hhmm.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
export const nowMins = (d = new Date()) => d.getHours() * 60 + d.getMinutes();
export const fmtClock = (mins) => {
  const h = Math.floor(mins / 60), m = mins % 60;
  const d = new Date(); d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour:"numeric", minute:"2-digit" });
};
export const fmtSpan = (mins) => {
  if (mins < 1) return "under a minute";
  const h = Math.floor(mins / 60), m = mins % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

export function loadPlan() {
  const p = safeGetJSON(PLAN_KEY);
  return p && typeof p === "object" ? { ...DEFAULT_PLAN, ...p } : { ...DEFAULT_PLAN };
}
export const savePlan = (plan) => safeSet(PLAN_KEY, plan);

export function loadCloses() {
  const c = safeGetJSON(CLOSE_KEY);
  return c && typeof c === "object" ? c : {};
}

export function closeDay(at = new Date()) {
  const c = loadCloses();
  c[dayKey(at)] = { ...(c[dayKey(at)] || {}), closedAt: at.getTime(), reopened: false };
  safeSet(CLOSE_KEY, c);
  return c;
}

export function reopenDay(at = new Date()) {
  const c = loadCloses();
  c[dayKey(at)] = { ...(c[dayKey(at)] || {}), reopened: true };
  safeSet(CLOSE_KEY, c);
  return c;
}

// Where today sits: "off" (not a workday), "before", "working", "wrapping"
// (past the aim), "over" (past the hard stop), with minutes and progress.
export function dayState(plan, d = new Date()) {
  const n = nowMins(d), s = toMins(plan.start), a = toMins(plan.aim), e = toMins(plan.stop);
  if (!plan.days.includes(d.getDay())) return { phase:"off", now:n, start:s, aim:a, stop:e, pct:0 };
  const pct = Math.max(0, Math.min(1, (n - s) / Math.max(1, e - s)));
  const phase = n < s ? "before" : n < a ? "working" : n < e ? "wrapping" : "over";
  return { phase, now:n, start:s, aim:a, stop:e, pct, toAim: a - n, toStop: e - n };
}

// Evenings reclaimed: days this month closed at or before the hard stop.
// Only ever counts up; a late day simply isn't added.
export function eveningsThisMonth(plan, closes = loadCloses(), d = new Date()) {
  const prefix = dayKey(d).slice(0, 7);
  const stop = toMins(plan.stop);
  return Object.entries(closes).filter(([k, v]) => {
    if (!k.startsWith(prefix) || !v.closedAt) return false;
    return nowMins(new Date(v.closedAt)) <= stop;
  }).length;
}
