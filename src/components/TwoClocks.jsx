import { useState, useEffect, useMemo } from "react";
import { LineIcon } from "./Witchy";
import { toMins } from "../workday";
import {
  ET, IST, TEAM_SHIFT, minsIn, dayIn, atZonedMins, timeIn, dateIn, zoneAbbr,
  indiaAhead, fmtAhead, meetLine,
} from "../tz";

const STEP = 15;                 // slider moves in 15-minute steps
const STEPS = (24 * 60) / STEP;  // across one Eastern day

function useNow(ms) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), ms); return () => clearInterval(id); }, [ms]);
  return now;
}

const inShift = (date) => { const m = minsIn(IST, date); return m >= TEAM_SHIFT.start && m < TEAM_SHIFT.end; };

// The small India clock in the header. Pressing it opens or folds the panel.
export function IndiaClockChip({ theme, open, onToggle }) {
  const now = useNow(5000);
  return (
    <button onClick={onToggle} aria-expanded={open} aria-controls="two-clocks" title={open ? "Fold the India clock" : "Open the India clock"}
      style={{ background:"none", border:"none", borderBottom:`1px solid ${open ? theme.rose : "transparent"}`, padding:"0 0 1px", cursor:"pointer",
        fontFamily:"var(--font-body)", fontSize:"0.9rem", fontStyle:"italic", letterSpacing:"0.04em", color:theme.textMuted }}>
      India {timeIn(IST, now)}
    </button>
  );
}

// Runs of slider steps where `test` holds, as [fromStep, toStep) pairs.
function runs(instants, test) {
  const out = []; let from = null;
  instants.forEach((d, i) => {
    if (test(d)) { if (from == null) from = i; }
    else if (from != null) { out.push([from, i]); from = null; }
  });
  if (from != null) out.push([from, instants.length]);
  return out;
}

