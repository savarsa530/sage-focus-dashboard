// ═══════════════════════════════════════════════════════════════════
// Sage & Steph Focus Dashboard — v5.1.0
// Fixes: layerable soundscapes · task-gated timer · custom work/break
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import PIReadiness from "./PIReadiness";

const VERSION = "5.1.1";

// ── THEMES ──────────────────────────────────────────────────────────
const THEMES = [
  { key:"obsidian", label:"Obsidian", accent:"#c084fc", bg:"#0d0b14", panel:"#18152a", panelBorder:"#2a2440", text:"#e8e2f8", textMuted:"#7c6fa0", timerRing:"#c084fc", auroraColors:["#c084fc","#818cf8","#a78bfa"], isDark:true },
  { key:"solar",    label:"Solar",    accent:"#f97316", bg:"#fefaf4", panel:"#fff7ed", panelBorder:"#fde8cc", text:"#431407", textMuted:"#9a7151", timerRing:"#f97316", auroraColors:["#fbbf24","#f97316","#fcd34d"], isDark:false },
  { key:"electric", label:"Electric", accent:"#38bdf8", bg:"#f0f9ff", panel:"#e0f2fe", panelBorder:"#bae6fd", text:"#0c2a42", textMuted:"#4b7fa3", timerRing:"#38bdf8", auroraColors:["#38bdf8","#818cf8","#7dd3fc"], isDark:false },
  { key:"sage",     label:"Sage",     accent:"#4ade80", bg:"#f2f7f2", panel:"#e8f5e8", panelBorder:"#c3e6c3", text:"#0f2d0f", textMuted:"#4a7a4a", timerRing:"#4ade80", auroraColors:["#4ade80","#86efac","#34d399"], isDark:false },
  { key:"bloom",    label:"Bloom 🌸", accent:"#f472b6", bg:"#fff0f7", panel:"#fce7f3", panelBorder:"#fbcfe8", text:"#500724", textMuted:"#9d4068", timerRing:"#f472b6", auroraColors:["#f472b6","#f9a8d4","#fb7185"], isDark:false },
];

// ── TIMER PRESETS (work mins / break mins) ───────────────────────────
const PRESETS = [
  { label:"25 / 5",  work:25, brk:5  },
  { label:"50 / 10", work:50, brk:10 },
  { label:"90 / 20", work:90, brk:20 },
  { label:"15 / 3",  work:15, brk:3  },
];

// ── SOUNDSCAPE DEFINITIONS ────────────────────────────────────────────
// Each sound is independently toggleable; all can run simultaneously.
const SOUND_DEFS = {
  rain:     { label:"🌧 Rain",          color:"#7B9EA8" },
  brown:    { label:"🌫 Brown Noise",   color:"#8B7355" },
  binaural: { label:"🎵 Binaural",      color:"#9B7ED8" },
  white:    { label:"⬜ White Noise",   color:"#B8B8B8" },
};

// ── PI constants ──────────────────────────────────────────────────────
const PI_CYCLES   = ["2026.2","2026.3","2026.4","2027.1"];
const PI_STATUSES = [
  { key:"seeding",  label:"🌱 Seeding"  },
  { key:"digging",  label:"⛏️ Digging"  },
  { key:"ready",    label:"✅ Ready"    },
  { key:"parked",   label:"🅿️ Parked"   },
];
// ── AUDIO ENGINE ──────────────────────────────────────────────────────
// Each sound key gets its own AudioContext + nodes so they're fully independent.
const audioRefs = {}; // { [key]: { ctx, gain, src } }

function buildNoise(ctx, type) {
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d   = buf.getChannelData(0);
  if (type === "white") {
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  } else if (type === "brown") {
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  } else if (type === "rain") {
    // Layered: soft brown bed + sparse high-freq drip impulses
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.015 * w) / 1.015;
      d[i] = last * 2.5;
      // random drip impulses
      if (Math.random() < 0.0012) d[i] += (Math.random() * 2 - 1) * 0.6;
    }
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

function buildBinaural(ctx) {
  // Classic binaural: left ear 200 Hz, right ear 210 Hz → 10 Hz beat
  const merger = ctx.createChannelMerger(2);
  const oL = ctx.createOscillator();
  const oR = ctx.createOscillator();
  oL.frequency.value = 200;
  oR.frequency.value = 210;
  oL.connect(merger, 0, 0);
  oR.connect(merger, 0, 1);
  oL.start(); oR.start();
  return { node: merger, cleanup: () => { oL.stop(); oR.stop(); } };
}

function startSound(key, volume) {
  stopSound(key); // clean up any existing
  const ctx  = new (window.AudioContext || window.webkitAudioContext)();
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.2);
  gain.connect(ctx.destination);

  let cleanup = null;

  if (key === "binaural") {
    const { node, cleanup: c } = buildBinaural(ctx);
    node.connect(gain);
    cleanup = c;
  } else {
    const noiseType = key === "rain" ? "rain" : key === "brown" ? "brown" : "white";
    const src = buildNoise(ctx, noiseType);
    // Add low-pass filter for rain/brown to warm it up
    if (key === "rain" || key === "brown") {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = key === "rain" ? 800 : 300;
      src.connect(filter);
      filter.connect(gain);
    } else {
      src.connect(gain);
    }
    src.start();
    cleanup = () => { try { src.stop(); } catch(_){} };
  }

  audioRefs[key] = { ctx, gain, cleanup };
}

function stopSound(key) {
  const ref = audioRefs[key];
  if (!ref) return;
  try {
    ref.gain.gain.linearRampToValueAtTime(0, ref.ctx.currentTime + 0.4);
    setTimeout(() => {
      ref.cleanup?.();
      try { ref.ctx.close(); } catch(_){}
    }, 500);
  } catch(_){}
  delete audioRefs[key];
}

