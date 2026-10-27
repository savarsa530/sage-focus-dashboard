import { useState } from "react";
import { loadLedger, dayKey } from "../utils";
import { Emblem, LineIcon, StarDivider } from "./Witchy";

const RANGES = [
  { key:"today", label:"Today",   days:1 },
  { key:"week",  label:"7 days",  days:7 },
  { key:"month", label:"30 days", days:30 },
  { key:"all",   label:"All time", days:null },
];

const fmtDur = (s) => {
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};

const dayLabel = (k) => {
  const [y, mo, d] = k.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString(undefined, { weekday:"long", day:"numeric", month:"long" });
};

function summarize(ledger, range) {
  const keys = Object.keys(ledger.days).sort().reverse();
  let inRange = keys;
  if (range.days) {
    const cutoff = new Date(); cutoff.setHours(0,0,0,0); cutoff.setDate(cutoff.getDate() - (range.days - 1));
    const cutKey = dayKey(cutoff);
    inRange = keys.filter(k => k >= cutKey);
  }
  const byLabel = {};
  const add = (row) => {
    const k = `${row.kind}:${row.label}`;
    byLabel[k] = byLabel[k] || { label:row.label, kind:row.kind, secs:0 };
    byLabel[k].secs += row.secs;
  };
  const perDay = inRange.map(k => {
    const rows = Object.values(ledger.days[k]);
    rows.forEach(add);
    return { key:k, secs: rows.reduce((a, r) => a + r.secs, 0), sessions: ledger.sessions[k] || 0 };
  });
  if (!range.days) Object.values(ledger.earlier || {}).forEach(add);
  const rows = Object.values(byLabel).filter(r => r.secs > 0).sort((a, b) => b.secs - a.secs);
  const total = rows.reduce((a, r) => a + r.secs, 0);
  const opsSecs = rows.filter(r => r.kind === "op").reduce((a, r) => a + r.secs, 0);
  const sessions = perDay.reduce((a, d) => a + d.sessions, 0);
  const earlierSecs = !range.days ? Object.values(ledger.earlier || {}).reduce((a, r) => a + r.secs, 0) : 0;
  return { rows, total, opsSecs, sessions, perDay, earlierSecs };
}

const capsStyle = (theme) => ({ fontFamily:"var(--font-caps)", textTransform:"uppercase", letterSpacing:"0.22em", fontSize:"0.62rem", color:theme.textMuted });

function Stat({ theme, label, value, caption }) {
  const DR = !!theme.deckRoom;
  return (
    <div style={{ flex:"1 1 140px", padding:"0.9rem 1rem", border: DR ? `3px double ${theme.line}` : `1px solid ${theme.panelBorder}`, borderRadius: DR ? 0 : 12, background: DR ? theme.card : "transparent" }}>
      <div style={capsStyle(theme)}>{label}</div>
      <div style={{ fontFamily:"var(--font-display)", fontSize:"2.1rem", lineHeight:1.05, color:theme.text }}>{value}</div>
      {caption && <div style={{ fontStyle:"italic", color:theme.textMuted, fontSize:"0.82rem" }}>{caption}</div>}
    </div>
  );
}

