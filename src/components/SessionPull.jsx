import { useEffect, useState } from "react";
import { Emblem, LineIcon } from "./Witchy";
import { playTurn } from "../audio";

// Offered when a focus session ends. Face down until you choose to turn it;
// "Not now" costs nothing. The pull is recorded the moment it's turned.
export default function SessionPull({ theme, card, breakRunning, onReveal, onClose }) {
  const [turned, setTurned] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const isDark = theme.isDark;

  const turn = () => {
    if (turned) return;
    setTurned(true);
    playTurn(card.rare);
    onReveal?.(card);
  };

  const close = () => { setLeaving(true); setTimeout(onClose, 220); };

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if ((e.key === "Enter" || e.key === " ") && !turned) { e.preventDefault(); turn(); }
    };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turned]);

  const ink = theme.accentInk || theme.accent;
  const frame = {
    position:"absolute", inset:0, backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden",
    borderRadius:14, border:`2px solid ${theme.brass}`, boxShadow:`0 18px 40px rgba(0,0,0,.5), ${theme.shadowMetal}`,
    overflow:"hidden",
  };
  const innerRule = { position:"absolute", inset:7, border:`1px solid ${theme.brassLo}`, borderRadius:9, pointerEvents:"none" };

  return (
    <div
      role="dialog" aria-modal="true" aria-label="A card for this session"
      className={leaving ? "pull-leave" : "pull-enter"}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{
        position:"fixed", inset:0, zIndex:1000, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        gap:"1.1rem", padding:"1.5rem 16px",
        background: isDark ? "rgba(10,7,15,.62)" : "rgba(51,36,63,.55)",
        backdropFilter:"blur(2px)",
      }}
    >
      <div style={{ textAlign:"center", color: isDark ? theme.text : "#fbf7ef", textShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,.45)" }}>
        <div style={{ fontFamily:"var(--font-caps)", fontSize:"0.72rem", letterSpacing:"0.24em", textTransform:"uppercase", color: isDark ? ink : "#f1dca0", display:"inline-flex", alignItems:"center", gap:"0.5rem" }}>
          <LineIcon name="star" size={12}/>Session sealed<LineIcon name="star" size={12}/>
        </div>
        <div style={{ fontStyle:"italic", fontSize:"0.95rem", marginTop:"0.3rem", opacity:0.85 }}>
          {turned ? " " : breakRunning ? "A card, if you'd like one. Your break is already running." : "A card, if you'd like one."}
        </div>
      </div>

      {/* The card */}
      {/* Glow and entrance live on the wrapper: a filter or animated transform on the
          turning element would flatten its 3D and show the back through the face. */}
      <div className={turned ? (card.rare ? "pull-card turned rare" : "pull-card turned") : "pull-card"}>
        <button
          onClick={turn}
          aria-label={turned ? `${card.name}: ${card.line}` : "Turn the card"}
          style={{
            display:"block", width:236, height:356, padding:0, border:"none", background:"none",
            cursor: turned ? "default" : "pointer", perspective:1100, fontFamily:"var(--font-body)",
          }}
        >
        {/* Chromium won't keep 3D inside a <button> itself, so the turning happens on this div. */}
        <div className="pull-flip" style={{
          position:"relative", width:"100%", height:"100%", transformStyle:"preserve-3d",
          transform: turned ? "rotateY(180deg)" : "rotateY(0deg)",
          transition:"transform .75s cubic-bezier(.3,.7,.2,1)",
        }}>
          {/* Back */}
          <span style={{ ...frame, background:`radial-gradient(circle at 50% 46%, #241631 0%, #1d1228 45%, #130b1b 100%)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={innerRule}/>
            <span style={{ position:"absolute", top:18, left:0, right:0, display:"flex", justifyContent:"center", color:theme.brass, opacity:.8 }}><LineIcon name="star" size={14}/></span>
            <span style={{ position:"absolute", bottom:18, left:0, right:0, display:"flex", justifyContent:"center", color:theme.brass, opacity:.8 }}><LineIcon name="star" size={14}/></span>
            <Emblem name="moon-wreath" size={170} style={{ opacity:.95 }}/>
          </span>

          {/* Face */}
          <span style={{ ...frame, transform:"rotateY(180deg)", background:`linear-gradient(180deg, #221630 0%, ${theme.velvet} 55%, #1a1024 100%)`, display:"flex", flexDirection:"column", alignItems:"center", padding:"20px 18px 18px", textAlign:"center" }}>
            <span style={innerRule}/>
            <span style={{ fontSize:"0.72rem", fontStyle:"italic", color:"#c9b8d8", letterSpacing:"0.03em" }}>
              {card.rare ? "rare · " : ""}{card.kind}
            </span>
            <span style={{ flex:"0 0 150px", display:"flex", alignItems:"center", justifyContent:"center", width:"100%", marginTop:4 }}>
              <Emblem name={card.art} size={146}/>
            </span>
            <span style={{ fontFamily:"var(--font-display)", fontSize:"1.4rem", color:"#f4ebdd", lineHeight:1.1, marginTop:6 }}>{card.name}</span>
            <span style={{ width:40, height:1, background:theme.brass, opacity:.6, margin:"0.55rem 0" }}/>
            <span style={{ fontSize:"0.93rem", lineHeight:1.4, color:"#e6dcea" }}>{card.line}</span>
          </span>
        </div>
        </button>
      </div>

      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", minHeight:44 }}>
        {!turned ? (
          <>
            <button onClick={turn} style={{
              fontFamily:"var(--font-caps)", textTransform:"uppercase", letterSpacing:"0.14em", fontSize:"0.8rem",
              background:`linear-gradient(180deg, ${theme.parchment} 0%, ${theme.parchmentLo} 100%)`, color:theme.parchmentInk,
              border:`2px solid ${theme.brass}`, outline:`1px solid ${theme.brassLo}`, outlineOffset:-4,
              borderRadius:10, boxShadow:theme.shadowMetal, padding:"0.6rem 1.5rem", cursor:"pointer",
            }}>Turn the card</button>
            <button onClick={close} style={{ background:"none", border:"none", cursor:"pointer", fontStyle:"italic", fontSize:"0.95rem", color: isDark ? theme.textMuted : "#fbf7ef", textShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,.45)" }}>Not now</button>
          </>
        ) : (
          <button onClick={close} className="pull-after" style={{
            fontSize:"0.95rem", background:"transparent", color: isDark ? theme.text : "#fbf7ef",
            border:`1px solid ${isDark ? theme.line : "rgba(251,247,239,.6)"}`, borderRadius:999, padding:"0.5rem 1.4rem", cursor:"pointer",
            textShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,.45)",
          }}>Keep it · into the {breakRunning ? "break" : "quiet"}</button>
        )}
      </div>
    </div>
  );
}