function setVolume(key, vol) {
  const ref = audioRefs[key];
  if (!ref) return;
  ref.gain.gain.cancelScheduledValues(ref.ctx.currentTime);
  ref.gain.gain.linearRampToValueAtTime(vol, ref.ctx.currentTime + 0.1);
}

function stopAllSounds() {
  Object.keys(audioRefs).forEach(stopSound);
}

// ── HELPERS ───────────────────────────────────────────────────────────
const fmt  = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const pad  = (n) => String(n).padStart(2,"0");
const uuid = ()  => crypto.randomUUID();

function LiveClock({ color }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => { const d = new Date(); setT(`${pad(d.getHours())}:${pad(d.getMinutes())}`); };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  return <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:"0.85rem", color, letterSpacing:"0.05em" }}>{t}</span>;
}

function TimerRing({ pct, color, running, children }) {
  const r = 80, circ = 2 * Math.PI * r;
  return (
    <div style={{ position:"relative", width:200, height:200 }}>
      <svg width={200} height={200} style={{ transform:"rotate(-90deg)", ...(running ? { filter:`drop-shadow(0 0 14px ${color}55)` } : {}) }}>
        <circle cx={100} cy={100} r={r} fill="none" stroke={`${color}22`} strokeWidth={10}/>
        <circle cx={100} cy={100} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
          strokeLinecap="round" style={{ transition:"stroke-dashoffset 0.5s ease" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {

  // ── Theme ─────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    const k = localStorage.getItem("sage_theme_v5") || "obsidian";
    return THEMES.find(t => t.key === k) || THEMES[0];
  });
  const switchTheme = (t) => { setTheme(t); localStorage.setItem("sage_theme_v5", t.key); };

  // ── Focused task (gating the timer) — declared early so timer can reference it
  const [focusedTaskId, setFocusedTaskId] = useState(null);

  // ── Tasks — declared early so timer tick can call setTasks ───
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sage_tasks_v5")||"[]"); } catch { return []; }
  });
  const saveTasks = (list) => { setTasks(list); localStorage.setItem("sage_tasks_v5", JSON.stringify(list)); };

  // ── Timer: work/break cycle ───────────────────────────────────
  const [workMins,  setWorkMins]  = useState(25);
  const [brkMins,   setBrkMins]   = useState(5);
  const [customW,   setCustomW]   = useState("");
  const [customB,   setCustomB]   = useState("");
  const [phase,     setPhase]     = useState("work");
  const [timeLeft,  setTimeLeft]  = useState(25 * 60);
  const [running,   setRunning]   = useState(false);
  const [needTask,  setNeedTask]  = useState(false);
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

  // Sessions & streak
  const [sessionsToday, setSessionsToday] = useState(() => {
    const d = localStorage.getItem("sage_sessions_date");
    return d === new Date().toDateString() ? Number(localStorage.getItem("sage_sessions_count")||0) : 0;
  });

  const bumpStreak = () => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now()-86400000).toDateString();
    const last = localStorage.getItem("sage_streak_date");
    const cur  = Number(localStorage.getItem("sage_streak")||0);
    const next = last === yesterday ? cur+1 : last === today ? cur : 1;
    localStorage.setItem("sage_streak", String(next));
    localStorage.setItem("sage_streak_date", today);
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        // Accumulate focus seconds on the currently focused task (work phase only)
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
              localStorage.setItem("sage_sessions_date", new Date().toDateString());
              localStorage.setItem("sage_sessions_count", String(nc));
              bumpStreak();
              setPhase("break"); setTimeLeft(brkMins * 60); setRunning(false);
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
  }, [running, phase, workMins, brkMins, focusedTaskId]);

  // clicking "focus" on a task → set it AND auto-start
  const focusTask = (taskId) => {
    if (focusedTaskId === taskId) {
      setFocusedTaskId(null);
      setRunning(false);
    } else {
      setFocusedTaskId(taskId);
      setNeedTask(false);
      if (phase === "work" && timeLeft === workMins * 60) {
        // fresh session — auto-start
        setRunning(true);
      }
    }
  };

  // Start button — requires a focused task
  const handleStart = () => {
    if (!focusedTaskId) {
      setNeedTask(true);
      setTimeout(() => setNeedTask(false), 3000);
      return;
    }
    setRunning(true);
  };

  const handlePause = () => setRunning(false);
  const handleReset = () => { setRunning(false); setPhase("work"); setTimeLeft(workMins * 60); };

  // ── Soundscape: multi-toggle ──────────────────────────────────
  const [activeSounds, setActiveSounds] = useState({}); // { [key]: bool }
  const [soundVol, setSoundVol] = useState(0.35);

  const toggleSound = (key) => {
    setActiveSounds(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (next[key]) startSound(key, soundVol);
      else stopSound(key);
      return next;
    });
  };

  useEffect(() => {
    // sync volume to all active sounds
    Object.keys(activeSounds).forEach(k => { if (activeSounds[k]) setVolume(k, soundVol); });
  }, [soundVol]);

  useEffect(() => () => stopAllSounds(), []);

  // ── Tasks continued ───────────────────────────────────────────
  const [newTask,       setNewTask]       = useState("");
  const [taskSort,      setTaskSort]      = useState({ by:"default", asc:true });
  const [doneToBottom,  setDoneToBottom]  = useState(true);
  const [dragId,        setDragId]        = useState(null);
  const [dragOverId,    setDragOverId]    = useState(null);

  // Drag is only available on Default sort (other sorts define order logically)
  const canDrag = taskSort.by === "default";

  const addTask = () => {
    if (!newTask.trim()) return;
    // Append at end: give it an order value = current max + 1
    const maxOrder = tasks.reduce((m, t) => Math.max(m, t.order||0), 0);
    saveTasks([...tasks, { id:uuid(), text:newTask.trim(), done:false, priority:"medium", focusSecs:0, order:maxOrder+1, createdAt:Date.now() }]);
    setNewTask("");
  };

  const toggleTask    = (id) => saveTasks(tasks.map(t => t.id===id ? {...t, done:!t.done} : t));
  const deleteTask    = (id) => { if (focusedTaskId===id) { setFocusedTaskId(null); setRunning(false); } saveTasks(tasks.filter(t=>t.id!==id)); };
  const cyclePriority = (id) => {
    const o = ["low","medium","high"];
    saveTasks(tasks.map(t => t.id===id ? {...t, priority:o[(o.indexOf(t.priority)+1)%3]} : t));
  };

  const pColor   = (p) => ({ high:"#f87171", medium:theme.accent, low:theme.textMuted }[p]);
  const pLabel   = (p) => ({ high:"H · High priority", medium:"M · Medium priority", low:"L · Low priority" }[p]);
  const pNum     = (p) => ({ high:3, medium:2, low:1 }[p]);
  const fmtMins  = (s) => s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s/60)}m` : `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;

  // Sort + done-to-bottom
  const sortedTasks = (() => {
    let list = [...tasks];
    if (doneToBottom) list.sort((a, b) => (a.done===b.done) ? 0 : a.done ? 1 : -1);
    if (taskSort.by === "default") {
      // stable order by .order field; doneToBottom already applied above
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

  // Drag-and-drop handlers (only fires when canDrag)
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

  const focusedTask = tasks.find(t => t.id === focusedTaskId);

  // ── Side Quests ───────────────────────────────────────────────
  const [quests, setQuests] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sage_quests_v5")||"[]"); } catch { return []; }
  });
  const [newQuest, setNewQuest] = useState("");
  const saveQuests = (list) => { setQuests(list); localStorage.setItem("sage_quests_v5", JSON.stringify(list)); };
  const addQuest    = () => { if (!newQuest.trim()) return; saveQuests([...quests, { id:uuid(), text:newQuest.trim(), createdAt:Date.now() }]); setNewQuest(""); };
  const deleteQuest = (id) => saveQuests(quests.filter(q=>q.id!==id));
  const promoteQuest= (q)  => { saveTasks([...tasks, { id:uuid(), text:q.text, done:false, priority:"medium", createdAt:Date.now() }]); saveQuests(quests.filter(x=>x.id!==q.id)); };

  // ── Streak display ────────────────────────────────────────────
  const streak = Number(localStorage.getItem("sage_streak")||0);
  const streakLabel = streak===0 ? "Start your streak!" : streak===1 ? "1 day 🌱" : `${streak} days 🔥`;

  // ── PI Parking Lot ────────────────────────────────────────────
  const [piItems, setPiItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sage_pi_lot_v5")||"[]"); } catch { return []; }
  });
  const [piExpanded, setPiExpanded] = useState(null);
  const [showAddPi,  setShowAddPi]  = useState(false);
  const [newPi, setNewPi] = useState({ pi:"2026.2", title:"", objectives:"", risks:"", status:"seeding" });
  const savePiItems  = (list) => { setPiItems(list); localStorage.setItem("sage_pi_lot_v5", JSON.stringify(list)); };
  const addPiItem    = () => { if (!newPi.title.trim()) return; savePiItems([...piItems, { ...newPi, id:uuid(), createdAt:Date.now() }]); setNewPi({ pi:"2026.2", title:"", objectives:"", risks:"", status:"seeding" }); setShowAddPi(false); };
  const updatePiItem = (id,f,v) => savePiItems(piItems.map(x=>x.id===id ? {...x,[f]:v} : x));
  const deletePiItem = (id) => savePiItems(piItems.filter(x=>x.id!==id));

  // ── UI state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("tasks");
  const [zenMode,   setZenMode]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA") return;
      if (e.key===" ")  { e.preventDefault(); running ? handlePause() : handleStart(); }
      if (e.key==="z"||e.key==="Z") setZenMode(p=>!p);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [running, focusedTaskId]);

  // ── STYLES ────────────────────────────────────────────────────
  const auroraC = theme.auroraColors;

  const panel = {
    background:   theme.panel,
    border:       `1px solid ${theme.panelBorder}`,
    borderRadius: 18,
    padding:      "1.25rem 1.5rem",
    marginBottom: "1.1rem",
  };

  const inp = {
    background:   "transparent",
    border:       `1px solid ${theme.panelBorder}`,
    borderRadius: 10,
    color:        theme.text,
    fontFamily:   "'Barlow',sans-serif",
    fontSize:     "0.9rem",
    padding:      "0.5rem 0.75rem",
    outline:      "none",
    width:        "100%",
    boxSizing:    "border-box",
  };

  const btn = (primary=true) => ({
    background:   primary ? theme.accent : "transparent",
    color:        primary ? (theme.isDark?"#000":"#fff") : theme.accent,
    border:       primary ? "none" : `1px solid ${theme.accent}`,
    borderRadius: 10,
    padding:      "0.45rem 1rem",
    fontFamily:   "'Barlow',sans-serif",
    fontWeight:   700,
    fontSize:     "0.82rem",
    cursor:       "pointer",
    letterSpacing:"0.02em",
    transition:   "opacity 0.15s",
  });

  const pill = (active) => ({
    background:   active ? theme.accent : `${theme.accent}18`,
    color:        active ? (theme.isDark?"#000":"#fff") : theme.textMuted,
    border:       "none",
    borderRadius: 20,
    padding:      "0.3rem 0.8rem",
    fontFamily:   "'Barlow',sans-serif",
    fontSize:     "0.75rem",
    fontWeight:   700,
    cursor:       "pointer",
    letterSpacing:"0.04em",
    transition:   "all 0.15s",
  });

  // ── PHASE LABEL ───────────────────────────────────────────────
  const phaseLabel = phase==="work" ? "Focus" : "Break";
  const phaseColor = phase==="work" ? theme.timerRing : "#86efac";

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  // Shared CSS (injected whether zen or not)
  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:${theme.bg};}
    ::placeholder{color:${theme.textMuted}88;}
    input:focus,textarea:focus{border-color:${theme.accent}88!important;outline:none;}
    button:hover{opacity:0.82;}
    textarea{resize:vertical;}
    select{background:${theme.panel};color:${theme.text};border:1px solid ${theme.panelBorder};border-radius:8px;padding:6px 10px;font-family:'Barlow',sans-serif;font-size:0.85rem;outline:none;}
    ::-webkit-scrollbar{width:5px;}
    ::-webkit-scrollbar-thumb{background:${theme.panelBorder};border-radius:4px;}
    @keyframes gentlePulse{0%,100%{box-shadow:0 0 0 0 ${theme.accent}40;}50%{box-shadow:0 0 16px 6px ${theme.accent}35;}}
    @keyframes needTaskShake{0%,100%{transform:translateX(0);}20%,60%{transform:translateX(-4px);}40%,80%{transform:translateX(4px);}}
    @keyframes auroraWave{0%{transform:translateX(-120%) skewX(-12deg);opacity:0;}20%{opacity:${theme.isDark?0.15:0.09};}80%{opacity:${theme.isDark?0.15:0.09};}100%{transform:translateX(220%) skewX(-12deg);opacity:0;}}
    @keyframes auroraWave2{0%{transform:translateX(220%) skewX(12deg);opacity:0;}20%{opacity:${theme.isDark?0.11:0.07};}80%{opacity:${theme.isDark?0.11:0.07};}100%{transform:translateX(-120%) skewX(12deg);opacity:0;}}
    @keyframes timerGlow{0%,100%{filter:drop-shadow(0 0 6px ${phaseColor}40);}50%{filter:drop-shadow(0 0 22px ${phaseColor}66);}}
    .aurora-wrap{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;}
    .aurora-1{position:absolute;width:60%;height:35%;top:15%;left:0;background:linear-gradient(90deg,transparent,${auroraC[0]},transparent);border-radius:50%;animation:auroraWave 13s ease-in-out infinite;}
    .aurora-2{position:absolute;width:50%;height:30%;top:45%;left:20%;background:linear-gradient(90deg,transparent,${auroraC[1]},transparent);border-radius:50%;animation:auroraWave2 18s ease-in-out infinite;animation-delay:5s;}
    .aurora-3{position:absolute;width:70%;height:25%;top:65%;left:10%;background:linear-gradient(90deg,transparent,${auroraC[2]},transparent);border-radius:50%;animation:auroraWave 22s ease-in-out infinite;animation-delay:10s;}
    .timer-pulse{animation:timerGlow 3s ease-in-out infinite;}
    .start-pulse{animation:gentlePulse 2.5s ease-in-out infinite;}
    .need-task{animation:needTaskShake 0.5s ease;}
  `;

  // ── ZEN MODE: full-screen replacement, nothing else renders ──
  if (zenMode) {
    return (
      <div style={{ minHeight:"100vh", background:theme.bg, fontFamily:"'Barlow',sans-serif", color:theme.text, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
        <style>{globalStyles}</style>

        {/* Aurora in zen too when running */}
        {running && phase==="work" && <div className="aurora-wrap"><div className="aurora-1"/><div className="aurora-2"/><div className="aurora-3"/></div>}

        {/* Phase label */}
        <div style={{ fontSize:"0.68rem", color:phaseColor, fontWeight:800, letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:"1.5rem" }}>
          {phase==="work" ? "Focus" : "Break"}
        </div>

        {/* Big ring */}
        <div className={running?"timer-pulse":""}>
          <TimerRing pct={timerPct} color={phaseColor} running={running}>
            <div style={{ fontSize:"3.2rem", fontWeight:900, letterSpacing:"-0.03em", color:theme.text }}>{fmt(timeLeft)}</div>
            {focusedTask
              ? <div style={{ fontSize:"0.78rem", color:phaseColor, maxWidth:150, textAlign:"center", marginTop:6, fontWeight:700, lineHeight:1.3 }}>✦ {focusedTask.text}</div>
              : <div style={{ fontSize:"0.65rem", color:theme.textMuted, marginTop:6 }}>no task selected</div>
            }
          </TimerRing>
        </div>

        {/* Controls */}
        <div style={{ display:"flex", gap:"0.75rem", marginTop:"2rem", alignItems:"center" }}>
          {!running
            ? <button className={!focusedTaskId?"start-pulse":""} style={{ ...btn(true), fontSize:"1rem", padding:"0.7rem 2.2rem" }} onClick={handleStart}>
                ▶ {phase==="work"?"Start Focus":"Start Break"}
              </button>
            : <button style={{ ...btn(true), fontSize:"1rem", padding:"0.7rem 2.2rem" }} onClick={handlePause}>⏸ Pause</button>
          }
          <button style={{ ...btn(false), padding:"0.7rem 1.2rem" }} onClick={handleReset}>↺</button>
        </div>

        {/* Need-task nudge in zen */}
        {needTask && (
          <div className="need-task" style={{ marginTop:"1rem", color:"#f87171", fontSize:"0.82rem", fontWeight:700 }}>
            👆 Pick a task from the Tasks tab first!
          </div>
        )}

        {/* Exit hint + streak */}
        <div style={{ marginTop:"2rem", display:"flex", flexDirection:"column", alignItems:"center", gap:"0.4rem" }}>
          <div style={{ fontSize:"0.68rem", color:theme.textMuted, letterSpacing:"0.1em" }}>
            Z to exit · space to start/pause
          </div>
          <div style={{ fontSize:"0.72rem", color:theme.textMuted }}>
            🔥 {streakLabel} · {sessionsToday} session{sessionsToday!==1?"s":""} today
          </div>
        </div>

        {/* Tiny exit button */}
        <button
          onClick={()=>setZenMode(false)}
          style={{ position:"fixed", top:"1.25rem", right:"1.25rem", ...btn(false), fontSize:"0.72rem", padding:"0.3rem 0.7rem", opacity:0.5 }}
        >
          ✦ Exit
        </button>
      </div>
    );
  }

  // ── NORMAL MODE ──────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:theme.bg, fontFamily:"'Barlow',sans-serif", color:theme.text, transition:"background 0.4s, color 0.3s", position:"relative", overflow:"hidden" }}>
      <style>{globalStyles}</style>

      {/* Aurora — only when running + focus phase */}
      {running && phase==="work" && <div className="aurora-wrap"><div className="aurora-1"/><div className="aurora-2"/><div className="aurora-3"/></div>}

      <div style={{ maxWidth:900, margin:"0 auto", padding:"2rem 1.25rem", position:"relative", zIndex:2 }}>

        {/* ════ HEADER ════ */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.75rem", flexWrap:"wrap", gap:"0.75rem" }}>
          <div>
            <div style={{ fontWeight:900, fontSize:"1.65rem", color:theme.text, letterSpacing:"-0.02em", lineHeight:1 }}>Sage & Steph</div>
            <div style={{ fontSize:"0.68rem", color:theme.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", marginTop:2 }}>Focus Dashboard · v{VERSION}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
            <LiveClock color={theme.textMuted}/>
            <div style={{ display:"flex", gap:"0.35rem", alignItems:"center" }}>
              {THEMES.map(t => (
                <button key={t.key} onClick={()=>switchTheme(t)} title={t.label} style={{ width:18, height:18, borderRadius:"50%", background:t.accent, border:theme.key===t.key?`2px solid ${theme.text}`:"2px solid transparent", cursor:"pointer", padding:0, transition:"transform 0.15s", transform:theme.key===t.key?"scale(1.3)":"scale(1)" }}/>
              ))}
            </div>
            <button style={{ ...btn(false), fontSize:"0.72rem", padding:"0.3rem 0.65rem" }} onClick={()=>setZenMode(p=>!p)} title="Zen mode (Z)">
              {zenMode ? "✦ Exit" : "⬡ Zen"}
            </button>
          </div>
        </div>

        {/* ════ TIMER PANEL ════ */}
        <div style={panel}>

          {/* Phase badge */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:"0.75rem" }}>
            <span style={{ background:`${phaseColor}22`, color:phaseColor, borderRadius:20, padding:"0.2rem 0.9rem", fontSize:"0.7rem", fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase" }}>
              {phaseLabel}
            </span>
          </div>

          {/* Preset pills */}
          <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", justifyContent:"center", marginBottom:"0.75rem" }}>
            {PRESETS.map(p => (
              <button key={p.label} style={pill(workMins===p.work && brkMins===p.brk)} onClick={()=>applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", justifyContent:"center", marginBottom:"1rem", flexWrap:"wrap" }}>
            <span style={{ fontSize:"0.72rem", color:theme.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Custom:</span>
            <input
              value={customW} onChange={e=>setCustomW(e.target.value)}
              placeholder="Work min"
              onKeyDown={e=>e.key==="Enter"&&applyCustom()}
              style={{ ...inp, width:80, textAlign:"center" }}
            />
            <span style={{ color:theme.textMuted, fontSize:"0.85rem" }}>/</span>
            <input
              value={customB} onChange={e=>setCustomB(e.target.value)}
              placeholder="Break min"
              onKeyDown={e=>e.key==="Enter"&&applyCustom()}
              style={{ ...inp, width:80, textAlign:"center" }}
            />
            <button style={{ ...btn(false), padding:"0.45rem 0.75rem" }} onClick={applyCustom}>Set</button>
          </div>

          {/* Ring */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:"0.75rem" }}>
            <div className={running?"timer-pulse":""}>
              <TimerRing pct={timerPct} color={phaseColor} running={running}>
                <div style={{ fontSize:"2.4rem", fontWeight:900, letterSpacing:"-0.03em", color:theme.text }}>{fmt(timeLeft)}</div>
                {focusedTask ? (
                  <div style={{ fontSize:"0.68rem", color:phaseColor, maxWidth:130, textAlign:"center", marginTop:4, fontWeight:700 }}>
                    ✦ {focusedTask.text}
                  </div>
                ) : (
                  <div style={{ fontSize:"0.65rem", color:theme.textMuted, marginTop:4, textAlign:"center" }}>
                    pick a task below
                  </div>
                )}
              </TimerRing>
            </div>
          </div>

          {/* Need-task nudge */}
          {needTask && (
            <div className="need-task" style={{ textAlign:"center", color:"#f87171", fontSize:"0.82rem", marginBottom:"0.6rem", fontWeight:700 }}>
              👆 Choose a task to focus on first!
            </div>
          )}

          {/* Controls */}
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap", justifyContent:"center" }}>
            {!running ? (
              <button
                className={!focusedTaskId?"start-pulse":""}
                style={{ ...btn(true), fontSize:"0.9rem", padding:"0.55rem 1.6rem" }}
                onClick={handleStart}
              >
                ▶ {phase==="work"?"Start Focus":"Start Break"}
              </button>
            ) : (
              <button style={{ ...btn(true), fontSize:"0.9rem", padding:"0.55rem 1.6rem" }} onClick={handlePause}>
                ⏸ Pause
              </button>
            )}
            <button style={{ ...btn(false), padding:"0.55rem 1rem" }} onClick={handleReset}>↺ Reset</button>
            <div style={{ fontSize:"0.78rem", color:theme.textMuted }}>
              🔥 {streakLabel} · {sessionsToday} session{sessionsToday!==1?"s":""} today
            </div>
          </div>

          {/* Paused reminder */}
          {!running && timeLeft<(workMins*60) && timeLeft>0 && phase==="work" && focusedTaskId && (
            <div style={{ textAlign:"center", marginTop:"0.6rem", fontSize:"0.78rem", color:theme.accent, cursor:"pointer", textDecoration:"underline dotted" }} onClick={handleStart}>
              ⏸ Paused — click to resume
            </div>
          )}
        </div>

        {/* ════ SOUNDSCAPE PANEL ════ */}
        {!zenMode && (
          <div style={{ ...panel, display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
            <span style={{ fontSize:"0.68rem", fontWeight:700, color:theme.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", minWidth:64 }}>Ambience</span>
            <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", flex:1 }}>
              {Object.entries(SOUND_DEFS).map(([key, def]) => {
                const on = !!activeSounds[key];
                return (
                  <button key={key} onClick={()=>toggleSound(key)} style={{
                    padding:"0.35rem 0.85rem", borderRadius:20, fontSize:"0.78rem", fontWeight:700, cursor:"pointer",
                    fontFamily:"'Barlow',sans-serif", letterSpacing:"0.03em",
                    background: on ? `${def.color}28` : "transparent",
                    border: `1px solid ${on ? def.color : theme.panelBorder}`,
                    color: on ? def.color : theme.textMuted,
                    transition:"all 0.2s",
                  }}>
                    {def.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
              <span style={{ fontSize:"0.68rem", color:theme.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" }}>Vol</span>
              <input type="range" min={0} max={1} step={0.05} value={soundVol}
                onChange={e=>setSoundVol(Number(e.target.value))}
                style={{ width:72, accentColor:theme.accent }}
              />
            </div>
          </div>
        )}

        {/* ════ TAB BAR ════ */}
        {!zenMode && (
          <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1rem", flexWrap:"wrap" }}>
            {[["tasks","📋 Tasks"],["pi","🗂 PI Parking Lot"],["readiness","🧭 PI Readiness"]].map(([k,l])=>(
              <button key={k} style={{ ...pill(activeTab===k), fontSize:"0.8rem", padding:"0.4rem 1rem" }} onClick={()=>setActiveTab(k)}>{l}</button>
            ))}
          </div>
        )}

        {/* ════ TASKS TAB ════ */}
        {!zenMode && activeTab==="tasks" && (
          <>
            {/* Task input */}
            <div style={panel}>
              <div style={{ fontSize:"0.68rem", fontWeight:700, color:theme.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.7rem" }}>Today's Focus</div>
              <div style={{ display:"flex", gap:"0.5rem" }}>
                <input style={inp} placeholder="Add a task…" value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()}/>
                <button style={btn(true)} onClick={addTask}>Add</button>
              </div>
            </div>

            {/* Task list */}
            <div style={panel}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.75rem", flexWrap:"wrap", gap:"0.5rem" }}>
                <div style={{ fontSize:"0.68rem", fontWeight:700, color:theme.textMuted, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                  Tasks ({tasks.filter(t=>!t.done).length} open)
                </div>
                <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap", alignItems:"center" }}>
                  {/* Default sort — no direction arrow, drag enabled here */}
                  <button style={pill(taskSort.by==="default")} onClick={()=>setTaskSort({by:"default",asc:true})}>
                    Default {canDrag && tasks.length>1 && <span style={{ fontSize:"0.6rem", opacity:0.7 }}>⠿</span>}
                  </button>
                  {/* Priority */}
                  <button style={pill(taskSort.by==="priority")} onClick={()=>setTaskSort(p=>p.by==="priority"?{...p,asc:!p.asc}:{by:"priority",asc:false})}>
                    Priority{taskSort.by==="priority" ? (taskSort.asc?" ↑":" ↓") : ""}
                  </button>
                  {/* A–Z */}
                  <button style={pill(taskSort.by==="alpha")} onClick={()=>setTaskSort(p=>p.by==="alpha"?{...p,asc:!p.asc}:{by:"alpha",asc:true})}>
                    A–Z{taskSort.by==="alpha" ? (taskSort.asc?" ↑":" ↓") : ""}
                  </button>
                  {/* Time invested */}
                  <button style={pill(taskSort.by==="time")} onClick={()=>setTaskSort(p=>p.by==="time"?{...p,asc:!p.asc}:{by:"time",asc:false})}>
                    Time{taskSort.by==="time" ? (taskSort.asc?" ↑":" ↓") : " ↓"}
                  </button>
                  {/* Done↓ toggle */}
                  <button style={{ ...pill(doneToBottom), fontSize:"0.7rem" }} onClick={()=>setDoneToBottom(p=>!p)}>
                    Done ↓
                  </button>
                </div>
              </div>

              {canDrag && tasks.length > 1 && (
                <div style={{ fontSize:"0.68rem", color:theme.textMuted, marginBottom:"0.5rem", textAlign:"right" }}>
                  drag ⠿ to reorder
                </div>
              )}

              {sortedTasks.length===0 && (
                <div style={{ textAlign:"center", padding:"1.5rem 0", color:theme.textMuted, fontSize:"0.85rem" }}>
                  Add a task above, then click <strong>focus</strong> to lock it in and start the timer ☝️
                </div>
              )}

              <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                {sortedTasks.map(task => {
                  const isFocused  = task.id === focusedTaskId;
                  const isDragOver = task.id === dragOverId;
                  return (
                    <div
                      key={task.id}
                      draggable={canDrag && !task.done}
                      onDragStart={() => canDrag && handleDragStart(task.id)}
                      onDragOver={e => canDrag && handleDragOver(e, task.id)}
                      onDrop={e => canDrag && handleDrop(e, task.id)}
                      onDragEnd={handleDragEnd}
                      style={{
                        display:"flex", alignItems:"center", gap:"0.6rem",
                        padding:"0.5rem 0.6rem", borderRadius:10,
                        background: isFocused ? `${theme.accent}18` : task.done ? `${theme.panelBorder}40` : `${theme.accent}0a`,
                        border:`1px solid ${isDragOver ? theme.accent : isFocused ? theme.accent+"60" : task.done ? theme.panelBorder : theme.accent+"28"}`,
                        borderTop: isDragOver ? `2px solid ${theme.accent}` : undefined,
                        opacity: task.done ? 0.55 : 1,
                        transition:"all 0.15s",
                        cursor: canDrag && !task.done ? "grab" : "default",
                      }}
                    >
                      {/* Grip handle — only shown on Default sort */}
                      {canDrag && !task.done && (
                        <span style={{ color:theme.textMuted, fontSize:"0.9rem", cursor:"grab", userSelect:"none", flexShrink:0 }} title="Drag to reorder">⠿</span>
                      )}

                      <input type="checkbox" checked={task.done} onChange={()=>toggleTask(task.id)}
                        style={{ width:16, height:16, accentColor:theme.accent, cursor:"pointer", flexShrink:0 }}/>

                      {/* Task text + time invested */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"0.88rem", textDecoration:task.done?"line-through":"none", color:theme.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {task.text}
                        </div>
                        {(task.focusSecs||0) > 0 && !task.done && (
                          <div style={{ fontSize:"0.68rem", color:theme.accent, marginTop:1, fontWeight:600 }}>
                            ⏱ {fmtMins(task.focusSecs)} invested
                          </div>
                        )}
                      </div>

                      {/* Priority cycle — letter with tooltip */}
                      <button
                        onClick={()=>cyclePriority(task.id)}
                        title={pLabel(task.priority)}
                        style={{ background:"none", border:`1px solid ${pColor(task.priority)}44`, borderRadius:6, cursor:"pointer", fontSize:"0.68rem", color:pColor(task.priority), fontWeight:800, padding:"1px 5px", flexShrink:0 }}
                      >
                        {task.priority[0].toUpperCase()}
                      </button>

                      {/* Focus button */}
                      {!task.done && (
                        <button onClick={()=>focusTask(task.id)}
                          style={{ ...pill(isFocused), fontSize:"0.7rem", padding:"0.2rem 0.6rem", flexShrink:0 }}>
                          {isFocused ? "★ focused" : "focus"}
                        </button>
                      )}

                      <button onClick={()=>deleteTask(task.id)}
                        style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:"0.85rem", padding:"0 2px", flexShrink:0 }}>✕</button>
                    </div>
                  );
                })}
              </div>

              {tasks.some(t=>t.done) && (
                <button style={{ ...btn(false), marginTop:"0.75rem", fontSize:"0.72rem" }} onClick={()=>saveTasks(tasks.filter(t=>!t.done))}>
                  Clear completed
                </button>
              )}
            </div>

            {/* Side Quests */}
            <div style={panel}>
              <div style={{ fontSize:"0.68rem", fontWeight:700, color:theme.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.4rem" }}>⚡ Side Quests</div>
              <div style={{ fontSize:"0.75rem", color:theme.textMuted, marginBottom:"0.75rem" }}>Stray thoughts go here. Don't break flow — park it.</div>
              <div style={{ display:"flex", gap:"0.5rem", marginBottom:"0.75rem" }}>
                <input style={inp} placeholder="Park a distraction…" value={newQuest} onChange={e=>setNewQuest(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addQuest()}/>
                <button style={btn(true)} onClick={addQuest}>Park</button>
              </div>
              {quests.length===0 && <div style={{ textAlign:"center", color:theme.textMuted, fontSize:"0.8rem", padding:"0.5rem 0" }}>No distractions parked 🌿</div>}
              <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
                {quests.map(q=>(
                  <div key={q.id} style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.45rem 0.6rem", borderRadius:8, background:`${theme.accent}08`, border:`1px solid ${theme.panelBorder}` }}>
                    <span style={{ flex:1, fontSize:"0.85rem", color:theme.text }}>{q.text}</span>
                    <button onClick={()=>promoteQuest(q)} style={{ background:"none", border:"none", cursor:"pointer", color:theme.accent, fontSize:"0.75rem", fontWeight:700 }}>→ Task</button>
                    <button onClick={()=>deleteQuest(q.id)} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:"0.82rem" }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ════ PI PARKING LOT TAB ════ */}
        {!zenMode && activeTab==="pi" && (
          <div style={panel}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:"0.5rem" }}>
              <div>
                <div style={{ fontSize:"0.68rem", fontWeight:700, color:theme.textMuted, letterSpacing:"0.1em", textTransform:"uppercase" }}>PI Parking Lot</div>
                <div style={{ fontSize:"0.75rem", color:theme.textMuted, marginTop:2 }}>Ideas taking shape across planning cycles</div>
              </div>
              <button style={btn(true)} onClick={()=>setShowAddPi(p=>!p)}>{showAddPi?"✕ Cancel":"+ Add Item"}</button>
            </div>

            {showAddPi && (
              <div style={{ background:`${theme.accent}0d`, border:`1px solid ${theme.accent}30`, borderRadius:12, padding:"1rem", marginBottom:"1rem" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.6rem", marginBottom:"0.6rem" }}>
                  <div><div style={{ fontSize:"0.7rem", color:theme.textMuted, fontWeight:700, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>PI Cycle</div><select value={newPi.pi} onChange={e=>setNewPi(p=>({...p,pi:e.target.value}))} style={{ width:"100%" }}>{PI_CYCLES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                  <div><div style={{ fontSize:"0.7rem", color:theme.textMuted, fontWeight:700, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>Status</div><select value={newPi.status} onChange={e=>setNewPi(p=>({...p,status:e.target.value}))} style={{ width:"100%" }}>{PI_STATUSES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
                </div>
                <div style={{ marginBottom:"0.6rem" }}><div style={{ fontSize:"0.7rem", color:theme.textMuted, fontWeight:700, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>Title *</div><input style={inp} placeholder="Epic or initiative title…" value={newPi.title} onChange={e=>setNewPi(p=>({...p,title:e.target.value}))}/></div>
                <div style={{ marginBottom:"0.6rem" }}><div style={{ fontSize:"0.7rem", color:theme.textMuted, fontWeight:700, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>Objectives</div><textarea rows={2} style={inp} placeholder="What are we trying to achieve?" value={newPi.objectives} onChange={e=>setNewPi(p=>({...p,objectives:e.target.value}))}/></div>
                <div style={{ marginBottom:"0.75rem" }}><div style={{ fontSize:"0.7rem", color:theme.textMuted, fontWeight:700, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>Risks / Blockers</div><textarea rows={2} style={inp} placeholder="Known risks?" value={newPi.risks} onChange={e=>setNewPi(p=>({...p,risks:e.target.value}))}/></div>
                <button style={btn(true)} onClick={addPiItem}>Add to Parking Lot</button>
              </div>
            )}

            {PI_CYCLES.map(cycle => {
              const items = piItems.filter(x=>x.pi===cycle);
              if (!items.length) return null;
              return (
                <div key={cycle} style={{ marginBottom:"1rem" }}>
                  <div style={{ fontSize:"0.72rem", fontWeight:800, color:theme.accent, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.5rem" }}>PI {cycle}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.45rem" }}>
                    {items.map(item => {
                      const st = PI_STATUSES.find(s=>s.key===item.status);
                      const open = piExpanded===item.id;
                      return (
                        <div key={item.id} style={{ background:`${theme.accent}08`, border:`1px solid ${theme.panelBorder}`, borderRadius:12, overflow:"hidden" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.6rem 0.8rem", cursor:"pointer" }} onClick={()=>setPiExpanded(open?null:item.id)}>
                            <span style={{ fontSize:"0.75rem" }}>{st?.label||item.status}</span>
                            <span style={{ flex:1, fontWeight:700, fontSize:"0.88rem", color:theme.text }}>{item.title}</span>
                            <span style={{ color:theme.textMuted, fontSize:"0.8rem" }}>{open?"▲":"▼"}</span>
                            <button onClick={e=>{e.stopPropagation();deletePiItem(item.id);}} style={{ background:"none", border:"none", cursor:"pointer", color:theme.textMuted, fontSize:"0.82rem" }}>✕</button>
                          </div>
                          {open && (
                            <div style={{ padding:"0 0.8rem 0.8rem", display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                              <div style={{ display:"flex", gap:"0.5rem" }}>
                                <select value={item.pi} onChange={e=>updatePiItem(item.id,"pi",e.target.value)}>{PI_CYCLES.map(c=><option key={c} value={c}>{c}</option>)}</select>
                                <select value={item.status} onChange={e=>updatePiItem(item.id,"status",e.target.value)}>{PI_STATUSES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}</select>
                              </div>
                              <div><div style={{ fontSize:"0.68rem", color:theme.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Objectives</div><textarea rows={2} style={inp} value={item.objectives||""} onChange={e=>updatePiItem(item.id,"objectives",e.target.value)} placeholder="Objectives…"/></div>
                              <div><div style={{ fontSize:"0.68rem", color:theme.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Risks / Blockers</div><textarea rows={2} style={inp} value={item.risks||""} onChange={e=>updatePiItem(item.id,"risks",e.target.value)} placeholder="Risks…"/></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {piItems.length===0 && <div style={{ textAlign:"center", padding:"2rem 0", color:theme.textMuted, fontSize:"0.85rem" }}>Nothing parked yet — ideas don't have to be perfect 🌱</div>}
          </div>
        )}

        {/* ════ PI READINESS TAB ════ */}
        {!zenMode && activeTab==="readiness" && (
          <PIReadiness theme={theme} />
        )}

        {/* ════ FOOTER ════ */}
        <div style={{ textAlign:"center", marginTop:"1.5rem", fontSize:"0.68rem", color:theme.textMuted, letterSpacing:"0.06em" }}>
          space = start/pause · Z = zen mode · click <strong>focus</strong> on a task to lock it in and start
        </div>
      </div>
    </div>
  );
}
