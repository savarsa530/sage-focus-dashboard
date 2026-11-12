import { useState, useEffect, useMemo } from "react";
import { LineIcon } from "./Witchy";
import { ET, dayIn } from "../tz";
import { safeGet, safeSet } from "../utils";
import { COMING_UP, UPDATED } from "../data/comingUp";

const KEY = "sage_comingup_v1";
const DAY = 86400000;

// Date keys are "YYYY-MM-DD" (Eastern). Arithmetic runs at UTC noon so it
// never trips over daylight saving.
const padKey = (k) => k.split("-").map((p, i) => (i ? p.padStart(2, "0") : p)).join("-");
const asUTC  = (k) => { const [y, m, d] = k.split("-").map(Number); return Date.UTC(y, m - 1, d, 12); };
const keyOf  = (t) => new Date(t).toISOString().slice(0, 10);
const addDays = (k, n) => keyOf(asUTC(k) + n * DAY);
const daysBetween = (a, b) => Math.round((asUTC(b) - asUTC(a)) / DAY);
const weekday = (k) => new Date(asUTC(k)).getUTCDay();          // 0 Sun … 6 Sat
const fmtDay = (k, opts) => new Intl.DateTimeFormat("en-US", { timeZone:"UTC", ...opts }).format(new Date(asUTC(k)));
const whenLabel = (n) => n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`;

const TAGS = { light:"Light", stacked:"Stacked", crunch:"Crunch" };

function useToday() {
  const [key, setKey] = useState(() => padKey(dayIn(ET, new Date())));
  useEffect(() => {
    const id = setInterval(() => setKey(padKey(dayIn(ET, new Date()))), 60000);
    return () => clearInterval(id);
  }, []);
  return key;
}

// How each kind of item looks: a tinted block with a coloured edge.
function kindStyles(theme) {
  const due  = theme.rose;
  const prep = theme.breakColor || theme.primary;
  return {
    due:     { label:"Due",        swatch:due,  block:{ background:`${due}26`,  borderLeft:`3px solid ${due}` } },
    prep:    { label:"Prep block", swatch:prep, block:{ background:`${prep}24`, borderLeft:`3px solid ${prep}` } },
    meeting: { label:"Meeting",    swatch:theme.textMuted, block:{ background:"transparent", border:`1px solid ${theme.line}`, color:theme.textMuted } },
    nudge:   { label:"Reminder",   swatch:null, block:{ background:"transparent", color:theme.textMuted, fontStyle:"italic", padding:"0 0.1rem" } },
  };
}

// The work calendar: weeks as rows, weekdays as columns, every item a
// coloured block, so the heavy days and the crunch show at a glance.
export default function ComingUp({ theme, panelStyle }) {
  const today = useToday();
  const [open, setOpen] = useState(() => safeGet(KEY) !== "closed");
  const ink = theme.accentInk || theme.accent;
  const K = kindStyles(theme);

  const byDate = useMemo(() => Object.fromEntries(COMING_UP.map(d => [d.date, d])), []);
  const ahead  = useMemo(() => COMING_UP.filter(d => d.date >= today).sort((a, b) => a.date.localeCompare(b.date)), [today]);
  const last   = ahead.length ? ahead[ahead.length - 1].date : today;

  // Weeks from this Monday through the week of the last listed day.
  const weekend = ahead.some(d => [0, 6].includes(weekday(d.date)));
  const cols = weekend ? [1, 2, 3, 4, 5, 6, 0] : [1, 2, 3, 4, 5];
  const monday = addDays(today, -((weekday(today) + 6) % 7));
  const weeks = [];
  for (let w = monday; w <= last; w = addDays(w, 7)) {
    weeks.push(cols.map(c => addDays(w, (c + 6) % 7)));
  }

  const crunch = ahead.find(d => d.tag === "crunch");
  const milestones = ahead.flatMap(d => d.items.filter(i => i.milestone).map(i => ({ ...i, date:d.date })));
  const toggle = () => setOpen(v => { safeSet(KEY, v ? "closed" : "open"); return !v; });

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

  // One small square per work day ahead, coloured by how heavy it is.
  const strip = (
    <span aria-hidden="true" style={{ display:"inline-flex", gap:3, alignItems:"center" }}>
      {weeks.flat().filter(k => k >= today).map(k => {
        const d = byDate[k], n = d?.items.length || 0;
        const bg = d?.tag === "crunch" ? theme.rose
          : n >= 3 || d?.tag === "stacked" ? `${theme.brass || theme.accent}cc`
          : n ? `${theme.breakColor || theme.primary}99` : "transparent";
        return <span key={k} title={fmtDay(k, { weekday:"short", month:"short", day:"numeric" })}
          style={{ width:12, height:12, background:bg, border:`1px solid ${k === today ? theme.text : theme.line}`, ...(weekday(k) === 1 && k !== today ? { marginLeft:5 } : null) }}/>;
      })}
    </span>
  );

  const countdown = crunch
    ? (daysBetween(today, crunch.date) <= 0 ? "Crunch is today" : `Crunch ${whenLabel(daysBetween(today, crunch.date))}`)
    : null;

  // Folded: the heat strip and the crunch countdown.
  if (!open) return (
    <div id="coming-up" style={{ ...panelStyle, padding:"0.6rem 1.5rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem", flexWrap:"wrap" }}>
        {title}
        <span style={{ display:"inline-flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
          {strip}
          {countdown && <span style={{ color:theme.textMuted, fontSize:"0.92rem", fontStyle:"italic" }}>{countdown}</span>}
          {toggleBtn}
        </span>
      </div>
    </div>
  );

  const block = (it, i) => (
    <div key={i} style={{ fontSize:"0.8rem", lineHeight:1.3, padding:"0.22rem 0.4rem", color:theme.text, overflowWrap:"anywhere", ...K[it.kind || "due"]?.block }}>
      {it.time && <span style={{ fontWeight:500, marginRight:"0.3rem", whiteSpace:"nowrap" }}>{it.time}</span>}
      {it.text}
    </div>
  );

  const cell = (k) => {
    const d = byDate[k];
    const past = k < today, isToday = k === today, isCrunch = d?.tag === "crunch";
    return (
      <div key={k} className="cu-cell" data-has={d && !past ? "" : undefined} aria-current={isToday ? "date" : undefined}
        style={{
          minWidth:0, display:"flex", flexDirection:"column", gap:"0.25rem",
          padding:"0.4rem 0.45rem 0.5rem",
          background: isToday ? theme.card : isCrunch ? `${theme.rose}12` : "transparent",
          border: isCrunch ? `3px double ${theme.brass || theme.accent}` : `1px solid ${isToday ? theme.rose : theme.line}`,
          outline: isToday && isCrunch ? `1px solid ${theme.rose}` : undefined,
          opacity: past ? 0.38 : 1,
        }}>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:"0.3rem" }}>
          <span style={{ display:"inline-flex", alignItems:"baseline", gap:"0.3rem" }}>
            <span className="cu-wd" style={{ fontSize:"0.75rem", color:theme.textMuted }}>{fmtDay(k, { weekday:"short" })}</span>
            <span style={{ fontFamily:"var(--font-display)", fontSize:"1.15rem", lineHeight:1, color:isToday ? theme.rose : theme.text }}>{fmtDay(k, { day:"numeric" })}</span>
          </span>
          {isToday
            ? <span style={{ fontSize:"0.72rem", color:theme.rose, fontStyle:"italic" }}>Today</span>
            : d?.tag && <span style={{ fontSize:"0.72rem", fontStyle:"italic", color:isCrunch ? ink : theme.textMuted, display:"inline-flex", alignItems:"center", gap:"0.2rem" }}>
                {isCrunch && <LineIcon name="star" size={10}/>}{TAGS[d.tag] || d.tag}
              </span>}
        </div>
        {d?.items.map(block)}
      </div>
    );
  };

  return (
    <div id="coming-up" style={{ ...panelStyle, padding:"1rem 1.25rem 0.9rem" }}>
      <style>{`
        .cu-grid{display:grid;grid-template-columns:repeat(${cols.length},minmax(0,1fr));gap:5px;}
        .cu-head{display:grid;grid-template-columns:repeat(${cols.length},minmax(0,1fr));gap:5px;}
        .cu-cell .cu-wd{display:none;}
        @media (max-width:640px){
          .cu-grid{grid-template-columns:1fr;}
          .cu-head{display:none;}
          .cu-cell .cu-wd{display:inline;}
          .cu-cell:not([data-has]){display:none;}
        }
      `}</style>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem", marginBottom:"0.6rem" }}>
        {title}
        {toggleBtn}
      </div>
      <div id="coming-up-body">

        {(countdown || milestones.length > 0) && (
          <div style={{ display:"flex", gap:"0.45rem", flexWrap:"wrap", marginBottom:"0.7rem" }}>
            {countdown && (
              <span style={{ display:"inline-flex", alignItems:"center", gap:"0.35rem", padding:"0.2rem 0.6rem", border:`1px solid ${theme.rose}`, color:theme.text, fontSize:"0.85rem" }}>
                <LineIcon name="star" size={11} style={{ color:theme.rose }}/>{countdown}
                <span style={{ color:theme.textMuted }}>· {fmtDay(crunch.date, { weekday:"short", month:"short", day:"numeric" })}</span>
              </span>
            )}
            {milestones.map((m, i) => (
              <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:"0.35rem", padding:"0.2rem 0.6rem", border:`1px solid ${theme.line}`, color:theme.text, fontSize:"0.85rem" }}>
                {m.short || m.text}<span style={{ color:theme.textMuted, fontStyle:"italic" }}>{whenLabel(daysBetween(today, m.date))}</span>
              </span>
            ))}
          </div>
        )}

        {ahead.length === 0
          ? <div style={{ color:theme.textMuted, fontStyle:"italic", fontSize:"0.92rem" }}>Nothing listed past today.</div>
          : <>
              <div className="cu-head" aria-hidden="true" style={{ marginBottom:4 }}>
                {weeks[0].map(k => <span key={k} style={{ fontSize:"0.78rem", color:theme.textMuted, textAlign:"center", letterSpacing:"0.04em" }}>{fmtDay(k, { weekday:"short" })}</span>)}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {weeks.map((w, i) => (
                  <div key={i} className="cu-grid">
                    {w.map(cell)}
                  </div>
                ))}
              </div>
            </>}

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"0.75rem", flexWrap:"wrap", marginTop:"0.65rem", fontSize:"0.8rem", color:theme.textMuted }}>
          <span style={{ display:"inline-flex", gap:"0.8rem", flexWrap:"wrap" }}>
            {["due", "prep", "meeting"].map(k => (
              <span key={k} style={{ display:"inline-flex", alignItems:"center", gap:"0.3rem" }}>
                <span style={{ width:12, height:10, ...K[k].block, padding:0 }}/>{K[k].label}
              </span>
            ))}
            <span style={{ display:"inline-flex", alignItems:"center", gap:"0.3rem" }}>
              <span style={{ width:12, height:10, border:`3px double ${theme.brass || theme.accent}` }}/>Crunch day
            </span>
          </span>
          <span style={{ fontStyle:"italic" }}>Times are Eastern · updated {fmtDay(UPDATED, { month:"short", day:"numeric" })}</span>
        </div>
      </div>
    </div>
  );
}
