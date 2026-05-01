export default function IntentionChip({ intention, accent, textMuted, isDark, onEdit }) {
  if (!intention) return null;
  return (
    <div
      onClick={onEdit}
      title="Click to edit today's intention"
      style={{
        display:"flex", alignItems:"center", gap:"0.4rem",
        background: isDark ? "rgba(192,132,252,0.08)" : "rgba(139,92,246,0.07)",
        border:`1px solid ${accent}30`,
        borderRadius:20, padding:"0.25rem 0.75rem",
        cursor:"pointer", maxWidth:280,
        transition:"all 0.2s",
      }}
    >
      <span style={{ fontSize:"0.65rem", color:accent, opacity:0.7 }}>✦</span>
      <span style={{
        fontFamily:"'Cormorant Garamond', Georgia, serif",
        fontSize:"0.82rem", fontStyle:"italic",
        color: isDark ? "#c4b5f8" : "#5b3f8a",
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        flex:1,
      }}>
        {intention}
      </span>
      <span style={{ fontSize:"0.58rem", color:textMuted, opacity:0.5 }}>✎</span>
    </div>
  );
}
