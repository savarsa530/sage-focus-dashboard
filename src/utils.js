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
