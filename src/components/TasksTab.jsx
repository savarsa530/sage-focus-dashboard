import { useState } from "react";
import { uuid } from "../utils";
import { Emblem, LineIcon } from "./Witchy";
import { taskStage } from "../glyphs";
import { loadGroups, saveGroups, GROUP_ICONS, GROUPS_UI_KEY } from "../taskGroups";

export default function TasksTab({
  theme, tasks, saveTasks,
  focusedTaskId, focusTask,
  taskSort, setTaskSort,
  doneToBottom, setDoneToBottom,
  dragId, dragOverId,
  handleDragStart, handleDragOver, handleDrop, handleDragEnd,
  toggleTask, deleteTask, cyclePriority,
  newTask, setNewTask,
  quests, newQuest, setNewQuest, addQuest, deleteQuest, promoteQuest,
  panelStyle, btnStyle, pillStyle, inpStyle,
}) {
  const DR = !!theme.deckRoom;
  const [hoveredId, setHoveredId] = useState(null);
  const canDrag = taskSort.by === "default";
  const pColor  = (p) => ({ high:"#f87171", medium:theme.accent, low:theme.textMuted }[p]);
  const hoverGlow = (task) => {
    if (task.done || task.id !== hoveredId) return undefined;
    const alphaHex = task.priority === "high" ? "59" : task.priority === "medium" ? "38" : "1e";
    return `0 0 10px ${pColor(task.priority)}${alphaHex}`;
  };
  const pLabel  = (p) => ({ high:"H · High priority", medium:"M · Medium priority", low:"L · Low priority" }[p]);
  const pNum    = (p) => ({ high:3, medium:2, low:1 }[p]);
  const line    = theme.line || theme.panelBorder;
  const fmtMins = (s) => s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s/60)}m` : `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;

  const sortedTasks = (() => {
    let list = [...tasks];
    if (doneToBottom) list.sort((a, b) => (a.done===b.done) ? 0 : a.done ? 1 : -1);
    if (taskSort.by === "default") {
      if (!doneToBottom) list.sort((a, b) => (a.order||0) - (b.order||0));
      else {
        const undone = list.filter(t => !t.done).sort((a, b) => (a.order||0) - (b.order||0));
        const done   = list.filter(t => t.done).sort((a, b) => (a.order||0) - (b.order||0));
        list = [...undone, ...done];
      }
    } else {
      let d = 0;
      list.sort((a, b) => {
        if (taskSort.by === "priority") d = pNum(b.priority) - pNum(a.priority);
        else if (taskSort.by === "alpha") d = a.text.localeCompare(b.text);
        else if (taskSort.by === "time") d = (b.focusSecs||0) - (a.focusSecs||0);
        return taskSort.asc ? -d : d;
      });
    }
    return list;
  })();

  // ── Groups ──
  const [groups, setGroups]         = useState(loadGroups);
  const [collapsed, setCollapsed]   = useState(() => { try { return JSON.parse(localStorage.getItem(GROUPS_UI_KEY)) || {}; } catch { return {}; } });
  const [drafts, setDrafts]         = useState({});     // per-group "Add to …" text
  const [newGroup, setNewGroup]     = useState(null);   // null = closed, string = naming
  const [editingId, setEditingId]   = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [addToGroup, setAddToGroup] = useState("");     // group for the top add bar
  const putGroups = (g) => { setGroups(g); saveGroups(g); };
  const toggleCollapsed = (id) => setCollapsed(c => {
    const next = { ...c, [id]: !c[id] };
    try { localStorage.setItem(GROUPS_UI_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    return next;
  });
  const nextOrder = () => tasks.reduce((m, t) => Math.max(m, t.order||0), 0) + 1;
  const addToBucket = (g) => {
    const text = (drafts[g.id] || "").trim();
    if (!text) return;
    saveTasks([...tasks, { id:uuid(), text, done:false, priority:"medium", focusSecs:0, order:nextOrder(), createdAt:Date.now(), group:g.id }]);
    setDrafts(d => ({ ...d, [g.id]: "" }));
  };
  const createGroup = () => {
    const name = (newGroup || "").trim();
    if (!name) { setNewGroup(null); return; }
    const used = new Set(groups.map(g => g.icon));
    putGroups([...groups, { id:uuid(), name, icon: GROUP_ICONS.find(i => !used.has(i)) || "star" }]);
    setNewGroup(null);
  };
  const renameGroup = (id, name) => {
    name = name.trim();
    if (name) putGroups(groups.map(g => g.id === id ? { ...g, name } : g));
    setEditingId(null);
  };
  const cycleIcon = (id) => putGroups(groups.map(g => g.id === id ? { ...g, icon: GROUP_ICONS[(GROUP_ICONS.indexOf(g.icon) + 1) % GROUP_ICONS.length] } : g));
  const shiftGroup = (id, dir) => {
    const i = groups.findIndex(g => g.id === id), j = i + dir;
    if (j < 0 || j >= groups.length) return;
    const next = [...groups]; [next[i], next[j]] = [next[j], next[i]];
    putGroups(next);
  };
  // Removing a group never deletes its tasks; they fall back to Unsorted.
  const removeGroup = (id) => {
    putGroups(groups.filter(g => g.id !== id));
    saveTasks(tasks.map(t => t.group === id ? { ...t, group: undefined } : t));
    if (addToGroup === id) setAddToGroup("");
    setRemovingId(null);
  };
  const moveTask = (taskId, groupId) => saveTasks(tasks.map(t => t.id === taskId ? { ...t, group: groupId || undefined } : t));
  const dropOnGroup = (e, groupId) => {
    e.preventDefault();
    if (dragId && !tasks.find(t => t.id === dragId)?.opId) moveTask(dragId, groupId);
    handleDragEnd();
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    saveTasks([...tasks, { id:uuid(), text:newTask.trim(), done:false, priority:"medium", focusSecs:0, order:nextOrder(), createdAt:Date.now(), group: addToGroup || undefined }]);
    setNewTask("");
  };

  const hdrBtn = { background:"none", border:"none", color:theme.textMuted, cursor:"pointer", fontSize:"0.8rem", padding:"0 0.2rem", lineHeight:1, flexShrink:0 };

  // Sections: focused daily ops, each group in order, then Unsorted.
  // Sorting applies inside each section; empty ops/Unsorted sections hide.
  const renderGroups = (renderRow) => {
    const ids = new Set(groups.map(g => g.id));
    const buckets = [
      { id:"__ops", name:"From Daily Ops", icon:"candle", ops:true },
      ...groups,
      { id:"__none", name:"Unsorted", icon:"cards", none:true },
    ];
    return buckets.map(g => {
      const items = sortedTasks.filter(t =>
        g.ops ? t.opId && !ids.has(t.group) :
        g.none ? !t.opId && !ids.has(t.group) :
        t.group === g.id);
      if ((g.ops || g.none) && items.length === 0) return null;
      const open  = items.filter(t => !t.done).length;
      const shut  = !!collapsed[g.id];
      const real  = !g.ops && !g.none;
      const index = groups.findIndex(x => x.id === g.id);
      return (
        <section key={g.id} aria-label={g.name}>
          <div
            onDragOver={e => { if (canDrag && dragId && !g.ops) e.preventDefault(); }}
            onDrop={e => { if (!g.ops) dropOnGroup(e, g.none ? null : g.id); }}
            style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.15rem 0 0.4rem", borderBottom:`1px solid ${line}`, marginBottom: shut ? 0 : "0.5rem" }}>
            <button onClick={()=>real && cycleIcon(g.id)} title={real ? "Change sigil" : undefined} aria-label={real ? `Change sigil for ${g.name}` : undefined}
              style={{ background:"none", border:"none", padding:0, cursor: real ? "pointer" : "default", color:theme.accentInk || theme.accent, display:"inline-flex", flexShrink:0 }}>
              <LineIcon name={g.icon || "star"} size={17}/>
            </button>
            {editingId === g.id ? (
              <input id={`group-rename-${g.id}`} autoFocus defaultValue={g.name}
                onBlur={e=>renameGroup(g.id, e.target.value)}
                onKeyDown={e=>{ if (e.key==="Enter") e.target.blur(); if (e.key==="Escape") setEditingId(null); }}
                style={{ ...inpStyle, fontSize:"0.9rem", padding:"0.2rem 0.5rem", flex:1, minWidth:0 }}/>
            ) : (
              <span onDoubleClick={()=>real && setEditingId(g.id)}
                style={{ fontFamily:"var(--font-caps)", textTransform:"uppercase", letterSpacing:"0.12em", fontSize:"0.78rem", color: real ? theme.text : theme.textMuted, flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {g.name}
              </span>
            )}
            {removingId !== g.id && (
              <span style={{ fontSize:"0.82rem", fontStyle:"italic", color: open ? (theme.accentInk || theme.accent) : theme.textMuted, flexShrink:0, fontFamily:"var(--font-body)" }}>
                {open ? `${open} open` : items.length ? "all done" : "empty"}
              </span>
            )}
            {real && (removingId === g.id ? (
              <span style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", fontSize:"0.8rem", flexShrink:0 }}>
                <span style={{ fontStyle:"italic", color:theme.textMuted }}>{items.length ? "Remove group? Tasks move to Unsorted." : "Remove group?"}</span>
                <button onClick={()=>removeGroup(g.id)} style={{ ...pillStyle(true), fontSize:"0.78rem", padding:"0.1rem 0.55rem" }}>Remove</button>
                <button onClick={()=>setRemovingId(null)} style={hdrBtn}>Keep</button>
              </span>
            ) : (
              <>
                <button onClick={()=>shiftGroup(g.id, -1)} disabled={index <= 0} aria-label={`Move ${g.name} up`} title="Move group up" style={{ ...hdrBtn, opacity: index <= 0 ? 0.15 : 0.5 }}>↑</button>
                <button onClick={()=>shiftGroup(g.id, 1)} disabled={index >= groups.length - 1} aria-label={`Move ${g.name} down`} title="Move group down" style={{ ...hdrBtn, opacity: index >= groups.length - 1 ? 0.15 : 0.5 }}>↓</button>
                <button onClick={()=>setEditingId(g.id)} aria-label={`Rename ${g.name}`} title="Rename" style={{ ...hdrBtn, opacity:0.5 }}>✎</button>
                <button onClick={()=>setRemovingId(g.id)} aria-label={`Remove ${g.name}`} title="Remove group" style={{ ...hdrBtn, opacity:0.4 }}>×</button>
              </>
            ))}
            <button onClick={()=>toggleCollapsed(g.id)} aria-label={shut ? `Expand ${g.name}` : `Collapse ${g.name}`} style={{ ...hdrBtn, fontSize:"0.72rem" }}>{shut ? "▼" : "▲"}</button>
          </div>
          {!shut && (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
              {items.map(renderRow)}
              {real && (
                <div style={{ display:"flex", gap:"0.4rem" }}>
                  <input id={`group-add-${g.id}`} value={drafts[g.id] || ""} onChange={e=>{ const v = e.target.value; setDrafts(d => ({ ...d, [g.id]: v })); }}
                    onKeyDown={e=>e.key==="Enter"&&addToBucket(g)} placeholder={`Add to ${g.name}…`}
                    style={{ ...inpStyle, fontSize:"0.82rem", flex:1, minWidth:0 }}/>
                  <button style={{ ...btnStyle(false), padding:"0.4rem 0.75rem", fontSize:"0.82rem" }} aria-label={`Add to ${g.name}`} onClick={()=>addToBucket(g)}>+</button>
                </div>
              )}
            </div>
          )}
        </section>
      );
    });
  };

  return (
    <>
      {/* Add task */}
      <div style={panelStyle}>
        <div style={{ fontSize:"0.85rem", fontWeight:500, color:theme.textMuted, letterSpacing:"0.01em", marginBottom:"0.7rem", fontFamily:"var(--font-body)" }}>Today's Focus</div>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          <input style={inpStyle} placeholder="Add a task…" value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()}/>
          {groups.length > 0 && (
            <select id="task-add-group" value={addToGroup} onChange={e=>setAddToGroup(e.target.value)} aria-label="Add to group" title="Which group it goes in"
              style={{ ...inpStyle, width:"auto", flex:"0 1 auto", maxWidth:"9.5rem", fontSize:"0.85rem", cursor:"pointer" }}>
              <option value="">Unsorted</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          <button style={btnStyle(true)} onClick={addTask}>Add</button>
        </div>
      </div>

      {/* Task list */}
      <div style={panelStyle}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.75rem", flexWrap:"wrap", gap:"0.5rem" }}>
          <div style={{ fontSize:"0.85rem", fontWeight:500, color:theme.textMuted, letterSpacing:"0.01em", fontFamily:"var(--font-body)" }}>
            Tasks ({tasks.filter(t=>!t.done).length} open)
          </div>
          <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap", alignItems:"center" }}>
            <button style={pillStyle(taskSort.by==="default")} onClick={()=>setTaskSort({by:"default",asc:true})}>Default</button>
            <button style={pillStyle(taskSort.by==="priority")} onClick={()=>setTaskSort(p=>p.by==="priority"?{...p,asc:!p.asc}:{by:"priority",asc:false})}>Priority{taskSort.by==="priority"?(taskSort.asc?" ↑":" ↓"):""}</button>
            <button style={pillStyle(taskSort.by==="alpha")} onClick={()=>setTaskSort(p=>p.by==="alpha"?{...p,asc:!p.asc}:{by:"alpha",asc:true})}>A–Z{taskSort.by==="alpha"?(taskSort.asc?" ↑":" ↓"):""}</button>
            <button style={pillStyle(taskSort.by==="time")} onClick={()=>setTaskSort(p=>p.by==="time"?{...p,asc:!p.asc}:{by:"time",asc:false})}>Time{taskSort.by==="time"?(taskSort.asc?" ↑":" ↓"):" ↓"}</button>
            <button style={pillStyle(doneToBottom)} onClick={()=>setDoneToBottom(p=>!p)}>Done ↓</button>
          </div>
        </div>

        {canDrag && tasks.length > 1 && (
          <div style={{ fontSize:"0.8rem", fontStyle:"italic", color:theme.textMuted, marginBottom:"0.5rem", textAlign:"right", fontFamily:"var(--font-body)" }}>drag ⠿ to reorder</div>
        )}

        {sortedTasks.length === 0 && (
          DR ? (
            <div style={{ textAlign:"center", padding:"1.25rem 0", display:"flex", flexDirection:"column", alignItems:"center", gap:"0.5rem" }}>
              <Emblem name="crystal-bundle" size={60}/>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"1.2rem", color:theme.text }}>The table is quiet</div>
              <div style={{ fontStyle:"italic", color:theme.textMuted, fontSize:"0.88rem" }}>Add a task above, or focus a daily op to begin.</div>
            </div>
          ) : (
          <div style={{ textAlign:"center", padding:"1.5rem 0", color:theme.textMuted, fontSize:"0.9rem", fontStyle:"italic" }}>
            Add a task above, then click <strong>focus</strong> to begin ☝
          </div>
          )
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:"0.9rem" }}>
          {renderGroups(task => {
            const isFocused  = task.id === focusedTaskId;
            const isDragOver = task.id === dragOverId;
            const isDragging = task.id === dragId;
            return (
              <div
                key={task.id}
                className={`task-item${isDragging ? " dragging" : ""}`}
                draggable={canDrag && !task.done}
                onMouseEnter={() => setHoveredId(task.id)}
                onMouseLeave={() => setHoveredId(null)}
                onDragStart={() => canDrag && handleDragStart(task.id)}
                onDragOver={e => canDrag && handleDragOver(e, task.id)}
                onDrop={e => canDrag && handleDrop(e, task.id)}
                onDragEnd={handleDragEnd}
                style={{
                  display:"flex", alignItems:"center", gap:"0.6rem",
                  padding:"0.5rem 0.6rem", borderRadius: DR ? 0 : 10,
                  background: isFocused ? `${theme.accent}18` : task.done ? `${theme.panelBorder}40` : `${theme.accent}0a`,
                  border:`1px solid ${isDragOver ? theme.accent : isFocused ? theme.accent+"80" : task.done ? theme.panelBorder : theme.accent+"28"}`,
                  outline: isDragOver ? `2px solid ${theme.accent}` : "none",
                  outlineOffset: -1,
                  boxShadow: isFocused ? `0 0 20px ${theme.accent}30, inset 0 0 10px ${theme.accent}0a` : hoverGlow(task),
                  opacity: task.done ? 0.55 : 1,
                  transition:"all 0.2s",
                  cursor: canDrag && !task.done ? "grab" : "default",
                }}
              >
                {canDrag && !task.done && (
                  <span style={{ color:theme.textMuted, fontSize:"0.9rem", cursor:"grab", userSelect:"none", flexShrink:0 }} title="Drag to reorder">⠿</span>
                )}
                <input type="checkbox" checked={task.done} onChange={()=>toggleTask(task.id)} style={{ width:16, height:16, accentColor:theme.accent, cursor:"pointer", flexShrink:0 }}/>
                {DR && (() => { const st = taskStage(task, isFocused); return (
                  <span title={st.label} aria-label={st.label} style={{ color: task.done ? theme.breakColor : theme.accentInk, flexShrink:0, display:"inline-flex" }}><LineIcon name={st.icon} size={20}/></span>
                ); })()}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"1rem", fontStyle: task.done ? "italic" : "normal", textDecoration:task.done?"line-through":"none", color:theme.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {task.text}
                    {task.opId && <span style={{ marginLeft:"0.5rem", fontSize:"0.8rem", fontStyle:"italic", color:theme.textMuted, fontFamily:"var(--font-body)" }}>daily op</span>}
                  </div>
                  {(task.focusSecs||0) > 0 && !task.done && (
                    <div style={{ fontSize:"0.82rem", color:theme.accentInk || theme.accent, marginTop:1, fontStyle:"italic", fontFamily:"var(--font-body)" }}>
                      {DR ? "" : "⏱ "}{fmtMins(task.focusSecs)} invested
                    </div>
                  )}
                </div>
                {!task.opId && groups.length > 0 && (() => {
                  const inGroup = groups.some(g => g.id === task.group);
                  return (
                    <select value="__" onChange={e=>moveTask(task.id, e.target.value)} title="Move to another group" aria-label={`Move ${task.text} to another group`}
                      style={{ appearance:"none", WebkitAppearance:"none", background:"none", border:`1px solid ${line}`, borderRadius: DR ? 0 : 6, color:theme.textMuted, fontSize:"0.85rem", fontFamily:"var(--font-body)", padding:"1px 0", width:"1.9rem", textAlign:"center", textAlignLast:"center", cursor:"pointer", flexShrink:0 }}>
                      <option value="__" disabled hidden>⇄</option>
                      {groups.map(g => <option key={g.id} value={g.id} disabled={task.group===g.id}>{task.group===g.id ? "✓ " : ""}{g.name}</option>)}
                      <option value="" disabled={!inGroup}>{inGroup ? "" : "✓ "}Unsorted</option>
                    </select>
                  );
                })()}
                <button onClick={()=>cyclePriority(task.id)} title={pLabel(task.priority)} style={{ background:"none", border:`1px solid ${pColor(task.priority)}44`, borderRadius:6, cursor:"pointer", fontSize:"0.85rem", color:pColor(task.priority), fontWeight:500, padding:"1px 5px", flexShrink:0, fontFamily:"var(--font-body)" }}>
                  {task.priority[0].toUpperCase()}
                </button>
                {!task.done && (
                  <button onClick={()=>focusTask(task.id)} style={{ ...pillStyle(isFocused), fontSize:"0.85rem", padding:"0.2rem 0.7rem", flexShrink:0 }}>
                    {isFocused ? "★ focused" : "focus"}
                  </button>
                )}
                <button onClick={()=>deleteTask(task.id)} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:"0.85rem", padding:"0 2px", flexShrink:0 }}>✕</button>
              </div>
            );
          })}
        </div>

        {newGroup === null ? (
          <button onClick={()=>setNewGroup("")} style={{ display:"block", width:"100%", background:"none", border:`1px dashed ${line}`, borderRadius: DR ? 0 : 8, color:theme.textMuted, cursor:"pointer", fontSize:"0.88rem", fontStyle:"italic", padding:"0.5rem 0.8rem", marginTop:"0.9rem", fontFamily:"var(--font-body)" }}>
            + New group
          </button>
        ) : (
          <div style={{ display:"flex", gap:"0.4rem", marginTop:"0.9rem", alignItems:"center" }}>
            <input id="task-new-group" autoFocus value={newGroup} onChange={e=>setNewGroup(e.target.value)}
              onKeyDown={e=>{ if (e.key==="Enter") createGroup(); if (e.key==="Escape") setNewGroup(null); }}
              placeholder="Who is this work for?" style={{ ...inpStyle, fontSize:"0.85rem", flex:1, minWidth:0 }}/>
            <button style={btnStyle(true)} onClick={createGroup}>Create</button>
            <button style={hdrBtn} aria-label="Cancel new group" onClick={()=>setNewGroup(null)}>✕</button>
          </div>
        )}

        {tasks.some(t=>t.done) && (
          <button style={{ ...btnStyle(false), marginTop:"0.75rem", fontSize:"0.75rem" }} onClick={()=>saveTasks(tasks.filter(t=>!t.done))}>
            Clear completed
          </button>
        )}
      </div>

      {/* Side Quests */}
      <div style={panelStyle}>
        <div style={{ fontSize:"0.85rem", fontWeight:500, color:theme.textMuted, letterSpacing:"0.01em", marginBottom:"0.4rem", fontFamily:"var(--font-body)", display:"flex", alignItems:"center", gap:"0.4rem" }}>{DR ? <LineIcon name="sprig" size={14} style={{ color:theme.accentInk }}/> : "⚡"} Side Quests</div>
        <div style={{ fontSize:"0.82rem", color:theme.textMuted, marginBottom:"0.75rem", fontStyle:"italic" }}>Stray thoughts go here. Don't break flow — park it.</div>
        <div style={{ display:"flex", gap:"0.5rem", marginBottom:"0.75rem" }}>
          <input style={inpStyle} placeholder="Park a distraction…" value={newQuest} onChange={e=>setNewQuest(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addQuest()}/>
          <button style={btnStyle(true)} onClick={addQuest}>Park</button>
        </div>
        {quests.length === 0 && <div style={{ textAlign:"center", color:theme.textMuted, fontSize:"0.85rem", padding:"0.5rem 0", fontStyle:"italic" }}>{DR ? "Nothing parked. The mind is clear." : "No distractions parked 🌿"}</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
          {quests.map(q => (
            <div key={q.id} style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.45rem 0.6rem", borderRadius: DR ? 0 : 8, background:`${theme.accent}08`, border:`1px solid ${theme.panelBorder}` }}>
              <span style={{ flex:1, fontSize:"0.9rem", color:theme.text }}>{q.text}</span>
              <button onClick={()=>promoteQuest(q)} style={{ background:"none", border:"none", cursor:"pointer", color:theme.accent, fontSize:"0.78rem", fontWeight:700 }}>→ Task</button>
              <button onClick={()=>deleteQuest(q.id)} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:"0.82rem" }}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
