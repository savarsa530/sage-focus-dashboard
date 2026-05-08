import { useState } from "react";
import LiminalModal from "./LiminalModal";

export default function IntentionModal({ theme, onSet, existing }) {
  const [text, setText] = useState(existing || "");
  const isDark = theme.isDark;

  const handleSet = () => { if (!text.trim()) return; onSet(text.trim()); };
  const handleSkip = () => onSet("");

  return (
    <LiminalModal theme={theme} onClose={handleSkip} size="md" botanicalBorder>
      <div className="intention-animate">
      <div style={{ textAlign:"center", marginBottom:"1.75rem" }}>
        <div style={{
          fontSize:"0.6rem", letterSpacing:"0.22em", textTransform:"uppercase",
          color: theme.accent, fontFamily:"'Outfit', system-ui, sans-serif",
          fontStyle:"italic", marginBottom:"0.5rem", opacity:0.85,
        }}>
          morning field note
        </div>
        <h2 style={{
          fontFamily:"'Outfit', system-ui, sans-serif",
          fontSize:"1.7rem", fontWeight:600,
          color: isDark ? "#e8e0f8" : "#2d1854",
          letterSpacing:"-0.01em", lineHeight:1.2, margin:0,
        }}>
          What are you tending today?
        </h2>
        <div style={{ width:40, height:1, background:`${theme.accent}50`, margin:"1rem auto 0" }}/>
      </div>

      <p className="intention-prompt" style={{ color:theme.textMuted, fontFamily:"'Outfit', system-ui, sans-serif" }}>What quality do you want to embody for this cycle?</p>
      <textarea
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="A thought, a feeling, an intention for this day…"
        rows={3}
        onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSet(); }}
        style={{
          width:"100%", boxSizing:"border-box",
          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(80,30,120,0.04)",
          border:`1px solid ${isDark ? "#3d2f5a" : "#c9b8d8"}`,
          borderRadius:12, color: isDark ? "#e8e0f8" : "#2d1854",
          fontFamily:"'Outfit', system-ui, sans-serif",
          fontSize:"1rem", lineHeight:1.65,
          padding:"0.9rem 1.1rem",
          outline:"none", resize:"vertical",
          marginBottom:"1.25rem",
        }}
      />

      <div style={{ display:"flex", gap:"0.6rem", justifyContent:"center" }}>
        <button
          onClick={handleSet}
          disabled={!text.trim()}
          style={{
            background: text.trim() ? theme.accent : `${theme.accent}40`,
            color: text.trim() ? (isDark ? "#000" : "#fff") : theme.textMuted,
            border:"none", borderRadius:12, padding:"0.6rem 1.8rem",
            fontFamily:"'Outfit', system-ui, sans-serif",
            fontSize:"1rem", fontWeight:700, cursor: text.trim() ? "pointer" : "default",
            letterSpacing:"0.03em", transition:"all 0.2s",
          }}
        >
          Set Intention
        </button>
        <button
          onClick={handleSkip}
          style={{
            background:"transparent", color: theme.textMuted,
            border:`1px solid ${isDark ? "#3d2f5a" : "#c9b8d8"}`,
            borderRadius:12, padding:"0.6rem 1.2rem",
            fontFamily:"'Outfit', system-ui, sans-serif",
            fontSize:"0.9rem", cursor:"pointer", letterSpacing:"0.03em",
          }}
        >
          Begin without one
        </button>
      </div>

      <div style={{ textAlign:"center", marginTop:"1rem", fontSize:"0.68rem", color:theme.textMuted, fontFamily:"'Outfit', system-ui, sans-serif", fontStyle:"italic" }}>
        ⌘↵ to set · Esc to skip
      </div>
      </div>
    </LiminalModal>
  );
}
