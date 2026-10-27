import LiminalModal from "./LiminalModal";
import { LineIcon } from "./Witchy";
import { taskStage } from "../glyphs";

// After a task is checked off mid-focus: what's next?
export default function TaskSwapModal({ theme, tasks, completedCount, onSelect, onSkip }) {
  const unchecked = tasks.filter(t => !t.done);
  const pNum = (p) => ({ high:3, medium:2, low:1 }[p] || 2);
  const pLabel = (p) => ({ high:"high priority", medium:"medium priority", low:"low priority" }[p] || "");
  const ink = theme.accentInk || theme.accent;
  const fmt = (s) => s < 3600 ? `${Math.floor(s/60)}m` : `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;

  const suggested = [...unchecked].sort((a, b) => {
    const pd = pNum(b.priority) - pNum(a.priority);
    return pd !== 0 ? pd : (b.focusSecs||0) - (a.focusSecs||0);
  })[0];
  const others = unchecked.filter(t => t.id !== suggested?.id);

  const label = { fontSize:"0.88rem", fontStyle:"italic", color:theme.textMuted, marginBottom:"0.45rem" };
  const row = (t, featured) => {
    const st = taskStage(t, false);
    return (
      <button
        key={t.id}
        onClick={() => onSelect(t.id)}
        style={{
          width:"100%", textAlign:"left", cursor:"pointer",
          display:"flex", alignItems:"center", gap:"0.75rem",
          background: featured ? theme.card : "transparent",
          border:`1px solid ${featured ? theme.accent + "80" : theme.line}`,
          borderRadius:0, padding: featured ? "0.85rem 1rem" : "0.6rem 0.85rem",
          color:theme.text, transition:"background .15s",
        }}
      >
        <span title={st.label} style={{ color:ink, display:"inline-flex", flexShrink:0 }}><LineIcon name={st.icon} size={featured ? 22 : 18}/></span>
        <span style={{ flex:1, minWidth:0 }}>
          <span style={{ display:"block", fontFamily: featured ? "var(--font-display)" : "var(--font-body)", fontSize: featured ? "1.15rem" : "0.98rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {t.text}
          </span>
          {featured && (
            <span style={{ display:"block", fontSize:"0.85rem", fontStyle:"italic", color:theme.textMuted, marginTop:2 }}>
              {pLabel(t.priority)}{(t.focusSecs||0) > 0 ? ` · ${fmt(t.focusSecs)} invested` : ""}
            </span>
          )}
        </span>
        {featured && (
          <span style={{
            fontFamily:"var(--font-caps)", textTransform:"uppercase", letterSpacing:"0.14em", fontSize:"0.72rem",
            background:`linear-gradient(180deg, ${theme.velvetHi} 0%, ${theme.velvet} 100%)`, color:theme.cream,
            border:`2px solid ${theme.brass}`, borderRadius:10, boxShadow:theme.shadowMetal,
            padding:"0.35rem 0.8rem", flexShrink:0,
          }}>Focus</span>
        )}
      </button>
    );
  };

  return (
    <LiminalModal theme={theme} onClose={null} size="md">
      <div style={{ textAlign:"center", marginBottom:"1.4rem" }}>
        <div style={{ color:theme.breakColor, display:"inline-flex" }}><LineIcon name="bloom" size={30}/></div>
        <div style={{ fontStyle:"italic", color:theme.textMuted, fontSize:"0.95rem", marginTop:"0.2rem" }}>
          Bloomed. {completedCount} done so far.
        </div>
        <h2 style={{ fontFamily:"var(--font-display)", fontWeight:400, fontSize:"1.9rem", color:theme.text, lineHeight:1.15, margin:"0.5rem 0 0" }}>
          What's next?
        </h2>
        <div className="dr-rule" style={{ width:120, margin:"0.6rem auto 0", color:ink }}><LineIcon name="star" size={11}/></div>
      </div>

      {suggested && (
        <div style={{ marginBottom:"1rem" }}>
          <div style={label}>Suggested</div>
          {row(suggested, true)}
        </div>
      )}

      {others.length > 0 && (
        <div style={{ marginBottom:"1.25rem" }}>
          <div style={label}>Or choose another</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem", maxHeight:200, overflowY:"auto" }}>
            {others.map(t => row(t, false))}
          </div>
        </div>
      )}

      <div style={{ textAlign:"center" }}>
        <button onClick={onSkip} style={{ background:"transparent", border:"none", color:theme.textMuted, cursor:"pointer", fontSize:"0.95rem", fontStyle:"italic", padding:"0.25rem 0.5rem" }}>
          Not now
        </button>
      </div>
    </LiminalModal>
  );
}
