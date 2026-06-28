import { useState } from "react";
import { PI_READINESS_CYCLES, READINESS_BUCKETS, READINESS_TOTAL } from "../constants";
import { safeGetJSON, safeSet } from "../utils";

const readinessKey = (pi) => "sage_readiness_" + pi.replace(".", "_");

export default function PIReadiness({ theme }) {
  const isDark = theme.isDark;
  const [selectedPi, setSelectedPi] = useState("2026.2");
  const [data, setData] = useState(() => {
    const loaded = {};
    PI_READINESS_CYCLES.forEach(pi => {
      loaded[pi] = safeGetJSON(readinessKey(pi), {}) || {};
    });
    return loaded;
  });
  const [openBuckets, setOpenBuckets] = useState(() =>
    Object.fromEntries(READINESS_BUCKETS.map(b => [b.id, true]))
  );

  const piData = data[selectedPi] || {};
  const getStatus = (itemId) => piData[itemId]?.status || "none";
  const getNote   = (itemId) => piData[itemId]?.note   || "";

  const setStatus = (itemId, status) => {
    setData(prev => {
      const updated = { ...prev, [selectedPi]: { ...prev[selectedPi], [itemId]: { ...prev[selectedPi]?.[itemId], status } } };
      safeSet(readinessKey(selectedPi), updated[selectedPi]);
      return updated;
    });
  };

  const setNote = (itemId, note) => {
    setData(prev => {
      const updated = { ...prev, [selectedPi]: { ...prev[selectedPi], [itemId]: { ...prev[selectedPi]?.[itemId], note } } };
      safeSet(readinessKey(selectedPi), updated[selectedPi]);
      return updated;
    });
  };

  const resetPi = () => {
    setData(prev => {
      const updated = { ...prev, [selectedPi]: {} };
      safeSet(readinessKey(selectedPi), {});
      return updated;
    });
  };

  const toggleBucket = (id) => setOpenBuckets(p => ({ ...p, [id]: !p[id] }));

  const allItems = READINESS_BUCKETS.flatMap(b => b.items);
  const doneCount    = allItems.filter(i => getStatus(i.id) === "yes").length;
  const partialCount = allItems.filter(i => getStatus(i.id) === "partial").length;
  const noCount      = allItems.filter(i => getStatus(i.id) === "no").length;
  const pct = Math.round(((doneCount + partialCount * 0.5) / READINESS_TOTAL) * 100);

  const statusBtnStyle = (btnStatus, currentStatus) => ({
    fontSize: "0.68rem", padding: "0.18rem 0.55rem", borderRadius: 999,
    border: `1px solid ${
      currentStatus === btnStatus
        ? btnStatus === "yes" ? "#4ade80" : btnStatus === "partial" ? "#fbbf24" : "#f87171"
        : isDark ? "#3d2f5a" : "#c9b8d8"
    }`,
    background: currentStatus === btnStatus
      ? btnStatus === "yes" ? "#4ade8025" : btnStatus === "partial" ? "#fbbf2425" : "#f8717125"
      : "transparent",
    color: currentStatus === btnStatus
      ? btnStatus === "yes" ? "#4ade80" : btnStatus === "partial" ? "#fbbf24" : "#f87171"
      : theme.textMuted,
    cursor: "pointer",
    fontFamily: "'Outfit', system-ui, sans-serif",
    whiteSpace: "nowrap", transition: "all 0.12s",
  });

  return (
    <div style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:"0.5rem" }}>
        <div>
          <div style={{ fontSize:"0.62rem", fontWeight:600, color:theme.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"'DM Mono', monospace" }}>PI Readiness</div>
          <div style={{ fontSize:"0.82rem", color:theme.textMuted, fontStyle:"italic", marginTop:2 }}>Preflight checklist — how ready are we?</div>
        </div>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
          <select
            value={selectedPi}
            onChange={e => setSelectedPi(e.target.value)}
            style={{ background:theme.panel, color:theme.text, border:`1px solid ${theme.panelBorder}`, borderRadius:8, padding:"5px 9px", fontFamily:"'Outfit', system-ui, sans-serif", fontSize:"0.88rem", outline:"none" }}
          >
            {PI_READINESS_CYCLES.map(pi => <option key={pi} value={pi}>PI {pi}</option>)}
          </select>
          <button
            onClick={resetPi}
            style={{ background:"transparent", border:`1px solid ${theme.panelBorder}`, borderRadius:8, padding:"5px 10px", color:theme.textMuted, fontFamily:"'Outfit', system-ui, sans-serif", fontSize:"0.82rem", cursor:"pointer" }}
          >
            Reset PI
          </button>
        </div>
      </div>

      <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <div style={{ flex:1, background:theme.panel, border:`1px solid ${theme.panelBorder}`, borderRadius:12, padding:"0.75rem 1rem", textAlign:"center", minWidth:80 }}>
          <div style={{ fontSize:"1.5rem", fontWeight:600, color:theme.accent }}>{pct}%</div>
          <div style={{ fontSize:"0.65rem", color:theme.textMuted, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'DM Mono', monospace" }}>Ready</div>
        </div>
        {[
          { label:"Done",        val:doneCount,    color:"#4ade80" },
          { label:"Partial",     val:partialCount, color:"#fbbf24" },
          { label:"Not started", val:noCount,       color:theme.textMuted },
        ].map(m => (
          <div key={m.label} style={{ flex:1, background:theme.panel, border:`1px solid ${theme.panelBorder}`, borderRadius:12, padding:"0.75rem 1rem", textAlign:"center", minWidth:70 }}>
            <div style={{ fontSize:"1.5rem", fontWeight:600, color:m.color }}>{m.val}</div>
            <div style={{ fontSize:"0.65rem", color:theme.textMuted, textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'DM Mono', monospace" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {READINESS_BUCKETS.map(bucket => {
        const isOpen = openBuckets[bucket.id];
        const bucketItems = bucket.items;
        const bucketDone    = bucketItems.filter(i => getStatus(i.id) === "yes").length;
        const bucketPartial = bucketItems.filter(i => getStatus(i.id) === "partial").length;
        const bucketPct = Math.round(((bucketDone + bucketPartial * 0.5) / bucketItems.length) * 100);

        return (
          <div key={bucket.id} style={{ border:`1px solid ${theme.panelBorder}`, borderRadius:12, marginBottom:"0.65rem", overflow:"hidden" }}>
            <div onClick={() => toggleBucket(bucket.id)} style={{ display:"flex", alignItems:"center", gap:"0.65rem", padding:"0.7rem 1rem", cursor:"pointer", background:theme.panel, userSelect:"none" }}>
              <span style={{ flex:1, fontSize:"0.88rem", fontWeight:600, color:theme.text }}>{bucket.label}</span>
              <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
                <div style={{ width:60, height:4, background:isDark?"#2a2440":"#e5ddef", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ width:`${bucketPct}%`, height:"100%", background:bucket.color, borderRadius:2, transition:"width 0.3s" }}/>
                </div>
                <span style={{ fontSize:"0.65rem", color:theme.textMuted, fontFamily:"'DM Mono', monospace", minWidth:28 }}>{bucketPct}%</span>
              </div>
              <span style={{ color:theme.textMuted, fontSize:"0.75rem", transform:isOpen?"rotate(180deg)":"none", transition:"transform 0.2s" }}>▼</span>
            </div>

            {isOpen && (
              <div style={{ borderTop:`1px solid ${theme.panelBorder}` }}>
                {bucketItems.map((item, idx) => {
                  const status = getStatus(item.id);
                  const note   = getNote(item.id);
                  return (
                    <div key={item.id} style={{
                      display:"flex", alignItems:"flex-start", gap:"0.75rem", padding:"0.75rem 1rem",
                      borderBottom: idx < bucketItems.length - 1 ? `1px solid ${theme.panelBorder}` : "none",
                      background: status === "yes" ? `${bucket.color}08` : status === "partial" ? "#fbbf2408" : "transparent",
                    }}>
                      <div style={{ display:"flex", flexDirection:"column", gap:"0.2rem", paddingTop:"0.1rem", flexShrink:0 }}>
                        {["yes","partial","no"].map(s => (
                          <button key={s} style={statusBtnStyle(s, status)} onClick={() => setStatus(item.id, status === s ? "none" : s)}>
                            {s === "yes" ? "Done" : s === "partial" ? "Partial" : "No"}
                          </button>
                        ))}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:"0.9rem", fontWeight:600, color:theme.text, marginBottom:"0.15rem" }}>{item.label}</div>
                        <div style={{ fontSize:"0.78rem", color:theme.textMuted, fontStyle:"italic", marginBottom:"0.4rem", lineHeight:1.4 }}>{item.sub}</div>
                        <textarea
                          rows={1}
                          placeholder="Add a note…"
                          value={note}
                          onChange={e => setNote(item.id, e.target.value)}
                          style={{
                            width:"100%", boxSizing:"border-box", background:"transparent",
                            border:`1px solid ${theme.panelBorder}`, borderRadius:6, color:theme.text,
                            fontFamily:"'Outfit', system-ui, sans-serif", fontSize:"0.82rem",
                            padding:"0.3rem 0.5rem", outline:"none", resize:"vertical",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
