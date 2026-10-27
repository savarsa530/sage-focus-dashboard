import { useState } from "react";
import LiminalModal from "./LiminalModal";
import { LineIcon } from "./Witchy";
import { dayState, fmtClock, fmtSpan, toMins } from "../workday";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// A point along the arc (quadratic curve from start to stop).
const P0 = [24, 78], P1 = [300, -6], P2 = [576, 78];
const at = (t) => [0, 1].map(k => (1-t)*(1-t)*P0[k] + 2*(1-t)*t*P1[k] + t*t*P2[k]);

export default function DayArc({ theme, plan, now, onSavePlan, onCloseDay, panelStyle, running }) {
  const [editing, setEditing] = useState(false);
  const ds = dayState(plan, now);
  const ink = theme.accentInk || theme.accent;
  const span = Math.max(1, ds.stop - ds.start);
  const aimT = Math.max(0, Math.min(1, (ds.aim - ds.start) / span));
  const [mx, my] = at(ds.pct);
  const [ax, ay] = at(aimT);
  const arcD = `M${P0} Q${P1} ${P2}`;

  // One line from her list, turning slowly through the day.
  const buys = plan.buys.filter(Boolean);
  const buy = buys.length ? buys[Math.floor(ds.now / 20) % buys.length] : null;
  // Last two hours before log-off, through to the hard stop: nudge toward wrapping up.
  const windingDown = (ds.phase === "working" && ds.toAim <= 120) || ds.phase === "wrapping";

  let headline, sub;
  if (ds.phase === "off")         { headline = "No workday today."; sub = "Nothing here is asking for you."; }
  else if (ds.phase === "before") { headline = `The workday starts at ${fmtClock(ds.start)}.`; sub = `Aim to be done by ${fmtClock(ds.aim)}.`; }
  else if (ds.phase === "working"){ headline = `${fmtSpan(ds.toAim)} until ${fmtClock(ds.aim)}`; sub = `Then you log off. ${fmtClock(ds.stop)} at the very latest.`; }
  else if (ds.phase === "wrapping"){ headline = `It's ${fmtClock(ds.now)}. You can go.`; sub = `Wrap what's in hand. The hard stop is ${fmtClock(ds.stop)}, ${fmtSpan(ds.toStop)} from now.`; }
  else                            { headline = `It's past ${fmtClock(ds.stop)}.`; sub = running ? "Let this session finish, then close the day." : "The work can wait until tomorrow."; }

  const glyph = ds.phase === "over" || ds.phase === "wrapping" ? "crescent" : "star";
  const plaque = {
    fontFamily:"var(--font-caps)", textTransform:"uppercase", letterSpacing:"0.14em", fontSize:"0.74rem",
    background:`linear-gradient(180deg, ${theme.parchment} 0%, ${theme.parchmentLo} 100%)`, color:theme.parchmentInk,
    border:`2px solid ${theme.brass}`, outline:`1px solid ${theme.brassLo}`, outlineOffset:-4,
    borderRadius:10, boxShadow:theme.shadowMetal, padding:"0.5rem 1.1rem", cursor:"pointer",
    display:"inline-flex", alignItems:"center", gap:"0.45rem",
  };

  return (
    <div style={{ ...panelStyle, padding:"1.1rem 1.5rem 1.2rem" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>
        <div style={{ minWidth:0, flex:"1 1 260px" }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:"1.5rem", lineHeight:1.15, color:theme.text }}>{headline}</div>
          <div style={{ color:theme.textMuted, fontSize:"0.95rem", marginTop:"0.15rem" }}>{sub}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", flexWrap:"wrap" }}>
          {(ds.phase === "wrapping" || ds.phase === "over") && !running && (
            <button style={plaque} onClick={onCloseDay}><LineIcon name="candle" size={15}/>Close the day</button>
          )}
          <button onClick={() => setEditing(true)} title="Your workday" aria-label="Edit your workday" style={{ background:"none", border:`1px solid ${theme.line}`, color:ink, cursor:"pointer", padding:"0.35rem 0.6rem", display:"inline-flex", alignItems:"center", gap:"0.35rem", fontSize:"0.88rem" }}>
            <LineIcon name="hourglass" size={15}/>Hours
          </button>
        </div>
      </div>

      {ds.phase !== "off" && (
        <svg viewBox="0 0 600 104" width="100%" style={{ display:"block", maxWidth:620, margin:"0.6rem auto 0", overflow:"visible" }} aria-hidden="true">
          <path d={arcD} fill="none" stroke={theme.line} strokeWidth={2} strokeDasharray="2 5" strokeLinecap="round"/>
          <path d={arcD} fill="none" stroke={theme.brass} strokeWidth={2.2} pathLength={1} strokeDasharray={`${ds.pct} 1`} strokeLinecap="round" opacity={0.9}/>
          {/* the aim */}
          <line x1={ax} y1={ay - 9} x2={ax} y2={ay + 9} stroke={theme.rose} strokeWidth={2}/>
          <text x={ax} y={ay - 14} textAnchor="middle" fill={theme.textMuted} style={{ font:"italic 13px var(--font-body)" }}>log off {fmtClock(ds.aim)}</text>
          {/* the traveller */}
          {ds.phase !== "before" && (
            <g transform={`translate(${mx} ${my})`} className={ds.phase === "working" ? "arc-glow" : ""}>
              <circle r={11} fill={theme.panel} stroke={theme.brass} strokeWidth={1.5}/>
              <g transform="translate(-8 -8) scale(0.667)" color={theme.isDark ? theme.brassHi : theme.accent}><path d={glyph === "star" ? "M12 2.5 13.6 10.4 21.5 12 13.6 13.6 12 21.5 10.4 13.6 2.5 12 10.4 10.4Z" : "M15.5 3.2A9 9 0 1 0 20.8 16 7.2 7.2 0 0 1 15.5 3.2Z"} fill="currentColor"/></g>
            </g>
          )}
          <text x={P0[0]} y={100} textAnchor="start" fill={theme.textMuted} style={{ font:"13px var(--font-body)" }}>{fmtClock(ds.start)}</text>
          <text x={P2[0]} y={100} textAnchor="end" fill={theme.textMuted} style={{ font:"13px var(--font-body)" }}>{fmtClock(ds.stop)} · hard stop</text>
        </svg>
      )}

      {windingDown ? (
        <div style={{ textAlign:"center", marginTop:"0.25rem", color:ink, fontSize:"0.95rem", fontStyle:"italic", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.45rem" }}>
          <LineIcon name="crescent" size={14}/>
          Shift what can't be done today over to tomorrow, and start wrapping up your day.
        </div>
      ) : buy && (
        <div style={{ textAlign:"center", marginTop:"0.25rem", color:theme.textMuted, fontSize:"0.95rem" }}>
          <span style={{ fontStyle:"italic" }}>This work pays for </span>
          <span style={{ color:theme.text }}>{buy}</span>
        </div>
      )}
      {!buy && (ds.phase === "before" || (ds.phase === "working" && !windingDown)) && (
        <div style={{ textAlign:"center", marginTop:"0.25rem" }}>
          <button onClick={() => setEditing(true)} style={{ background:"none", border:"none", color:ink, cursor:"pointer", fontStyle:"italic", fontSize:"0.92rem" }}>
            What does this work pay for? Add it here.
          </button>
        </div>
      )}

      {editing && <HoursModal theme={theme} plan={plan} onClose={() => setEditing(false)} onSave={(p) => { onSavePlan(p); setEditing(false); }}/>}
    </div>
  );
}

function HoursModal({ theme, plan, onClose, onSave }) {
  const [draft, setDraft] = useState({ ...plan, buys: plan.buys.length ? plan.buys : [""] });
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const valid = toMins(draft.start) < toMins(draft.aim) && toMins(draft.aim) <= toMins(draft.stop);
  const field = { background:"transparent", border:`1px solid ${theme.line}`, color:theme.text, padding:"0.4rem 0.55rem", fontSize:"0.98rem", borderRadius:0, colorScheme: theme.isDark ? "dark" : "light" };
  const label = { display:"flex", flexDirection:"column", gap:"0.25rem", fontSize:"0.88rem", fontStyle:"italic", color:theme.textMuted };

  return (
    <LiminalModal theme={theme} onClose={onClose} size="md">
      <h2 style={{ fontFamily:"var(--font-display)", fontWeight:400, fontSize:"1.7rem", color:theme.text, margin:"0 0 1rem", textAlign:"center" }}>Your workday</h2>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(110px, 1fr))", gap:"0.75rem", marginBottom:"0.9rem" }}>
        <label style={label}>Starts<input id="wd-start" type="time" value={draft.start} onChange={e => set("start", e.target.value)} style={field}/></label>
        <label style={label}>Log off by<input id="wd-aim" type="time" value={draft.aim} onChange={e => set("aim", e.target.value)} style={field}/></label>
        <label style={label}>Hard stop<input id="wd-stop" type="time" value={draft.stop} onChange={e => set("stop", e.target.value)} style={field}/></label>
      </div>

      <div style={{ ...label, marginBottom:"0.35rem" }}>Workdays</div>
      <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap", marginBottom:"1rem" }}>
        {DAY_NAMES.map((n, i) => {
          const on = draft.days.includes(i);
          return <button key={n} aria-pressed={on} onClick={() => set("days", on ? draft.days.filter(d => d !== i) : [...draft.days, i].sort())} style={{
            background: on ? theme.card : "transparent", color: on ? theme.text : theme.textMuted,
            border:`1px solid ${theme.line}`, borderBottom: on ? `2px solid ${theme.rose}` : `1px solid ${theme.line}`,
            borderRadius:0, padding:"0.3rem 0.6rem", cursor:"pointer", fontSize:"0.92rem",
          }}>{n}</button>;
        })}
      </div>

      <div style={{ ...label, marginBottom:"0.35rem" }}>What this work pays for <span>— one per line, shown through the day</span></div>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem", marginBottom:"0.5rem" }}>
        {draft.buys.map((b, i) => (
          <div key={i} style={{ display:"flex", gap:"0.35rem" }}>
            <input id={`wd-buy-${i}`} value={b} placeholder={i === 0 ? "paint and canvas, Saturdays with the girls…" : ""} onChange={e => set("buys", draft.buys.map((x, j) => j === i ? e.target.value : x))}
              style={{ ...field, flex:1, minWidth:0 }}/>
            <button aria-label="Remove" onClick={() => set("buys", draft.buys.filter((_, j) => j !== i))} style={{ background:"none", border:"none", color:theme.textMuted, cursor:"pointer", fontSize:"1rem" }}>×</button>
          </div>
        ))}
      </div>
      <button onClick={() => set("buys", [...draft.buys, ""])} style={{ background:"none", border:"none", color:theme.accentInk, cursor:"pointer", fontStyle:"italic", fontSize:"0.92rem", padding:0, marginBottom:"1.2rem" }}>+ add another</button>

      {!valid && <div style={{ color:theme.error, fontSize:"0.9rem", marginBottom:"0.6rem" }}>Log off needs to fall after the start, and on or before the hard stop.</div>}
      <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center" }}>
        <button disabled={!valid} onClick={() => onSave({ ...draft, buys: draft.buys.map(s => s.trim()).filter(Boolean) })} style={{
          fontFamily:"var(--font-caps)", textTransform:"uppercase", letterSpacing:"0.14em", fontSize:"0.78rem",
          background:`linear-gradient(180deg, ${theme.velvetHi} 0%, ${theme.velvet} 100%)`, color:theme.cream,
          border:`2px solid ${theme.brass}`, borderRadius:10, boxShadow:theme.shadowMetal, padding:"0.5rem 1.3rem", cursor: valid ? "pointer" : "default", opacity: valid ? 1 : 0.5,
        }}>Save</button>
        <button onClick={onClose} style={{ background:"transparent", border:"none", color:theme.textMuted, cursor:"pointer", fontStyle:"italic", fontSize:"0.95rem" }}>Cancel</button>
      </div>
    </LiminalModal>
  );
}