export default function LedgerTab({ theme, panelStyle, pillStyle }) {
  const DR = !!theme.deckRoom;
  const [rangeKey, setRangeKey] = useState("today");
  const range = RANGES.find(r => r.key === rangeKey);
  const ledger = loadLedger();
  const s = summarize(ledger, range);
  const ink = theme.accentInk || theme.accent;

  const caps = capsStyle(theme);

  return (
    <div style={panelStyle}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem", flexWrap:"wrap", marginBottom:"1rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
          {DR && <Emblem name="lantern" size={40}/>}
          <div>
            <div style={{ ...caps, color:ink }}>The ledger</div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:"1.35rem", color:theme.text }}>Where the time went</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap" }}>
          {RANGES.map(r => <button key={r.key} style={pillStyle(rangeKey === r.key)} onClick={() => setRangeKey(r.key)}>{r.label}</button>)}
        </div>
      </div>

      {s.total === 0 ? (
        <div style={{ textAlign:"center", padding:"1.5rem 0", display:"flex", flexDirection:"column", alignItems:"center", gap:"0.6rem" }}>
          {DR && <Emblem name="crystal-bundle" size={64}/>}
          <div style={{ fontFamily:"var(--font-display)", fontSize:"1.25rem", color:theme.text }}>The ledger is quiet</div>
          <div style={{ fontStyle:"italic", color:theme.textMuted, fontSize:"0.88rem" }}>Focus on a task or a daily op and the time lands here.</div>
        </div>
      ) : (
        <>
          <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", marginBottom:"1.25rem" }}>
            <Stat theme={theme} label="Focused" value={fmtDur(s.total)} caption={`${s.rows.length} thing${s.rows.length !== 1 ? "s" : ""}`}/>
            <Stat theme={theme} label="Sessions" value={s.sessions} caption={range.days === 1 ? "completed today" : "completed"}/>
            <Stat theme={theme} label="Daily ops" value={fmtDur(s.opsSecs)} caption={`${Math.round(100 * s.opsSecs / s.total)}% of the time`}/>
          </div>

          {DR ? <StarDivider color={ink} width={80} style={{ margin:"0 0 1rem" }}/> : null}

          <div style={{ display:"flex", flexDirection:"column" }}>
            {s.rows.map(r => {
              const pct = r.secs / s.total;
              return (
                <div key={`${r.kind}:${r.label}`} style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) auto", alignItems:"center", gap:"0.25rem 0.75rem", padding:"0.6rem 0", borderBottom:`1px solid ${DR ? theme.line : theme.panelBorder}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", minWidth:0 }}>
                    {DR && <span style={{ color:ink }}><LineIcon name={r.kind === "op" ? "candle" : "cards"} size={15}/></span>}
                    <span style={{ fontFamily:"var(--font-display)", fontSize:"1.02rem", color:theme.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.label}</span>
                    {r.kind === "op" && <span style={{ ...caps, fontSize:"0.55rem" }}>daily op</span>}
                  </div>
                  <span style={{ fontFamily:"var(--font-display)", color:theme.text }}>{fmtDur(r.secs)} <span style={{ fontStyle:"italic", color:theme.textMuted, fontSize:"0.85rem" }}>· {Math.round(pct * 100)}%</span></span>
                  <div style={{ gridColumn:"1 / -1", height:3, background: DR ? theme.line : `${theme.panelBorder}`, overflow:"hidden" }}>
                    <div style={{ width:`${Math.max(2, pct * 100)}%`, height:"100%", background: theme.accent }}/>
                  </div>
                </div>
              );
            })}
          </div>

          {range.days !== 1 && s.perDay.length > 0 && (
            <div style={{ marginTop:"1.25rem" }}>
              <div style={{ ...caps, marginBottom:"0.4rem" }}>By day</div>
              {s.perDay.filter(d => d.secs > 0).map(d => (
                <div key={d.key} style={{ display:"flex", justifyContent:"space-between", gap:"0.75rem", padding:"0.35rem 0", borderBottom:`1px solid ${DR ? theme.line : theme.panelBorder}`, fontSize:"0.9rem" }}>
                  <span style={{ fontStyle:"italic", color:theme.textMuted }}>{dayLabel(d.key)}</span>
                  <span style={{ fontFamily:"var(--font-display)", color:theme.text }}>{fmtDur(d.secs)} · {d.sessions} session{d.sessions !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          )}

          {s.earlierSecs > 0 && (
            <div style={{ marginTop:"0.9rem", fontStyle:"italic", color:theme.textMuted, fontSize:"0.8rem" }}>
              Includes {fmtDur(s.earlierSecs)} logged before the ledger began, which has no dates.
            </div>
          )}
        </>
      )}
    </div>
  );
}
