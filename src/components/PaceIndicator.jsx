export default function PaceIndicator({ sessionsToday, consecutiveSkips, sessionTimestamps, accent, textMuted, isDark }) {
  const now = Date.now();
  const recentSessions = sessionTimestamps.filter(t => now - t < 90 * 60 * 1000).length;

  let signal = null;
  let signalColor = accent;

  if (consecutiveSkips >= 4 || (recentSessions >= 4 && consecutiveSkips >= 2)) {
    signal = { icon:"🍂", text:"Deep in it. Your body may need you soon.", intensity:"warm" };
    signalColor = "#f97316";
  } else if (consecutiveSkips === 3 || recentSessions >= 4) {
    signal = { icon:"🌾", text:"Good momentum. Consider a stretch.", intensity:"gentle" };
    signalColor = "#fbbf24";
  } else if (consecutiveSkips === 2) {
    signal = { icon:"🌿", text:"Flow state or push? Either is valid.", intensity:"neutral" };
    signalColor = accent;
  } else if (sessionsToday >= 6) {
    signal = { icon:"✦", text:"A full day of tending. Honor that.", intensity:"affirm" };
    signalColor = accent;
  }

  if (!signal) return null;

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:"0.5rem",
      background: isDark ? `${signalColor}10` : `${signalColor}12`,
      border:`1px solid ${signalColor}30`,
      borderRadius:12, padding:"0.4rem 0.8rem",
      marginTop:"0.6rem",
    }}>
      <span style={{ fontSize:"0.85rem" }}>{signal.icon}</span>
      <span style={{
        fontFamily:"'Outfit', system-ui, sans-serif",
        fontSize:"0.82rem", fontStyle:"italic",
        color: isDark ? "#c4b5f8" : "#5b3f8a",
        lineHeight:1.3,
      }}>
        {signal.text}
      </span>
    </div>
  );
}
