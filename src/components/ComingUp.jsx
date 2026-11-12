import { useState, useEffect, useMemo } from "react";
import { LineIcon } from "./Witchy";
import { ET, dayIn } from "../tz";
import { safeGet, safeSet } from "../utils";
import { COMING_UP, UPDATED } from "../data/comingUp";

const KEY = "sage_comingup_v1";
const SHOWN = 4;   // days shown before "Show all"

// "2026-11-3" (from dayIn) → "2026-11-03", so keys compare as text.
const padKey = (k) => k.split("-").map((p, i) => (i ? p.padStart(2, "0") : p)).join("-");
const asUTC  = (k) => { const [y, m, d] = k.split("-").map(Number); return Date.UTC(y, m - 1, d, 12); };
const daysBetween = (a, b) => Math.round((asUTC(b) - asUTC(a)) / 86400000);
const fmtDay = (k, opts) => new Intl.DateTimeFormat("en-US", { timeZone:"UTC", ...opts }).format(new Date(asUTC(k)));

const whenLabel = (n) => n === 0 ? "Today" : n === 1 ? "Tomorrow" : `in ${n} days`;
const TAGS = { light:"Light day", stacked:"Stacked", crunch:"Crunch" };

function useToday() {
  const [key, setKey] = useState(() => padKey(dayIn(ET, new Date())));
  useEffect(() => {
    const id = setInterval(() => setKey(padKey(dayIn(ET, new Date()))), 60000);
    return () => clearInterval(id);
  }, []);
  return key;
}

// Upcoming work deliverables from src/data/comingUp.js. Past days hide
// themselves; today is marked; the crunch days carry a brass rule.
export default function ComingUp({ theme, panelStyle }) {
  const today = useToday();
  const [open, setOpen] = useState(() => safeGet(KEY) !== "closed");
  const [all, setAll]   = useState(false);
  const ink = theme.accentInk || theme.accent;

  const days = useMemo(
    () => COMING_UP.filter(d => d.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
    [today]
  );
  const toggle = () => setOpen(v => { safeSet(KEY, v ? "closed" : "open"); return !v; });
  const updated = fmtDay(UPDATED, { month:"short", day:"numeric" });
  const crunchAhead = days.filter(d => d.tag === "crunch");

  const toggleBtn = (
    <button onClick={toggle} aria-expanded={open} aria-controls="coming-up-body"
      style={{ background:"none", border:`1px solid ${theme.line}`, color:ink, cursor:"pointer", padding:"0.25rem 0.6rem", fontSize:"0.88rem", display:"inline-flex", alignItems:"center", gap:"0.35rem" }}>
      {open ? "Minimize" : "Show"}<span aria-hidden="true" style={{ fontSize:"0.7rem" }}>{open ? "▲" : "▼"}</span>
    </button>
  );
  const title = (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"0.45rem", fontFamily:"var(--font-display)", fontSize:"1.25rem", color:theme.text }}>
      <LineIcon name="calendar" size={16} style={{ color:ink }}/>Coming up
    </span>
  );

  // Folded: the next thing, and how far off the crunch is.
  if (!open) {
    const next = days[0];
    const n = next ? daysBetween(today, next.date) : 0;
    const c = crunchAhead[0];
    const cn = c ? daysBetween(today, c.date) : 0;
    return (
      <div id="coming-up" style={{ ...panelStyle, padding:"0.6rem 1.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem", flexWrap:"wrap" }}>
          {title}
          <span style={{ display:"inline-flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap", minWidth:0 }}>
            <span style={{ color:theme.textMuted, fontSize:"0.95rem" }}>
              {next
                ? <>{whenLabel(n)}: {next.items[0]?.text}{c && cn > 0 && <span style={{ fontStyle:"italic" }}> · crunch {whenLabel(cn)}</span>}</>
                : "Nothing listed"}
            </span>
            {toggleBtn}
          </span>
        </div>
      </div>
    );
  }

  const shown = all ? days : days.slice(0, SHOWN);

  const dayCard = (d) => {
    const n = daysBetween(today, d.date);
    const isToday = n === 0, crunch = d.tag === "crunch";
    return (
      <div key={d.date} aria-current={isToday ? "date" : undefined}
        style={{
          background: isToday ? theme.card : "transparent",
          border:`1px solid ${isToday ? theme.rose : theme.line}`,
          borderLeft: crunch ? `4px double ${theme.brass || theme.accent}` : undefined,
          padding:"0.55rem 0.8rem 0.6rem", minWidth:0,
        }}>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:"0.5rem", flexWrap:"wrap", marginBottom:"0.25rem" }}>
          <span style={{ fontFamily:"var(--font-display)", fontSize:"1.08rem", color:theme.text }}>
            {fmtDay(d.date, { weekday:"short", month:"short", day:"numeric" })}
          </span>
          <span style={{ fontSize:"0.8rem", fontStyle:"italic", color: isToday ? theme.rose : theme.textMuted, display:"inline-flex", alignItems:"center", gap:"0.3rem" }}>
            {d.tag && (
              <span style={{ color: crunch ? ink : theme.textMuted, display:"inline-flex", alignItems:"center", gap:"0.25rem" }}>
                {crunch && <LineIcon name="star" size={11}/>}{TAGS[d.tag] || d.tag}
              </span>
            )}
            {d.tag && <span aria-hidden="true">·</span>}
            <span style={{ fontWeight: isToday ? 500 : 400 }}>{whenLabel(n)}</span>
          </span>
        </div>
        <ul style={{ listStyle:"none", margin:0, padding:0, display:"flex", flexDirection:"column", gap:"0.15rem" }}>
          {d.items.map((it, i) => (
            <li key={i} style={{ fontSize:"0.92rem", lineHeight:1.35, color:theme.text }}>
              {it.time && <span style={{ color:ink, marginRight:"0.4rem", whiteSpace:"nowrap" }}>{it.time}</span>}
              {it.text}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div id="coming-up" style={{ ...panelStyle, padding:"1rem 1.5rem 0.9rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem", marginBottom:"0.6rem" }}>
        {title}
        {toggleBtn}
      </div>
      <div id="coming-up-body">
        {days.length === 0
          ? <div style={{ color:theme.textMuted, fontStyle:"italic", fontSize:"0.92rem" }}>Nothing listed past today.</div>
          : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(250px, 1fr))", gap:"0.55rem" }}>
              {shown.map(dayCard)}
            </div>}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"0.75rem", flexWrap:"wrap", marginTop:"0.6rem", fontSize:"0.82rem", color:theme.textMuted, fontStyle:"italic" }}>
          <span>Updated {updated}</span>
          {days.length > SHOWN && (
            <button onClick={() => setAll(v => !v)} aria-expanded={all}
              style={{ background:"none", border:"none", padding:0, cursor:"pointer", color:ink, fontStyle:"italic", fontSize:"0.85rem" }}>
              {all ? "Show fewer" : `Show all (${days.length - SHOWN} more)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
