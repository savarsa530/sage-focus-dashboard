import { useState } from "react";
import Plant from "./Plant";
import { LineIcon } from "./Witchy";
import { SPECIES, STAGE_NAMES, BLOOM_AT, stageOf, pressBloom, plantSeed } from "../garden";

// The seed on the sill. Finished tasks and daily ops feed it; it blooms,
// you press the bloom into the herbarium, and choose the next seed.
export default function Garden({ theme, garden, onChange, compact = false }) {
  const [showHerb, setShowHerb] = useState(false);
  const { plant, pressed } = garden;
  const st = stageOf(plant.points);
  const sp = SPECIES[plant.species] || SPECIES.moonflower;
  const p = plant.points;
  const toBud = Math.max(0, 10 - p), toBloom = Math.max(0, BLOOM_AT - p);
  const ink = theme.accentInk || theme.accent;
  const bloomed = st === 6;

  const plaque = {
    fontFamily:"var(--font-caps)", textTransform:"uppercase", letterSpacing:"0.14em", fontSize:"0.74rem",
    background:`linear-gradient(180deg, ${theme.parchment} 0%, ${theme.parchmentLo} 100%)`, color:theme.parchmentInk,
    border:`2px solid ${theme.brass}`, outline:`1px solid ${theme.brassLo}`, outlineOffset:-4,
    borderRadius:10, boxShadow:theme.shadowMetal, padding:"0.5rem 1.1rem", cursor:"pointer",
  };

  return (
    <div style={{ display:"flex", gap:"1.25rem", alignItems:"center", flexWrap:"wrap" }}>
      <div style={{ flex:"none", width: compact ? 110 : 132, display:"flex", justifyContent:"center" }}>
        <Plant species={plant.species} points={p} size={compact ? 96 : 118} theme={theme}/>
      </div>

      <div style={{ flex:"1 1 200px", minWidth:0 }}>
        <div style={{ fontStyle:"italic", color:theme.textMuted, fontSize:"0.88rem" }}>On the sill</div>
        <div style={{ fontFamily:"var(--font-display)", fontSize:"1.45rem", color:theme.text, lineHeight:1.15 }}>
          {sp.name}, {STAGE_NAMES[st]}
        </div>

        {!bloomed && (
          <>
            <div style={{ color:theme.textMuted, fontSize:"0.95rem", marginTop:"0.25rem" }}>
              {p === 0 ? "Finish anything — a task or a daily op — and it sprouts."
                : toBud > 0 ? `Every finished thing adds growth. ${toBud} more to the bud.`
                : `${toBloom === 1 ? "One more" : `${toBloom} more`} to the bloom.`}
            </div>
            {/* one pip per finished thing, so each one visibly lands */}
            <div aria-label={`${p} of ${BLOOM_AT} toward the bloom`} style={{ display:"flex", gap:5, marginTop:"0.5rem" }}>
              {Array.from({ length: BLOOM_AT }, (_, i) => (
                <span key={i} className={i === p - 1 ? "pip-new" : undefined} style={{
                  width:9, height:9, borderRadius:"50%", flex:"none",
                  background: i < p ? (i >= 9 ? theme.rose : theme.brass) : "transparent",
                  border:`1px solid ${i < p ? "transparent" : theme.line}`,
                }}/>
              ))}
            </div>
          </>
        )}

        {bloomed && !plant.pressed && (
          <div style={{ marginTop:"0.5rem", display:"flex", flexDirection:"column", gap:"0.55rem", alignItems:"flex-start" }}>
            <div style={{ color:theme.text, fontSize:"0.98rem" }}>It bloomed. That's {p} finished things.</div>
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
                {pressed.slice().reverse().map((pr, i) => (
                  <div key={i} title={`${SPECIES[pr.species]?.name} · bloomed ${new Date(pr.bloomedAt).toLocaleDateString()}`} style={{ textAlign:"center", width:64 }}>
                    <Plant species={pr.species} points={BLOOM_AT} size={44} theme={theme}/>
                    <div style={{ fontSize:"0.72rem", fontStyle:"italic", color:theme.textMuted }}>{new Date(pr.bloomedAt).toLocaleDateString(undefined, { month:"short", day:"numeric" })}</div>
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
