import Garden from "./Garden";
import { Emblem, LineIcon, OrnateCorners } from "./Witchy";
import { loadLedger, dayKey } from "../utils";
import { fmtClock, nowMins, fmtSpan, eveningsThisMonth, loadCloses } from "../workday";

// What the page becomes once the workday is closed: the work folds away,
// and what's left is what the day bought and what's growing.
export default function EveningFace({ theme, plan, closedAt, garden, onGardenChange, onReopen, tasksDoneToday, panelStyle }) {
  const ink = theme.accentInk || theme.accent;
  const ledger = loadLedger();
  const today = Object.values(ledger.days[dayKey()] || {});
  const focused = Math.round(today.reduce((a, r) => a + r.secs, 0) / 60);
  const evenings = eveningsThisMonth(plan, loadCloses());
  const buys = plan.buys.filter(Boolean);
  const closedLine = closedAt
    ? `Closed at ${fmtClock(nowMins(new Date(closedAt)))}.`
    : `It's ${fmtClock(nowMins())}. The work can wait until tomorrow.`;

  return (
    <>
      <div style={{ ...panelStyle, position:"relative", textAlign:"center", padding:"2rem 1.75rem 1.75rem" }}>
        <OrnateCorners color={ink}/>
        <Emblem name="moon-path" size={120} style={{ height:150 }}/>
        <div style={{ fontFamily:"var(--font-display)", fontSize:"2.2rem", lineHeight:1.1, color:theme.text, marginTop:"0.5rem" }}>The workday is closed.</div>
        <div style={{ color:theme.textMuted, fontStyle:"italic", fontSize:"1rem", marginTop:"0.3rem" }}>{closedLine}</div>

        <div className="dr-rule" style={{ width:"min(260px, 70%)", margin:"1.1rem auto", color:ink }}><LineIcon name="star" size={11}/></div>

        <div style={{ display:"flex", justifyContent:"center", gap:"2rem", flexWrap:"wrap", color:theme.text }}>
          <Fact theme={theme} value={focused ? fmtSpan(focused) : "—"} label="focused today"/>
          <Fact theme={theme} value={tasksDoneToday} label={tasksDoneToday === 1 ? "thing finished" : "things finished"}/>
          <Fact theme={theme} value={evenings} label={evenings === 1 ? "evening reclaimed this month" : "evenings reclaimed this month"}/>
        </div>

        {buys.length > 0 && (
          <div style={{ marginTop:"1.4rem" }}>
            <div style={{ fontStyle:"italic", color:theme.textMuted, fontSize:"0.95rem", marginBottom:"0.4rem" }}>Today's work paid for</div>
            <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"0.4rem 1.2rem" }}>
              {buys.map((b, i) => (
                <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", fontFamily:"var(--font-display)", fontSize:"1.15rem", color:theme.text }}>
                  <span style={{ color:ink, display:"inline-flex" }}><LineIcon name="sprig" size={15}/></span>{b}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop:"1.5rem" }}>
          <button onClick={onReopen} style={{ background:"none", border:"none", color:theme.textMuted, cursor:"pointer", fontStyle:"italic", fontSize:"0.92rem" }}>
            Open the work again for a bit
          </button>
        </div>
      </div>

      <div style={panelStyle}>
        <Garden theme={theme} garden={garden} onChange={onGardenChange}/>
      </div>
    </>
  );
}

function Fact({ theme, value, label }) {
  return (
    <div style={{ minWidth:110 }}>
      <div style={{ fontFamily:"var(--font-display)", fontSize:"1.9rem", lineHeight:1.05 }}>{value}</div>
      <div style={{ fontStyle:"italic", color:theme.textMuted, fontSize:"0.88rem" }}>{label}</div>
    </div>
  );
}
