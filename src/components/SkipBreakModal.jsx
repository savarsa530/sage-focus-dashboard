import { useState } from "react";
import LiminalModal from "./LiminalModal";
import { SKIP_REASONS } from "../constants";

export default function SkipBreakModal({ theme, onSkip, onTakeBreak, sessionsToday, consecutiveSkips }) {
  const [reason, setReason] = useState("");
  const isDark = theme.isDark;

  const handleSkip = () => { if (!reason) return; onSkip(reason); };
  const overloaded = consecutiveSkips >= 2;

  return (
    <LiminalModal theme={theme} onClose={onTakeBreak} size="md">
      <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
        <div style={{
          fontSize:"0.6rem", letterSpacing:"0.22em", textTransform:"uppercase",
          color: theme.accent, fontFamily:"'Outfit', system-ui, sans-serif",
          fontStyle:"italic", marginBottom:"0.5rem", opacity:0.85,
        }}>
          session complete — {sessionsToday} today
        </div>
        <h2 style={{
          fontFamily:"'Outfit', system-ui, sans-serif",
          fontSize:"1.6rem", fontWeight:600,
          color: isDark ? "#e8e0f8" : "#2d1854",
          letterSpacing:"-0.01em", lineHeight:1.2, margin:"0 0 0.5rem",
        }}>
          Rest is also work.
        </h2>
        {overloaded && (
          <div style={{
            fontSize:"0.8rem", color: isDark ? "#a78bfa" : "#7c3aed",
            fontFamily:"'Outfit', system-ui, sans-serif",
            fontStyle:"italic", marginTop:"0.25rem",
            background: isDark ? "rgba(167,139,250,0.08)" : "rgba(124,58,237,0.06)",
            borderRadius:8, padding:"0.5rem 0.75rem",
          }}>
            You've skipped {consecutiveSkips} breaks in a row. Your roots need water too. 🌿
          </div>
        )}
        <div style={{ width:40, height:1, background:`${theme.accent}50`, margin:"1rem auto 0" }}/>
      </div>

      <div style={{ marginBottom:"1.25rem" }}>
        <div style={{
          fontSize:"0.68rem", color:theme.textMuted, letterSpacing:"0.1em",
          textTransform:"uppercase", fontFamily:"'Outfit', system-ui, sans-serif",
          marginBottom:"0.65rem",
        }}>
          Why skip the break?
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
          {SKIP_REASONS.map(r => (
            <button
              key={r.key}
              onClick={() => setReason(r.key)}
              style={{
                background: reason === r.key ? `${theme.accent}20` : isDark ? "rgba(255,255,255,0.03)" : "rgba(80,30,120,0.03)",
                border:`1px solid ${reason === r.key ? theme.accent + "60" : isDark ? "#3d2f5a" : "#c9b8d8"}`,
                borderRadius:10, color: reason === r.key ? theme.accent : theme.text,
                padding:"0.55rem 0.9rem", textAlign:"left",
                fontFamily:"'Outfit', system-ui, sans-serif",
                fontSize:"0.95rem", cursor:"pointer", transition:"all 0.15s", letterSpacing:"0.01em",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:"0.6rem", justifyContent:"center" }}>
        <button
          onClick={onTakeBreak}
          style={{
            background: theme.accent, color: isDark ? "#000" : "#fff",
            border:"none", borderRadius:12, padding:"0.6rem 1.6rem",
            fontFamily:"'Outfit', system-ui, sans-serif",
            fontSize:"1rem", fontWeight:700, cursor:"pointer", letterSpacing:"0.03em",
          }}
        >
          🌿 Take the break
        </button>
        <button
          onClick={handleSkip}
          disabled={!reason}
          style={{
            background:"transparent",
            color: reason ? theme.textMuted : `${theme.textMuted}50`,
            border:`1px solid ${reason ? (isDark ? "#3d2f5a" : "#c9b8d8") : isDark ? "#2a2440" : "#e5ddef"}`,
            borderRadius:12, padding:"0.6rem 1.2rem",
            fontFamily:"'Outfit', system-ui, sans-serif",
            fontSize:"0.9rem", cursor: reason ? "pointer" : "default", letterSpacing:"0.03em",
          }}
        >
          Skip break
        </button>
      </div>
    </LiminalModal>
  );
}
