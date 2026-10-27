import { useState } from "react";
import Plant from "./Plant";
import { LineIcon } from "./Witchy";
import { SPECIES, STAGE_NAMES, stageOf, toNext, pressBloom, plantSeed } from "../garden";

// The seed on the sill. Finished tasks and daily ops feed it; it blooms,
// you press the bloom into the herbarium, and choose the next seed.
export default function Garden({ theme, garden, onChange, compact = false }) {
  const [showHerb, setShowHerb] = useState(false);
  const { plant, pressed } = garden;
  const st = stageOf(plant.points);
  const sp = SPECIES[plant.species] || SPECIES.moonflower;
  const left = toNext(plant.points);
  const ink = theme.accentInk || theme.accent;
  const bloomed = st === 6;

  const nextLabel = st === 4 ? "the bud" : st === 5 ? "the bloom" : "the next leaf";
  const plaque = {
    fontFamily:"var(--font-caps)", textTransform:"uppercase", letterSpacing:"0.14em", fontSize:"0.74rem",
    background:`linear-gradient(180deg, ${theme.parchment} 0%, ${theme.parchmentLo} 100%)`, color:theme.parchmentInk,
    border:`2px solid ${theme.brass}`, outline:`1px solid ${theme.brassLo}`, outlineOffset:-4,
    borderRadius:10, boxShadow:theme.shadowMetal, padding:"0.5rem 1.1rem", cursor:"pointer",
  };

  return (
    <div style={{ display:"flex", gap:"1.25rem", alignItems:"center", flexWrap:"wrap" }}>
      <div style={{ flex:"none", width: compact ? 110 : 132, display:"flex", justifyContent:"center" }}>
        <Plant species={plant.species} stage={st} size={compact ? 96 : 118} theme={theme}/>
      </div>

      <div style={{ flex:"1 1 200px", minWidth:0 }}>
        <div style={{ fontStyle:"italic", color:theme.textMuted, fontSize:"0.88rem" }}>On the sill</div>
        <div style={{ fontFamily:"var(--font-display)", fontSize:"1.45rem", color:theme.text, lineHeight:1.15 }}>
          {sp.name}, {STAGE_NAMES[st]}
        </div>

        {!bloomed && (
          <div style={{ color:theme.textMuted, fontSize:"0.95rem", marginTop:"0.25rem" }}>
            {left === 1 ? "One more finished task" : `${left} more finished tasks`} to {nextLabel}.
            <span style={{ fontStyle:"italic" }}> Daily ops count too.</span>
          </div>
        )}

        {bloomed && !plant.pressed && (
          <div style={{ marginTop:"0.5rem", display:"flex", flexDirection:"column", gap:"0.55rem", alignItems:"flex-start" }}>
            <div style={{ color:theme.text, fontSize:"0.98rem" }}>It bloomed. That's {plant.points} finished things.</div>
            <button style={plaque} onClick={() => onChange(pressBloom())}>Press it into the herbarium</button>
          </div>
        )}

        {bloomed && plant.pressed && (
          <div style={{ marginTop:"0.5rem" }}>
            <div style={{ color:theme.text, fontSize:"0.98rem", marginBottom:"0.45rem" }}>Pressed and kept. Choose the next seed:</div>
            <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
              {Object.entries(SPECIES).map(([k, s]) => (
                <button key={k} onClick={() => onChange(plantSeed(k))} title={s.note} style={{
                  background:"transparent", border:`1px solid ${theme.line}`, borderRadius:0, color:theme.text,
                  padding:"0.35rem 0.8rem", cursor:"pointer", fontSize:"0.92rem",
                }}>{s.name} <span style={{ fontStyle:"italic", color:theme.textMuted, fontSize:"0.82rem" }}>· {s.note}</span></button>
              ))}
            </div>
          </div>
        )}

        {pressed.length > 0 && (
          <div style={{ marginTop:"0.6rem" }}>
            <button onClick={() => setShowHerb(p => !p)} aria-expanded={showHerb} style={{ background:"none", border:"none", padding:0, cursor:"pointer", color:ink, fontStyle:"italic", fontSize:"0.9rem", display:"inline-flex", alignItems:"center", gap:"0.35rem" }}>
              <LineIcon name="bloom" size={15}/>Herbarium · {pressed.length} pressed {showHerb ? "▴" : "▾"}
            </button>
            {showHerb && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginTop:"0.4rem" }}>
                {pressed.slice().reverse().map((p, i) => (
                  <div key={i} title={`${SPECIES[p.species]?.name} · bloomed ${new Date(p.bloomedAt).toLocaleDateString()}`} style={{ textAlign:"center", width:64 }}>
                    <Plant species={p.species} stage={6} size={44} theme={theme}/>
                    <div style={{ fontSize:"0.72rem", fontStyle:"italic", color:theme.textMuted }}>{new Date(p.bloomedAt).toLocaleDateString(undefined, { month:"short", day:"numeric" })}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
