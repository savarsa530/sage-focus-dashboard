import { useState, useEffect, useRef, useCallback } from "react";
import PIParkingLot from "./PIParkingLot";
import PIReadiness from "./PIReadiness";

// ─── VERSION ────────────────────────────────────────────────
const VERSION = "4.0.0";

// ─── THEMES ─────────────────────────────────────────────────
const THEMES = [
  {
    key: "obsidian",
    label: "Obsidian",
    bg: "#0e0c1a",
    card: "rgba(255,255,255,0.05)",
    text: "#e8e4f4",
    muted: "#7a7090",
    accent: "#9B7ED8",
    border: "rgba(255,255,255,0.1)",
    timerBg: "rgba(255,255,255,0.04)",
    inputBg: "rgba(255,255,255,0.07)",
    isDark: true,
  },
  {
    key: "solar",
    label: "Solar",
    bg: "#fdf8f0",
    card: "rgba(0,0,0,0.04)",
    text: "#2a1f0e",
    muted: "#8a7460",
    accent: "#c2621a",
    border: "rgba(0,0,0,0.1)",
    timerBg: "rgba(0,0,0,0.04)",
    inputBg: "rgba(0,0,0,0.05)",
    isDark: false,
  },
  {
    key: "electric",
    label: "Electric",
    bg: "#f5f7ff",
    card: "rgba(0,0,0,0.04)",
    text: "#0d0f2b",
    muted: "#5a5e8a",
    accent: "#3333cc",
    border: "rgba(0,0,0,0.1)",
    timerBg: "rgba(0,0,0,0.04)",
    inputBg: "rgba(0,0,0,0.05)",
    isDark: false,
  },
  {
    key: "sage",
    label: "Sage",
    bg: "#f2f7f2",
    card: "rgba(0,0,0,0.04)",
    text: "#0f1f12",
    muted: "#5a7a5e",
    accent: "#2d6e3e",
    border: "rgba(0,0,0,0.1)",
    timerBg: "rgba(0,0,0,0.04)",
    inputBg: "rgba(0,0,0,0.05)",
    isDark: false,
  },
  {
    key: "bloom",
    label: "Bloom",
    bg: "#fff5fb",
    card: "rgba(0,0,0,0.04)",
    text: "#2a0020",
    muted: "#a0528a",
    accent: "#d4006a",
    border: "rgba(212,0,106,0.15)",
    timerBg: "rgba(212,0,106,0.04)",
    inputBg: "rgba(212,0,106,0.05)",
    isDark: false,
  },
];

// ─── AMBIENT ACCENT PALETTES per theme ──────────────────────
const AURORA = {
  obsidian: ["rgba(155,126,216,0.18)", "rgba(123,158,168,0.12)", "rgba(155,126,216,0.09)"],
  solar:    ["rgba(194,98,26,0.12)",   "rgba(220,160,80,0.10)",  "rgba(194,98,26,0.07)"],
  electric: ["rgba(51,51,204,0.10)",   "rgba(100,120,255,0.09)", "rgba(51,51,204,0.06)"],
  sage:     ["rgba(45,110,62,0.10)",   "rgba(90,155,100,0.09)",  "rgba(45,110,62,0.06)"],
  bloom:    ["rgba(212,0,106,0.13)",   "rgba(255,80,160,0.10)",  "rgba(212,0,106,0.07)"],
};

// ─── SOUNDS ─────────────────────────────────────────────────
const SOUNDS = {
  rain:     { label: "Rain" },
  brown:    { label: "Brown Noise" },
  binaural: { label: "Binaural" },
  white:    { label: "White Noise" },
};

// ─── PRESETS ────────────────────────────────────────────────
const PRESETS = [
  { label: "25 / 5",  work: 25, brk: 5  },
  { label: "50 / 10", work: 50, brk: 10 },
  { label: "90 / 20", work: 90, brk: 20 },
];

