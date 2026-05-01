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
        background: isDark ? "#1a1428" : "#f8f3f0",
        border:`1px solid ${isDark ? "#3d2f5a" : "#c9b8d8"}`,
        borderRadius:20,
        boxShadow: isDark
          ? "0 0 60px rgba(192,132,252,0.12), 0 4px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 0 60px rgba(139,92,246,0.1), 0 8px 40px rgba(80,30,100,0.18)",
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
