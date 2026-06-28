import LiminalModal from "./LiminalModal";

export default function MorningGate({ theme, opsTouchedToday, onChoice }) {
  const isDark = theme.isDark;
  const hour = new Date().getHours();
  const greeting = hour < 10 ? "Good morning" : hour < 12 ? "Morning" : "Hey";

  return (
    <>
      <div className="vignette"/>
      <LiminalModal theme={theme} onClose={() => onChoice("jump-in")} size="md">
      <div className="threshold-fade">
      <div style={{ textAlign:"center", marginBottom:"2rem" }}>
        <div style={{
          fontSize:"0.6rem", letterSpacing:"0.22em", textTransform:"uppercase",
          color:theme.accent, fontFamily:"'Outfit', system-ui, sans-serif",
          fontStyle:"italic", marginBottom:"0.5rem", opacity:0.85,
        }}>
          daily threshold
        </div>
        <h2 style={{
          fontFamily:"'Outfit', system-ui, sans-serif",
          fontSize:"1.65rem", fontWeight:600,
          color: isDark ? "#e8e0f8" : "#2d1854",
          letterSpacing:"-0.01em", lineHeight:1.25, margin:0,
        }}>
          {greeting}. How do you want to enter the day?
        </h2>
        <div style={{ width:40, height:1, background:`${theme.accent}50`, margin:"1rem auto 0" }}/>
      </div>

      {opsTouchedToday && (
        <div style={{
          textAlign:"center", marginBottom:"1.25rem",
          fontSize:"0.75rem", color:theme.accent,
          fontStyle:"italic", opacity:0.75,
        }}>
          ✓ Ops already underway today
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        <button
          onClick={() => onChoice("orient")}
          style={{
            background:`${theme.accent}18`,
            color: isDark ? "#e8e0f8" : "#2d1854",
            border:`1px solid ${theme.accent}50`,
            borderRadius:14, padding:"1rem 1.5rem",
            fontFamily:"'Outfit', system-ui, sans-serif",
            fontSize:"1rem", fontWeight:600, cursor:"pointer",
            letterSpacing:"0.02em", transition:"all 0.2s",
            textAlign:"left",
          }}
        >
          <div>Orient First</div>
          <div style={{ fontSize:"0.75rem", color:theme.textMuted, fontWeight:400, marginTop:"0.2rem" }}>
            Set your emotional stance before you act.
          </div>
        </button>

        <button
          onClick={() => onChoice("jump-in")}
          style={{
            background:"transparent",
            color:theme.textMuted,
            border:`1px solid ${theme.panelBorder}`,
            borderRadius:14, padding:"1rem 1.5rem",
            fontFamily:"'Outfit', system-ui, sans-serif",
            fontSize:"1rem", fontWeight:500, cursor:"pointer",
            letterSpacing:"0.02em", transition:"all 0.2s",
            textAlign:"left",
          }}
        >
          <div style={{ color: isDark ? "#e8e0f8" : "#2d1854" }}>Jump In</div>
          <div style={{ fontSize:"0.75rem", color:theme.textMuted, fontWeight:400, marginTop:"0.2rem", opacity:0.7 }}>
            Begin with momentum.
          </div>
        </button>
      </div>

      <div style={{ textAlign:"center", marginTop:"1.25rem", fontSize:"0.65rem", color:theme.textMuted, fontStyle:"italic" }}>
        Esc or clicking away counts as Jump In
      </div>
      </div>
    </LiminalModal>
    </>
  );
}