// ─── AUDIO HELPERS ──────────────────────────────────────────
function createNoise(ctx, type) {
  const bufSize = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  if (type === "white") {
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
  } else {
    let last = 0;
    for (let i = 0; i < bufSize; i++) {
      const w = Math.random() * 2 - 1;
      d[i] = (last + 0.02 * w) / 1.02;
      last = d[i];
      d[i] *= 3.5;
    }
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

function createRain(ctx) {
  const src = createNoise(ctx, "brown");
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1000;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 8000;
  src.connect(hp).connect(lp);
  return { src, out: lp };
}

function createBinaural(ctx) {
  const oL = ctx.createOscillator();
  const oR = ctx.createOscillator();
  oL.frequency.value = 200;
  oR.frequency.value = 210;
  oL.type = "sine";
  oR.type = "sine";
  const merger = ctx.createChannelMerger(2);
  oL.connect(merger, 0, 0);
  oR.connect(merger, 0, 1);
  return { src: oL, src2: oR, out: merger };
}

// ─── LIVE CLOCK ─────────────────────────────────────────────
function LiveClock({ color }) {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontSize: "0.85rem", fontWeight: 600, color, fontFamily: "'Barlow', sans-serif", letterSpacing: "0.05em" }}>
      {time}
    </span>
  );
}

