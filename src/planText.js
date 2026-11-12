// Your focus plan, as plain text you can read in an email and paste into
// the dashboard. The plan is kept in your browser, never in this public
// repo. No browser APIs here, so scripts/plan-text.mjs can use it too.
//
// The text looks like this (blank lines and extra lines are ignored):
//
//   Focus plan, updated Thu, Nov 12, 2026
//
//   Thu, Nov 12, 2026 · 12:30 PM
//   Prep for next week's review: draft the agenda
//   For: The review is next Thursday morning.
//   1. Open the shared folder and write down each file name
//   2. Skim each file once
//   Done when: The agenda is drafted
//
//   Wed, Nov 18, 2026 · 12:30 PM
//   Breather: The afternoon is busy, so this block is yours.

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const pad = (n) => String(n).padStart(2, "0");

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
  return blocks.length ? { updated: DATE.test(raw.updated || "") ? raw.updated : "", blocks } : null;
}

// "Thu, Nov 12, 2026 · 12:30 PM" (weekday, comma, "at" and time all optional)
const HEAD = /^\W*(?:[A-Za-z]{3,9},?\s+)?([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})(?:\s*(?:at|[^\w\s])?\s*(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]?\.?)?\W*$/;
function readDate(line) {
  const m = line.match(HEAD);
  if (!m) return null;
  const mo = MONTHS.findIndex((x) => x.toLowerCase() === m[1].toLowerCase());
  if (mo < 0) return null;
  let time = "";
  if (m[4]) {
    let h = Number(m[4]) % 12;
    if (/p/i.test(m[6] || "")) h += 12;
    if (!m[6] && Number(m[4]) < 12) h = Number(m[4]);
    time = `${pad(h)}:${m[5]}`;
  }
  return { date: `${m[3]}-${pad(mo + 1)}-${pad(Number(m[2]))}`, time };
}

const label = (line, word) => {
  const m = line.match(new RegExp(`^${word}\\s*:\\s*(.*)$`, "i"));
  return m ? m[1] : null;
};

// Read pasted text into a plan, or null if no blocks were found.
export function parsePlanText(text) {
  const lines = String(text || "").replace(/\r/g, "").split("\n").map((l) => l.replace(/\u00a0/g, " ").trim()).filter(Boolean);
  let updated = "";
  const blocks = [];
  let cur = null;
  let last = null;   // the field a wrapped line continues
  const add = (key, v) => { cur[key] = v; last = key; };
  for (const line of lines) {
    const upd = line.match(/^focus plan\b.*updated\s+(.*)$/i);
    if (upd) { updated = readDate(upd[1])?.date || ""; continue; }
    const when = readDate(line);
    if (when) { cur = { ...when, work:"", context:"", steps:[], doneWhen:"", rest:false }; blocks.push(cur); last = null; continue; }
    if (!cur) continue;
    let v;
    if ((v = label(line, "breather")) !== null) { cur.rest = true; add("work", v || "A breather"); }
    else if ((v = label(line, "for")) !== null) add("context", v);
    else if ((v = label(line, "done when")) !== null) add("doneWhen", v);
    else if ((v = line.match(/^(?:\d+[.)]|[-•*])\s+(.*)$/))) { cur.steps.push(v[1]); last = "step"; }
    else if (!cur.work) add("work", line);
    else if (last === "step") cur.steps[cur.steps.length - 1] += ` ${line}`;   // a wrapped line
    else if (last) cur[last] += ` ${line}`;
  }
  return cleanPlan({ updated, blocks });
}

const dayLine = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  const wd = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${wd}, ${MONTHS[m - 1]} ${d}, ${y}`;
};
const timeLine = (t) => {
  const [h, mi] = t.split(":").map(Number);
  return `${h % 12 || 12}:${pad(mi)} ${h < 12 ? "AM" : "PM"}`;
};

// The plan as the text above, for the weekly email.
export function planToText(plan) {
  const out = [`Focus plan, updated ${plan.updated ? dayLine(plan.updated) : ""}`.trim(), ""];
  for (const b of plan.blocks) {
    out.push(b.time ? `${dayLine(b.date)} · ${timeLine(b.time)}` : dayLine(b.date));
    if (b.rest) out.push(`Breather: ${b.work}`);
    else {
      out.push(b.work);
      if (b.context) out.push(`For: ${b.context}`);
      b.steps.forEach((s, i) => out.push(`${i + 1}. ${s}`));
      if (b.doneWhen) out.push(`Done when: ${b.doneWhen}`);
    }
    out.push("");
  }
  return out.join("\n").trim() + "\n";
}
