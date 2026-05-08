import { useState } from "react";
import { uuid } from "../utils";

const STORE_KEY = "sage_sprint_v1";

const HEALTH = [
  { key:"on-track",  label:"On Track",  color:"#4ade80" },
  { key:"watch",     label:"Watch",     color:"#f59e0b" },
  { key:"off-track", label:"Off Track", color:"#f87171" },
];

function blockerAge(addedDate) {
  return Math.floor((Date.now() - addedDate) / 86400000);
}

function calcProgress(startDate, endDate) {
  const now  = Date.now();
  const start = new Date(startDate).getTime();
  const end   = new Date(endDate).getTime();
  const total = Math.max(1, end - start);
  const totalDays  = Math.round(total / 86400000);
  const remaining  = Math.max(0, Math.ceil((end - now) / 86400000));
  const pct        = Math.min(1, Math.max(0, (now - start) / total));
  return { pct, remaining, totalDays };
}

function emptyDraft() {
  return { name:"", goal:"", startDate:"", endDate:"" };
}

export default function SprintPulse({ theme, panelStyle, btnStyle, inpStyle }) {
  const isDark = theme.isDark;

  const [sprint,     setSprint]     = useState(() => { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch { return null; } });
  const [collapsed,  setCollapsed]  = useState(false);
  const [editing,    setEditing]    = useState(false);
  const [newBlocker, setNewBlocker] = useState("");
  const [draft,      setDraft]      = useState(() =>
    sprint ? { name:sprint.name, goal:sprint.goal, startDate:sprint.startDate, endDate:sprint.endDate } : emptyDraft()
  );

  const persist = (updated) => {
    setSprint(updated);
    localStorage.setItem(STORE_KEY, JSON.stringify(updated));
  };

  const saveDraft = () => {
    if (!draft.name.trim() || !draft.startDate || !draft.endDate) return;
    persist(sprint
      ? { ...sprint, name:draft.name.trim(), goal:draft.goal.trim(), startDate:draft.startDate, endDate:draft.endDate }
      : { name:draft.name.trim(), goal:draft.goal.trim(), startDate:draft.startDate, endDate:draft.endDate, health:"on-track", blockers:[] }
    );
    setEditing(false);
  };

  const setHealth = (key)  => persist({ ...sprint, health:key });

  const addBlocker = () => {
    if (!newBlocker.trim()) return;
    persist({ ...sprint, blockers:[...sprint.blockers, { id:uuid(), text:newBlocker.trim(), addedDate:Date.now() }] });
    setNewBlocker("");
  };

  const removeBlocker = (id) => persist({ ...sprint, blockers:sprint.blockers.filter(b => b.id !== id) });

  const dateInput = { ...inpStyle, fontSize:"0.85rem", colorScheme: isDark ? "dark" : "light" };

  // ── Setup / edit form ─────────────────────────────────────────
  if (!sprint || editing) {
    const valid = draft.name.trim() && draft.startDate && draft.endDate;
    return (
      <div style={{ ...panelStyle, marginBottom:"0.75rem" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.9rem" }}>
          <span style={{ fontSize:"0.65rem", letterSpacing:"0.16em", textTransform:"uppercase", color:theme.textMuted, fontFamily:"'DM Mono', monospace" }}>
            {editing ? "Edit Sprint" : "Sprint Pulse"}
          </span>
          {editing && (
            <button onClick={() => setEditing(false)} style={{ background:"none", border:"none", color:theme.textMuted, cursor:"pointer", fontSize:"0.72rem", opacity:0.6 }}>cancel</button>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginBottom:"0.8rem" }}>
          <input
            value={draft.name} onChange={e => setDraft(p => ({ ...p, name:e.target.value }))}
            placeholder="Sprint name (e.g. Sprint 24)"
            style={{ ...inpStyle, fontSize:"0.88rem" }}
          />
          <input
            value={draft.goal} onChange={e => setDraft(p => ({ ...p, goal:e.target.value }))}
            placeholder="Sprint goal — what does done look like?"
            style={{ ...inpStyle, fontSize:"0.88rem" }}
          />
          <div style={{ display:"flex", gap:"0.5rem" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"0.6rem", color:theme.textMuted, marginBottom:"0.25rem", fontFamily:"'DM Mono', monospace", letterSpacing:"0.1em", textTransform:"uppercase" }}>Start</div>
              <input type="date" value={draft.startDate} onChange={e => setDraft(p => ({ ...p, startDate:e.target.value }))} style={{ ...dateInput, width:"100%" }}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"0.6rem", color:theme.textMuted, marginBottom:"0.25rem", fontFamily:"'DM Mono', monospace", letterSpacing:"0.1em", textTransform:"uppercase" }}>End</div>
              <input type="date" value={draft.endDate} onChange={e => setDraft(p => ({ ...p, endDate:e.target.value }))} style={{ ...dateInput, width:"100%" }}/>
            </div>
          </div>
        </div>

        <button
          onClick={saveDraft}
          disabled={!valid}
          style={{ ...btnStyle(true), opacity: valid ? 1 : 0.4, cursor: valid ? "pointer" : "default" }}
        >
          {editing ? "Save" : "Set Sprint"}
        </button>
      </div>
    );
  }

  // ── Pulse view ────────────────────────────────────────────────
  const { pct, remaining, totalDays } = calcProgress(sprint.startDate, sprint.endDate);
  const health   = HEALTH.find(h => h.key === sprint.health) || HEALTH[0];
  const blockers = sprint.blockers || [];
  const barColor = remaining === 0 ? "#f87171" : remaining <= 2 ? "#f59e0b" : theme.accent;
  const remainLabel = remaining === 0 ? "Sprint ended" : `${remaining}d left`;
  const remainColor = remaining === 0 ? "#f87171" : remaining <= 2 ? "#f59e0b" : theme.textMuted;

  return (
    <div style={{ ...panelStyle, marginBottom:"0.75rem" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: collapsed ? 0 : "0.85rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.55rem", flexWrap:"wrap" }}>
          <span style={{ fontSize:"0.65rem", letterSpacing:"0.16em", textTransform:"uppercase", color:theme.textMuted, fontFamily:"'DM Mono', monospace" }}>
            Sprint Pulse
          </span>
          <span style={{ fontSize:"0.78rem", fontWeight:600, color:theme.text }}>{sprint.name}</span>
          <span style={{ width:7, height:7, borderRadius:"50%", background:health.color, display:"inline-block", flexShrink:0, boxShadow:`0 0 7px ${health.color}80` }} title={health.label}/>
          {blockers.length > 0 && (
            <span style={{ fontSize:"0.62rem", color:"#f87171", fontFamily:"'DM Mono', monospace", fontWeight:700 }}>
              {blockers.length} blocker{blockers.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ display:"flex", gap:"0.35rem", alignItems:"center" }}>
          <button
            onClick={() => { setDraft({ name:sprint.name, goal:sprint.goal, startDate:sprint.startDate, endDate:sprint.endDate }); setEditing(true); }}
            style={{ background:"none", border:"none", color:theme.textMuted, cursor:"pointer", fontSize:"0.68rem", opacity:0.5, padding:"0 0.15rem" }}
          >
            edit
          </button>
          <button onClick={() => setCollapsed(p => !p)} style={{ background:"none", border:"none", color:theme.textMuted, cursor:"pointer", fontSize:"0.72rem", padding:"0 0.25rem", lineHeight:1 }}>
            {collapsed ? "▼" : "▲"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Goal */}
          {sprint.goal && (
            <div style={{ fontSize:"0.82rem", color:theme.text, fontStyle:"italic", marginBottom:"0.85rem", opacity:0.7, lineHeight:1.4 }}>
              ✦ {sprint.goal}
            </div>
          )}

          {/* Progress bar */}
          <div style={{ marginBottom:"0.9rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.3rem" }}>
              <span style={{ fontSize:"0.62rem", color:theme.textMuted, fontFamily:"'DM Mono', monospace" }}>{totalDays}d sprint</span>
              <span style={{ fontSize:"0.62rem", color:remainColor, fontFamily:"'DM Mono', monospace", fontWeight: remaining <= 2 ? 700 : 400 }}>{remainLabel}</span>
            </div>
            <div style={{ height:4, background:`${theme.panelBorder}50`, borderRadius:2, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${pct * 100}%`, background:barColor, borderRadius:2, transition:"width 0.4s ease" }}/>
            </div>
          </div>

          {/* Health selector */}
          <div style={{ display:"flex", gap:"0.4rem", marginBottom:"0.9rem" }}>
            {HEALTH.map(opt => (
              <button
                key={opt.key}
                onClick={() => setHealth(opt.key)}
                style={{
                  flex:1, padding:"0.35rem 0",
                  background: sprint.health === opt.key ? `${opt.color}1e` : "transparent",
                  border:`1.5px solid ${sprint.health === opt.key ? opt.color : theme.panelBorder}`,
                  borderRadius:8,
                  color: sprint.health === opt.key ? opt.color : theme.textMuted,
                  fontFamily:"'Outfit', system-ui, sans-serif",
                  fontSize:"0.72rem", fontWeight: sprint.health === opt.key ? 700 : 400,
                  cursor:"pointer", letterSpacing:"0.03em",
                  boxShadow: sprint.health === opt.key ? `0 0 10px ${opt.color}28` : "none",
                  transition:"all 0.15s",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Blockers */}
          {blockers.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.45rem", marginBottom:"0.8rem" }}>
              {blockers.map(b => {
                const age = blockerAge(b.addedDate);
                const ageColor = age >= 3 ? "#f87171" : age >= 1 ? "#f59e0b" : theme.textMuted;
                return (
                  <div key={b.id} style={{ display:"flex", alignItems:"flex-start", gap:"0.55rem" }}>
                    <span style={{ fontSize:"0.62rem", fontFamily:"'DM Mono', monospace", fontWeight:700, color:ageColor, minWidth:28, paddingTop:2, flexShrink:0 }}>
                      D{age}
                    </span>
                    <span style={{ fontSize:"0.85rem", color:theme.text, flex:1, lineHeight:1.35 }}>{b.text}</span>
                    <button onClick={() => removeBlocker(b.id)} style={{ background:"none", border:"none", color:theme.textMuted, cursor:"pointer", fontSize:"0.75rem", opacity:0.38, padding:"0 0.15rem", lineHeight:1, flexShrink:0 }}>×</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add blocker */}
          <div style={{ display:"flex", gap:"0.4rem" }}>
            <input
              value={newBlocker}
              onChange={e => setNewBlocker(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addBlocker()}
              placeholder="Log a blocker…"
              style={{ ...inpStyle, fontSize:"0.82rem", flex:1 }}
            />
            <button style={{ ...btnStyle(false), padding:"0.4rem 0.75rem", fontSize:"0.82rem" }} onClick={addBlocker}>+</button>
          </div>
        </>
      )}
    </div>
  );
}