// ─── STREAK GRID ────────────────────────────────────────────
function StreakGrid({ sessions, accent, muted, border }) {
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    return d.toDateString();
  });
  return (
    <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginTop: "0.5rem" }}>
      {days.map((day) => {
        const count = (sessions || []).filter((s) => new Date(s).toDateString() === day).length;
        return (
          <div
            key={day}
            title={`${day}: ${count} session${count !== 1 ? "s" : ""}`}
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "3px",
              background: count === 0 ? border : count === 1 ? accent + "66" : count >= 2 ? accent + "cc" : accent,
              transition: "background 0.2s ease",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function App() {
  // ── Theme ──
  const [themeIdx, setThemeIdx] = useState(() => {
    const saved = localStorage.getItem("sage_theme_v4");
    const idx = THEMES.findIndex((t) => t.key === saved);
    return idx >= 0 ? idx : 0;
  });
  const theme = THEMES[themeIdx];

  function cycleTheme() {
    const next = (themeIdx + 1) % THEMES.length;
    setThemeIdx(next);
    localStorage.setItem("sage_theme_v4", THEMES[next].key);
  }

  // ── Timer state ──
  const [workMin, setWorkMin] = useState(25);
  const [brkMin, setBrkMin] = useState(5);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [showSkipInput, setShowSkipInput] = useState(false);
  const intervalRef = useRef(null);

  // ── Tasks ──
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem("sage_tasks_v4") || "[]"));
  const [newTask, setNewTask] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [sortMode, setSortMode] = useState("default");
  const [sortDir, setSortDir] = useState("asc");
  const [doneBottom, setDoneBottom] = useState(false);
  const [focusTask, setFocusTask] = useState(null);

  // ── Side quests ──
  const [sideQuests, setSideQuests] = useState(() => JSON.parse(localStorage.getItem("sage_sq_v4") || "[]"));
  const [newSQ, setNewSQ] = useState("");

  // ── Sessions / streak ──
  const [sessions, setSessions] = useState(() => JSON.parse(localStorage.getItem("sage_sessions_v4") || "[]"));

  // ── Sound ──
  const [sound, setSound] = useState(null);
  const [vol, setVol] = useState(0.4);
  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);
  const nodesRef = useRef([]);

  // ── Persist ──
  useEffect(() => { localStorage.setItem("sage_tasks_v4", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("sage_sq_v4", JSON.stringify(sideQuests)); }, [sideQuests]);
  useEffect(() => { localStorage.setItem("sage_sessions_v4", JSON.stringify(sessions)); }, [sessions]);

  // ── Apply background to html element ──
  useEffect(() => {
    document.documentElement.style.background = theme.bg;
    document.documentElement.style.backgroundAttachment = "fixed";
    document.body.style.background = "transparent";
  }, [theme]);

  // ── Keyboard shortcut: T to cycle theme ──
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "t" || e.key === "T") {
        if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
          cycleTheme();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [themeIdx]);

  // ── Timer tick ──
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (!onBreak) {
              setSessions((prev) => [...prev, new Date().toISOString()]);
              setOnBreak(true);
              setSeconds(brkMin * 60);
            } else {
              setOnBreak(false);
              setSeconds(workMin * 60);
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, onBreak, workMin, brkMin]);

  const totalSec = (onBreak ? brkMin : workMin) * 60;
  const pct = ((totalSec - seconds) / totalSec) * 100;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  function startTimer() { setRunning(true); }
  function pauseTimer() { setRunning(false); }
  function resetTimer() { setRunning(false); setOnBreak(false); setSeconds(workMin * 60); }

  function applyPreset(p) {
    setWorkMin(p.work);
    setBrkMin(p.brk);
    setSeconds(p.work * 60);
    setRunning(false);
    setOnBreak(false);
  }

  function skipBreak() {
    setRunning(false);
    setOnBreak(false);
    setSeconds(workMin * 60);
    setShowSkipInput(false);
    setSkipReason("");
  }

  // ── Audio ──
  function stopAudio() {
    nodesRef.current.forEach((n) => { try { n.stop(); } catch {} });
    nodesRef.current = [];
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    gainRef.current = null;
  }

  function playSound(key) {
    stopAudio();
    if (!key) { setSound(null); return; }
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    gain.connect(ctx.destination);
    gainRef.current = gain;
    setSound(key);

    if (key === "rain") {
      const { src, out } = createRain(ctx);
      out.connect(gain);
      src.start();
      nodesRef.current = [src];
    } else if (key === "binaural") {
      const { src, src2, out } = createBinaural(ctx);
      out.connect(gain);
      src.start(); src2.start();
      nodesRef.current = [src, src2];
    } else {
      const src = createNoise(ctx, key === "brown" ? "brown" : "white");
      src.connect(gain);
      src.start();
      nodesRef.current = [src];
    }
  }

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = vol;
  }, [vol]);

  useEffect(() => () => stopAudio(), []);

  // ── Tasks logic ──
  function addTask() {
    if (!newTask.trim()) return;
    setTasks((prev) => [...prev, { id: Date.now(), text: newTask.trim(), done: false, mins: Number(newTaskTime) || 0, added: Date.now() }]);
    setNewTask("");
    setNewTaskTime("");
  }

  function toggleTask(id) { setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t)); }
  function deleteTask(id) { setTasks((prev) => prev.filter((t) => t.id !== id)); }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortMode === "az") return sortDir === "asc" ? a.text.localeCompare(b.text) : b.text.localeCompare(a.text);
    if (sortMode === "time") return sortDir === "asc" ? b.mins - a.mins : a.mins - b.mins;
    return sortDir === "asc" ? a.added - b.added : b.added - a.added;
  }).sort((a, b) => doneBottom ? (a.done === b.done ? 0 : a.done ? 1 : -1) : 0);

  // ── Side quests ──
  function addSQ() {
    if (!newSQ.trim()) return;
    setSideQuests((prev) => [...prev, { id: Date.now(), text: newSQ.trim() }]);
    setNewSQ("");
  }

  // ── Sort pill handler ──
  function handleSort(mode) {
    if (sortMode === mode) { setSortDir((d) => d === "asc" ? "desc" : "asc"); }
    else { setSortMode(mode); setSortDir("asc"); }
  }

  const sortArrow = (mode) => sortMode === mode ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  // ── Aurora colors for current theme ──
  const aurora = AURORA[theme.key];

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  const containerStyle = {
    minHeight: "100vh",
    background: theme.bg,
    fontFamily: "'Barlow', sans-serif",
    color: theme.text,
    position: "relative",
    overflowX: "hidden",
  };

  const innerStyle = {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "2rem 1.25rem 4rem",
    position: "relative",
    zIndex: 1,
  };

  const cardStyle = {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: "16px",
    padding: "1.25rem",
  };

  const inputStyle = {
    width: "100%",
    background: theme.inputBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "10px",
    padding: "0.55rem 0.85rem",
    color: theme.text,
    fontFamily: "'Barlow', sans-serif",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
  };

  const btnPrimary = {
    background: theme.accent,
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "0.55rem 1.1rem",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
    letterSpacing: "0.03em",
  };

  const btnGhost = {
    background: "transparent",
    color: theme.muted,
    border: `1px solid ${theme.border}`,
    borderRadius: "10px",
    padding: "0.45rem 0.9rem",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "0.8rem",
    cursor: "pointer",
  };

  const sectionLabel = {
    fontFamily: "'Barlow', sans-serif",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: theme.accent,
    marginBottom: "0.75rem",
    display: "block",
  };

  const pillStyle = (active) => ({
    padding: "0.25rem 0.65rem",
    borderRadius: "999px",
    border: `1px solid ${active ? theme.accent : theme.border}`,
    background: active ? theme.accent + "22" : "transparent",
    color: active ? theme.accent : theme.muted,
    fontFamily: "'Barlow', sans-serif",
    fontSize: "0.75rem",
    fontWeight: active ? 700 : 400,
    cursor: "pointer",
    transition: "all 0.15s ease",
  });

  return (
    <div style={containerStyle}>
      {/* ── Google Fonts: Barlow ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }
        html { background: ${theme.bg}; }

        @keyframes auroraWave {
          0%, 100% { transform: translateX(-8%) scaleY(1); opacity: 0.7; }
          50%       { transform: translateX(8%)  scaleY(1.15); opacity: 1; }
        }
        @keyframes auroraWave2 {
          0%, 100% { transform: translateX(6%) scaleY(1); opacity: 0.6; }
          50%       { transform: translateX(-6%) scaleY(1.2); opacity: 1; }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes gentlePulse {
          0%, 100% { box-shadow: 0 0 0 0 ${theme.accent}40; }
          50%       { box-shadow: 0 0 14px 5px ${theme.accent}30; }
        }
        @keyframes timerGlow {
          0%, 100% { filter: drop-shadow(0 0 4px ${theme.accent}60); }
          50%       { filter: drop-shadow(0 0 12px ${theme.accent}90); }
        }

        .focus-active {
          background: linear-gradient(270deg,
            ${theme.bg},
            ${theme.isDark ? "#1a1030" : theme.key === "solar" ? "#fff3e0" : theme.key === "electric" ? "#eef0ff" : theme.key === "bloom" ? "#ffe0f4" : "#e8f5ea"},
            ${theme.bg}) !important;
          background-size: 400% 400% !important;
          animation: gradientShift 15s ease infinite !important;
        }
        .aurora-container {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none; overflow: hidden; z-index: 0;
        }
        .aurora-wave {
          position: absolute; top: 10%; left: 0; width: 60%; height: 40%;
          background: linear-gradient(90deg, transparent, ${aurora[0]}, transparent);
          border-radius: 50%;
          animation: auroraWave 12s ease-in-out infinite;
        }
        .aurora-wave-2 {
          position: absolute; top: 50%; right: 0; width: 50%; height: 35%;
          background: linear-gradient(90deg, transparent, ${aurora[1]}, transparent);
          border-radius: 50%;
          animation: auroraWave2 16s ease-in-out infinite;
          animation-delay: 4s;
        }
        .aurora-wave-3 {
          position: absolute; top: 30%; left: 20%; width: 40%; height: 30%;
          background: linear-gradient(90deg, transparent, ${aurora[2]}, transparent);
          border-radius: 50%;
          animation: auroraWave 20s ease-in-out infinite;
          animation-delay: 8s;
        }
        .timer-glow svg { animation: timerGlow 3s ease-in-out infinite; }
        .start-pulse { animation: gentlePulse 2.5s ease-in-out infinite; }
        input::placeholder, textarea::placeholder { color: ${theme.muted}88; }
        input:focus, textarea:focus { border-color: ${theme.accent}88 !important; }
        button:hover { opacity: 0.85; }
        textarea { resize: vertical; }
      `}</style>

      {/* ── Aurora (focus only) ── */}
      {running && (
        <div className={`aurora-container`}>
          <div className="aurora-wave" />
          <div className="aurora-wave-2" />
          <div className="aurora-wave-3" />
        </div>
      )}

      <div style={innerStyle}>

        {/* ══ HEADER ══════════════════════════════════════════ */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: "1.6rem", color: theme.text, letterSpacing: "-0.02em", lineHeight: 1 }}>
              Sage & Steph
            </div>
            <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.72rem", color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "0.2rem" }}>
              Focus Dashboard · v{VERSION} · Updated Apr 2026
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <LiveClock color={theme.muted} />
            <div style={{ display: "flex", gap: "0.35rem" }}>
              {THEMES.map((t, i) => (
                <button
                  key={t.key}
                  onClick={() => { setThemeIdx(i); localStorage.setItem("sage_theme_v4", t.key); }}
                  title={t.label}
                  style={{
                    width: "18px", height: "18px", borderRadius: "50%",
                    background: t.accent,
                    border: themeIdx === i ? `2px solid ${theme.text}` : `2px solid transparent`,
                    cursor: "pointer",
                    padding: 0,
                    transition: "border 0.15s ease",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ══ TIMER + SOUND ════════════════════════════════════ */}
        <div style={{ ...cardStyle, marginBottom: "1.25rem" }}>
          <span style={sectionLabel}>Focus Timer</span>

          {/* Presets */}
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {PRESETS.map((p) => (
              <button key={p.label} style={pillStyle(workMin === p.work && brkMin === p.brk)} onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Timer ring */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <div
              className={running ? "timer-glow" : ""}
              style={{ position: "relative", width: "160px", height: "160px" }}
            >
              <svg viewBox="0 0 160 160" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="80" cy="80" r="70" fill="none" stroke={theme.border} strokeWidth="8" />
                <circle
                  cx="80" cy="80" r="70" fill="none"
                  stroke={theme.accent} strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - pct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 800, fontSize: "2.2rem", color: theme.text, letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {mm}:{ss}
                </div>
                <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.7rem", color: theme.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "0.2rem" }}>
                  {onBreak ? "Break" : "Focus"}
                </div>
              </div>
            </div>

            {/* Paused banner */}
            {!running && seconds < (onBreak ? brkMin : workMin) * 60 && seconds > 0 && (
              <div
                onClick={() => setRunning(true)}
                style={{ background: theme.accent + "22", border: `1px solid ${theme.accent}44`, borderRadius: "8px", padding: "0.4rem 1rem", fontSize: "0.78rem", color: theme.accent, cursor: "pointer", fontFamily: "'Barlow', sans-serif", fontWeight: 600 }}
              >
                ⏸ Paused — tap to resume
              </div>
            )}

            {/* Controls */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              {!running ? (
                <button
                  className={seconds === (onBreak ? brkMin : workMin) * 60 ? "start-pulse" : ""}
                  style={btnPrimary}
                  onClick={startTimer}
                >
                  {seconds === (onBreak ? brkMin : workMin) * 60 ? "Start" : "Resume"}
                </button>
              ) : (
                <button style={btnPrimary} onClick={pauseTimer}>Pause</button>
              )}
              <button style={btnGhost} onClick={resetTimer}>Reset</button>
              {onBreak && (
                <button style={btnGhost} onClick={() => setShowSkipInput(!showSkipInput)}>
                  Skip Break
                </button>
              )}
            </div>

            {showSkipInput && onBreak && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input
                  style={inputStyle}
                  placeholder="Why skip? (optional)"
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                />
                <button style={btnPrimary} onClick={skipBreak}>Confirm Skip</button>
              </div>
            )}

            {/* Focus task indicator */}
            {focusTask && (
              <div style={{ fontSize: "0.8rem", color: theme.muted, fontStyle: "italic", fontFamily: "'Barlow', sans-serif" }}>
                Focusing on: <strong style={{ color: theme.accent }}>{focusTask}</strong>
              </div>
            )}
          </div>

          {/* Sound controls */}
          <div style={{ marginTop: "1.25rem", borderTop: `1px solid ${theme.border}`, paddingTop: "1rem" }}>
            <span style={{ ...sectionLabel, marginBottom: "0.5rem" }}>Ambient Sound</span>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              {Object.entries(SOUNDS).map(([key, val]) => (
                <button key={key} style={pillStyle(sound === key)} onClick={() => sound === key ? playSound(null) : playSound(key)}>
                  {val.label}
                </button>
              ))}
            </div>
            {sound && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.75rem", color: theme.muted, fontFamily: "'Barlow', sans-serif" }}>Volume</span>
                <input type="range" min="0" max="1" step="0.05" value={vol}
                  onChange={(e) => setVol(Number(e.target.value))}
                  style={{ flex: 1, accentColor: theme.accent }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ══ TASK + SIDE QUEST PANELS ═════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.25rem", marginBottom: "1.25rem" }}>

          {/* Tasks */}
          <div style={cardStyle}>
            <span style={sectionLabel}>Tasks</span>

            {/* Add task */}
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Add a task..." value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()} />
              <input style={{ ...inputStyle, width: "70px" }} placeholder="min" type="number"
                value={newTaskTime} onChange={(e) => setNewTaskTime(e.target.value)} />
              <button style={btnPrimary} onClick={addTask}>+</button>
            </div>

            {/* Sort */}
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
              {[["default", "Default"], ["az", "A–Z"], ["time", "Time ↓"]].map(([mode, label]) => (
                <button key={mode} style={pillStyle(sortMode === mode)} onClick={() => handleSort(mode)}>
                  {label}{sortArrow(mode)}
                </button>
              ))}
              <button style={pillStyle(doneBottom)} onClick={() => setDoneBottom(!doneBottom)}>Done ↓</button>
            </div>

            {/* Task list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "320px", overflowY: "auto" }}>
              {sortedTasks.map((task) => (
                <div key={task.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 0.6rem", background: theme.timerBg, borderRadius: "8px", border: `1px solid ${theme.border}` }}>
                  <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} style={{ accentColor: theme.accent, cursor: "pointer" }} />
                  <span
                    style={{ flex: 1, fontSize: "0.85rem", color: task.done ? theme.muted : theme.text, textDecoration: task.done ? "line-through" : "none", cursor: "pointer", fontFamily: "'Barlow', sans-serif" }}
                    onClick={() => setFocusTask(task.done ? null : task.text)}
                  >
                    {task.text}
                  </span>
                  {task.mins > 0 && <span style={{ fontSize: "0.7rem", color: theme.muted, fontFamily: "'Barlow', sans-serif" }}>{task.mins}m</span>}
                  <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", fontSize: "0.75rem", padding: "0 2px" }}>×</button>
                </div>
              ))}
              {sortedTasks.length === 0 && (
                <div style={{ fontSize: "0.8rem", color: theme.muted, fontStyle: "italic", fontFamily: "'Barlow', sans-serif", padding: "0.5rem" }}>Nothing here yet.</div>
              )}
            </div>
          </div>

          {/* Side Quests */}
          <div style={cardStyle}>
            <span style={sectionLabel}>Side Quests — capture it, don't chase it</span>
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem" }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Brain fired? Drop it here..."
                value={newSQ} onChange={(e) => setNewSQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSQ()} />
              <button style={btnPrimary} onClick={addSQ}>+</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "350px", overflowY: "auto" }}>
              {sideQuests.map((sq) => (
                <div key={sq.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.45rem 0.6rem", background: theme.timerBg, borderRadius: "8px", border: `1px solid ${theme.border}` }}>
                  <span style={{ flex: 1, fontSize: "0.85rem", color: theme.text, fontFamily: "'Barlow', sans-serif", lineHeight: 1.4 }}>{sq.text}</span>
                  <button onClick={() => setSideQuests((p) => p.filter((s) => s.id !== sq.id))} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", fontSize: "0.75rem", padding: "0 2px", flexShrink: 0 }}>×</button>
                </div>
              ))}
              {sideQuests.length > 0 && (
                <button style={{ ...btnGhost, marginTop: "0.25rem", fontSize: "0.72rem" }} onClick={() => setSideQuests([])}>Clear all</button>
              )}
              {sideQuests.length === 0 && (
                <div style={{ fontSize: "0.8rem", color: theme.muted, fontStyle: "italic", fontFamily: "'Barlow', sans-serif", padding: "0.5rem" }}>No distractions captured yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* ══ STREAK ═══════════════════════════════════════════ */}
        <div style={{ ...cardStyle, marginBottom: "1.25rem" }}>
          <span style={sectionLabel}>Focus Streak — last 35 days</span>
          <div style={{ fontSize: "0.78rem", color: theme.muted, fontFamily: "'Barlow', sans-serif", marginBottom: "0.25rem" }}>
            {sessions.filter((s) => new Date(s).toDateString() === new Date().toDateString()).length} session{sessions.filter((s) => new Date(s).toDateString() === new Date().toDateString()).length !== 1 ? "s" : ""} today · {sessions.length} total
          </div>
          <StreakGrid sessions={sessions} accent={theme.accent} muted={theme.muted} border={theme.border} />
        </div>

        {/* ══ PI PLANNING SECTIONS ═════════════════════════════ */}
        <PIParkingLot theme={theme} />
        <PIReadiness theme={theme} />
        {/* See PI_DEPLOY_INSTRUCTIONS.md for exact placement */}

      </div>
    </div>
  );
}
