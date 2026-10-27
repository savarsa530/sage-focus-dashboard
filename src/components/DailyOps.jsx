import { useState, useEffect } from "react";
import { uuid, today, safeGet, safeGetJSON, safeSet } from "../utils";

const DEFAULT_TEMPLATE = [
  "Email scan",
  "Calendar review",
  "Jira PO review",
  "Sprint progress check",
  "Standup prep",
];

const TEMPLATE_KEY = "sage_daily_ops_v1";
const DATE_KEY     = "sage_daily_ops_date_v1";
const STATE_KEY    = "sage_daily_ops_state_v1";

function loadTemplate() {
  const saved = safeGetJSON(TEMPLATE_KEY);
  return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_TEMPLATE;
}

function saveTemplate(template) {
  safeSet(TEMPLATE_KEY, template);
}

export default function DailyOps({ theme, panelStyle, btnStyle, inpStyle, onTouched, highlight = false }) {
  const isDark = theme.isDark;
  const [collapsed, setCollapsed] = useState(false);
  const [newItem,   setNewItem]   = useState("");

  const [items, setItems] = useState(() => {
    if (safeGet(DATE_KEY) === today()) {
      const state = safeGetJSON(STATE_KEY);
      if (state?.date === today() && Array.isArray(state.items)) return state.items;
    }
    const fresh = loadTemplate().map(text => ({ id: uuid(), text, checked: false }));
    safeSet(DATE_KEY, today());
    safeSet(STATE_KEY, { date: today(), items: fresh });
    return fresh;
  });

  // Signal parent if ops already touched on load
  useEffect(() => {
    if (items.some(i => i.checked)) onTouched?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (updated) => {
    setItems(updated);
    safeSet(STATE_KEY, { date: today(), items: updated });
  };

  const toggleItem = (id) => {
    const updated = items.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
    persist(updated);
    if (updated.find(i => i.id === id).checked) onTouched?.();
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    const text = newItem.trim();
    const updated = [...items, { id: uuid(), text, checked: false }];
    const template = loadTemplate();
    if (!template.includes(text)) saveTemplate([...template, text]);
    persist(updated);
    setNewItem("");
  };

  const removeItem = (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const template = loadTemplate().filter(t => t !== item.text);
    saveTemplate(template);
    persist(items.filter(i => i.id !== id));
  };

  const checked = items.filter(i => i.checked).length;
  const allDone = items.length > 0 && checked === items.length;

  return (
    <div style={{ ...panelStyle, marginBottom:"0.75rem", transition:"box-shadow 0.4s ease", ...(highlight ? { boxShadow:`0 0 0 2px ${theme.accent}, 0 0 24px ${theme.accent}40` } : {}) }}>
      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: collapsed ? 0 : "0.9rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.55rem" }}>
          <span style={{ fontSize:"0.65rem", letterSpacing:"0.16em", textTransform:"uppercase", color:theme.textMuted, fontFamily:"var(--font-caps)" }}>
            Daily Ops
          </span>
          {items.length > 0 && (
            <span style={{
              fontSize:"0.65rem", fontFamily:"var(--font-caps)", fontWeight:700,
              color: allDone ? "#4ade80" : theme.accent,
            }}>
              {checked}/{items.length}
            </span>
          )}
          {allDone && (
            <span style={{ fontSize:"0.72rem", color:"#4ade80" }}>✓</span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(p => !p)}
          style={{ background:"none", border:"none", color:theme.textMuted, cursor:"pointer", fontSize:"0.72rem", padding:"0 0.25rem", lineHeight:1 }}
        >
          {collapsed ? "▼" : "▲"}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Checklist */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.45rem", marginBottom:"0.8rem" }}>
            {items.map(item => (
              <div key={item.id} style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
                <button
                  onClick={() => toggleItem(item.id)}
                  style={{
                    width:17, height:17, borderRadius:5, flexShrink:0,
                    background: item.checked ? theme.accent : "transparent",
                    border:`1.5px solid ${item.checked ? theme.accent : theme.panelBorder}`,
                    cursor:"pointer", padding:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all 0.15s",
                  }}
                >
                  {item.checked && (
                    <span style={{ color: isDark ? "#000" : "#fff", fontSize:"0.62rem", lineHeight:1, fontWeight:700 }}>✓</span>
                  )}
                </button>
                <span style={{
                  fontSize:"0.88rem", flex:1,
                  fontFamily:"var(--font-body)",
                  color: item.checked ? theme.textMuted : theme.text,
                  textDecoration: item.checked ? "line-through" : "none",
                  opacity: item.checked ? 0.5 : 1,
                  transition:"all 0.15s",
                }}>
                  {item.text}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{ background:"none", border:"none", color:theme.textMuted, cursor:"pointer", fontSize:"0.72rem", opacity:0.35, padding:"0 0.2rem", lineHeight:1 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add item */}
          <div style={{ display:"flex", gap:"0.4rem" }}>
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addItem()}
              placeholder="Add op…"
              style={{ ...inpStyle, fontSize:"0.82rem", flex:1 }}
            />
            <button
              style={{ ...btnStyle(false), padding:"0.4rem 0.75rem", fontSize:"0.82rem" }}
              onClick={addItem}
            >
              +
            </button>
          </div>
        </>
      )}
    </div>
  );
}
