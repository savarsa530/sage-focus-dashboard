import { SOUND_DEFS } from "../constants";

export default function SoundscapePanel({ theme, activeSounds, soundVol, onToggle, onVolumeChange, panelStyle }) {
  return (
    <div style={{ ...panelStyle, display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
      <span style={{ fontSize:"0.62rem", fontWeight:600, color:theme.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", minWidth:60, fontFamily:"'DM Mono', monospace" }}>Ambience</span>
      <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", flex:1 }}>
        {Object.entries(SOUND_DEFS).map(([key, def]) => {
          const on = !!activeSounds[key];
          return (
            <button key={key} onClick={() => onToggle(key)} style={{
              padding:"0.35rem 0.85rem", borderRadius:20, fontSize:"0.82rem", fontWeight:600, cursor:"pointer",
              fontFamily:"'Outfit', system-ui, sans-serif", letterSpacing:"0.03em",
              background: on ? `${def.color}22` : "transparent",
              border: `1px solid ${on ? def.color : theme.panelBorder}`,
              color: on ? def.color : theme.textMuted,
              boxShadow: on ? `0 0 16px ${def.color}55, inset 0 0 8px ${def.color}18` : "none",
              transition:"all 0.25s",
            }}>
              {def.label}
            </button>
          );
        })}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
        <span style={{ fontSize:"0.62rem", color:theme.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"'DM Mono', monospace" }}>Vol</span>
        <input type="range" min={0} max={1} step={0.05} value={soundVol} onChange={e => onVolumeChange(Number(e.target.value))} style={{ width:72, accentColor:theme.accent }}/>
      </div>
    </div>
  );
}
