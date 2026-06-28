import { useState } from "react";
import { uuid, today, safeGetJSON, safeSet } from "../utils";

const STORE_KEY = "sage_schedule_v1";

function loadAnchors() {
  const saved = safeGetJSON(STORE_KEY);
  if (saved?.date === today()) return saved.anchors || [];
  return [];
}

function persist(anchors) {
  safeSet(STORE_KEY, { date: today(), anchors });
}

function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export default function ScheduleSidebar({ theme, onClose }) {
  const isDark = theme.isDark;
  const [anchors,  setAnchors]  = useState(loadAnchors);
  const [newTime,  setNewTime]  = useState("");
  const [newLabel, setNewLabel] = useState("");

  const commit = (updated) => {
    setAnchors(updated);
    persist(updated);
  };

  const addAnchor = () => {
    if (!newTime || !newLabel.trim()) return;
    const updated = [...anchors, { id: uuid(), time: newTime, label: newLabel.trim() }]
      .sort((a, b) => a.time.localeCompare(b.time));
    commit(updated);
    setNewTime(""); setNewLabel("");
  };

  const removeAnchor = (id) => commit(anchors.filter(a => a.id !== id));

  const inputBase = {
    background:"transparent",
    border:`1px solid ${theme.panelBorder}`,
    borderRadius:8, color:theme.text,
    fontFamily:"'Outfit', system-ui, sans-serif",
    fontSize:"0.85rem", padding:"0.4rem 0.6rem",
    outline:"none", boxSizing:"border-box", width:"100%",
  };

  return (
    <div className="schedule-sidebar" style={{
      position:"fixed", top:0, right:0, bottom:0, zIndex:500,
      background: isDark
        ? `linear-gradient(160deg, ${theme.panel} 0%, ${theme.bg}f2 100%)`
        : theme.panel,
      borderLeft:`1px solid ${theme.panelBorder}`,
      boxShadow: isDark ? `-4px 0 40px rgba(0,0,0,0.55)` : `-2px 0 20px rgba(0,0,0,0.09)`,
      display:"flex", flexDirection:"column",
      fontFamily:"'Outfit', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding:"1.4rem 1.25rem 1rem", display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:"0.58rem", letterSpacing:"0.2em", textTransform:"uppercase", color:theme.accent, fontFamily:"'DM Mono', monospace", opacity:0.85, marginBottom:"0.2rem" }}>
            today&apos;s shape
          </div>
          <div style={{ fontSize:"1.05rem", fontWeight:600, color:theme.text, letterSpacing:"-0.01em" }}>
            Schedule
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background:"none", border:`1px solid ${theme.panelBorder}`, borderRadius:8, color:theme.textMuted, cursor:"pointer", fontSize:"0.72rem", padding:"0.28rem 0.55rem", marginTop:"0.1rem" }}
        >
          ✕
        </button>
      </div>

      {/* Anchor list */}
      <div style={{ flex:1, padding:"0 1.25rem", overflowY:"auto" }}>
        {anchors.length === 0 ? (
          <div style={{ fontSize:"0.8rem", color:theme.textMuted, fontStyle:"italic", textAlign:"center", paddingTop:"1.5rem", opacity:0.55, lineHeight:1.6 }}>
            No anchors yet.<br/>Add your first time block below.
          </div>
        ) : (
          anchors.map(a => (
            <div key={a.id} style={{
              display:"flex", alignItems:"center", gap:"0.65rem",
              padding:"0.6rem 0",
              borderBottom:`1px solid ${theme.panelBorder}30`,
            }}>
              <span style={{
                fontSize:"0.7rem", fontFamily:"'DM Mono', monospace",
                color:theme.accent, minWidth:58, fontWeight:500,
              }}>
                {fmtTime(a.time)}
              </span>
              <span style={{ fontSize:"0.88rem", color:theme.text, flex:1, lineHeight:1.35 }}>
                {a.label}
              </span>
              <button
                onClick={() => removeAnchor(a.id)}
                style={{ background:"none", border:"none", color:theme.textMuted, cursor:"pointer", fontSize:"0.78rem", opacity:0.35, padding:"0 0.1rem", lineHeight:1, flexShrink:0 }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add form */}
      <div style={{ padding:"1rem 1.25rem 1.75rem", borderTop:`1px solid ${theme.panelBorder}30`, marginTop:"0.5rem" }}>
        <input
          type="time"
          value={newTime}
          onChange={e => setNewTime(e.target.value)}
          style={{ ...inputBase, fontFamily:"'DM Mono', monospace", marginBottom:"0.45rem", colorScheme: isDark ? "dark" : "light" }}
        />
        <div style={{ display:"flex", gap:"0.4rem" }}>
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addAnchor()}
            placeholder="Label…"
            style={{ ...inputBase, flex:1, width:"auto" }}
          />
          <button
            onClick={addAnchor}
            style={{
              background:theme.accent, color: isDark ? "#000" : "#fff",
              border:"none", borderRadius:8, padding:"0.4rem 0.75rem",
              fontFamily:"'Outfit', system-ui, sans-serif",
              fontWeight:700, fontSize:"0.85rem", cursor:"pointer",
              letterSpacing:"0.03em", flexShrink:0,
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
