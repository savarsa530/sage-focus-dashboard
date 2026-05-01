// Sage & Steph Focus Dashboard — v5.3.0 · Phase 3

import { useState, useEffect, useRef, useCallback } from "react";
import { THEMES, PRESETS } from "./constants";
import { fmt, uuid, today } from "./utils";
import { startSound, stopSound, setVolume, stopAllSounds } from "./audio";
import LiveClock       from "./components/LiveClock";
import TimerRing       from "./components/TimerRing";
import IntentionChip   from "./components/IntentionChip";
import PaceIndicator   from "./components/PaceIndicator";
import IntentionModal  from "./components/IntentionModal";
import SkipBreakModal  from "./components/SkipBreakModal";
import TaskSwapModal   from "./components/TaskSwapModal";
import SoundscapePanel from "./components/SoundscapePanel";
import TasksTab        from "./components/TasksTab";
import PITab           from "./components/PITab";
import PIReadiness     from "./components/PIReadiness";

const VERSION = "5.3.0 · 2026-04-30 · Phase 3";

export default function App() {

  // ── Theme ─────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    const k = localStorage.getItem("sage_theme_v5") || "obsidian";
    return THEMES.find(t => t.key === k) || THEMES[0];
  });
  const switchTheme = (t) => { setTheme(t); localStorage.setItem("sage_theme_v5", t.key); };

  // ── Daily Intention ───────────────────────────────────────────
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [intention, setIntention] = useState(() => {
    const saved = localStorage.getItem("sage_intention_v5");
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed.date === today() ? parsed.text : null;
    } catch { return null; }
  });

  useEffect(() => {
    const lastSeen = localStorage.getItem("sage_intention_seen");
    if (lastSeen !== today()) {
      setTimeout(() => setShowIntentionModal(true), 600);
    }
  }, []);

  const handleSetIntention = (text) => {
    const data = { date:today(), text };
    localStorage.setItem("sage_intention_v5", JSON.stringify(data));
    localStorage.setItem("sage_intention_seen", today());
    setIntention(text || null);
    setShowIntentionModal(false);
  };

  // ── Humanistic tracking ───────────────────────────────────────
  const [consecutiveSkips, setConsecutiveSkips] = useState(() => {
    const d = localStorage.getItem("sage_skip_streak_date");
    return d === today() ? Number(localStorage.getItem("sage_skip_streak")||0) : 0;
  });

  const [sessionTimestamps, setSessionTimestamps] = useState(() => {
    const d = localStorage.getItem("sage_session_ts_date");
    if (d !== today()) return [];
    try { return JSON.parse(localStorage.getItem("sage_session_timestamps")||"[]"); } catch { return []; }
  });

  const [skipLog, setSkipLog] = useState(() => {
    const d = localStorage.getItem("sage_skip_log_date");
    if (d !== today()) return [];
    try { return JSON.parse(localStorage.getItem("sage_skip_log")||"[]"); } catch { return []; }
  });

  const recordSessionTimestamp = useCallback(() => {
    const now = Date.now();
    setSessionTimestamps(prev => {
      const updated = [...prev, now];
      localStorage.setItem("sage_session_ts_date", today());
      localStorage.setItem("sage_session_timestamps", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const recordSkip = (reason) => {
    const newSkips = consecutiveSkips + 1;
    setConsecutiveSkips(newSkips);
    localStorage.setItem("sage_skip_streak", String(newSkips));
    localStorage.setItem("sage_skip_streak_date", today());
    const entry = { reason, time:Date.now() };
    const updated = [...skipLog, entry];
    setSkipLog(updated);
    localStorage.setItem("sage_skip_log", JSON.stringify(updated));
    localStorage.setItem("sage_skip_log_date", today());
  };

  const resetSkipStreak = () => {
    setConsecutiveSkips(0);
    localStorage.setItem("sage_skip_streak", "0");
    localStorage.setItem("sage_skip_streak_date", today());
  };

  // ── Tasks ─────────────────────────────────────────────────────
  const [focusedTaskId, setFocusedTaskId] = useState(null);
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sage_tasks_v5")||"[]"); } catch { return []; }
  });
  const saveTasks = (list) => { setTasks(list); localStorage.setItem("sage_tasks_v5", JSON.stringify(list)); };

  // ── Timer ─────────────────────────────────────────────────────
  const [workMins,  setWorkMins]  = useState(25);
  const [brkMins,   setBrkMins]   = useState(5);
  const [customW,   setCustomW]   = useState("");
  const [customB,   setCustomB]   = useState("");
  const [phase,     setPhase]     = useState("work");
  const [timeLeft,  setTimeLeft]  = useState(25 * 60);
  const [running,   setRunning]   = useState(false);
  const [needTask,  setNeedTask]  = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const intervalRef = useRef(null);

  const totalSecs = phase === "work" ? workMins * 60 : brkMins * 60;
  const timerPct  = totalSecs > 0 ? timeLeft / totalSecs : 0;

  const applyPreset = (p) => {
    setWorkMins(p.work); setBrkMins(p.brk);
    setPhase("work"); setTimeLeft(p.work * 60); setRunning(false);
  };

  const applyCustom = () => {
    const w = parseInt(customW), b = parseInt(customB);
    if (w > 0) { setWorkMins(w); setPhase("work"); setTimeLeft(w * 60); setRunning(false); }
    if (b > 0) setBrkMins(b);
    setCustomW(""); setCustomB("");
  };

  // ── Sessions & streak ─────────────────────────────────────────
  const [sessionsToday, setSessionsToday] = useState(() => {
    const d = localStorage.getItem("sage_sessions_date");
    return d === today() ? Number(localStorage.getItem("sage_sessions_count")||0) : 0;
  });

  const bumpStreak = () => {
    const yesterday = new Date(Date.now()-86400000).toDateString();
    const last = localStorage.getItem("sage_streak_date");
    const cur  = Number(localStorage.getItem("sage_streak")||0);
    const next = last === yesterday ? cur+1 : last === today() ? cur : 1;
    localStorage.setItem("sage_streak", String(next));
    localStorage.setItem("sage_streak_date", today());
  };

  const onWorkSessionComplete = useCallback(() => {
    setPhase("break");
    setTimeLeft(brkMins * 60);
    setRunning(false);
    setShowSkipModal(true);
    recordSessionTimestamp();
  }, [brkMins, recordSessionTimestamp]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        if (phase === "work") {
          setTasks(prev => {
            const updated = prev.map(t =>
              t.id === focusedTaskId ? { ...t, focusSecs: (t.focusSecs||0) + 1 } : t
            );
            localStorage.setItem("sage_tasks_v5", JSON.stringify(updated));
            return updated;
          });
        }
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            if (phase === "work") {
              const nc = sessionsToday + 1;
              setSessionsToday(nc);
              localStorage.setItem("sage_sessions_date", today());
              localStorage.setItem("sage_sessions_count", String(nc));
              bumpStreak();
              onWorkSessionComplete();
            } else {
              setPhase("work"); setTimeLeft(workMins * 60); setRunning(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, phase, workMins, brkMins, focusedTaskId, sessionsToday, onWorkSessionComplete]);

  const handleSkipBreak = (reason) => {
    recordSkip(reason);
    setShowSkipModal(false);
    setPhase("work"); setTimeLeft(workMins * 60); setRunning(false);
  };

  const handleTakeBreak = () => {
    resetSkipStreak();
    setShowSkipModal(false);
    setRunning(true);
  };

  // ── Task focus ────────────────────────────────────────────────
  const focusTask = (taskId) => {
    if (focusedTaskId === taskId) {
      setFocusedTaskId(null); setRunning(false);
    } else {
      setFocusedTaskId(taskId); setNeedTask(false);
      if (phase === "work" && !running) setRunning(true);
    }
  };

  const handleStart = () => {
    if (!focusedTaskId && phase === "work") {
      setNeedTask(true);
      setTimeout(() => setNeedTask(false), 3000);
      return;
    }
    setRunning(true);
  };

  const handlePause = () => setRunning(false);
  const handleReset = () => { setRunning(false); setPhase("work"); setTimeLeft(workMins * 60); };

  // ── Task swap modal ───────────────────────────────────────────
  const [showTaskSwap, setShowTaskSwap] = useState(false);

  const toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const nowDone = !task.done;
    const updatedTasks = tasks.map(t => t.id === id ? {...t, done: nowDone} : t);
    saveTasks(updatedTasks);
    if (nowDone && id === focusedTaskId && phase === "work") {
      const remainingUnchecked = updatedTasks.filter(t => !t.done);
      if (remainingUnchecked.length > 0) {
        setRunning(false); setFocusedTaskId(null); setShowTaskSwap(true);
      } else {
        setFocusedTaskId(null); setRunning(false);
      }
    }
  };

  const deleteTask    = (id) => { if (focusedTaskId===id) { setFocusedTaskId(null); setRunning(false); } saveTasks(tasks.filter(t=>t.id!==id)); };
  const cyclePriority = (id) => {
    const o = ["low","medium","high"];
    saveTasks(tasks.map(t => t.id===id ? {...t, priority:o[(o.indexOf(t.priority)+1)%3]} : t));
  };

  const handleTaskSwapSelect = (taskId) => { setFocusedTaskId(taskId); setShowTaskSwap(false); setRunning(true); };
  const handleTaskSwapSkip   = () => setShowTaskSwap(false);

  // ── Drag & drop ───────────────────────────────────────────────
  const [taskSort,     setTaskSort]     = useState({ by:"default", asc:true });
  const [doneToBottom, setDoneToBottom] = useState(true);
  const [dragId,       setDragId]       = useState(null);
  const [dragOverId,   setDragOverId]   = useState(null);
  const [newTask,      setNewTask]      = useState("");

  const handleDragStart = (id) => setDragId(id);
  const handleDragOver  = (e, id) => { e.preventDefault(); setDragOverId(id); };
  const handleDragEnd   = () => { setDragId(null); setDragOverId(null); };
  const handleDrop      = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { handleDragEnd(); return; }
    const ordered = [...tasks].sort((a, b) => (a.order||0) - (b.order||0));
    const fromIdx = ordered.findIndex(t => t.id === dragId);
    const toIdx   = ordered.findIndex(t => t.id === targetId);
    const reordered = [...ordered];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    saveTasks(reordered.map((t, i) => ({ ...t, order: i })));
    handleDragEnd();
  };

  // ── Side Quests ───────────────────────────────────────────────
  const [quests,    setQuests]    = useState(() => { try { return JSON.parse(localStorage.getItem("sage_quests_v5")||"[]"); } catch { return []; } });
  const [newQuest,  setNewQuest]  = useState("");
  const saveQuests  = (list) => { setQuests(list); localStorage.setItem("sage_quests_v5", JSON.stringify(list)); };
  const addQuest    = () => { if (!newQuest.trim()) return; saveQuests([...quests, { id:uuid(), text:newQuest.trim(), createdAt:Date.now() }]); setNewQuest(""); };
  const deleteQuest = (id) => saveQuests(quests.filter(q=>q.id!==id));
  const promoteQuest= (q)  => { saveTasks([...tasks, { id:uuid(), text:q.text, done:false, priority:"medium", createdAt:Date.now() }]); saveQuests(quests.filter(x=>x.id!==q.id)); };

  // ── Soundscape ────────────────────────────────────────────────
  const [activeSounds, setActiveSounds] = useState({});
  const [soundVol,     setSoundVol]     = useState(0.35);

  const toggleSound = (key) => {
    setActiveSounds(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (next[key]) startSound(key, soundVol);
      else stopSound(key);
      return next;
    });
  };

  useEffect(() => {
    Object.keys(activeSounds).forEach(k => { if (activeSounds[k]) setVolume(k, soundVol); });
  }, [soundVol]);

  useEffect(() => () => stopAllSounds(), []);

  // ── PI Parking Lot ────────────────────────────────────────────
  const [piCapacity,     setPiCapacity]     = useState(() => { try { return JSON.parse(localStorage.getItem("sage_pi_capacity_v5")||"[]"); } catch { return []; } });
  const [piDependencies, setPiDependencies] = useState(() => { try { return JSON.parse(localStorage.getItem("sage_pi_dependencies_v5")||"[]"); } catch { return []; } });
  const [piRisk,         setPiRisk]         = useState(() => { try { return JSON.parse(localStorage.getItem("sage_pi_risk_v5")||"[]"); } catch { return []; } });

  const savePiCapacity     = (list) => { setPiCapacity(list);     localStorage.setItem("sage_pi_capacity_v5",     JSON.stringify(list)); };
  const savePiDependencies = (list) => { setPiDependencies(list); localStorage.setItem("sage_pi_dependencies_v5", JSON.stringify(list)); };
  const savePiRisk         = (list) => { setPiRisk(list);         localStorage.setItem("sage_pi_risk_v5",         JSON.stringify(list)); };

  const [piExpanded, setPiExpanded] = useState(null);
  const [showAddPi,  setShowAddPi]  = useState("");

  const [newCapacity,   setNewCapacity]   = useState({ pi:"2026.2", title:"", notes:"", impactLevel:"medium", owner:"", status:"seeding" });
  const [newDependency, setNewDependency] = useState({ pi:"2026.2", title:"", notes:"", blockingTeam:"", targetResolution:"", status:"identified" });
  const [newRisk,       setNewRisk]       = useState({ pi:"2026.2", title:"", objectives:"", risks:"", status:"seeding" });

  const addPiCapacity = () => {
    if (!newCapacity.title.trim()) return;
    savePiCapacity([...piCapacity, { ...newCapacity, id:uuid(), createdAt:Date.now() }]);
    setNewCapacity({ pi:"2026.2", title:"", notes:"", impactLevel:"medium", owner:"", status:"seeding" });
    setShowAddPi("");
  };

  const addPiDependency = () => {
    if (!newDependency.title.trim()) return;
    savePiDependencies([...piDependencies, { ...newDependency, id:uuid(), createdAt:Date.now() }]);
    setNewDependency({ pi:"2026.2", title:"", notes:"", blockingTeam:"", targetResolution:"", status:"identified" });
    setShowAddPi("");
  };

  const addPiRisk = () => {
    if (!newRisk.title.trim()) return;
    savePiRisk([...piRisk, { ...newRisk, id:uuid(), createdAt:Date.now() }]);
    setNewRisk({ pi:"2026.2", title:"", objectives:"", risks:"", status:"seeding" });
    setShowAddPi("");
  };

  const updatePiItem = (type, id, field, value) => {
    if (type === "capacity")     savePiCapacity(piCapacity.map(x => x.id===id ? {...x,[field]:value} : x));
    else if (type === "dependencies") savePiDependencies(piDependencies.map(x => x.id===id ? {...x,[field]:value} : x));
    else if (type === "risk")    savePiRisk(piRisk.map(x => x.id===id ? {...x,[field]:value} : x));
  };

  const deletePiItem = (type, id) => {
    if (type === "capacity")     savePiCapacity(piCapacity.filter(x => x.id!==id));
    else if (type === "dependencies") savePiDependencies(piDependencies.filter(x => x.id!==id));
    else if (type === "risk")    savePiRisk(piRisk.filter(x => x.id!==id));
    if (piExpanded === id) setPiExpanded(null);
  };

  // ── UI state ──────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState("tasks");
  const [zenMode,      setZenMode]      = useState(false);
  const [showPresets,  setShowPresets]  = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"||e.target.tagName==="SELECT") return;
      if (showSkipModal || showIntentionModal || showTaskSwap) return;
      if (e.key===" ")  { e.preventDefault(); running ? handlePause() : handleStart(); }
      if (e.key==="z"||e.key==="Z") setZenMode(p=>!p);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [running, focusedTaskId, showSkipModal, showIntentionModal, showTaskSwap]);

  // ── Shared style objects ──────────────────────────────────────
  const isDark    = theme.isDark;
  const auroraC   = theme.auroraColors;
  const phaseLabel = phase==="work" ? "Focus" : "Break";
  const phaseColor = phase==="work" ? theme.timerRing : "#86efac";
  const streak     = Number(localStorage.getItem("sage_streak")||0);
  const streakLabel = streak===0 ? "Start your streak!" : streak===1 ? "1 day 🌱" : `${streak} days 🔥`;
  const focusedTask = tasks.find(t => t.id === focusedTaskId);

  const panel = {
    background: theme.panel, border:`1px solid ${theme.panelBorder}`,
    borderRadius:18, padding:"1.25rem 1.5rem", marginBottom:"1.1rem",
  };

  const inp = {
    background:"transparent", border:`1px solid ${theme.panelBorder}`,
    borderRadius:10, color:theme.text,
    fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:"0.95rem",
    padding:"0.5rem 0.75rem", outline:"none", width:"100%", boxSizing:"border-box",
  };

  const btn = (primary=true) => ({
    background:   primary ? theme.accent : "transparent",
    color:        primary ? (isDark?"#000":"#fff") : theme.accent,
    border:       primary ? "none" : `1px solid ${theme.accent}`,
    borderRadius: 10, padding:"0.45rem 1rem",
    fontFamily:"'Cormorant Garamond', Georgia, serif",
    fontWeight:700, fontSize:"0.88rem", cursor:"pointer",
    letterSpacing:"0.03em", transition:"opacity 0.15s",
  });

  const pill = (active) => ({
    background:   active ? theme.accent : `${theme.accent}18`,
    color:        active ? (isDark?"#000":"#fff") : theme.textMuted,
    border:"none", borderRadius:20, padding:"0.3rem 0.8rem",
    fontFamily:"'Cormorant Garamond', Georgia, serif",
    fontSize:"0.78rem", fontWeight:700, cursor:"pointer",
    letterSpacing:"0.04em", transition:"all 0.15s",
  });

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=DM+Mono:wght@400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:${theme.bg};}
    ::placeholder{color:${theme.textMuted}70;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;}
    input:focus,textarea:focus{border-color:${theme.accent}88!important;outline:none;}
    button:hover{opacity:0.82;}
    textarea{resize:vertical;}
    select{background:${theme.panel};color:${theme.text};border:1px solid ${theme.panelBorder};border-radius:8px;padding:6px 10px;font-family:'Cormorant Garamond',Georgia,serif;font-size:0.9rem;outline:none;}
    ::-webkit-scrollbar{width:5px;}
    ::-webkit-scrollbar-thumb{background:${theme.panelBorder};border-radius:4px;}
    @keyframes gentlePulse{0%,100%{box-shadow:0 0 0 0 ${theme.accent}40;}50%{box-shadow:0 0 16px 6px ${theme.accent}35;}}
    @keyframes needTaskShake{0%,100%{transform:translateX(0);}20%,60%{transform:translateX(-4px);}40%,80%{transform:translateX(4px);}}
    @keyframes auroraWave{0%{transform:translateX(-120%) skewX(-12deg);opacity:0;}20%{opacity:${isDark?0.15:0.09};}80%{opacity:${isDark?0.15:0.09};}100%{transform:translateX(220%) skewX(-12deg);opacity:0;}}
    @keyframes auroraWave2{0%{transform:translateX(220%) skewX(12deg);opacity:0;}20%{opacity:${isDark?0.11:0.07};}80%{opacity:${isDark?0.11:0.07};}100%{transform:translateX(-120%) skewX(12deg);opacity:0;}}
    @keyframes timerGlow{0%,100%{filter:drop-shadow(0 0 6px ${phaseColor}40);}50%{filter:drop-shadow(0 0 22px ${phaseColor}66);}}
    @keyframes modalFadeIn{from{opacity:0;transform:scale(0.96);}to{opacity:1;transform:scale(1);}}
    @keyframes intentionFloat{0%,100%{opacity:0.85;transform:translateY(0);}50%{opacity:1;transform:translateY(-1px);}}
    .aurora-wrap{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;}
    .aurora-1{position:absolute;width:60%;height:35%;top:15%;left:0;background:linear-gradient(90deg,transparent,${auroraC[0]},transparent);border-radius:50%;animation:auroraWave 13s ease-in-out infinite;}
    .aurora-2{position:absolute;width:50%;height:30%;top:45%;left:20%;background:linear-gradient(90deg,transparent,${auroraC[1]},transparent);border-radius:50%;animation:auroraWave2 18s ease-in-out infinite;animation-delay:5s;}
    .aurora-3{position:absolute;width:70%;height:25%;top:65%;left:10%;background:linear-gradient(90deg,transparent,${auroraC[2]},transparent);border-radius:50%;animation:auroraWave 22s ease-in-out infinite;animation-delay:10s;}
    .timer-pulse{animation:timerGlow 3s ease-in-out infinite;}
    .start-pulse{animation:gentlePulse 2.5s ease-in-out infinite;}
    .need-task{animation:needTaskShake 0.5s ease;}
    .intention-float{animation:intentionFloat 4s ease-in-out infinite;}
  `;

  // ── Zen Mode ──────────────────────────────────────────────────
  if (zenMode) {
    return (
      <div style={{ minHeight:"100vh", background:theme.bg, fontFamily:"'Cormorant Garamond', Georgia, serif", color:theme.text, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
        <style>{globalStyles}</style>
        {running && phase==="work" && <div className="aurora-wrap"><div className="aurora-1"/><div className="aurora-2"/><div className="aurora-3"/></div>}

        {showSkipModal && <SkipBreakModal theme={theme} onSkip={handleSkipBreak} onTakeBreak={handleTakeBreak} sessionsToday={sessionsToday} consecutiveSkips={consecutiveSkips}/>}
        {showTaskSwap  && <TaskSwapModal  theme={theme} tasks={tasks} completedCount={tasks.filter(t=>t.done).length} onSelect={handleTaskSwapSelect} onSkip={handleTaskSwapSkip}/>}

        {intention && (
          <div className="intention-float" style={{ marginBottom:"1.5rem", textAlign:"center" }}>
            <span style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:"0.85rem", fontStyle:"italic", color: isDark ? "#a78bfa" : "#7c3aed", opacity:0.7, letterSpacing:"0.04em" }}>
              ✦ {intention}
            </span>
          </div>
        )}

        <div style={{ fontSize:"0.68rem", color:phaseColor, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"1.5rem", fontFamily:"'DM Mono', monospace" }}>
          {phase==="work" ? "Focus" : "Break"}
        </div>
        <div className={running?"timer-pulse":""}>
          <TimerRing pct={timerPct} color={phaseColor} running={running}>
            <div style={{ fontSize:"3.2rem", fontWeight:600, letterSpacing:"-0.03em", color:theme.text, fontFamily:"'Cormorant Garamond', Georgia, serif" }}>{fmt(timeLeft)}</div>
            {focusedTask
              ? <div style={{ fontSize:"0.75rem", color:phaseColor, maxWidth:150, textAlign:"center", marginTop:6, fontStyle:"italic", lineHeight:1.3, fontFamily:"'Cormorant Garamond', Georgia, serif" }}>✦ {focusedTask.text}</div>
              : <div style={{ fontSize:"0.65rem", color:theme.textMuted, marginTop:6, fontStyle:"italic" }}>no task selected</div>
            }
          </TimerRing>
        </div>
        <div style={{ display:"flex", gap:"0.75rem", marginTop:"2rem", alignItems:"center" }}>
          {!running
            ? <button className={!focusedTaskId && phase==="work"?"start-pulse":""} style={{ ...btn(true), fontSize:"1rem", padding:"0.7rem 2.2rem" }} onClick={handleStart}>▶ {phase==="work"?"Begin Focus":"Begin Break"}</button>
            : <button style={{ ...btn(true), fontSize:"1rem", padding:"0.7rem 2.2rem" }} onClick={handlePause}>⏸ Pause</button>
          }
          <button style={{ ...btn(false), padding:"0.7rem 1.2rem" }} onClick={handleReset}>↺</button>
        </div>
        {needTask && <div className="need-task" style={{ marginTop:"1rem", color:"#f87171", fontSize:"0.88rem", fontStyle:"italic" }}>Choose a task from the Tasks tab first.</div>}
        <div style={{ marginTop:"2rem", display:"flex", flexDirection:"column", alignItems:"center", gap:"0.4rem" }}>
          <div style={{ fontSize:"0.65rem", color:theme.textMuted, letterSpacing:"0.12em", fontFamily:"'DM Mono', monospace" }}>Z · exit &nbsp;·&nbsp; space · start/pause</div>
          <div style={{ fontSize:"0.72rem", color:theme.textMuted, fontStyle:"italic" }}>🔥 {streakLabel} · {sessionsToday} session{sessionsToday!==1?"s":""} today</div>
        </div>
        <button onClick={()=>setZenMode(false)} style={{ position:"fixed", top:"1.25rem", right:"1.25rem", ...btn(false), fontSize:"0.72rem", padding:"0.3rem 0.7rem", opacity:0.4 }}>✦ Exit</button>
      </div>
    );
  }

  // ── Normal Mode ───────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:theme.bg, fontFamily:"'Cormorant Garamond', Georgia, serif", color:theme.text, transition:"background 0.4s, color 0.3s", position:"relative", overflow:"hidden" }}>
      <style>{globalStyles}</style>
      {running && phase==="work" && <div className="aurora-wrap"><div className="aurora-1"/><div className="aurora-2"/><div className="aurora-3"/></div>}

      {showIntentionModal && <IntentionModal theme={theme} onSet={handleSetIntention} existing={intention}/>}
      {showSkipModal      && <SkipBreakModal theme={theme} onSkip={handleSkipBreak} onTakeBreak={handleTakeBreak} sessionsToday={sessionsToday} consecutiveSkips={consecutiveSkips}/>}
      {showTaskSwap       && <TaskSwapModal  theme={theme} tasks={tasks} completedCount={tasks.filter(t=>t.done).length} onSelect={handleTaskSwapSelect} onSkip={handleTaskSwapSkip}/>}

      <div style={{ maxWidth:900, margin:"0 auto", padding:"2rem 1.25rem", position:"relative", zIndex:2 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.75rem", flexWrap:"wrap", gap:"0.75rem" }}>
          <div>
            <div style={{ fontWeight:600, fontSize:"1.8rem", color:theme.text, letterSpacing:"-0.02em", lineHeight:1, fontFamily:"'Cormorant Garamond', Georgia, serif" }}>Sage & Steph</div>
            <div style={{ fontSize:"0.62rem", color:theme.textMuted, letterSpacing:"0.15em", textTransform:"uppercase", marginTop:3, fontFamily:"'DM Mono', monospace" }}>Focus Dashboard · v{VERSION}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
            <LiveClock color={theme.textMuted}/>
            <div style={{ display:"flex", gap:"0.35rem", alignItems:"center" }}>
              {THEMES.map(t => (
                <button key={t.key} onClick={()=>switchTheme(t)} title={t.label} style={{ width:18, height:18, borderRadius:"50%", background:t.accent, border:theme.key===t.key?`2px solid ${theme.text}`:"2px solid transparent", cursor:"pointer", padding:0, transition:"transform 0.15s", transform:theme.key===t.key?"scale(1.3)":"scale(1)" }}/>
              ))}
            </div>
            <button style={{ ...btn(false), fontSize:"0.72rem", padding:"0.3rem 0.65rem" }} onClick={()=>setZenMode(p=>!p)} title="Zen mode (Z)">⬡ Zen</button>
            <button onClick={() => setShowIntentionModal(true)} title="Set today's intention" style={{ ...btn(false), fontSize:"0.72rem", padding:"0.3rem 0.65rem", opacity: intention ? 1 : 0.6 }}>✦ Intention</button>
          </div>
        </div>

        {intention && (
          <div style={{ marginBottom:"1rem" }}>
            <IntentionChip intention={intention} accent={theme.accent} textMuted={theme.textMuted} isDark={isDark} onEdit={() => setShowIntentionModal(true)}/>
          </div>
        )}

        {/* Timer Panel */}
        <div style={panel}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:"0.75rem" }}>
            <span style={{ background:`${phaseColor}22`, color:phaseColor, borderRadius:20, padding:"0.2rem 0.9rem", fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", fontFamily:"'DM Mono', monospace" }}>
              {phaseLabel}
            </span>
          </div>

          <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", justifyContent:"center", marginBottom:"0.75rem", alignItems:"center" }}>
            <button onClick={() => setShowPresets(!showPresets)} style={{ ...btn(false), fontSize:"0.78rem", padding:"0.3rem 0.65rem", display:"flex", alignItems:"center", gap:"0.3rem" }} title="Timer presets">
              ⚙ Presets
            </button>
          </div>

          {showPresets && (
            <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", justifyContent:"center", marginBottom:"0.75rem" }}>
              {PRESETS.map(p => (
                <button key={p.label} style={pill(workMins===p.work && brkMins===p.brk)} onClick={()=>{applyPreset(p); setShowPresets(false);}}>
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", justifyContent:"center", marginBottom:"1rem", flexWrap:"wrap" }}>
            <span style={{ fontSize:"0.65rem", color:theme.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"'DM Mono', monospace" }}>Custom:</span>
            <input value={customW} onChange={e=>setCustomW(e.target.value)} placeholder="Work min" onKeyDown={e=>e.key==="Enter"&&applyCustom()} style={{ ...inp, width:80, textAlign:"center", fontSize:"0.88rem" }}/>
            <span style={{ color:theme.textMuted, fontSize:"0.85rem" }}>/</span>
            <input value={customB} onChange={e=>setCustomB(e.target.value)} placeholder="Break min" onKeyDown={e=>e.key==="Enter"&&applyCustom()} style={{ ...inp, width:80, textAlign:"center", fontSize:"0.88rem" }}/>
            <button style={{ ...btn(false), padding:"0.45rem 0.75rem" }} onClick={applyCustom}>Set</button>
          </div>

          <div style={{ display:"flex", justifyContent:"center", marginBottom:"0.75rem" }}>
            <div className={running?"timer-pulse":""}>
              <TimerRing pct={timerPct} color={phaseColor} running={running}>
                <div style={{ fontSize:"2.6rem", fontWeight:500, letterSpacing:"-0.03em", color:theme.text, fontFamily:"'Cormorant Garamond', Georgia, serif" }}>{fmt(timeLeft)}</div>
                {phase === "work" && intention && !focusedTask && (
                  <div className="intention-float" style={{ fontSize:"0.6rem", color:theme.accent, maxWidth:110, textAlign:"center", marginTop:4, fontStyle:"italic", lineHeight:1.3, opacity:0.65 }}>
                    {intention.length > 40 ? intention.slice(0,38)+"…" : intention}
                  </div>
                )}
                {focusedTask
                  ? <div style={{ fontSize:"0.68rem", color:phaseColor, maxWidth:130, textAlign:"center", marginTop:4, fontWeight:600, fontStyle:"italic", lineHeight:1.3 }}>✦ {focusedTask.text}</div>
                  : !intention && <div style={{ fontSize:"0.62rem", color:theme.textMuted, marginTop:4, textAlign:"center", fontStyle:"italic" }}>pick a task below</div>
                }
              </TimerRing>
            </div>
          </div>

          {needTask && <div className="need-task" style={{ textAlign:"center", color:"#f87171", fontSize:"0.88rem", marginBottom:"0.6rem", fontStyle:"italic" }}>Choose a task to focus on first.</div>}

          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap", justifyContent:"center" }}>
            {!running
              ? <button className={!focusedTaskId && phase==="work"?"start-pulse":""} style={{ ...btn(true), fontSize:"0.95rem", padding:"0.55rem 1.6rem" }} onClick={handleStart}>▶ {phase==="work"?"Begin Focus":"Begin Break"}</button>
              : <button style={{ ...btn(true), fontSize:"0.95rem", padding:"0.55rem 1.6rem" }} onClick={handlePause}>⏸ Pause</button>
            }
            <button style={{ ...btn(false), padding:"0.55rem 1rem" }} onClick={handleReset}>↺ Reset</button>
          </div>

          <div style={{ textAlign:"center", marginTop:"0.75rem" }}>
            <div style={{ fontSize:"0.75rem", color:theme.textMuted, fontStyle:"italic" }}>
              🔥 {streakLabel} · {sessionsToday} session{sessionsToday!==1?"s":""} today
            </div>
            <PaceIndicator sessionsToday={sessionsToday} consecutiveSkips={consecutiveSkips} sessionTimestamps={sessionTimestamps} accent={theme.accent} textMuted={theme.textMuted} isDark={isDark}/>
          </div>

          {!running && timeLeft<(workMins*60) && timeLeft>0 && phase==="work" && focusedTaskId && (
            <div style={{ textAlign:"center", marginTop:"0.6rem", fontSize:"0.82rem", color:theme.accent, cursor:"pointer", fontStyle:"italic" }} onClick={handleStart}>
              ⏸ Paused — resume?
            </div>
          )}
        </div>

        {/* Soundscape Panel */}
        <SoundscapePanel theme={theme} activeSounds={activeSounds} soundVol={soundVol} onToggle={toggleSound} onVolumeChange={setSoundVol} panelStyle={panel}/>

        {/* Tab Bar */}
        <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1rem", flexWrap:"wrap" }}>
          {[["tasks","📋 Tasks"],["pi","🗂 PI Parking Lot"],["readiness","🧭 PI Readiness"]].map(([k,l])=>(
            <button key={k} style={{ ...pill(activeTab===k), fontSize:"0.82rem", padding:"0.4rem 1rem" }} onClick={()=>setActiveTab(k)}>{l}</button>
          ))}
        </div>

        {/* Tasks Tab */}
        {activeTab==="tasks" && (
          <TasksTab
            theme={theme} tasks={tasks} saveTasks={saveTasks}
            focusedTaskId={focusedTaskId} focusTask={focusTask}
            taskSort={taskSort} setTaskSort={setTaskSort}
            doneToBottom={doneToBottom} setDoneToBottom={setDoneToBottom}
            dragId={dragId} dragOverId={dragOverId}
            handleDragStart={handleDragStart} handleDragOver={handleDragOver}
            handleDrop={handleDrop} handleDragEnd={handleDragEnd}
            toggleTask={toggleTask} deleteTask={deleteTask} cyclePriority={cyclePriority}
            newTask={newTask} setNewTask={setNewTask}
            quests={quests} newQuest={newQuest} setNewQuest={setNewQuest}
            addQuest={addQuest} deleteQuest={deleteQuest} promoteQuest={promoteQuest}
            panelStyle={panel} btnStyle={btn} pillStyle={pill} inpStyle={inp}
          />
        )}

        {/* PI Parking Lot Tab */}
        {activeTab==="pi" && (
          <PITab
            theme={theme}
            piCapacity={piCapacity} piDependencies={piDependencies} piRisk={piRisk}
            piExpanded={piExpanded} setPiExpanded={setPiExpanded}
            showAddPi={showAddPi} setShowAddPi={setShowAddPi}
            newCapacity={newCapacity} setNewCapacity={setNewCapacity}
            newDependency={newDependency} setNewDependency={setNewDependency}
            newRisk={newRisk} setNewRisk={setNewRisk}
            addPiCapacity={addPiCapacity} addPiDependency={addPiDependency} addPiRisk={addPiRisk}
            updatePiItem={updatePiItem} deletePiItem={deletePiItem}
            panelStyle={panel} btnStyle={btn} inpStyle={inp}
          />
        )}

        {/* PI Readiness Tab */}
        {activeTab==="readiness" && <PIReadiness theme={theme}/>}

        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:"1.5rem", fontSize:"0.6rem", color:theme.textMuted, letterSpacing:"0.1em", fontFamily:"'DM Mono', monospace" }}>
          space · start/pause &nbsp;·&nbsp; Z · zen &nbsp;·&nbsp; click focus on a task to begin
        </div>
      </div>
    </div>
  );
}
