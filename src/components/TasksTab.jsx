import { uuid } from "../utils";

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
  const canDrag = taskSort.by === "default";
  const pColor  = (p) => ({ high:"#f87171", medium:theme.accent, low:theme.textMuted }[p]);
  const pLabel  = (p) => ({ high:"H · High priority", medium:"M · Medium priority", low:"L · Low priority" }[p]);
  const pNum    = (p) => ({ high:3, medium:2, low:1 }[p]);
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

  const addTask = () => {
    if (!newTask.trim()) return;
    const maxOrder = tasks.reduce((m, t) => Math.max(m, t.order||0), 0);
    saveTasks([...tasks, { id:uuid(), text:newTask.trim(), done:false, priority:"medium", focusSecs:0, order:maxOrder+1, createdAt:Date.now() }]);
    setNewTask("");
  };

  return (
    <>
      {/* Add task */}
      <div style={panelStyle}>
        <div style={{ fontSize:"0.62rem", fontWeight:600, color:theme.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"0.7rem", fontFamily:"'DM Mono', monospace" }}>Today's Focus</div>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          <input style={inpStyle} placeholder="Add a task…" value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()}/>
          <button style={btnStyle(true)} onClick={addTask}>Add</button>
        </div>
      </div>

      {/* Task list */}
      <div style={panelStyle}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.75rem", flexWrap:"wrap", gap:"0.5rem" }}>
          <div style={{ fontSize:"0.62rem", fontWeight:600, color:theme.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"'DM Mono', monospace" }}>
            Tasks ({tasks.filter(t=>!t.done).length} open)
          </div>
          <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap", alignItems:"center" }}>
            <button style={pillStyle(taskSort.by==="default")} onClick={()=>setTaskSort({by:"default",asc:true})}>Default</button>
            <button style={pillStyle(taskSort.by==="priority")} onClick={()=>setTaskSort(p=>p.by==="priority"?{...p,asc:!p.asc}:{by:"priority",asc:false})}>Priority{taskSort.by==="priority"?(taskSort.asc?" ↑":" ↓"):""}</button>
            <button style={pillStyle(taskSort.by==="alpha")} onClick={()=>setTaskSort(p=>p.by==="alpha"?{...p,asc:!p.asc}:{by:"alpha",asc:true})}>A–Z{taskSort.by==="alpha"?(taskSort.asc?" ↑":" ↓"):""}</button>
            <button style={pillStyle(taskSort.by==="time")} onClick={()=>setTaskSort(p=>p.by==="time"?{...p,asc:!p.asc}:{by:"time",asc:false})}>Time{taskSort.by==="time"?(taskSort.asc?" ↑":" ↓"):" ↓"}</button>
            <button style={{ ...pillStyle(doneToBottom), fontSize:"0.72rem" }} onClick={()=>setDoneToBottom(p=>!p)}>Done ↓</button>
          </div>
        </div>

        {canDrag && tasks.length > 1 && (
          <div style={{ fontSize:"0.62rem", color:theme.textMuted, marginBottom:"0.5rem", textAlign:"right", fontFamily:"'DM Mono', monospace" }}>drag ⠿ to reorder</div>
        )}

        {sortedTasks.length === 0 && (
          <div style={{ textAlign:"center", padding:"1.5rem 0", color:theme.textMuted, fontSize:"0.9rem", fontStyle:"italic" }}>
            Add a task above, then click <strong>focus</strong> to begin ☝
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
          {sortedTasks.map(task => {
            const isFocused  = task.id === focusedTaskId;
            const isDragOver = task.id === dragOverId;
            const isDragging = task.id === dragId;
            return (
              <div
                key={task.id}
                className={`task-item${isDragging ? " dragging" : ""}`}
                draggable={canDrag && !task.done}
                onDragStart={() => canDrag && handleDragStart(task.id)}
                onDragOver={e => canDrag && handleDragOver(e, task.id)}
                onDrop={e => canDrag && handleDrop(e, task.id)}
                onDragEnd={handleDragEnd}
                style={{
                  display:"flex", alignItems:"center", gap:"0.6rem",
                  padding:"0.5rem 0.6rem", borderRadius:10,
                  background: isFocused ? `${theme.accent}18` : task.done ? `${theme.panelBorder}40` : `${theme.accent}0a`,
                  border:`1px solid ${isDragOver ? theme.accent : isFocused ? theme.accent+"80" : task.done ? theme.panelBorder : theme.accent+"28"}`,
                  borderTop: isDragOver ? `2px solid ${theme.accent}` : undefined,
                  boxShadow: isFocused ? `0 0 20px ${theme.accent}30, inset 0 0 10px ${theme.accent}0a` : undefined,
                  opacity: task.done ? 0.55 : 1,
                  transition:"all 0.2s",
                  cursor: canDrag && !task.done ? "grab" : "default",
                }}
              >
                {canDrag && !task.done && (
                  <span style={{ color:theme.textMuted, fontSize:"0.9rem", cursor:"grab", userSelect:"none", flexShrink:0 }} title="Drag to reorder">⠿</span>
                )}
                <input type="checkbox" checked={task.done} onChange={()=>toggleTask(task.id)} style={{ width:16, height:16, accentColor:theme.accent, cursor:"pointer", flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"0.9rem", fontStyle: task.done ? "italic" : "normal", textDecoration:task.done?"line-through":"none", color:theme.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {task.text}
                  </div>
                  {(task.focusSecs||0) > 0 && !task.done && (
                    <div style={{ fontSize:"0.65rem", color:theme.accent, marginTop:1, fontWeight:600, fontFamily:"'DM Mono', monospace" }}>
                      ⏱ {fmtMins(task.focusSecs)} invested
                    </div>
                  )}
                </div>
                <button onClick={()=>cyclePriority(task.id)} title={pLabel(task.priority)} style={{ background:"none", border:`1px solid ${pColor(task.priority)}44`, borderRadius:6, cursor:"pointer", fontSize:"0.65rem", color:pColor(task.priority), fontWeight:700, padding:"1px 5px", flexShrink:0, fontFamily:"'DM Mono', monospace" }}>
                  {task.priority[0].toUpperCase()}
                </button>
                {!task.done && (
                  <button onClick={()=>focusTask(task.id)} style={{ ...pillStyle(isFocused), fontSize:"0.72rem", padding:"0.2rem 0.6rem", flexShrink:0 }}>
                    {isFocused ? "★ focused" : "focus"}
                  </button>
                )}
                <button onClick={()=>deleteTask(task.id)} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:"0.85rem", padding:"0 2px", flexShrink:0 }}>✕</button>
              </div>
            );
          })}
        </div>

        {tasks.some(t=>t.done) && (
          <button style={{ ...btnStyle(false), marginTop:"0.75rem", fontSize:"0.75rem" }} onClick={()=>saveTasks(tasks.filter(t=>!t.done))}>
            Clear completed
          </button>
        )}
      </div>

      {/* Side Quests */}
      <div style={panelStyle}>
        <div style={{ fontSize:"0.62rem", fontWeight:600, color:theme.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"0.4rem", fontFamily:"'DM Mono', monospace" }}>⚡ Side Quests</div>
        <div style={{ fontSize:"0.82rem", color:theme.textMuted, marginBottom:"0.75rem", fontStyle:"italic" }}>Stray thoughts go here. Don't break flow — park it.</div>
        <div style={{ display:"flex", gap:"0.5rem", marginBottom:"0.75rem" }}>
          <input style={inpStyle} placeholder="Park a distraction…" value={newQuest} onChange={e=>setNewQuest(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addQuest()}/>
          <button style={btnStyle(true)} onClick={addQuest}>Park</button>
        </div>
        {quests.length === 0 && <div style={{ textAlign:"center", color:theme.textMuted, fontSize:"0.85rem", padding:"0.5rem 0", fontStyle:"italic" }}>No distractions parked 🌿</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
          {quests.map(q => (
            <div key={q.id} style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.45rem 0.6rem", borderRadius:8, background:`${theme.accent}08`, border:`1px solid ${theme.panelBorder}` }}>
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
