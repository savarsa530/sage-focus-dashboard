import LiminalModal from "./LiminalModal";

export default function TaskSwapModal({ theme, tasks, completedCount, onSelect, onSkip }) {
  const isDark = theme.isDark;
  const unchecked = tasks.filter(t => !t.done);
  const pNum = (p) => ({ high:3, medium:2, low:1 }[p] || 2);
  const pColor = (p) => ({ high:"#f87171", medium:theme.accent, low:theme.textMuted }[p]);

  const suggested = [...unchecked].sort((a, b) => {
    const pd = pNum(b.priority) - pNum(a.priority);
    return pd !== 0 ? pd : (b.focusSecs||0) - (a.focusSecs||0);
  })[0];

  const others = unchecked.filter(t => t.id !== suggested?.id);

  return (
    <LiminalModal theme={theme} onClose={null} size="md">
      <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
        <div style={{
          fontSize:"0.6rem", letterSpacing:"0.22em", textTransform:"uppercase",
          color:theme.accent, fontFamily:"var(--font-body)",
          fontStyle:"italic", marginBottom:"0.5rem", opacity:0.85,
        }}>
          task complete
        </div>
        <div style={{
          display:"inline-flex", alignItems:"center", gap:"0.5rem",
          background: isDark ? `${theme.accent}14` : `${theme.accent}12`,
          border:`1px solid ${theme.accent}35`,
          borderRadius:20, padding:"0.3rem 1rem",
          fontFamily:"var(--font-body)",
          fontSize:"1rem", fontStyle:"italic",
          color: isDark ? "#c4b5f8" : "#5b3f8a",
        }}>
          <span style={{ fontSize:"0.9rem" }}>✓</span>
          <span>{completedCount} completed this session</span>
        </div>
        <h2 style={{
          fontFamily:"var(--font-body)",
          fontSize:"1.55rem", fontWeight:600,
          color: isDark ? "#e8e0f8" : "#2d1854",
          letterSpacing:"-0.01em", lineHeight:1.2, margin:"1rem 0 0",
        }}>
          What's next?
        </h2>
        <div style={{ width:40, height:1, background:`${theme.accent}50`, margin:"0.75rem auto 0" }}/>
      </div>

      {suggested && (
        <div style={{ marginBottom:"1rem" }}>
          <div style={{ fontSize:"0.6rem", color:theme.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"var(--font-caps)", marginBottom:"0.5rem" }}>
            suggested
          </div>
          <button
            onClick={() => onSelect(suggested.id)}
            style={{
              width:"100%", textAlign:"left",
              background: isDark ? `${theme.accent}14` : `${theme.accent}10`,
              border:`1.5px solid ${theme.accent}50`,
              borderRadius:12, padding:"0.85rem 1rem",
              cursor:"pointer", transition:"all 0.15s",
              display:"flex", alignItems:"center", gap:"0.75rem",
            }}
          >
            <span style={{ width:8, height:8, borderRadius:"50%", background: pColor(suggested.priority), flexShrink:0, boxShadow:`0 0 6px ${pColor(suggested.priority)}88` }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"var(--font-body)", fontSize:"1rem", fontWeight:600, color: isDark ? "#e8e0f8" : "#2d1854", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {suggested.text}
              </div>
              {(suggested.focusSecs||0) > 0 && (
                <div style={{ fontSize:"0.65rem", color:theme.accent, marginTop:2, fontFamily:"var(--font-caps)" }}>
                  ⏱ {suggested.focusSecs < 3600 ? `${Math.floor(suggested.focusSecs/60)}m` : `${Math.floor(suggested.focusSecs/3600)}h`} invested
                </div>
              )}
            </div>
            <span style={{ fontSize:"0.72rem", color: isDark ? "#000" : "#fff", background:theme.accent, borderRadius:8, padding:"0.2rem 0.6rem", flexShrink:0, fontFamily:"var(--font-body)", fontWeight:700 }}>
              Select →
            </span>
          </button>
        </div>
      )}

      {others.length > 0 && (
        <div style={{ marginBottom:"1.25rem" }}>
          <div style={{ fontSize:"0.6rem", color:theme.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"var(--font-caps)", marginBottom:"0.5rem" }}>
            or choose another
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.3rem", maxHeight:180, overflowY:"auto" }}>
            {others.map(t => (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                style={{
                  width:"100%", textAlign:"left",
                  background: isDark ? "rgba(255,255,255,0.03)" : "rgba(80,30,120,0.03)",
                  border:`1px solid ${isDark ? "#3d2f5a" : "#c9b8d8"}`,
                  borderRadius:10, padding:"0.6rem 0.85rem",
                  cursor:"pointer", display:"flex", alignItems:"center", gap:"0.65rem", transition:"all 0.12s",
                }}
              >
                <span style={{ width:6, height:6, borderRadius:"50%", background:pColor(t.priority), flexShrink:0 }}/>
                <span style={{ flex:1, fontFamily:"var(--font-body)", fontSize:"0.92rem", color: isDark ? "#c4b5f8" : "#4a2d7a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {t.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ textAlign:"center" }}>
        <button
          onClick={onSkip}
          style={{
            background:"transparent", border:"none", color:theme.textMuted, cursor:"pointer",
            fontFamily:"var(--font-body)", fontSize:"0.88rem", fontStyle:"italic",
            textDecoration:"underline dotted", padding:"0.25rem 0.5rem",
          }}
        >
          Skip for now
        </button>
      </div>
    </LiminalModal>
  );
}
