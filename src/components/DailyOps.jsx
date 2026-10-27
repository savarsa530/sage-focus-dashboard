import { useState } from "react";
import { uuid, today, safeGet, safeGetJSON, safeSet } from "../utils";
import { LineIcon } from "./Witchy";
import { opIcon } from "../glyphs";

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

// Daily ops are starter tasks: a fresh checklist each day, and any op can be
// focused, which pops it into the task list so its time is tracked.
export default function DailyOps({ theme, panelStyle, btnStyle, pillStyle, inpStyle, tasks = [], focusedTaskId, onFocusOp, onToggleLinked }) {
  const DR = !!theme.deckRoom;
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

  const persist = (updated) => {
    setItems(updated);
    safeSet(STATE_KEY, { date: today(), items: updated });
  };

  const linkedTask = (item) => tasks.find(t => t.opId === item.id);
  const isChecked  = (item) => { const t = linkedTask(item); return t ? t.done : item.checked; };

  const toggleItem = (id) => {
    const item = items.find(i => i.id === id);
    const next = !isChecked(item);
    persist(items.map(i => i.id === id ? { ...i, checked: next } : i));
    const t = linkedTask(item);
    if (t && t.done !== next) onToggleLinked?.(t.id);   // keep the popped-in task in step
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

  const checked = items.filter(isChecked).length;
  const fmtMins = (s) => s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s/60)}m` : `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;
  const allDone = items.length > 0 && checked === items.length;

  return (
    <div style={{ ...panelStyle, marginBottom:"0.75rem" }}>
      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: collapsed ? 0 : "0.9rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.55rem" }}>
          <span style={{ fontSize:"0.85rem", letterSpacing:"0.01em", color:theme.textMuted, fontFamily:"var(--font-body)", display:"inline-flex", alignItems:"center", gap:"0.4rem" }}>
            {DR && <LineIcon name="candle" size={14} style={{ color:theme.accentInk }}/>}Daily Ops
          </span>
          {items.length > 0 && (
            <span style={{
              fontSize:"0.85rem", fontFamily:"var(--font-body)", fontWeight:500,
              color: allDone ? (theme.breakColor || "#4ade80") : theme.accent,
            }}>
              {checked}/{items.length}
            </span>
          )}
          {allDone && (
            <span style={{ fontSize:"0.72rem", color:theme.breakColor || "#4ade80" }}>✓</span>
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
            {items.map(item => {
              const done    = isChecked(item);
              const linked  = linkedTask(item);
              const focused = linked && linked.id === focusedTaskId;
              return (
              <div key={item.id} style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding: DR ? "0.15rem 0" : 0 }}>
                <button
                  onClick={() => toggleItem(item.id)}
                  aria-label={done ? `Uncheck ${item.text}` : `Check ${item.text}`}
                  style={{
                    width:18, height:18, borderRadius: DR ? 2 : 5, flexShrink:0,
                    background: done ? (DR ? "transparent" : theme.accent) : "transparent",
                    border:`1.5px solid ${done ? theme.accent : (DR ? theme.accentInk : theme.panelBorder)}`,
                    cursor:"pointer", padding:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all 0.15s",
                  }}
                >
                  {done && (
                    <span style={{ color: DR ? theme.accentInk : (isDark ? "#000" : "#fff"), fontSize:"0.65rem", lineHeight:1, fontWeight:700 }}>✓</span>
                  )}
                </button>
                <span style={{
                  fontSize: DR ? "1rem" : "0.88rem", flex:1, minWidth:0,
                  fontFamily: DR ? "var(--font-display)" : "var(--font-body)",
                  color: done ? theme.textMuted : theme.text,
                  textDecoration: done ? "line-through" : "none",
                  opacity: done ? 0.5 : 1,
                  transition:"all 0.15s",
                }}>
                  {DR && <LineIcon name={opIcon(item.text)} size={17} style={{ color:theme.accentInk, marginRight:"0.5rem", opacity: done ? 0.6 : 0.9 }}/>}
                  {item.text}
                  {(linked?.focusSecs || 0) > 0 && (
                    <span style={{ marginLeft:"0.5rem", fontSize:"0.85rem", color:theme.accentInk || theme.accent, fontFamily:"var(--font-body)", letterSpacing:"0.01em", textDecoration:"none", display:"inline-block" }}>
                      {fmtMins(linked.focusSecs)}
                    </span>
                  )}
                </span>
                {!done && (
                  <button
                    onClick={() => onFocusOp?.(item)}
                    title={focused ? "Unfocus" : "Focus on this op — it joins your task list"}
                    style={{ ...pillStyle(focused), fontSize:"0.85rem", padding:"0.2rem 0.7rem", flexShrink:0 }}
                  >
                    {focused ? "★ focused" : "focus"}
                  </button>
                )}
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.text} from daily ops`}
                  style={{ background:"none", border:"none", color:theme.textMuted, cursor:"pointer", fontSize:"0.72rem", opacity:0.35, padding:"0 0.2rem", lineHeight:1 }}
                >
                  ×
                </button>
              </div>
              );
            })}
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