export default function TwoClocks({ theme, plan, panelStyle, open, onToggle }) {
  const now = useNow(15000);
  const [picked, setPicked] = useState(null);   // Eastern minutes, or null to follow the clock
  const [copied, setCopied] = useState(false);
  const ink = theme.accentInk || theme.accent;
  const today = dayIn(ET, now);

  // Every step of today's Eastern day, as a real instant (DST-safe).
  const instants = useMemo(
    () => Array.from({ length: STEPS }, (_, i) => atZonedMins(ET, now, i * STEP)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today]
  );

  const at = picked == null ? now : atZonedMins(ET, now, picked);
  const step = picked == null ? Math.floor(minsIn(ET, now) / STEP) : picked / STEP;
  const nextDay = dayIn(IST, at) !== dayIn(ET, at);
  const line = meetLine(at);

  const teamRuns = useMemo(() => runs(instants, inShift), [instants]);
  const myRuns = useMemo(() => {
    const s = toMins(plan.start), e = toMins(plan.stop);
    return runs(instants, d => { const m = minsIn(ET, d); return m >= s && m < e; });
  }, [instants, plan.start, plan.stop]);

  const shiftStartET = instants.find(d => minsIn(IST, d) === TEAM_SHIFT.start);
  const shiftEndET   = teamRuns.length ? instants[teamRuns[0][1] % STEPS] : null;
  let teamNote;
  if (inShift(at)) teamNote = `The India team is on shift, until ${shiftEndET ? `${timeIn(ET, shiftEndET)} ET (11:00 PM IST)` : "11:00 PM IST"}.`;
  else teamNote = `The India team is off shift. They start at 3:00 PM IST${shiftStartET ? `, ${timeIn(ET, shiftStartET)} ET` : ""}.`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(line); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    catch { setCopied(false); }
  };

  const pct = (i) => `${(i / STEPS) * 100}%`;
  const band = (rs, color, top, label) => rs.map(([a, b]) => (
    <span key={`${label}${a}`} title={label} style={{ position:"absolute", top, height:5, left:pct(a), width:pct(b - a), background:color, opacity:0.75 }}/>
  ));

  const face = (label, tz, extra) => (
    <div style={{ flex:"1 1 150px", minWidth:0, textAlign:"center" }}>
      <div style={{ fontSize:"0.85rem", color:theme.textMuted, fontStyle:"italic" }}>{label} · {zoneAbbr(tz, at)}</div>
      <div style={{ fontFamily:"var(--font-display)", fontSize:"2.1rem", lineHeight:1.1, color:theme.text }}>{timeIn(tz, at)}</div>
      <div style={{ fontSize:"0.9rem", color:theme.textMuted }}>
        {dateIn(tz, at)}{extra}
      </div>
    </div>
  );

  const toggleBtn = (
    <button onClick={onToggle} aria-expanded={open} aria-controls="two-clocks-body"
      style={{ background:"none", border:`1px solid ${theme.line}`, color:ink, cursor:"pointer", padding:"0.25rem 0.6rem", fontSize:"0.88rem", display:"inline-flex", alignItems:"center", gap:"0.35rem" }}>
      {open ? "Minimize" : "Show"}<span aria-hidden="true" style={{ fontSize:"0.7rem" }}>{open ? "▲" : "▼"}</span>
    </button>
  );
  const title = (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"0.45rem", fontFamily:"var(--font-display)", fontSize:"1.25rem", color:theme.text }}>
      <LineIcon name="crescent" size={15} style={{ color:ink }}/>Their side of the clock
    </span>
  );

  // Folded: one line with the live times, and the way back in.
  if (!open) return (
    <div id="two-clocks" style={{ ...panelStyle, padding:"0.6rem 1.5rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem", flexWrap:"wrap" }}>
        {title}
        <span style={{ display:"inline-flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
          <span style={{ color:theme.textMuted, fontSize:"0.95rem" }}>{meetLine(now)}</span>
          {toggleBtn}
        </span>
      </div>
    </div>
  );

  return (
    <div id="two-clocks" style={{ ...panelStyle, padding:"1rem 1.5rem 1.1rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem", marginBottom:"0.5rem" }}>
        {title}
        <span style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem" }}>
          {picked != null && (
            <button onClick={() => setPicked(null)} style={{ background:"none", border:`1px solid ${theme.line}`, color:ink, cursor:"pointer", padding:"0.25rem 0.6rem", fontSize:"0.88rem" }}>Now</button>
          )}
          {toggleBtn}
        </span>
      </div>
      <div id="two-clocks-body">

      <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap", alignItems:"flex-end" }}>
        {face("Eastern", ET)}
        {face("India", IST, nextDay && <span style={{ color:theme.rose, fontStyle:"italic" }}> · next day</span>)}
      </div>

      <div style={{ textAlign:"center", color:theme.textMuted, fontSize:"0.9rem", marginTop:"0.35rem" }}>
        India is {fmtAhead(indiaAhead(at))} ahead. {teamNote}
      </div>

      <div style={{ margin:"0.85rem 0 0", padding:"0 2px" }}>
        <div aria-hidden="true" style={{ position:"relative", height:12, margin:"0 8px" }}>
          {band(teamRuns, theme.breakColor || theme.primary, 0, "India team on shift")}
          {band(myRuns, theme.brass || theme.accent, 7, "Your workday")}
        </div>
        <input type="range" min={0} max={STEPS - 1} step={1} value={step}
          onChange={e => setPicked(Number(e.target.value) * STEP)}
          aria-label="Pick a time" aria-valuetext={line}
          style={{ width:"100%", accentColor:theme.brass || theme.accent, cursor:"pointer", margin:"2px 0 0" }}/>
        <div aria-hidden="true" style={{ display:"flex", justifyContent:"space-between", margin:"0 4px", fontSize:"0.8rem", color:theme.textMuted }}>
          {["12 AM", "6 AM", "12 PM", "6 PM", "12 AM"].map((t, i) => <span key={i}>{t}</span>)}
        </div>
        <div style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap", marginTop:"0.3rem", fontSize:"0.82rem", color:theme.textMuted, fontStyle:"italic" }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:"0.35rem" }}><span style={{ width:14, height:5, background:theme.breakColor || theme.primary, opacity:0.75 }}/>India team on shift</span>
          <span style={{ display:"inline-flex", alignItems:"center", gap:"0.35rem" }}><span style={{ width:14, height:5, background:theme.brass || theme.accent, opacity:0.75 }}/>Your workday</span>
          <span>Times along the line are Eastern.</span>
        </div>
      </div>

      <div style={{ display:"flex", gap:"0.5rem", justifyContent:"center", alignItems:"center", flexWrap:"wrap", marginTop:"0.8rem" }}>
        <span style={{ border:`1px solid ${theme.line}`, background:theme.card, color:theme.text, padding:"0.4rem 0.8rem", fontSize:"1rem", userSelect:"all" }}>{line}</span>
        <button onClick={copy} style={{ background:"transparent", border:`1px solid ${theme.line}`, color:ink, cursor:"pointer", padding:"0.4rem 0.8rem", fontSize:"0.9rem" }}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      </div>
    </div>
  );
}
