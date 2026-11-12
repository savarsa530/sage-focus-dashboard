// Your focus plan lives in your browser, not in this public repo.
//
// It arrives in a link: the dashboard address followed by #plan=<code>.
// Browsers never send the part after # to the server, so GitHub never
// sees the plan. The dashboard reads it, keeps it in localStorage, and
// takes it back out of the address bar.
//
// <code> is "z." + base64url(deflate-raw(JSON)), or "j." + base64url(JSON).
// scripts/plan-link.mjs builds one from a plan file.

import { safeGetJSON, safeSet } from "./utils";

export const PLAN_KEY = "sage_focusplan_data_v1";

const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{1,2}:\d{2}$/;

// Keep only the fields the panel knows, as plain text.
export function cleanPlan(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.blocks)) return null;
  const blocks = raw.blocks.slice(0, 60).map((b) => {
    if (!b || typeof b !== "object" || !DATE.test(b.date) || !str(b.work, 300)) return null;
    return {
      date: b.date,
      time: TIME.test(b.time || "") ? b.time : "",
      work: str(b.work, 300),
      context: str(b.context, 500),
      steps: Array.isArray(b.steps) ? b.steps.slice(0, 12).map((s) => str(s, 400)).filter(Boolean) : [],
      doneWhen: str(b.doneWhen, 300),
      rest: b.rest === true,
    };
  }).filter((b) => b && (b.rest || b.steps.length));
  return { updated: DATE.test(raw.updated || "") ? raw.updated : "", blocks };
}

export const loadPlan = () => cleanPlan(safeGetJSON(PLAN_KEY));

function fromB64url(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function decode(code) {
  const bytes = fromB64url(code.slice(2));
  if (code.startsWith("j.")) return JSON.parse(new TextDecoder().decode(bytes));
  if (code.startsWith("z.") && typeof DecompressionStream !== "undefined") {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return JSON.parse(await new Response(stream).text());
  }
  throw new Error("unknown plan code");
}

// If the address has #plan=..., save that plan and remove it from the
// address bar. Resolves to the saved plan, or null when there was none.
export async function takePlanFromHash() {
  if (typeof location === "undefined" || !location.hash.includes("plan=")) return null;
  const params = new URLSearchParams(location.hash.slice(1));
  const code = params.get("plan");
  params.delete("plan");
  const rest = params.toString();
  history.replaceState(null, "", location.pathname + location.search + (rest ? `#${rest}` : ""));
  try {
    const plan = cleanPlan(await decode(code || ""));
    if (!plan) return null;
    safeSet(PLAN_KEY, plan);
    return plan;
  } catch {
    return null;
  }
}
