// ═══════════════════════════════════════════════════════════════════
// Sage & Steph Focus Dashboard — v5.0.0
// Full feature set: Timer · Aurora · Soundscapes · Tasks · Side Quests
//                  Streak · PI Parking Lot · PI Readiness · 5 Themes
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";

const VERSION = "5.0.0";

// ── THEMES ──────────────────────────────────────────────────────────
const THEMES = [
  {
    key: "obsidian",
    label: "Obsidian",
    accent: "#c084fc",
    accentAlt: "#a855f7",
    bg: "#0d0b14",
    panel: "#18152a",
    panelBorder: "#2a2440",
    text: "#e8e2f8",
    textMuted: "#7c6fa0",
    timerRing: "#c084fc",
    auroraColors: ["#c084fc", "#818cf8", "#a78bfa"],
    isDark: true,
  },
  {
    key: "solar",
    label: "Solar",
    accent: "#f97316",
    accentAlt: "#ea580c",
    bg: "#fefaf4",
    panel: "#fff7ed",
    panelBorder: "#fde8cc",
    text: "#431407",
    textMuted: "#9a7151",
    timerRing: "#f97316",
    auroraColors: ["#fbbf24", "#f97316", "#fcd34d"],
    isDark: false,
  },
  {
    key: "electric",
    label: "Electric",
    accent: "#38bdf8",
    accentAlt: "#0ea5e9",
    bg: "#f0f9ff",
    panel: "#e0f2fe",
    panelBorder: "#bae6fd",
    text: "#0c2a42",
    textMuted: "#4b7fa3",
    timerRing: "#38bdf8",
    auroraColors: ["#38bdf8", "#818cf8", "#7dd3fc"],
    isDark: false,
  },
  {
    key: "sage",
    label: "Sage",
    accent: "#4ade80",
    accentAlt: "#22c55e",
    bg: "#f2f7f2",
    panel: "#e8f5e8",
    panelBorder: "#c3e6c3",
    text: "#0f2d0f",
    textMuted: "#4a7a4a",
    timerRing: "#4ade80",
    auroraColors: ["#4ade80", "#86efac", "#34d399"],
    isDark: false,
  },
  {
    key: "bloom",
    label: "Bloom 🌸",
    accent: "#f472b6",
    accentAlt: "#ec4899",
    bg: "#fff0f7",
    panel: "#fce7f3",
    panelBorder: "#fbcfe8",
    text: "#500724",
    textMuted: "#9d4068",
    timerRing: "#f472b6",
    auroraColors: ["#f472b6", "#f9a8d4", "#fb7185"],
    isDark: false,
  },
];

// ── TIMER PRESETS ────────────────────────────────────────────────────
const TIMER_PRESETS = [
  { label: "25 min", seconds: 25 * 60 },
  { label: "50 min", seconds: 50 * 60 },
  { label: "15 min", seconds: 15 * 60 },
  { label: "5 min",  seconds: 5 * 60  },
];

// ── SOUNDSCAPE DEFINITIONS ───────────────────────────────────────────
const SOUNDSCAPES = [
  { id: "rain",   label: "🌧 Rain",    baseFreq: 200, noiseType: "pink"  },
  { id: "forest", label: "🌲 Forest",  baseFreq: 180, noiseType: "brown" },
  { id: "cafe",   label: "☕ Café",    baseFreq: 320, noiseType: "white" },
  { id: "ocean",  label: "🌊 Ocean",   baseFreq: 100, noiseType: "pink"  },
  { id: "none",   label: "🔇 Silent",  baseFreq: 0,   noiseType: null    },
];

// ── PI CYCLE OPTIONS ─────────────────────────────────────────────────
const PI_CYCLES = ["2026.2", "2026.3", "2026.4", "2027.1"];
const PI_STATUSES = [
  { key: "seeding",  label: "🌱 Seeding",  title: "Just landed — still forming" },
  { key: "digging",  label: "⛏️ Digging",  title: "Being actively thought through" },
  { key: "ready",    label: "✅ Ready",     title: "Enough shape to become an epic" },
  { key: "parked",   label: "🅿️ Parked",   title: "On hold — not this PI" },
];
const READINESS_ITEMS = [
  { key: "objective",     label: "PI Objective defined" },
  { key: "epics",         label: "Epics scoped" },
  { key: "risks",         label: "Risks identified" },
  { key: "dependencies",  label: "Dependencies mapped" },
  { key: "capacity",      label: "Capacity checked" },
  { key: "stakeholders",  label: "Stakeholders aligned" },
];

