import { useEffect } from "react";
import { FernSpiral, SeedPod } from "./Botanicals";
import { OrnateCorners } from "./Witchy";

export default function LiminalModal({ children, onClose, theme, size = "md", botanicalBorder = false }) {
  const maxW = size === "sm" ? 380 : size === "lg" ? 560 : 460;
  const isDark = theme.isDark;
  const DR = !!theme.deckRoom;

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Deck Room: a square paper panel, double-ruled, with the corner flourishes
  // the timer wears. The rounded glass panel below is the pre-6.0 look.
  const surface = DR ? {
    background: theme.panel,
    border:`3px double ${theme.line}`, borderRadius:0,
    boxShadow: isDark ? "0 24px 60px rgba(0,0,0,.6)" : "0 18px 44px rgba(51,36,63,.25)",
  } : {
    background: botanicalBorder
      ? `url('${import.meta.env.BASE_URL}assets/botanical-border.svg') center/cover no-repeat, ${isDark ? `linear-gradient(145deg, ${theme.panel} 0%, ${theme.bg}dd 100%)` : theme.panel}`
      : isDark ? `linear-gradient(145deg, ${theme.panel} 0%, ${theme.bg}dd 100%)` : theme.panel,
    border:`1px solid ${theme.panelBorder}`, borderRadius:20,
    boxShadow: isDark
      ? `0 0 80px ${theme.accent}28, 0 4px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)`
      : `0 0 60px ${theme.accent}20, 0 8px 40px rgba(0,0,0,0.12)`,
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background: isDark ? (DR ? "rgba(10,7,15,0.7)" : "rgba(8,6,18,0.88)") : (DR ? "rgba(51,36,63,0.45)" : "rgba(20,10,40,0.55)"),
      backdropFilter: DR ? "blur(2px)" : "blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"1rem",
      animation:"modalFadeIn 0.3s ease",
    }}>
      <div style={{ maxWidth:maxW, width:"100%", padding:"2rem 2.2rem", position:"relative", overflow: DR ? "visible" : "hidden", ...surface }}>
        {DR ? <OrnateCorners color={theme.accentInk}/> : <>
          <div style={{ position:"absolute", top:12, left:12, pointerEvents:"none" }}>
            <FernSpiral color={theme.accent} size={36} opacity={0.2}/>
          </div>
          <div style={{ position:"absolute", bottom:12, right:12, pointerEvents:"none", transform:"rotate(180deg)" }}>
            <FernSpiral color={theme.accent} size={30} opacity={0.15}/>
          </div>
          <div style={{ position:"absolute", top:16, right:16, pointerEvents:"none" }}>
            <SeedPod color={theme.accent} size={24} opacity={0.18}/>
          </div>
        </>}
        {children}
      </div>
    </div>
  );
}
