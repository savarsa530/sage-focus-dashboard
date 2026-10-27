// Sage & Steph Focus Dashboard — v6.0.0

import { useState, useEffect, useRef, useCallback } from "react";
import { THEMES, PRESETS } from "./constants";
import { fmt, uuid, today, safeGet, safeGetJSON, safeSet, loadLedger, creditLedger, countLedgerSession } from "./utils";
import { startSound, stopSound, setVolume, stopAllSounds, playDing } from "./audio";
import ErrorBoundary   from "./components/ErrorBoundary";
import LiveClock       from "./components/LiveClock";
import TimerRing       from "./components/TimerRing";
import IntentionChip   from "./components/IntentionChip";
import SkipBreakModal  from "./components/SkipBreakModal";
import TaskSwapModal   from "./components/TaskSwapModal";
import SoundscapePanel from "./components/SoundscapePanel";
import TasksTab        from "./components/TasksTab";
import PITab           from "./components/PITab";
import DailyOps        from "./components/DailyOps";
import LedgerTab       from "./components/LedgerTab";
import { Emblem, LineIcon, MoonPhase, OrnateCorners, StarDivider } from "./components/Witchy";
import { moonOf } from "./moon";

const VERSION = "6.0.0 · 2026-10-27";

export default function App() {

  // Restored timer snapshot (read once) — rehydrates the timer across refresh.
  const [timer0] = useState(() => safeGetJSON("sage_timer_v1") || {});

  // ── Theme ─────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    const k = safeGet("sage_theme_v6", "candlelight");
    return THEMES.find(t => t.key === k) || THEMES[0];
  });
  const switchTheme = (t) => { setTheme(t); safeSet("sage_theme_v6", t.key); };

  // ── Daily Intention (optional, inline beneath the timer) ──────
  const [intention, setIntention] = useState(() => {
    const parsed = safeGetJSON("sage_intention_v5");
    return parsed && parsed.date === today() ? parsed.text : null;
  });

  const handleSetIntention = (text) => {
    safeSet("sage_intention_v5", { date:today(), text });
    setIntention(text || null);
  };

  // ── Humanistic tracking ───────────────────────────────────────
  const [consecutiveSkips, setConsecutiveSkips] = useState(() =>
    safeGet("sage_skip_streak_date") === today() ? Number(safeGet("sage_skip_streak", 0)) : 0
  );

  const [, setSessionTimestamps] = useState(() => {
    if (safeGet("sage_session_ts_date") !== today()) return [];
    return safeGetJSON("sage_session_timestamps", []) || [];
  });

  const [skipLog, setSkipLog] = useState(() => {
    if (safeGet("sage_skip_log_date") !== today()) return [];
    return safeGetJSON("sage_skip_log", []) || [];
  });

  const recordSessionTimestamp = useCallback(() => {
    const now = Date.now();
    setSessionTimestamps(prev => {
      const updated = [...prev, now];
      safeSet("sage_session_ts_date", today());
      safeSet("sage_session_timestamps", updated);
      return updated;
    });
  }, []);

  const recordSkip = (reason) => {
    const newSkips = consecutiveSkips + 1;
    setConsecutiveSkips(newSkips);
    safeSet("sage_skip_streak", String(newSkips));
    safeSet("sage_skip_streak_date", today());
    const entry = { reason, time:Date.now() };
    const updated = [...skipLog, entry];
    setSkipLog(updated);
    safeSet("sage_skip_log", updated);
    safeSet("sage_skip_log_date", today());
  };

  const resetSkipStreak = () => {
    setConsecutiveSkips(0);
    safeSet("sage_skip_streak", "0");
    safeSet("sage_skip_streak_date", today());
  };

  // ── Tasks ─────────────────────────────────────────────────────
  const [focusedTaskId, setFocusedTaskId] = useState(() => timer0.focusedTaskId ?? null);
  const [tasks, setTasks] = useState(() => {
    const list = safeGetJSON("sage_tasks_v5", []) || [];
    loadLedger(list);   // first run: carry existing focus time into the ledger
    return list;
  });
  const saveTasks = (list) => { setTasks(list); safeSet("sage_tasks_v5", list); };
  const tasksRef = useRef(tasks); tasksRef.current = tasks;

  // ── Timer ─────────────────────────────────────────────────────
  const TIMER_KEY = "sage_timer_v1";
  const [workMins,  setWorkMins]  = useState(() => timer0.workMins ?? 25);
  const [brkMins,   setBrkMins]   = useState(() => timer0.brkMins  ?? 5);
  const [customW,   setCustomW]   = useState("");
  const [customB,   setCustomB]   = useState("");
  const [phase,     setPhase]     = useState(() => timer0.phase ?? "work");
  const [timeLeft,  setTimeLeft]  = useState(() => timer0.timeLeft ?? (timer0.workMins ?? 25) * 60);
  const [running,   setRunning]   = useState(false);
  const [needTask,  setNeedTask]  = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showCompletionFlash, setShowCompletionFlash] = useState(false);
  const [autoCycle, setAutoCycle] = useState(() => {
    const v = safeGet("sage_autocycle_v1");
    return v == null ? true : v === "true";
  });
  const intervalRef = useRef(null);
  const endsAtRef   = useRef(timer0.endsAt ?? null);  // epoch ms the running phase ends
  const lastTickRef = useRef(Date.now());             // for real-elapsed focus crediting

  const toggleAutoCycle = () => setAutoCycle(p => { const n = !p; safeSet("sage_autocycle_v1", String(n)); return n; });

  const totalSecs = phase === "work" ? workMins * 60 : brkMins * 60;
  const timerPct  = totalSecs > 0 ? timeLeft / totalSecs : 0;

  const applyPreset = (p) => {
    endsAtRef.current = null;
    setWorkMins(p.work); setBrkMins(p.brk);
    setPhase("work"); setTimeLeft(p.work * 60); setRunning(false);
  };

  const applyCustom = () => {
    const w = parseInt(customW), b = parseInt(customB);
    if (w > 0) { endsAtRef.current = null; setWorkMins(w); setPhase("work"); setTimeLeft(w * 60); setRunning(false); }
    if (b > 0) setBrkMins(b);
    setCustomW(""); setCustomB("");
  };

  // ── Sessions & streak ─────────────────────────────────────────
  const [sessionsToday, setSessionsToday] = useState(() =>
    safeGet("sage_sessions_date") === today() ? Number(safeGet("sage_sessions_count", 0)) : 0
  );

  const bumpStreak = () => {
    const yesterday = new Date(Date.now()-86400000).toDateString();
    const last = safeGet("sage_streak_date");
    const cur  = Number(safeGet("sage_streak", 0));
    const next = last === yesterday ? cur+1 : last === today() ? cur : 1;
    safeSet("sage_streak", String(next));
    safeSet("sage_streak_date", today());
  };

  // ── Wall-clock timer engine ───────────────────────────────────
  // Source of truth while running is `endsAtRef` (epoch ms). The interval
  // recomputes remaining time from it, so a backgrounded or refreshed tab
  // self-corrects instead of silently losing ticks. Latest state is mirrored
  // into refs so the single long-lived interval closure always sees fresh values.
  const phaseRef     = useRef(phase);          phaseRef.current     = phase;
  const focusedIdRef = useRef(focusedTaskId);  focusedIdRef.current = focusedTaskId;
  const sessionsRef  = useRef(sessionsToday);  sessionsRef.current  = sessionsToday;
  const autoCycleRef = useRef(autoCycle);      autoCycleRef.current = autoCycle;
  const workMinsRef  = useRef(workMins);       workMinsRef.current  = workMins;
  const brkMinsRef   = useRef(brkMins);        brkMinsRef.current   = brkMins;

  const accrueFocus = (seconds) => {
    const id = focusedIdRef.current;
    if (!id || seconds <= 0) return;
    creditLedger(tasksRef.current.find(t => t.id === id), seconds);
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, focusSecs: (t.focusSecs || 0) + seconds } : t);
      safeSet("sage_tasks_v5", updated);
      return updated;
    });
  };

  const handlePhaseComplete = () => {
    endsAtRef.current = null;
    playDing();
    setShowCompletionFlash(true);
    setTimeout(() => setShowCompletionFlash(false), 800);

    if (phaseRef.current === "work") {
      const nc = sessionsRef.current + 1;
      setSessionsToday(nc);
      safeSet("sage_sessions_date", today());
      safeSet("sage_sessions_count", String(nc));
      bumpStreak();
      recordSessionTimestamp();
      countLedgerSession();
      const dur = brkMinsRef.current * 60;
      setPhase("break"); setTimeLeft(dur);
      if (autoCycleRef.current) {
        endsAtRef.current = Date.now() + dur * 1000;
        lastTickRef.current = Date.now();
        setRunning(true);            // flow straight into the break
      } else {
        setRunning(false);
        setShowSkipModal(true);      // reflective pause
      }
    } else {
      const dur = workMinsRef.current * 60;
      setPhase("work"); setTimeLeft(dur);
      if (autoCycleRef.current && focusedIdRef.current) {
        endsAtRef.current = Date.now() + dur * 1000;
        lastTickRef.current = Date.now();
        setRunning(true);            // resume focus on the same task
      } else {
        setRunning(false);
      }
    }
  };

  // Reassigned each render so the interval always invokes the latest logic.
  const tickRef = useRef(() => {});
  tickRef.current = () => {
    const now = Date.now();
    if (phaseRef.current === "work") {
      const delta = Math.round((now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      if (delta >= 1) accrueFocus(delta);   // credits real elapsed time, incl. background catch-up
    } else {
      lastTickRef.current = now;
    }
    if (endsAtRef.current == null) return;
    const remaining = Math.round((endsAtRef.current - now) / 1000);
    if (remaining <= 0) { setTimeLeft(0); handlePhaseComplete(); }
    else setTimeLeft(remaining);
  };

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    if (endsAtRef.current == null) endsAtRef.current = Date.now() + timeLeft * 1000;
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(() => tickRef.current(), 1000);
    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Persist a timer snapshot on every change (incl. each tick) for refresh recovery.
  useEffect(() => {
    safeSet(TIMER_KEY, {
      phase, running, timeLeft, workMins, brkMins,
      focusedTaskId, endsAt: endsAtRef.current, savedAt: Date.now(),
    });
  }, [phase, running, timeLeft, workMins, brkMins, focusedTaskId]);

  // Recover a session that was running when the tab was closed/refreshed.
  const recoveredRef = useRef(false);
  useEffect(() => {
    if (recoveredRef.current) return;
    recoveredRef.current = true;
    if (!timer0.running || timer0.endsAt == null) return;
    const now = Date.now();
    const remaining = Math.round((timer0.endsAt - now) / 1000);
    if (remaining > 0) {
      setPhase(timer0.phase || "work");
      setTimeLeft(remaining);
      endsAtRef.current = timer0.endsAt;
      lastTickRef.current = now;
      setRunning(true);                         // seamless resume
      return;
    }
    // Phase ended while away: credit exactly one completion, then land paused.
    endsAtRef.current = null;
    if (timer0.phase === "work") {
      const missed = Math.max(0, Math.round((timer0.endsAt - (timer0.savedAt || timer0.endsAt)) / 1000));
      if (missed > 0 && timer0.focusedTaskId) {
        creditLedger(tasksRef.current.find(t => t.id === timer0.focusedTaskId), missed);
        setTasks(prev => {
          const updated = prev.map(x => x.id === timer0.focusedTaskId ? { ...x, focusSecs:(x.focusSecs||0)+missed } : x);
          safeSet("sage_tasks_v5", updated);
          return updated;
        });
      }
      const nc = sessionsRef.current + 1;
      setSessionsToday(nc);
      safeSet("sage_sessions_date", today());
      safeSet("sage_sessions_count", String(nc));
      bumpStreak();
      recordSessionTimestamp();
      countLedgerSession();
      setPhase("break"); setTimeLeft((timer0.brkMins ?? 5) * 60); setRunning(false);
    } else {
      setPhase("work"); setTimeLeft((timer0.workMins ?? 25) * 60); setRunning(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Anchor the running phase to wall-clock time, then start ticking.
  const startRunning = () => {
    endsAtRef.current = Date.now() + timeLeft * 1000;
    lastTickRef.current = Date.now();
    setRunning(true);
  };

  const handleSkipBreak = (reason) => {
    recordSkip(reason);
    setShowSkipModal(false);
    endsAtRef.current = null;
    setPhase("work"); setTimeLeft(workMins * 60); setRunning(false);
  };

  const handleTakeBreak = () => {
    resetSkipStreak();
    setShowSkipModal(false);
    startRunning();
  };

  // ── Task focus ────────────────────────────────────────────────
  const focusTask = (taskId) => {
    if (focusedTaskId === taskId) {
      endsAtRef.current = null;
      setFocusedTaskId(null); setRunning(false);
    } else {
      setFocusedTaskId(taskId); setNeedTask(false);
      if (phase === "work" && !running) startRunning();
    }
  };

  // Daily ops are starter tasks: focusing one pops it into the task list, focused.
  const focusOp = (op) => {
    let t = tasks.find(x => x.opId === op.id);
    if (!t) {
      const minOrder = tasks.reduce((m, x) => Math.min(m, x.order || 0), 0);
      t = { id:uuid(), text:op.text, done:false, priority:"medium", focusSecs:0, order:minOrder - 1, opId:op.id, createdAt:Date.now() };
      saveTasks([t, ...tasks]);
    } else if (t.done) {
      saveTasks(tasks.map(x => x.id === t.id ? { ...x, done:false } : x));
    }
    focusTask(t.id);
  };

  const handleStart = () => {
    if (!focusedTaskId && phase === "work") {
      setNeedTask(true);
      setTimeout(() => setNeedTask(false), 3000);
      return;
    }
    startRunning();
  };

  const handlePause = () => {
    if (endsAtRef.current != null) setTimeLeft(Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000)));
    endsAtRef.current = null;
    setRunning(false);
  };
  const handleReset = () => { endsAtRef.current = null; setRunning(false); setPhase("work"); setTimeLeft(workMins * 60); };

  // ── Task swap modal ───────────────────────────────────────────
  const [showTaskSwap, setShowTaskSwap] = useState(false);

  const toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const nowDone = !task.done;
    const updatedTasks = tasks.map(t => t.id === id ? {...t, done: nowDone} : t);
    saveTasks(updatedTasks);
    if (nowDone && id === focusedTaskId && phase === "work") {
      endsAtRef.current = null;
      const remainingUnchecked = updatedTasks.filter(t => !t.done);
      if (remainingUnchecked.length > 0) {
        setRunning(false); setFocusedTaskId(null); setShowTaskSwap(true);
      } else {
        setFocusedTaskId(null); setRunning(false);
      }
    }
  };

  const deleteTask    = (id) => { if (focusedTaskId===id) { endsAtRef.current = null; setFocusedTaskId(null); setRunning(false); } saveTasks(tasks.filter(t=>t.id!==id)); };
  const cyclePriority = (id) => {
    const o = ["low","medium","high"];
    saveTasks(tasks.map(t => t.id===id ? {...t, priority:o[(o.indexOf(t.priority)+1)%3]} : t));
  };

  const handleTaskSwapSelect = (taskId) => { setFocusedTaskId(taskId); setShowTaskSwap(false); startRunning(); };
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
  const [quests,    setQuests]    = useState(() => safeGetJSON("sage_quests_v5", []) || []);
  const [newQuest,  setNewQuest]  = useState("");
  const saveQuests  = (list) => { setQuests(list); safeSet("sage_quests_v5", list); };
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
  }, [soundVol, activeSounds]);

  useEffect(() => () => stopAllSounds(), []);

  // ── PI Parking Lot ────────────────────────────────────────────
  const [piCapacity,     setPiCapacity]     = useState(() => safeGetJSON("sage_pi_capacity_v5", []) || []);
  const [piDependencies, setPiDependencies] = useState(() => safeGetJSON("sage_pi_dependencies_v5", []) || []);
  const [piRisk,         setPiRisk]         = useState(() => safeGetJSON("sage_pi_risk_v5", []) || []);

  const savePiCapacity     = (list) => { setPiCapacity(list);     safeSet("sage_pi_capacity_v5",     list); };
  const savePiDependencies = (list) => { setPiDependencies(list); safeSet("sage_pi_dependencies_v5", list); };
  const savePiRisk         = (list) => { setPiRisk(list);         safeSet("sage_pi_risk_v5",         list); };

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
  const [activeTab,     setActiveTab]     = useState("tasks");
  const [zenMode,       setZenMode]       = useState(false);
  const [showPresets,   setShowPresets]   = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"||e.target.tagName==="SELECT") return;
      if (showSkipModal || showTaskSwap) return;
      if (e.key===" ")  { e.preventDefault(); running ? handlePause() : handleStart(); }
      if (e.key==="z"||e.key==="Z") setZenMode(p=>!p);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, focusedTaskId, showSkipModal, showTaskSwap]);

  // ── Shared style objects ──────────────────────────────────────
  const isDark    = theme.isDark;
  const auroraC   = theme.auroraColors;
  const phaseLabel = phase==="work" ? "Focus" : "Break";
  const phaseColor = phase==="work" ? theme.timerRing : (theme.breakColor || "#86efac");
  const DR         = !!theme.deckRoom;   // The Deck Room design system
  const streak     = Number(safeGet("sage_streak", 0));
  const streakLabel = streak===0 ? (DR ? "A new streak begins" : "Start your streak!") : streak===1 ? (DR ? "1 day" : "1 day 🌱") : (DR ? `${streak} days running` : `${streak} days 🔥`);
  const focusedTask = tasks.find(t => t.id === focusedTaskId);

  // Deck Room: paper is flat, square and framed with double rules; brass is what you press.
  const GRAIN = isDark
    ? "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.12'/></svg>\")"
    : "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .12  0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.18'/></svg>\")";
  const panel = DR ? {
    background: `${GRAIN}, ${theme.panel}`,
    border:`3px double ${theme.line}`,
    borderRadius:0, padding:"1.5rem 1.75rem", marginBottom:"1.25rem",
  } : {
    background: isDark
      ? `linear-gradient(145deg, ${theme.panel} 0%, ${theme.bg}cc 100%)`
      : theme.panel,
    border:`1px solid ${theme.panelBorder}`,
    boxShadow: isDark ? `inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.4)` : theme.shadowSoft,
    borderRadius:18, padding:"1.25rem 1.5rem", marginBottom:"1.1rem",
  };

  const inp = {
    background:"transparent", border:`1px solid ${DR ? theme.line : theme.panelBorder}`,
    borderRadius: DR ? 3 : 10, color:theme.text,
    fontFamily: DR ? "var(--font-display)" : "var(--font-body)", fontSize:"0.95rem",
    padding:"0.5rem 0.75rem", outline:"none", width:"100%", boxSizing:"border-box",
  };

  // btn(true) = commit plaque (velvet in a brass frame), btn("invite") = the one
  // parchment plaque per view, btn(false) = quiet outlined control.
  const btn = (primary=true) => {
    if (!DR) return {
      background:   primary ? theme.accent : "transparent",
      color:        primary ? (isDark?"#000":"#fff") : theme.accent,
      border:       primary ? "none" : `1px solid ${theme.accent}`,
      borderRadius: 10, padding:"0.45rem 1rem",
      fontFamily:"var(--font-body)",
      fontWeight:700, fontSize:"0.88rem", cursor:"pointer",
      letterSpacing:"0.03em", transition:"opacity 0.15s",
    };
    const caps = { fontFamily:"var(--font-caps)", textTransform:"uppercase", letterSpacing:"0.14em", fontWeight:500, fontSize:"0.8rem", cursor:"pointer", transition:"transform 0.1s, filter 0.15s" };
    if (primary === "invite") return { ...caps,
      background:`linear-gradient(180deg, ${theme.parchment} 0%, ${theme.parchmentLo} 100%)`,
      color:theme.parchmentInk, border:`2px solid ${theme.brass}`,
      outline:`1px solid ${theme.brassLo}`, outlineOffset:-4,
      borderRadius:10, boxShadow:theme.shadowMetal, padding:"0.55rem 1.4rem" };
    if (primary) return { ...caps,
      background:`linear-gradient(180deg, ${theme.velvetHi} 0%, ${theme.velvet} 100%)`,
      color:theme.cream, border:`2px solid ${theme.brass}`,
      borderRadius:10, boxShadow:theme.shadowMetal, padding:"0.5rem 1.2rem" };
    return { ...caps,
      background:"transparent", color:theme.accentInk, border:`1px solid ${theme.line}`,
      borderRadius:0, padding:"0.4rem 0.9rem", fontSize:"0.7rem" };
  };

  // Chips: rose marks only the active item, as a 2px underline.
  const pill = (active) => DR ? {
    background: active ? theme.card : "transparent",
    color:      active ? theme.text : theme.textMuted,
    border:`1px solid ${theme.line}`, borderRadius:0,
    borderBottom: active ? `2px solid ${theme.rose}` : `1px solid ${theme.line}`,
    padding:"0.35rem 0.85rem",
    fontFamily:"var(--font-caps)", textTransform:"uppercase",
    fontSize:"0.68rem", fontWeight:400, letterSpacing:"0.18em", cursor:"pointer",
    transition:"background 0.2s, color 0.2s",
  } : {
    background:   active ? theme.accent : `${theme.accent}18`,
    color:        active ? (isDark?"#000":"#fff") : theme.textMuted,
    border:"none", borderRadius:20, padding:"0.3rem 0.8rem",
    fontFamily:"var(--font-body)",
    fontSize:"0.78rem", fontWeight:700, cursor:"pointer",
    letterSpacing:"0.04em", transition:"all 0.2s",
    boxShadow: active ? `0 0 14px ${theme.accent}50` : "none",
  };

  const globalStyles = `
    :root{--font-body:${theme.fonts.body};--font-caps:${theme.fonts.caps};--font-display:${theme.fonts.display};}
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:${theme.bg};}
    ::placeholder{color:${theme.textMuted}70;font-family:var(--font-body);}
    input:focus,textarea:focus{border-color:${theme.accent}99!important;box-shadow:0 0 0 3px ${theme.accent}22!important;outline:none;}
    button:hover{opacity:${DR?1:0.82};${DR?"filter:brightness(1.08);":""}}
    ${DR ? `button:active{transform:translateY(1px);}
    button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid ${theme.primary}!important;outline-offset:2px;}
    .dr-rule{display:flex;align-items:center;gap:10px;color:${theme.accent};}
    .dr-rule::before,.dr-rule::after{content:"";height:1px;flex:1;background:${theme.line};}
    @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important;}}` : ""}
    textarea{resize:vertical;}
    select{background:${theme.panel};color:${theme.text};border:1px solid ${theme.panelBorder};border-radius:8px;padding:6px 10px;font-family:var(--font-body);font-size:0.9rem;outline:none;}
    ::-webkit-scrollbar{width:5px;}
    ::-webkit-scrollbar-thumb{background:${theme.panelBorder};border-radius:4px;}
    @keyframes gentlePulse{0%,100%{box-shadow:0 0 0 0 ${theme.accent}30;}50%{box-shadow:0 0 24px 10px ${theme.accent}45;}}
    @keyframes needTaskShake{0%,100%{transform:translateX(0);}20%,60%{transform:translateX(-4px);}40%,80%{transform:translateX(4px);}}
    @keyframes auroraWave{0%{transform:translateX(-120%) skewX(-12deg);opacity:0;}20%{opacity:${isDark?0.15:0.09};}80%{opacity:${isDark?0.15:0.09};}100%{transform:translateX(220%) skewX(-12deg);opacity:0;}}
    @keyframes auroraWave2{0%{transform:translateX(220%) skewX(12deg);opacity:0;}20%{opacity:${isDark?0.11:0.07};}80%{opacity:${isDark?0.11:0.07};}100%{transform:translateX(-120%) skewX(12deg);opacity:0;}}
    @keyframes timerGlow{0%,100%{filter:drop-shadow(0 0 8px ${phaseColor}55);}50%{filter:drop-shadow(0 0 32px ${phaseColor}88);}}
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
    @keyframes thresholdFadeIn{from{opacity:0;}to{opacity:1;}}
    .threshold-fade{opacity:0;animation:thresholdFadeIn 0.25s ease-out forwards;}
    .vignette{position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4));z-index:1001;}
    @keyframes intentionFade{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
    .intention-animate{opacity:0;transform:translateY(10px);animation:intentionFade 0.3s ease-out forwards;}
    .intention-prompt{font-size:0.9rem;opacity:0.85;margin-bottom:8px;}
    @keyframes breathe{0%{transform:scale(1);opacity:1;}50%{transform:scale(1.015);opacity:0.95;}100%{transform:scale(1);opacity:1;}}
    .timer-breath{animation:breathe 5s ease-in-out infinite;}
    @keyframes flashOut{from{opacity:1;}to{opacity:0;}}
    .completion-flash{position:fixed;inset:0;background:radial-gradient(circle, rgba(255,255,255,0.4), transparent 70%);animation:flashOut 0.8s ease-out forwards;pointer-events:none;z-index:999;}
    .task-item{transition:transform 0.12s ease,box-shadow 0.12s ease;}
    .task-item.dragging{transform:rotate(1deg) scale(1.02);box-shadow:0 4px 12px rgba(0,0,0,0.15);}
    .schedule-sidebar{width:272px;}
    @media(max-width:480px){.schedule-sidebar{width:100%;}}
  `;

  // ── Zen Mode ──────────────────────────────────────────────────
  if (zenMode) {
    return (
      <div style={{ minHeight:"100vh", background:theme.bg, fontFamily:"var(--font-body)", color:theme.text, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
        <style>{globalStyles}</style>
        {running && phase==="work" && <div className="aurora-wrap"><div className="aurora-1"/><div className="aurora-2"/><div className="aurora-3"/></div>}

        {showSkipModal && <SkipBreakModal theme={theme} onSkip={handleSkipBreak} onTakeBreak={handleTakeBreak} sessionsToday={sessionsToday} consecutiveSkips={consecutiveSkips}/>}
        {showTaskSwap  && <TaskSwapModal  theme={theme} tasks={tasks} completedCount={tasks.filter(t=>t.done).length} onSelect={handleTaskSwapSelect} onSkip={handleTaskSwapSkip}/>}

        {intention && (
          <div className="intention-float" style={{ marginBottom:"1.5rem", textAlign:"center" }}>
            <span style={{ fontFamily:"var(--font-body)", fontSize:"0.85rem", fontStyle:"italic", color: isDark ? "#a78bfa" : "#7c3aed", opacity:0.7, letterSpacing:"0.04em" }}>
              ✦ {intention}
            </span>
          </div>
        )}

        <div style={{ fontSize:"0.68rem", color:phaseColor, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"1.5rem", fontFamily:"var(--font-caps)" }}>
          {phase==="work" ? "Focus" : "Break"}
        </div>
        <div className={running?"timer-pulse":""}>
          <TimerRing pct={timerPct} color={phaseColor} running={running}>
            <div className="timer-breath" style={{ fontSize:DR?"3.6rem":"3.2rem", fontWeight:DR?400:600, letterSpacing:DR?"0":"-0.03em", color:theme.text, fontFamily:DR?"var(--font-display)":"var(--font-body)" }}>{fmt(timeLeft)}</div>
            {focusedTask
              ? <div style={{ fontSize:"0.75rem", color:phaseColor, maxWidth:150, textAlign:"center", marginTop:6, fontStyle:"italic", lineHeight:1.3, fontFamily:"var(--font-body)" }}>✦ {focusedTask.text}</div>
              : <div style={{ fontSize:"0.65rem", color:theme.textMuted, marginTop:6, fontStyle:"italic" }}>no task selected</div>
            }
          </TimerRing>
        </div>
        <div style={{ display:"flex", gap:"0.75rem", marginTop:"2rem", alignItems:"center" }}>
          {!running
            ? <button className={!focusedTaskId && phase==="work"?"start-pulse":""} style={{ ...btn(DR ? "invite" : true), fontSize:DR?"0.85rem":"1rem", padding:"0.7rem 2.2rem" }} onClick={handleStart}>▶ {phase==="work"?"Begin Focus":"Begin Break"}</button>
            : <button style={{ ...btn(true), fontSize:"1rem", padding:"0.7rem 2.2rem" }} onClick={handlePause}>⏸ Pause</button>
          }
          <button style={{ ...btn(false), padding:"0.7rem 1.2rem" }} onClick={handleReset}>↺</button>
        </div>
        {needTask && <div className="need-task" style={{ marginTop:"1rem", color:"#f87171", fontSize:"0.88rem", fontStyle:"italic" }}>Choose a task from the Tasks tab first.</div>}
        {!running && (
          <p style={{ marginTop:"1.5rem", fontSize:"0.85rem", fontStyle:"italic", color:theme.textMuted, opacity:0.65, fontFamily:"var(--font-body)", textAlign:"center" }}>
            Dropping into the quiet.
          </p>
        )}
        <div style={{ marginTop:"1rem", display:"flex", flexDirection:"column", alignItems:"center", gap:"0.4rem" }}>
          <div style={{ fontSize:"0.65rem", color:theme.textMuted, letterSpacing:"0.12em", fontFamily:"var(--font-caps)" }}>Z · exit &nbsp;·&nbsp; space · start/pause</div>
          <div style={{ fontSize:"0.72rem", color:theme.textMuted, fontStyle:"italic" }}>🔥 {streakLabel} · {sessionsToday} session{sessionsToday!==1?"s":""} today</div>
        </div>
        <button onClick={()=>setZenMode(false)} style={{ position:"fixed", top:"1.25rem", right:"1.25rem", ...btn(false), fontSize:"0.72rem", padding:"0.3rem 0.7rem", opacity:0.4 }}>✦ Exit</button>
        {showCompletionFlash && <div className="completion-flash"/>}
      </div>
    );
  }

  // ── Normal Mode ───────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:theme.bg, fontFamily:"var(--font-body)", color:theme.text, transition:"background 0.4s, color 0.3s", position:"relative", overflow:"hidden" }}>
      <style>{globalStyles}</style>
      {running && phase==="work" && <div className="aurora-wrap"><div className="aurora-1"/><div className="aurora-2"/><div className="aurora-3"/></div>}

      {showSkipModal      && <SkipBreakModal theme={theme} onSkip={handleSkipBreak} onTakeBreak={handleTakeBreak} sessionsToday={sessionsToday} consecutiveSkips={consecutiveSkips}/>}
      {showTaskSwap       && <TaskSwapModal  theme={theme} tasks={tasks} completedCount={tasks.filter(t=>t.done).length} onSelect={handleTaskSwapSelect} onSkip={handleTaskSwapSkip}/>}

      <div style={{ maxWidth:900, margin:"0 auto", padding:"2rem 1.25rem", position:"relative", zIndex:2 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.75rem", flexWrap:"wrap", gap:"0.75rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.7rem" }}>
            {DR && <Emblem name="moon-face" size={52}/>}
            <div>
            <div style={{ fontWeight:DR?400:600, fontSize:DR?"2.1rem":"1.8rem", color:theme.text, letterSpacing:DR?"0":"-0.02em", lineHeight:1, fontFamily:"var(--font-display)" }}>Sage & Steph</div>
            <div style={{ fontSize:"0.62rem", color:DR?theme.accentInk:theme.textMuted, letterSpacing:DR?"0.22em":"0.15em", textTransform:"uppercase", marginTop:DR?6:3, fontFamily:"var(--font-caps)" }}>Focus Dashboard · v{VERSION}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
            {DR && (
              <span style={{ display:"inline-flex", alignItems:"center", gap:"0.45rem", fontStyle:"italic", color:theme.textMuted, fontSize:"0.85rem" }}>
                <MoonPhase theme={theme} size={16}/>{moonOf(new Date()).name}
              </span>
            )}
            <LiveClock color={theme.textMuted}/>
            {/* The crescent toggle: Candlelight ↔ Daylight. The moon knob waxes as it turns on. */}
            {(() => {
              const day = theme.key === "daylight";
              const next = THEMES.find(t => t.key === (day ? "candlelight" : "daylight"));
              return (
                <button
                  role="switch" aria-checked={day} aria-label="Daylight mode"
                  title={day ? "Daylight · switch to Candlelight" : "Candlelight · switch to Daylight"}
                  onClick={() => switchTheme(next)}
                  style={{ display:"inline-flex", alignItems:"center", gap:"0.55rem", background:"none", border:"none", padding:0, cursor:"pointer", color:theme.textMuted }}
                >
                  <span style={{ position:"relative", width:58, height:30, flex:"none", borderRadius:999, background:"linear-gradient(180deg, #f1dca0 0%, #c9a35b 22%, #8a6630 48%, #b48a45 70%, #e4c784 88%, #9a743c 100%)", filter:"drop-shadow(0 2px 3px rgba(0,0,0,.4))" }}>
                    <span style={{ position:"absolute", inset:2, borderRadius:999, background: day ? "radial-gradient(circle at 50% 30%, #1d7a7d, #0f5960)" : "radial-gradient(circle at 50% 30%, #2e2145, #140f1e)", boxShadow:"inset 0 1px 3px rgba(0,0,0,.7)", transition:"background .18s ease" }}/>
                    <span style={{ position:"absolute", top:4, left: day ? 32 : 4, width:22, height:22, borderRadius:"50%", overflow:"hidden", background:"radial-gradient(circle at 35% 30%, #fbf1d4, #e9d7ae 60%, #c9a35b)", boxShadow:"0 1px 2px rgba(0,0,0,.6)", transition:"left .18s ease" }}>
                      <span style={{ position:"absolute", top:-3, left: day ? -26 : -9, width:22, height:22, borderRadius:"50%", background:"#140f1e", transition:"left .18s ease" }}/>
                    </span>
                  </span>
                  <span style={{ fontFamily:"var(--font-caps)", fontSize:"0.62rem", letterSpacing:"0.2em", textTransform:"uppercase" }}>{day ? "Daylight" : "Candlelight"}</span>
                </button>
              );
            })()}
            <button style={{ ...btn(false), fontSize:"0.72rem", padding:"0.3rem 0.65rem" }} onClick={()=>setZenMode(p=>!p)} title="Zen mode (Z)">{DR ? <span style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem" }}><LineIcon name="eye" size={15}/>Zen</span> : "⬡ Zen"}</button>
          </div>
        </div>

        {/* Timer Panel — the featured thing on the view */}
        <div style={{ ...panel, position:"relative" }}>
          {DR && <OrnateCorners color={theme.accentInk}/>}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:"0.75rem" }}>
            {DR
              ? <span className="dr-rule" style={{ width:"min(320px, 80%)", fontFamily:"var(--font-caps)", fontSize:"0.72rem", letterSpacing:"0.22em", textTransform:"uppercase", color:theme.accentInk }}>
                  <LineIcon name={phase==="work" ? "star" : "crescent"} size={13}/>{phaseLabel}<LineIcon name={phase==="work" ? "star" : "crescent"} size={13}/>
                </span>
              : <span style={{ background:`${phaseColor}22`, color:phaseColor, borderRadius:20, padding:"0.2rem 0.9rem", fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", fontFamily:"var(--font-caps)" }}>
                  {phaseLabel}
                </span>}
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
            <span style={{ fontSize:"0.65rem", color:theme.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"var(--font-caps)" }}>Custom:</span>
            <input value={customW} onChange={e=>setCustomW(e.target.value)} placeholder="Work min" onKeyDown={e=>e.key==="Enter"&&applyCustom()} style={{ ...inp, width:80, textAlign:"center", fontSize:"0.88rem" }}/>
            <span style={{ color:theme.textMuted, fontSize:"0.85rem" }}>/</span>
            <input value={customB} onChange={e=>setCustomB(e.target.value)} placeholder="Break min" onKeyDown={e=>e.key==="Enter"&&applyCustom()} style={{ ...inp, width:80, textAlign:"center", fontSize:"0.88rem" }}/>
            <button style={{ ...btn(false), padding:"0.45rem 0.75rem" }} onClick={applyCustom}>Set</button>
          </div>

          <div style={{ display:"flex", justifyContent:"center", marginBottom:"0.75rem" }}>
            <div className={running?"timer-pulse":""}>
              <TimerRing pct={timerPct} color={phaseColor} running={running}>
                <div className="timer-breath" style={{ fontSize:DR?"3rem":"2.6rem", fontWeight:DR?400:500, letterSpacing:DR?"0":"-0.03em", color:theme.text, fontFamily:DR?"var(--font-display)":"var(--font-body)" }}>{fmt(timeLeft)}</div>
                {focusedTask
                  ? <div style={{ fontSize:"0.68rem", color:phaseColor, maxWidth:130, textAlign:"center", marginTop:4, fontWeight:600, fontStyle:"italic", lineHeight:1.3 }}>✦ {focusedTask.text}</div>
                  : <div style={{ fontSize:"0.62rem", color:theme.textMuted, marginTop:4, textAlign:"center", fontStyle:"italic" }}>pick a task below</div>
                }
              </TimerRing>
            </div>
          </div>

          <div style={{ marginBottom:"1rem" }}>
            <IntentionChip intention={intention} theme={theme} onSet={handleSetIntention}/>
          </div>

          {needTask && <div className="need-task" style={{ textAlign:"center", color:theme.error || "#f87171", fontSize:"0.88rem", marginBottom:"0.6rem", fontStyle:"italic" }}>Choose a task to focus on first.</div>}

          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap", justifyContent:"center" }}>
            {!running
              ? <button className={!focusedTaskId && phase==="work"?"start-pulse":""} style={{ ...btn(DR ? "invite" : true), fontSize:DR?"0.82rem":"0.95rem", padding:"0.55rem 1.6rem" }} onClick={handleStart}>▶ {phase==="work"?"Begin Focus":"Begin Break"}</button>
              : <button style={{ ...btn(true), fontSize:"0.95rem", padding:"0.55rem 1.6rem" }} onClick={handlePause}>⏸ Pause</button>
            }
            <button style={{ ...btn(false), padding:"0.55rem 1rem" }} onClick={handleReset}>↺ Reset</button>
            <button style={{ ...pill(autoCycle), padding:"0.4rem 0.9rem" }} onClick={toggleAutoCycle} title="Auto-cycle: flow focus → break → focus automatically">
              {DR
                ? <span style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem" }}><LineIcon name="crescent" size={14}/>Auto-cycle: {autoCycle ? "on" : "off"}</span>
                : (autoCycle ? "🔁 Auto-cycle: on" : "🔁 Auto-cycle: off")}
            </button>
          </div>

          {autoCycle && phase==="break" && running && (
            <div style={{ textAlign:"center", marginTop:"0.6rem" }}>
              <span onClick={() => { handlePause(); setShowSkipModal(true); }} style={{ fontSize:"0.8rem", color:theme.accent, cursor:"pointer", fontStyle:"italic" }}>
                {DR ? <><LineIcon name="sprig" size={14}/> skip break</> : "🌿 skip break"}
              </span>
            </div>
          )}

          <div style={{ textAlign:"center", marginTop:"0.75rem" }}>
            <div style={{ fontSize:"0.75rem", color:theme.textMuted, fontStyle:"italic" }}>
              {DR ? <LineIcon name="candle" size={14} style={{ color:theme.accentInk }}/> : "🔥"} {streakLabel} · {sessionsToday} session{sessionsToday!==1?"s":""} today
            </div>
          </div>

          {!running && timeLeft<(workMins*60) && timeLeft>0 && phase==="work" && focusedTaskId && (
            <div style={{ textAlign:"center", marginTop:"0.6rem", fontSize:"0.82rem", color:theme.accent, cursor:"pointer", fontStyle:"italic" }} onClick={handleStart}>
              ⏸ Paused — resume?
            </div>
          )}
        </div>

        {/* Soundscape Panel */}
        <ErrorBoundary label="ambience">
          <SoundscapePanel theme={theme} activeSounds={activeSounds} soundVol={soundVol} onToggle={toggleSound} onVolumeChange={setSoundVol} panelStyle={panel}/>
        </ErrorBoundary>

        {/* Tab Bar */}
        <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1rem", flexWrap:"wrap" }}>
          {(DR
            ? [["tasks","cards","Tasks"],["pi","crystal","PI Parking Lot"],["ledger","planchette","Ledger"]]
            : [["tasks",null,"📋 Tasks"],["pi",null,"🗂 PI Parking Lot"],["ledger",null,"📜 Ledger"]]
          ).map(([k,icon,l])=>(
            <button key={k} style={{ ...pill(activeTab===k), fontSize:DR?"0.7rem":"0.82rem", padding:"0.45rem 1rem", display:"inline-flex", alignItems:"center", gap:"0.45rem" }} onClick={()=>setActiveTab(k)}>
              {icon && <LineIcon name={icon} size={15} style={{ color:theme.accentInk }}/>}{l}
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {activeTab==="tasks" && (
          <ErrorBoundary label="tasks">
          <DailyOps
            theme={theme} panelStyle={panel} btnStyle={btn} pillStyle={pill} inpStyle={inp}
            tasks={tasks} focusedTaskId={focusedTaskId}
            onFocusOp={focusOp} onToggleLinked={toggleTask}
          />
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
          </ErrorBoundary>
        )}

        {/* PI Parking Lot Tab */}
        {activeTab==="pi" && (
          <ErrorBoundary label="PI parking lot">
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
          </ErrorBoundary>
        )}

        {/* Ledger Tab */}
        {activeTab==="ledger" && (
          <ErrorBoundary label="ledger">
            <LedgerTab theme={theme} panelStyle={panel} pillStyle={pill}/>
          </ErrorBoundary>
        )}

        {/* Footer */}
        {DR && <StarDivider color={theme.accentInk} width={90} style={{ marginTop:"1.75rem" }}/>}
        <div style={{ textAlign:"center", marginTop:"1.5rem", fontSize:"0.6rem", color:theme.textMuted, letterSpacing:"0.1em", fontFamily:"var(--font-caps)" }}>
          space · start/pause &nbsp;·&nbsp; Z · zen &nbsp;·&nbsp; click focus on a task to begin
        </div>
      </div>
      {showCompletionFlash && <div className="completion-flash"/>}
    </div>
  );
}
