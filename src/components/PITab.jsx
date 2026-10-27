import { PI_CYCLES, PI_STATUSES, PI_SECTION_TYPES } from "../constants";

function FieldLabel({ children, textMuted }) {
  return (
    <div style={{ fontSize:"0.65rem", color:textMuted, fontWeight:600, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"var(--font-caps)" }}>
      {children}
    </div>
  );
}

export default function PITab({
  theme,
  piCapacity, piDependencies, piRisk,
  piExpanded, setPiExpanded,
  showAddPi, setShowAddPi,
  newCapacity, setNewCapacity,
  newDependency, setNewDependency,
  newRisk, setNewRisk,
  addPiCapacity, addPiDependency, addPiRisk,
  updatePiItem, deletePiItem,
  panelStyle, btnStyle, inpStyle,
}) {

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:"0.5rem" }}>
        <div>
          <div style={{ fontSize:"0.62rem", fontWeight:600, color:theme.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"var(--font-caps)" }}>PI Parking Lot</div>
          <div style={{ fontSize:"0.82rem", color:theme.textMuted, marginTop:2, fontStyle:"italic" }}>Capacity, dependencies, and risks across planning cycles</div>
        </div>
        <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap" }}>
          {Object.values(PI_SECTION_TYPES).map(sectionType => (
            <button
              key={sectionType.key}
              style={{ ...btnStyle(showAddPi === sectionType.key), fontSize:"0.72rem", padding:"0.35rem 0.65rem" }}
              onClick={() => setShowAddPi(showAddPi === sectionType.key ? "" : sectionType.key)}
            >
              {showAddPi === sectionType.key ? `✕ Cancel` : `+ ${sectionType.label}`}
            </button>
          ))}
        </div>
      </div>

      {/* Add Capacity Form */}
      {showAddPi === "capacity" && (
        <div style={{ background:`${PI_SECTION_TYPES.capacity.color}0d`, border:`1px solid ${PI_SECTION_TYPES.capacity.color}30`, borderRadius:12, padding:"1rem", marginBottom:"1rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.6rem", marginBottom:"0.6rem" }}>
            <div><FieldLabel textMuted={theme.textMuted}>PI Cycle</FieldLabel><select value={newCapacity.pi} onChange={e=>setNewCapacity(c=>({...c,pi:e.target.value}))} style={{ width:"100%" }}>{PI_CYCLES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div><FieldLabel textMuted={theme.textMuted}>Impact</FieldLabel><select value={newCapacity.impactLevel} onChange={e=>setNewCapacity(c=>({...c,impactLevel:e.target.value}))} style={{ width:"100%" }}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          </div>
          <div style={{ marginBottom:"0.6rem" }}><FieldLabel textMuted={theme.textMuted}>Title *</FieldLabel><input style={inpStyle} placeholder="What's the capacity constraint?" value={newCapacity.title} onChange={e=>setNewCapacity(c=>({...c,title:e.target.value}))}/></div>
          <div style={{ marginBottom:"0.6rem" }}><FieldLabel textMuted={theme.textMuted}>Notes</FieldLabel><textarea rows={2} style={inpStyle} placeholder="Details…" value={newCapacity.notes} onChange={e=>setNewCapacity(c=>({...c,notes:e.target.value}))}/></div>
          <div style={{ marginBottom:"0.75rem" }}><FieldLabel textMuted={theme.textMuted}>Owner</FieldLabel><input style={inpStyle} placeholder="Who owns this? (optional)" value={newCapacity.owner} onChange={e=>setNewCapacity(c=>({...c,owner:e.target.value}))}/></div>
          <button style={btnStyle(true)} onClick={addPiCapacity}>Add Capacity Item</button>
        </div>
      )}

      {/* Add Dependencies Form */}
      {showAddPi === "dependencies" && (
        <div style={{ background:`${PI_SECTION_TYPES.dependencies.color}0d`, border:`1px solid ${PI_SECTION_TYPES.dependencies.color}30`, borderRadius:12, padding:"1rem", marginBottom:"1rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.6rem", marginBottom:"0.6rem" }}>
            <div><FieldLabel textMuted={theme.textMuted}>PI Cycle</FieldLabel><select value={newDependency.pi} onChange={e=>setNewDependency(d=>({...d,pi:e.target.value}))} style={{ width:"100%" }}>{PI_CYCLES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div><FieldLabel textMuted={theme.textMuted}>Status</FieldLabel><select value={newDependency.status} onChange={e=>setNewDependency(d=>({...d,status:e.target.value}))} style={{ width:"100%" }}><option value="identified">Identified</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option></select></div>
          </div>
          <div style={{ marginBottom:"0.6rem" }}><FieldLabel textMuted={theme.textMuted}>Title *</FieldLabel><input style={inpStyle} placeholder="What are we dependent on?" value={newDependency.title} onChange={e=>setNewDependency(d=>({...d,title:e.target.value}))}/></div>
          <div style={{ marginBottom:"0.6rem" }}><FieldLabel textMuted={theme.textMuted}>Notes</FieldLabel><textarea rows={2} style={inpStyle} placeholder="More context…" value={newDependency.notes} onChange={e=>setNewDependency(d=>({...d,notes:e.target.value}))}/></div>
          <div style={{ marginBottom:"0.6rem" }}><FieldLabel textMuted={theme.textMuted}>Blocking Team</FieldLabel><input style={inpStyle} placeholder="Which team/system? (optional)" value={newDependency.blockingTeam} onChange={e=>setNewDependency(d=>({...d,blockingTeam:e.target.value}))}/></div>
          <div style={{ marginBottom:"0.75rem" }}><FieldLabel textMuted={theme.textMuted}>Target Resolution</FieldLabel><input style={inpStyle} placeholder="When should this resolve? (optional)" value={newDependency.targetResolution} onChange={e=>setNewDependency(d=>({...d,targetResolution:e.target.value}))}/></div>
          <button style={btnStyle(true)} onClick={addPiDependency}>Add Dependency</button>
        </div>
      )}

      {/* Add Risk Form */}
      {showAddPi === "risk" && (
        <div style={{ background:`${PI_SECTION_TYPES.risk.color}0d`, border:`1px solid ${PI_SECTION_TYPES.risk.color}30`, borderRadius:12, padding:"1rem", marginBottom:"1rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.6rem", marginBottom:"0.6rem" }}>
            <div><FieldLabel textMuted={theme.textMuted}>PI Cycle</FieldLabel><select value={newRisk.pi} onChange={e=>setNewRisk(r=>({...r,pi:e.target.value}))} style={{ width:"100%" }}>{PI_CYCLES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div><FieldLabel textMuted={theme.textMuted}>Status</FieldLabel><select value={newRisk.status} onChange={e=>setNewRisk(r=>({...r,status:e.target.value}))} style={{ width:"100%" }}>{PI_STATUSES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
          </div>
          <div style={{ marginBottom:"0.6rem" }}><FieldLabel textMuted={theme.textMuted}>Title *</FieldLabel><input style={inpStyle} placeholder="What's the risk?" value={newRisk.title} onChange={e=>setNewRisk(r=>({...r,title:e.target.value}))}/></div>
          <div style={{ marginBottom:"0.6rem" }}><FieldLabel textMuted={theme.textMuted}>Objectives</FieldLabel><textarea rows={2} style={inpStyle} placeholder="Context or mitigation strategy…" value={newRisk.objectives} onChange={e=>setNewRisk(r=>({...r,objectives:e.target.value}))}/></div>
          <div style={{ marginBottom:"0.75rem" }}><FieldLabel textMuted={theme.textMuted}>Risk Details</FieldLabel><textarea rows={2} style={inpStyle} placeholder="Details about the risk…" value={newRisk.risks} onChange={e=>setNewRisk(r=>({...r,risks:e.target.value}))}/></div>
          <button style={btnStyle(true)} onClick={addPiRisk}>Add Risk</button>
        </div>
      )}

      {/* Capacity Section */}
      {(piCapacity.length > 0 || showAddPi !== "capacity") && (
        <div style={{ marginBottom:"1.5rem" }}>
          <div style={{ fontSize:"0.78rem", fontWeight:700, color:PI_SECTION_TYPES.capacity.color, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.75rem", display:"flex", alignItems:"center", gap:"0.4rem" }}>
            <span>{PI_SECTION_TYPES.capacity.icon}</span><span>Capacity</span>
            {piCapacity.length > 0 && <span style={{ marginLeft:"auto", fontSize:"0.65rem", color:theme.textMuted, fontFamily:"var(--font-caps)" }}>({piCapacity.length})</span>}
          </div>
          {piCapacity.length === 0 ? (
            <div style={{ textAlign:"center", padding:"1.5rem", color:theme.textMuted, fontSize:"0.88rem", fontStyle:"italic", border:`1px dashed ${theme.panelBorder}`, borderRadius:10 }}>No capacity constraints yet 🌿</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {(() => {
                const grouped = {};
                piCapacity.forEach(item => { if (!grouped[item.pi]) grouped[item.pi] = []; grouped[item.pi].push(item); });
                return PI_CYCLES.map(cycle => {
                  const items = grouped[cycle] || [];
                  if (!items.length) return null;
                  return (
                    <div key={cycle}>
                      <div style={{ fontSize:"0.65rem", color:theme.textMuted, fontWeight:600, marginBottom:"0.35rem", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"var(--font-caps)" }}>PI {cycle}</div>
                      {items.map(item => {
                        const isOpen = piExpanded === item.id;
                        const impactColor = { low:"#86efac", medium:theme.accent, high:"#f87171" }[item.impactLevel];
                        return (
                          <div key={item.id} style={{ background:`${PI_SECTION_TYPES.capacity.color}08`, border:`1px solid ${theme.panelBorder}`, borderRadius:10, overflow:"hidden", marginBottom:"0.4rem" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.6rem 0.8rem", cursor:"pointer", userSelect:"none" }} onClick={() => setPiExpanded(isOpen ? null : item.id)}>
                              <span style={{ color:impactColor, fontSize:"0.68rem", fontWeight:700, fontFamily:"var(--font-caps)" }}>{item.impactLevel?.toUpperCase() || "MED"}</span>
                              <span style={{ flex:1, fontWeight:600, fontSize:"0.9rem", color:theme.text }}>{item.title}</span>
                              <span style={{ color:theme.textMuted, fontSize:"0.8rem" }}>{isOpen ? "▲" : "▼"}</span>
                              <button onClick={e => { e.stopPropagation(); deletePiItem("capacity", item.id); }} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:"0.82rem", padding:"0 4px" }}>✕</button>
                            </div>
                            {isOpen && (
                              <div style={{ padding:"0.75rem 0.8rem", borderTop:`1px solid ${theme.panelBorder}`, background:`${theme.accent}04` }}>
                                <div style={{ marginBottom:"0.5rem" }}><FieldLabel textMuted={theme.textMuted}>Impact Level</FieldLabel><select value={item.impactLevel || "medium"} onChange={e => updatePiItem("capacity", item.id, "impactLevel", e.target.value)} style={{ width:"100%" }}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                                <div style={{ marginBottom:"0.5rem" }}><FieldLabel textMuted={theme.textMuted}>Notes</FieldLabel><textarea style={inpStyle} rows={2} value={item.notes || ""} onChange={e => updatePiItem("capacity", item.id, "notes", e.target.value)} placeholder="Add details…"/></div>
                                <div><FieldLabel textMuted={theme.textMuted}>Owner</FieldLabel><input style={inpStyle} value={item.owner || ""} onChange={e => updatePiItem("capacity", item.id, "owner", e.target.value)} placeholder="Who owns this?"/></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}

      {/* Dependencies Section */}
      {(piDependencies.length > 0 || showAddPi !== "dependencies") && (
        <div style={{ marginBottom:"1.5rem" }}>
          <div style={{ fontSize:"0.78rem", fontWeight:700, color:PI_SECTION_TYPES.dependencies.color, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.75rem", display:"flex", alignItems:"center", gap:"0.4rem" }}>
            <span>{PI_SECTION_TYPES.dependencies.icon}</span><span>Dependencies</span>
            {piDependencies.length > 0 && <span style={{ marginLeft:"auto", fontSize:"0.65rem", color:theme.textMuted, fontFamily:"var(--font-caps)" }}>({piDependencies.length})</span>}
          </div>
          {piDependencies.length === 0 ? (
            <div style={{ textAlign:"center", padding:"1.5rem", color:theme.textMuted, fontSize:"0.88rem", fontStyle:"italic", border:`1px dashed ${theme.panelBorder}`, borderRadius:10 }}>No dependencies yet 🔗</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {(() => {
                const grouped = {};
                piDependencies.forEach(item => { if (!grouped[item.pi]) grouped[item.pi] = []; grouped[item.pi].push(item); });
                return PI_CYCLES.map(cycle => {
                  const items = grouped[cycle] || [];
                  if (!items.length) return null;
                  return (
                    <div key={cycle}>
                      <div style={{ fontSize:"0.65rem", color:theme.textMuted, fontWeight:600, marginBottom:"0.35rem", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"var(--font-caps)" }}>PI {cycle}</div>
                      {items.map(item => {
                        const isOpen = piExpanded === item.id;
                        const statusColor = { identified:"#fbbf24", in_progress:theme.accent, resolved:"#86efac" }[item.status];
                        return (
                          <div key={item.id} style={{ background:`${PI_SECTION_TYPES.dependencies.color}08`, border:`1px solid ${theme.panelBorder}`, borderRadius:10, overflow:"hidden", marginBottom:"0.4rem" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.6rem 0.8rem", cursor:"pointer", userSelect:"none" }} onClick={() => setPiExpanded(isOpen ? null : item.id)}>
                              <span style={{ color:statusColor, fontSize:"0.68rem", fontWeight:700, fontFamily:"var(--font-caps)" }}>{item.status?.replace(/_/g, " ").toUpperCase() || "IDENTIFIED"}</span>
                              <span style={{ flex:1, fontWeight:600, fontSize:"0.9rem", color:theme.text }}>{item.title}</span>
                              <span style={{ color:theme.textMuted, fontSize:"0.8rem" }}>{isOpen ? "▲" : "▼"}</span>
                              <button onClick={e => { e.stopPropagation(); deletePiItem("dependencies", item.id); }} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:"0.82rem", padding:"0 4px" }}>✕</button>
                            </div>
                            {isOpen && (
                              <div style={{ padding:"0.75rem 0.8rem", borderTop:`1px solid ${theme.panelBorder}`, background:`${theme.accent}04` }}>
                                <div style={{ marginBottom:"0.5rem" }}><FieldLabel textMuted={theme.textMuted}>Status</FieldLabel><select value={item.status || "identified"} onChange={e => updatePiItem("dependencies", item.id, "status", e.target.value)} style={{ width:"100%" }}><option value="identified">Identified</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option></select></div>
                                <div style={{ marginBottom:"0.5rem" }}><FieldLabel textMuted={theme.textMuted}>Notes</FieldLabel><textarea style={inpStyle} rows={2} value={item.notes || ""} onChange={e => updatePiItem("dependencies", item.id, "notes", e.target.value)} placeholder="Details…"/></div>
                                <div style={{ marginBottom:"0.5rem" }}><FieldLabel textMuted={theme.textMuted}>Blocking Team</FieldLabel><input style={inpStyle} value={item.blockingTeam || ""} onChange={e => updatePiItem("dependencies", item.id, "blockingTeam", e.target.value)} placeholder="Which team?"/></div>
                                <div><FieldLabel textMuted={theme.textMuted}>Target Resolution</FieldLabel><input style={inpStyle} value={item.targetResolution || ""} onChange={e => updatePiItem("dependencies", item.id, "targetResolution", e.target.value)} placeholder="When should this resolve?"/></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}

      {/* Risk Section */}
      {(piRisk.length > 0 || showAddPi !== "risk") && (
        <div>
          <div style={{ fontSize:"0.78rem", fontWeight:700, color:PI_SECTION_TYPES.risk.color, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.75rem", display:"flex", alignItems:"center", gap:"0.4rem" }}>
            <span>{PI_SECTION_TYPES.risk.icon}</span><span>Risk</span>
            {piRisk.length > 0 && <span style={{ marginLeft:"auto", fontSize:"0.65rem", color:theme.textMuted, fontFamily:"var(--font-caps)" }}>({piRisk.length})</span>}
          </div>
          {piRisk.length === 0 ? (
            <div style={{ textAlign:"center", padding:"1.5rem", color:theme.textMuted, fontSize:"0.88rem", fontStyle:"italic", border:`1px dashed ${theme.panelBorder}`, borderRadius:10 }}>No risks yet ⚠️</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {(() => {
                const grouped = {};
                piRisk.forEach(item => { if (!grouped[item.pi]) grouped[item.pi] = []; grouped[item.pi].push(item); });
                return PI_CYCLES.map(cycle => {
                  const items = grouped[cycle] || [];
                  if (!items.length) return null;
                  return (
                    <div key={cycle}>
                      <div style={{ fontSize:"0.65rem", color:theme.textMuted, fontWeight:600, marginBottom:"0.35rem", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"var(--font-caps)" }}>PI {cycle}</div>
                      {items.map(item => {
                        const isOpen = piExpanded === item.id;
                        return (
                          <div key={item.id} style={{ background:`${PI_SECTION_TYPES.risk.color}08`, border:`1px solid ${theme.panelBorder}`, borderRadius:10, overflow:"hidden", marginBottom:"0.4rem" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.6rem 0.8rem", cursor:"pointer", userSelect:"none" }} onClick={() => setPiExpanded(isOpen ? null : item.id)}>
                              <span style={{ flex:1, fontWeight:600, fontSize:"0.9rem", color:theme.text }}>{item.title}</span>
                              <span style={{ color:theme.textMuted, fontSize:"0.8rem" }}>{isOpen ? "▲" : "▼"}</span>
                              <button onClick={e => { e.stopPropagation(); deletePiItem("risk", item.id); }} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:"0.82rem", padding:"0 4px" }}>✕</button>
                            </div>
                            {isOpen && (
                              <div style={{ padding:"0.75rem 0.8rem", borderTop:`1px solid ${theme.panelBorder}`, background:`${theme.accent}04` }}>
                                <div style={{ marginBottom:"0.5rem" }}><FieldLabel textMuted={theme.textMuted}>Objectives</FieldLabel><textarea style={inpStyle} rows={2} value={item.objectives || ""} onChange={e => updatePiItem("risk", item.id, "objectives", e.target.value)} placeholder="Context…"/></div>
                                <div><FieldLabel textMuted={theme.textMuted}>Risk Details</FieldLabel><textarea style={inpStyle} rows={2} value={item.risks || ""} onChange={e => updatePiItem("risk", item.id, "risks", e.target.value)} placeholder="Details…"/></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