// ── AUDIO ENGINE ─────────────────────────────────────────────────────
let audioCtx = null;
let noiseNode = null;
let gainNode = null;
let filterNode = null;

function startSoundscape(soundId, volume = 0.4) {
  stopSoundscape();
  if (soundId === "none") return;
  const sc = SOUNDSCAPES.find(s => s.id === soundId);
  if (!sc || !sc.noiseType) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 1.5);

  filterNode = audioCtx.createBiquadFilter();
  filterNode.type = "lowpass";
  filterNode.frequency.setValueAtTime(sc.baseFreq, audioCtx.currentTime);

  const bufferSize = audioCtx.sampleRate * 4;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    if (sc.noiseType === "pink") {
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    } else if (sc.noiseType === "brown") {
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    } else {
      data[i] = white;
    }
  }
  noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;
  noiseNode.loop = true;
  noiseNode.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  noiseNode.start();
}

function stopSoundscape() {
  if (gainNode && audioCtx) {
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
  }
  setTimeout(() => {
    try { noiseNode?.stop(); } catch (_) {}
    try { audioCtx?.close(); } catch (_) {}
    audioCtx = null; noiseNode = null; gainNode = null; filterNode = null;
  }, 600);
}

// ── HELPERS ──────────────────────────────────────────────────────────
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const pad = (n) => String(n).padStart(2, "0");
const uuid = () => crypto.randomUUID();

function LiveClock({ color }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  return <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color, letterSpacing: "0.05em" }}>{time}</span>;
}

