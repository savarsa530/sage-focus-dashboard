export const fmt   = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
export const pad   = (n) => String(n).padStart(2,"0");
export const uuid  = ()  => crypto.randomUUID();
export const today = ()  => new Date().toDateString();

// ── Safe localStorage helpers ──────────────────────────────────
// Wrap every storage access so a full, blocked (private mode), or
// corrupt store degrades gracefully instead of throwing mid-flow.

export function safeGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

export function safeGetJSON(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function safeSet(key, value) {
  try {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ── Focus ledger ───────────────────────────────────────────────
// Time spent, by day and by task, so it can be summarized later.
// Shape: { days: { "YYYY-MM-DD": { [taskId]: { label, kind, secs } } },
//          sessions: { "YYYY-MM-DD": n },
//          earlier: { [taskId]: { label, kind, secs } } }   // time logged before the ledger existed
const LEDGER_KEY = "sage_ledger_v1";

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function loadLedger(tasks = []) {
  const saved = safeGetJSON(LEDGER_KEY);
  if (saved && saved.days) return { days:{}, sessions:{}, earlier:{}, ...saved };
  // First run: keep the time already invested in tasks, undated.
  const earlier = {};
  tasks.forEach(t => {
    if ((t.focusSecs || 0) > 0) earlier[t.id] = { label:t.text, kind: t.opId ? "op" : "task", secs:t.focusSecs };
  });
  const fresh = { days:{}, sessions:{}, earlier };
  safeSet(LEDGER_KEY, fresh);
  return fresh;
}

export function creditLedger(task, secs) {
  if (!task || secs <= 0) return;
  const ledger = loadLedger();
  const k = dayKey();
  const day = ledger.days[k] || (ledger.days[k] = {});
  const row = day[task.id] || (day[task.id] = { label:task.text, kind: task.opId ? "op" : "task", secs:0 });
  row.label = task.text;
  row.secs += secs;
  safeSet(LEDGER_KEY, ledger);
}

export function countLedgerSession() {
  const ledger = loadLedger();
  const k = dayKey();
  ledger.sessions[k] = (ledger.sessions[k] || 0) + 1;
  safeSet(LEDGER_KEY, ledger);
}
