import { useState } from "react";
import LiminalModal from "./LiminalModal";
import { LineIcon } from "./Witchy";
import { SKIP_REASONS } from "../constants";

const REASON_ICON = { flow:"star", overloaded:"crystal", physical:"sprig", incomplete:"seed", other:"planchette" };

export default function SkipBreakModal({ theme, onSkip, onTakeBreak, sessionsToday, consecutiveSkips }) {
  const [reason, setReason] = useState("");
  const ink = theme.accentInk || theme.accent;
  const handleSkip = () => { if (!reason) return; onSkip(reason); };
  const overloaded = consecutiveSkips >= 2;

  return (
    <LiminalModal theme={theme} onClose={onTakeBreak} size="md">
      <div style={{ textAlign:"center", marginBottom:"1.4rem" }}>
        <div style={{ color:ink, display:"inline-flex" }}><LineIcon name="teacup" size={30}/></div>
        <div style={{ fontStyle:"italic", color:theme.textMuted, fontSize:"0.95rem", marginTop:"0.2rem" }}>
          Session complete · {sessionsToday} today
        </div>
        <h2 style={{ fontFamily:"var(--font-display)", fontWeight:400, fontSize:"1.9rem", color:theme.text, lineHeight:1.15, margin:"0.5rem 0 0" }}>
          Rest is also work.
        </h2>
        {overloaded && (
          <div style={{ fontStyle:"italic", fontSize:"0.92rem", color:theme.text, marginTop:"0.75rem", padding:"0.55rem 0.8rem", border:`1px solid ${theme.line}`, background:theme.card }}>
            That's {consecutiveSkips} breaks skipped in a row. Your roots need water too.
          </div>
        )}
        <div className="dr-rule" style={{ width:120, margin:"0.8rem auto 0", color:ink }}><LineIcon name="star" size={11}/></div>
      </div>

      <div style={{ marginBottom:"1.25rem" }}>
        <div style={{ fontSize:"0.88rem", fontStyle:"italic", color:theme.textMuted, marginBottom:"0.5rem" }}>Why skip the break?</div>
        <div role="radiogroup" aria-label="Why skip the break?" style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
          {SKIP_REASONS.map(r => {
            const on = reason === r.key;
            return (
              <button key={r.key} role="radio" aria-checked={on} onClick={() => setReason(r.key)} style={{
                display:"flex", alignItems:"center", gap:"0.65rem", textAlign:"left", cursor:"pointer",
                background: on ? theme.card : "transparent",
                border:`1px solid ${on ? theme.accent + "90" : theme.line}`,
                borderBottom: on ? `2px solid ${theme.rose}` : `1px solid ${theme.line}`,
                borderRadius:0, color: on ? theme.text : theme.textMuted,
                padding:"0.55rem 0.85rem", fontSize:"0.98rem",
              }}>
                <span style={{ color:ink, display:"inline-flex" }}><LineIcon name={REASON_ICON[r.key] || "star"} size={17}/></span>
                {r.label.replace(/^\S+\s/, "")}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center", alignItems:"center", flexWrap:"wrap" }}>
        <button onClick={onTakeBreak} style={{
          display:"inline-flex", alignItems:"center", gap:"0.5rem",
          fontFamily:"var(--font-caps)", textTransform:"uppercase", letterSpacing:"0.14em", fontSize:"0.8rem",
          background:`linear-gradient(180deg, ${theme.parchment} 0%, ${theme.parchmentLo} 100%)`, color:theme.parchmentInk,
          border:`2px solid ${theme.brass}`, outline:`1px solid ${theme.brassLo}`, outlineOffset:-4,
          borderRadius:10, boxShadow:theme.shadowMetal, padding:"0.6rem 1.4rem", cursor:"pointer",
        }}>
          <LineIcon name="teacup" size={16}/>Take the break
        </button>
        <button onClick={handleSkip} disabled={!reason} style={{
          background:"transparent", border:`1px solid ${theme.line}`, borderRadius:0,
          color: reason ? theme.accentInk : theme.textMuted, opacity: reason ? 1 : 0.5,
          padding:"0.55rem 1.1rem", fontSize:"0.95rem", cursor: reason ? "pointer" : "default",
        }}>
          Skip the break
        </button>
      </div>
    </LiminalModal>
  );
}