// ── TIMER RING SVG ───────────────────────────────────────────────────
function TimerRing({ pct, color, running, children }) {
  const r = 80, circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct);
  return (
    <div style={{ position: "relative", width: 200, height: 200 }}>
      <svg width={200} height={200} style={{ transform: "rotate(-90deg)", ...(running ? { filter: `drop-shadow(0 0 14px ${color}55)` } : {}) }}>
        <circle cx={100} cy={100} r={r} fill="none" stroke={`${color}22`} strokeWidth={10} />
        <circle
          cx={100} cy={100} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={dash}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  // ── Theme ──────────────────────────────────────────────────────
  const savedThemeKey = localStorage.getItem("sage_theme_v5") || "obsidian";
  const initTheme = THEMES.find(t => t.key === savedThemeKey) || THEMES[0];
  const [theme, setTheme] = useState(initTheme);

  const switchTheme = (t) => {
    setTheme(t);
    localStorage.setItem("sage_theme_v5", t.key);
  };

  // ── Timer ──────────────────────────────────────────────────────
  const [timerTotal, setTimerTotal] = useState(25 * 60);
  const [timerLeft, setTimerLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [focusedTask, setFocusedTask] = useState(null);
  const [sessionsToday, setSessionsToday] = useState(() => {
    const d = localStorage.getItem("sage_sessions_date");
    if (d === new Date().toDateString()) return Number(localStorage.getItem("sage_sessions_count") || 0);
    return 0;
  });
  const intervalRef = useRef(null);

  const startTimer = useCallback(() => {
    if (timerLeft === 0) setTimerLeft(timerTotal);
    setRunning(true);
  }, [timerLeft, timerTotal]);

  const pauseTimer = () => setRunning(false);

  const resetTimer = () => {
    setRunning(false);
    setTimerLeft(timerTotal);
  };

  const selectPreset = (secs) => {
    setTimerTotal(secs);
    setTimerLeft(secs);
    setRunning(false);
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimerLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            const newCount = sessionsToday + 1;
            setSessionsToday(newCount);
            localStorage.setItem("sage_sessions_date", new Date().toDateString());
            localStorage.setItem("sage_sessions_count", String(newCount));
            // streak update
            const today = new Date().toDateString();
            const lastDay = localStorage.getItem("sage_streak_date");
            const streak = Number(localStorage.getItem("sage_streak") || 0);
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            if (lastDay === yesterday) {
              localStorage.setItem("sage_streak", String(streak + 1));
            } else if (lastDay !== today) {
              localStorage.setItem("sage_streak", "1");
            }
            localStorage.setItem("sage_streak_date", today);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // ── Soundscape ────────────────────────────────────────────────
  const [activeSoundId, setActiveSoundId] = useState("none");
  const [soundVol, setSoundVol] = useState(0.4);

  const handleSoundChange = (id) => {
    setActiveSoundId(id);
    if (id !== "none") startSoundscape(id, soundVol);
    else stopSoundscape();
  };

  useEffect(() => {
    if (activeSoundId !== "none") startSoundscape(activeSoundId, soundVol);
  }, [soundVol]);

  useEffect(() => () => stopSoundscape(), []);

  // ── Tasks ─────────────────────────────────────────────────────
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sage_tasks_v5") || "[]"); } catch { return []; }
  });
  const [newTask, setNewTask] = useState("");
  const [taskSort, setTaskSort] = useState({ by: "priority", asc: false });

  const saveTasks = (list) => {
    setTasks(list);
    localStorage.setItem("sage_tasks_v5", JSON.stringify(list));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    saveTasks([...tasks, { id: uuid(), text: newTask.trim(), done: false, priority: "medium", createdAt: Date.now() }]);
    setNewTask("");
  };

  const toggleTask = (id) => saveTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => saveTasks(tasks.filter(t => t.id !== id));
  const cyclePriority = (id) => {
    const order = ["low", "medium", "high"];
    saveTasks(tasks.map(t => t.id === id ? { ...t, priority: order[(order.indexOf(t.priority) + 1) % 3] } : t));
  };

  const priorityColor = (p) => ({ high: "#f87171", medium: theme.accent, low: theme.textMuted }[p]);
  const priorityNum = (p) => ({ high: 3, medium: 2, low: 1 }[p]);

  const sortedTasks = [...tasks].sort((a, b) => {
    let diff = 0;
    if (taskSort.by === "priority") diff = priorityNum(b.priority) - priorityNum(a.priority);
    else if (taskSort.by === "alpha") diff = a.text.localeCompare(b.text);
    else if (taskSort.by === "created") diff = b.createdAt - a.createdAt;
    return taskSort.asc ? -diff : diff;
  });

  // ── Side Quests ───────────────────────────────────────────────
  const [quests, setQuests] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sage_quests_v5") || "[]"); } catch { return []; }
  });
  const [newQuest, setNewQuest] = useState("");

  const saveQuests = (list) => {
    setQuests(list);
    localStorage.setItem("sage_quests_v5", JSON.stringify(list));
  };

  const addQuest = () => {
    if (!newQuest.trim()) return;
    saveQuests([...quests, { id: uuid(), text: newQuest.trim(), createdAt: Date.now() }]);
    setNewQuest("");
  };

  const promoteQuest = (q) => {
    saveTasks([...tasks, { id: uuid(), text: q.text, done: false, priority: "medium", createdAt: Date.now() }]);
    saveQuests(quests.filter(x => x.id !== q.id));
  };

  const deleteQuest = (id) => saveQuests(quests.filter(q => q.id !== id));

  // ── Streak ────────────────────────────────────────────────────
  const streak = Number(localStorage.getItem("sage_streak") || 0);
  const streakLabel = streak === 0 ? "Start your streak!" : streak === 1 ? "1 day 🌱" : `${streak} days 🔥`;

  // ── PI Parking Lot ────────────────────────────────────────────
  const [piItems, setPiItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sage_pi_lot_v5") || "[]"); } catch { return []; }
  });
  const [piExpanded, setPiExpanded] = useState(null);
  const [showAddPi, setShowAddPi] = useState(false);
  const [newPi, setNewPi] = useState({ pi: "2026.2", title: "", objectives: "", risks: "", status: "seeding" });

  const savePiItems = (list) => {
    setPiItems(list);
    localStorage.setItem("sage_pi_lot_v5", JSON.stringify(list));
  };

  const addPiItem = () => {
    if (!newPi.title.trim()) return;
    savePiItems([...piItems, { ...newPi, id: uuid(), createdAt: Date.now() }]);
    setNewPi({ pi: "2026.2", title: "", objectives: "", risks: "", status: "seeding" });
    setShowAddPi(false);
  };

  const updatePiItem = (id, field, val) => {
    savePiItems(piItems.map(x => x.id === id ? { ...x, [field]: val } : x));
  };

  const deletePiItem = (id) => savePiItems(piItems.filter(x => x.id !== id));

  // ── PI Readiness ──────────────────────────────────────────────
  const [readiness, setReadiness] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sage_pi_readiness_v5") || "{}"); } catch { return {}; }
  });
  const [readinessPi, setReadinessPi] = useState("2026.2");

  const toggleReadiness = (key) => {
    const updated = { ...readiness, [`${readinessPi}_${key}`]: !readiness[`${readinessPi}_${key}`] };
    setReadiness(updated);
    localStorage.setItem("sage_pi_readiness_v5", JSON.stringify(updated));
  };

  const readinessScore = READINESS_ITEMS.filter(r => readiness[`${readinessPi}_${r.key}`]).length;
  const readinessPct = Math.round((readinessScore / READINESS_ITEMS.length) * 100);

  // ── Zen mode ──────────────────────────────────────────────────
  const [zenMode, setZenMode] = useState(false);

  // ── Aurora ───────────────────────────────────────────────────
  const auroraColors = theme.auroraColors;

  // ── Key bindings ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === " ") { e.preventDefault(); running ? pauseTimer() : startTimer(); }
      if (e.key === "z" || e.key === "Z") setZenMode(p => !p);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [running, startTimer]);

  // ── Active tab ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("tasks"); // tasks | pi | readiness

  // ══════════════════════════════════════════════════════════════
  // STYLES
  // ══════════════════════════════════════════════════════════════
  const timerPct = timerTotal > 0 ? timerLeft / timerTotal : 0;

  const containerStyle = {
    minHeight: "100vh",
    background: theme.bg,
    fontFamily: "'Barlow', sans-serif",
    color: theme.text,
    transition: "background 0.5s ease, color 0.3s ease",
    position: "relative",
    overflow: "hidden",
  };

  const innerStyle = {
    maxWidth: 900,
    margin: "0 auto",
    padding: "2rem 1.25rem",
    position: "relative",
    zIndex: 2,
  };

  const panelStyle = {
    background: theme.panel,
    border: `1px solid ${theme.panelBorder}`,
    borderRadius: 18,
    padding: "1.25rem 1.5rem",
    marginBottom: "1.25rem",
  };

  const inputStyle = {
    background: "transparent",
    border: `1px solid ${theme.panelBorder}`,
    borderRadius: 10,
    color: theme.text,
    fontFamily: "'Barlow', sans-serif",
    fontSize: "0.9rem",
    padding: "0.5rem 0.75rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const btnStyle = (primary = true) => ({
    background: primary ? theme.accent : "transparent",
    color: primary ? (theme.isDark ? "#000" : "#fff") : theme.accent,
    border: primary ? "none" : `1px solid ${theme.accent}`,
    borderRadius: 10,
    padding: "0.45rem 1rem",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 700,
    fontSize: "0.82rem",
    cursor: "pointer",
    letterSpacing: "0.02em",
    transition: "opacity 0.15s",
  });

  const pillStyle = (active) => ({
    background: active ? theme.accent : `${theme.accent}18`,
    color: active ? (theme.isDark ? "#000" : "#fff") : theme.textMuted,
    border: "none",
    borderRadius: 20,
    padding: "0.3rem 0.75rem",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "0.75rem",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.04em",
  });

  const sortPill = (by, label) => (
    <button
      style={pillStyle(taskSort.by === by)}
      onClick={() => setTaskSort(prev => prev.by === by ? { by, asc: !prev.asc } : { by, asc: false })}
    >
      {label}{taskSort.by === by ? (taskSort.asc ? " ↑" : " ↓") : ""}
    </button>
  );

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div style={containerStyle}>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${theme.bg}; }
        ::placeholder { color: ${theme.textMuted}88; }
        input:focus, textarea:focus { border-color: ${theme.accent}88 !important; }
        button:hover { opacity: 0.82; }
        textarea { resize: vertical; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.panelBorder}; border-radius: 4px; }

        @keyframes gentlePulse {
          0%, 100% { box-shadow: 0 0 0 0 ${theme.accent}40; }
          50%       { box-shadow: 0 0 14px 5px ${theme.accent}35; }
        }
        @keyframes auroraWave {
          0%   { transform: translateX(-120%) skewX(-12deg); opacity: 0; }
          20%  { opacity: ${theme.isDark ? 0.14 : 0.09}; }
          80%  { opacity: ${theme.isDark ? 0.14 : 0.09}; }
          100% { transform: translateX(220%) skewX(-12deg); opacity: 0; }
        }
        @keyframes auroraWave2 {
          0%   { transform: translateX(220%) skewX(12deg); opacity: 0; }
          20%  { opacity: ${theme.isDark ? 0.10 : 0.07}; }
          80%  { opacity: ${theme.isDark ? 0.10 : 0.07}; }
          100% { transform: translateX(-120%) skewX(12deg); opacity: 0; }
        }
        @keyframes auroraWave3 {
          0%   { transform: translateY(-120%) skewY(-8deg); opacity: 0; }
          20%  { opacity: ${theme.isDark ? 0.08 : 0.05}; }
          80%  { opacity: ${theme.isDark ? 0.08 : 0.05}; }
          100% { transform: translateY(220%) skewY(-8deg); opacity: 0; }
        }
        @keyframes timerGlow {
          0%, 100% { filter: drop-shadow(0 0 6px ${theme.accent}40); }
          50%       { filter: drop-shadow(0 0 22px ${theme.accent}66); }
        }
        .aurora-wrap {
          position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
        }
        .aurora-1 {
          position: absolute; width: 60%; height: 35%; top: 15%; left: 0;
          background: linear-gradient(90deg, transparent, ${auroraColors[0]}, transparent);
          border-radius: 50%;
          animation: auroraWave 13s ease-in-out infinite;
        }
        .aurora-2 {
          position: absolute; width: 50%; height: 30%; top: 45%; left: 20%;
          background: linear-gradient(90deg, transparent, ${auroraColors[1]}, transparent);
          border-radius: 50%;
          animation: auroraWave2 18s ease-in-out infinite;
          animation-delay: 5s;
        }
        .aurora-3 {
          position: absolute; width: 70%; height: 25%; top: 65%; left: 10%;
          background: linear-gradient(90deg, transparent, ${auroraColors[2]}, transparent);
          border-radius: 50%;
          animation: auroraWave 22s ease-in-out infinite;
          animation-delay: 10s;
        }
        .timer-pulse { animation: timerGlow 3s ease-in-out infinite; }
        .start-pulse { animation: gentlePulse 2.5s ease-in-out infinite; }
      `}</style>

      {/* ── Aurora (when running) ── */}
      {running && (
        <div className="aurora-wrap">
          <div className="aurora-1" />
          <div className="aurora-2" />
          <div className="aurora-3" />
        </div>
      )}

      <div style={innerStyle}>

        {/* ════ HEADER ════ */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: "1.65rem", color: theme.text, letterSpacing: "-0.02em", lineHeight: 1 }}>
              Sage & Steph
            </div>
            <div style={{ fontSize: "0.68rem", color: theme.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "0.2rem" }}>
              Focus Dashboard · v{VERSION}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <LiveClock color={theme.textMuted} />
            <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
              {THEMES.map(t => (
                <button
                  key={t.key}
                  onClick={() => switchTheme(t)}
                  title={t.label}
                  style={{
                    width: 18, height: 18, borderRadius: "50%",
                    background: t.accent,
                    border: theme.key === t.key ? `2px solid ${theme.text}` : "2px solid transparent",
                    cursor: "pointer",
                    padding: 0,
                    transition: "transform 0.15s",
                    transform: theme.key === t.key ? "scale(1.3)" : "scale(1)",
                  }}
                />
              ))}
            </div>
            <button
              style={{ ...btnStyle(false), fontSize: "0.72rem", padding: "0.3rem 0.65rem" }}
              onClick={() => setZenMode(p => !p)}
              title="Toggle Zen mode (Z)"
            >
              {zenMode ? "✦ Exit" : "⬡ Zen"}
            </button>
          </div>
        </div>

        {/* ════ TIMER PANEL ════ */}
        <div style={{ ...panelStyle, display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          {/* Preset pills */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center" }}>
            {TIMER_PRESETS.map(p => (
              <button key={p.label} style={pillStyle(timerTotal === p.seconds)} onClick={() => selectPreset(p.seconds)}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Ring */}
          <div className={running ? "timer-pulse" : ""}>
            <TimerRing pct={timerPct} color={theme.timerRing} running={running}>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.03em", color: theme.text }}>
                {fmt(timerLeft)}
              </div>
              {focusedTask && (
                <div style={{ fontSize: "0.7rem", color: theme.textMuted, maxWidth: 130, textAlign: "center", marginTop: 4 }}>
                  {focusedTask}
                </div>
              )}
            </TimerRing>
          </div>

          {/* Timer controls */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            {!running ? (
              <button
                className={timerLeft === timerTotal ? "start-pulse" : ""}
                style={{ ...btnStyle(true), fontSize: "0.9rem", padding: "0.55rem 1.5rem" }}
                onClick={startTimer}
              >
                ▶ Start
              </button>
            ) : (
              <button style={{ ...btnStyle(true), fontSize: "0.9rem", padding: "0.55rem 1.5rem" }} onClick={pauseTimer}>
                ⏸ Pause
              </button>
            )}
            <button style={{ ...btnStyle(false), padding: "0.55rem 1rem" }} onClick={resetTimer}>↺ Reset</button>
            <div style={{ fontSize: "0.78rem", color: theme.textMuted }}>
              🔥 {streakLabel} · {sessionsToday} session{sessionsToday !== 1 ? "s" : ""} today
            </div>
          </div>

          {/* Paused reminder */}
          {!running && timerLeft < timerTotal && timerLeft > 0 && (
            <div
              style={{ fontSize: "0.78rem", color: theme.accent, cursor: "pointer", textDecoration: "underline dotted" }}
              onClick={startTimer}
            >
              ⏸ Timer paused — click to resume
            </div>
          )}
        </div>

        {/* ════ SOUNDSCAPE PANEL ════ */}
        {!zenMode && (
          <div style={{ ...panelStyle, display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: theme.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", minWidth: 70 }}>
              Ambience
            </span>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", flex: 1 }}>
              {SOUNDSCAPES.map(sc => (
                <button key={sc.id} style={pillStyle(activeSoundId === sc.id)} onClick={() => handleSoundChange(sc.id)}>
                  {sc.label}
                </button>
              ))}
            </div>
            {activeSoundId !== "none" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.72rem", color: theme.textMuted }}>vol</span>
                <input
                  type="range" min={0} max={1} step={0.05} value={soundVol}
                  onChange={e => setSoundVol(Number(e.target.value))}
                  style={{ width: 70, accentColor: theme.accent }}
                />
              </div>
            )}
          </div>
        )}

        {/* ════ TAB BAR ════ */}
        {!zenMode && (
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {[["tasks", "📋 Tasks"], ["pi", "🗂 PI Parking Lot"], ["readiness", "🧭 PI Readiness"]].map(([key, label]) => (
              <button key={key} style={{ ...pillStyle(activeTab === key), fontSize: "0.8rem", padding: "0.4rem 1rem" }} onClick={() => setActiveTab(key)}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ════ TASKS TAB ════ */}
        {(!zenMode || true) && activeTab === "tasks" && !zenMode && (
          <>
            {/* Task input */}
            <div style={{ ...panelStyle }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: theme.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                Today's Focus
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  style={{ ...inputStyle }}
                  placeholder="Add a task…"
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTask()}
                />
                <button style={btnStyle(true)} onClick={addTask}>Add</button>
              </div>
            </div>

            {/* Task list */}
            <div style={panelStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: theme.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Tasks ({tasks.filter(t => !t.done).length} open)
                </div>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  {sortPill("priority", "Priority")}
                  {sortPill("alpha", "A–Z")}
                  {sortPill("created", "New")}
                </div>
              </div>

              {sortedTasks.length === 0 && (
                <div style={{ textAlign: "center", padding: "1.5rem 0", color: theme.textMuted, fontSize: "0.85rem" }}>
                  Nothing here yet. Add a task above ☝️
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {sortedTasks.map(task => (
                  <div key={task.id} style={{
                    display: "flex", alignItems: "center", gap: "0.6rem",
                    padding: "0.5rem 0.6rem",
                    borderRadius: 10,
                    background: task.done ? `${theme.panelBorder}40` : `${theme.accent}0a`,
                    border: `1px solid ${task.done ? theme.panelBorder : theme.accent}28`,
                    opacity: task.done ? 0.55 : 1,
                    transition: "opacity 0.2s",
                  }}>
                    <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)}
                      style={{ width: 16, height: 16, accentColor: theme.accent, cursor: "pointer", flexShrink: 0 }} />
                    <span
                      style={{ flex: 1, fontSize: "0.88rem", textDecoration: task.done ? "line-through" : "none", color: theme.text, cursor: "pointer" }}
                      onClick={() => setFocusedTask(task.text === focusedTask ? null : task.text)}
                      title="Click to focus on this task"
                    >
                      {task.text}
                    </span>
                    <button
                      onClick={() => cyclePriority(task.id)}
                      title="Cycle priority"
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", color: priorityColor(task.priority), fontWeight: 700, padding: "0 4px" }}
                    >
                      {task.priority.toUpperCase()[0]}
                    </button>
                    {task.text === focusedTask && (
                      <span style={{ fontSize: "0.65rem", color: theme.accent, fontWeight: 700 }}>FOCUS</span>
                    )}
                    <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted, fontSize: "0.85rem", padding: "0 2px" }}>✕</button>
                  </div>
                ))}
              </div>

              {tasks.some(t => t.done) && (
                <button
                  style={{ ...btnStyle(false), marginTop: "0.75rem", fontSize: "0.72rem" }}
                  onClick={() => saveTasks(tasks.filter(t => !t.done))}
                >
                  Clear completed
                </button>
              )}
            </div>

            {/* Side Quests */}
            <div style={panelStyle}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: theme.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                ⚡ Side Quests
              </div>
              <div style={{ fontSize: "0.75rem", color: theme.textMuted, marginBottom: "0.75rem" }}>
                Capture distracting thoughts here. Don't break flow — park it and return later.
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <input
                  style={inputStyle}
                  placeholder="Park a distraction…"
                  value={newQuest}
                  onChange={e => setNewQuest(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addQuest()}
                />
                <button style={btnStyle(true)} onClick={addQuest}>Park</button>
              </div>

              {quests.length === 0 && (
                <div style={{ textAlign: "center", color: theme.textMuted, fontSize: "0.8rem", padding: "0.5rem 0" }}>
                  No distractions parked 🌿
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {quests.map(q => (
                  <div key={q.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.45rem 0.6rem", borderRadius: 8, background: `${theme.accent}08`, border: `1px solid ${theme.panelBorder}` }}>
                    <span style={{ flex: 1, fontSize: "0.85rem", color: theme.text }}>{q.text}</span>
                    <button onClick={() => promoteQuest(q)} title="Promote to task" style={{ background: "none", border: "none", cursor: "pointer", color: theme.accent, fontSize: "0.75rem", fontWeight: 700 }}>→ Task</button>
                    <button onClick={() => deleteQuest(q.id)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted, fontSize: "0.82rem" }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ════ PI PARKING LOT TAB ════ */}
        {!zenMode && activeTab === "pi" && (
          <div style={panelStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: theme.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  PI Parking Lot
                </div>
                <div style={{ fontSize: "0.75rem", color: theme.textMuted, marginTop: 2 }}>
                  Ideas and epics taking shape across planning cycles
                </div>
              </div>
              <button style={btnStyle(true)} onClick={() => setShowAddPi(p => !p)}>
                {showAddPi ? "✕ Cancel" : "+ Add Item"}
              </button>
            </div>

            {/* Add form */}
            {showAddPi && (
              <div style={{ background: `${theme.accent}0d`, border: `1px solid ${theme.accent}30`, borderRadius: 12, padding: "1rem", marginBottom: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.6rem" }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: theme.textMuted, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>PI Cycle</div>
                    <select
                      value={newPi.pi}
                      onChange={e => setNewPi(p => ({ ...p, pi: e.target.value }))}
                      style={{ ...inputStyle }}
                    >
                      {PI_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: theme.textMuted, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</div>
                    <select
                      value={newPi.status}
                      onChange={e => setNewPi(p => ({ ...p, status: e.target.value }))}
                      style={{ ...inputStyle }}
                    >
                      {PI_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: "0.6rem" }}>
                  <div style={{ fontSize: "0.7rem", color: theme.textMuted, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Title *</div>
                  <input style={inputStyle} placeholder="Epic or initiative title…" value={newPi.title} onChange={e => setNewPi(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div style={{ marginBottom: "0.6rem" }}>
                  <div style={{ fontSize: "0.7rem", color: theme.textMuted, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Objectives</div>
                  <textarea rows={2} style={{ ...inputStyle }} placeholder="What are we trying to achieve?" value={newPi.objectives} onChange={e => setNewPi(p => ({ ...p, objectives: e.target.value }))} />
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "0.7rem", color: theme.textMuted, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Risks / Blockers</div>
                  <textarea rows={2} style={{ ...inputStyle }} placeholder="Known risks or dependencies?" value={newPi.risks} onChange={e => setNewPi(p => ({ ...p, risks: e.target.value }))} />
                </div>
                <button style={btnStyle(true)} onClick={addPiItem}>Add to Parking Lot</button>
              </div>
            )}

            {/* Group by PI */}
            {PI_CYCLES.map(cycle => {
              const cycleItems = piItems.filter(x => x.pi === cycle);
              if (cycleItems.length === 0) return null;
              return (
                <div key={cycle} style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: theme.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                    PI {cycle}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                    {cycleItems.map(item => {
                      const statusDef = PI_STATUSES.find(s => s.key === item.status);
                      const isOpen = piExpanded === item.id;
                      return (
                        <div key={item.id} style={{ background: `${theme.accent}08`, border: `1px solid ${theme.panelBorder}`, borderRadius: 12, overflow: "hidden" }}>
                          <div
                            style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.8rem", cursor: "pointer" }}
                            onClick={() => setPiExpanded(isOpen ? null : item.id)}
                          >
                            <span style={{ fontSize: "0.75rem" }}>{statusDef?.label || item.status}</span>
                            <span style={{ flex: 1, fontWeight: 700, fontSize: "0.88rem", color: theme.text }}>{item.title}</span>
                            <span style={{ color: theme.textMuted, fontSize: "0.8rem" }}>{isOpen ? "▲" : "▼"}</span>
                            <button onClick={e => { e.stopPropagation(); deletePiItem(item.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted, fontSize: "0.82rem" }}>✕</button>
                          </div>
                          {isOpen && (
                            <div style={{ padding: "0 0.8rem 0.8rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <select
                                  value={item.pi}
                                  onChange={e => updatePiItem(item.id, "pi", e.target.value)}
                                  style={{ ...inputStyle, width: "auto" }}
                                >
                                  {PI_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select
                                  value={item.status}
                                  onChange={e => updatePiItem(item.id, "status", e.target.value)}
                                  style={{ ...inputStyle, width: "auto" }}
                                >
                                  {PI_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                </select>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.68rem", color: theme.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Objectives</div>
                                <textarea rows={2} style={inputStyle} value={item.objectives || ""} onChange={e => updatePiItem(item.id, "objectives", e.target.value)} placeholder="Objectives…" />
                              </div>
                              <div>
                                <div style={{ fontSize: "0.68rem", color: theme.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Risks / Blockers</div>
                                <textarea rows={2} style={inputStyle} value={item.risks || ""} onChange={e => updatePiItem(item.id, "risks", e.target.value)} placeholder="Risks…" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {piItems.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem 0", color: theme.textMuted, fontSize: "0.85rem" }}>
                Nothing parked yet. Ideas don't have to be perfect — park them early 🌱
              </div>
            )}
          </div>
        )}

        {/* ════ PI READINESS TAB ════ */}
        {!zenMode && activeTab === "readiness" && (
          <div style={panelStyle}>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: theme.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                PI Readiness Checklist
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <select value={readinessPi} onChange={e => setReadinessPi(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  {PI_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div style={{ flex: 1, minWidth: 100, background: theme.panelBorder, borderRadius: 20, height: 6 }}>
                  <div style={{ width: `${readinessPct}%`, background: theme.accent, borderRadius: 20, height: "100%", transition: "width 0.3s ease" }} />
                </div>
                <div style={{ fontWeight: 800, color: readinessPct === 100 ? theme.accent : theme.text, fontSize: "0.88rem" }}>
                  {readinessPct}%
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {READINESS_ITEMS.map(r => {
                const checked = !!readiness[`${readinessPi}_${r.key}`];
                return (
                  <div
                    key={r.key}
                    onClick={() => toggleReadiness(r.key)}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.65rem 0.85rem",
                      borderRadius: 12,
                      background: checked ? `${theme.accent}14` : `${theme.panelBorder}30`,
                      border: `1px solid ${checked ? theme.accent + "40" : theme.panelBorder}`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      background: checked ? theme.accent : "transparent",
                      border: `2px solid ${checked ? theme.accent : theme.textMuted}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.75rem", color: theme.isDark ? "#000" : "#fff",
                    }}>
                      {checked && "✓"}
                    </div>
                    <span style={{ fontSize: "0.88rem", color: theme.text, textDecoration: checked ? "line-through" : "none", opacity: checked ? 0.7 : 1 }}>
                      {r.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {readinessPct === 100 && (
              <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem", color: theme.accent, fontWeight: 800 }}>
                ✅ PI {readinessPi} is ready to plan!
              </div>
            )}
          </div>
        )}

        {/* ════ ZEN MODE ════ */}
        {zenMode && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem", paddingTop: "2rem" }}>
            <div className={running ? "timer-pulse" : ""}>
              <TimerRing pct={timerPct} color={theme.timerRing} running={running}>
                <div style={{ fontSize: "3rem", fontWeight: 900, letterSpacing: "-0.03em", color: theme.text }}>
                  {fmt(timerLeft)}
                </div>
                {focusedTask && (
                  <div style={{ fontSize: "0.8rem", color: theme.textMuted, maxWidth: 140, textAlign: "center", marginTop: 6 }}>
                    {focusedTask}
                  </div>
                )}
              </TimerRing>
            </div>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              {!running ? (
                <button className="start-pulse" style={{ ...btnStyle(true), fontSize: "1rem", padding: "0.65rem 2rem" }} onClick={startTimer}>
                  ▶ Start
                </button>
              ) : (
                <button style={{ ...btnStyle(true), fontSize: "1rem", padding: "0.65rem 2rem" }} onClick={pauseTimer}>
                  ⏸ Pause
                </button>
              )}
              <button style={{ ...btnStyle(false), padding: "0.65rem 1.2rem" }} onClick={resetTimer}>↺</button>
            </div>
            <div style={{ fontSize: "0.75rem", color: theme.textMuted }}>
              press Z to exit zen · space to start/pause
            </div>
          </div>
        )}

        {/* ════ FOOTER ════ */}
        {!zenMode && (
          <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.68rem", color: theme.textMuted, letterSpacing: "0.06em" }}>
            space = start/pause · Z = zen mode · click task to focus it
          </div>
        )}

      </div>
    </div>
  );
}
