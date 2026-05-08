import { useEffect } from "react";
import { FernSpiral, SeedPod } from "./Botanicals";

export default function LiminalModal({ children, onClose, theme, size = "md" }) {
  const maxW = size === "sm" ? 380 : size === "lg" ? 560 : 460;
  const isDark = theme.isDark;

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background: isDark ? "rgba(8,6,18,0.88)" : "rgba(20,10,40,0.55)",
      backdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"1rem",
      animation:"modalFadeIn 0.3s ease",
    }}>
      <div style={{
        maxWidth:maxW, width:"100%",
        background: isDark
          ? `linear-gradient(145deg, ${theme.panel} 0%, ${theme.bg}dd 100%)`
          : theme.panel,
        border:`1px solid ${isDark ? theme.panelBorder : theme.panelBorder}`,
        borderRadius:20,
        boxShadow: isDark
          ? `0 0 80px ${theme.accent}28, 0 4px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)`
          : `0 0 60px ${theme.accent}20, 0 8px 40px rgba(0,0,0,0.12)`,
        padding:"2rem 2.2rem",
        position:"relative",
        overflow:"hidden",
      }}>
        <div style={{ position:"absolute", top:12, left:12, pointerEvents:"none" }}>
          <FernSpiral color={theme.accent} size={36} opacity={0.2}/>
        </div>
        <div style={{ position:"absolute", bottom:12, right:12, pointerEvents:"none", transform:"rotate(180deg)" }}>
          <FernSpiral color={theme.accent} size={30} opacity={0.15}/>
        </div>
        <div style={{ position:"absolute", top:16, right:16, pointerEvents:"none" }}>
          <SeedPod color={theme.accent} size={24} opacity={0.18}/>
        </div>
        {children}
      </div>
    </div>
  );
}
