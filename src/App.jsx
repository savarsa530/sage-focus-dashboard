import { useState, useEffect, useRef, useCallback } from "react";

if (!window.storage) {
  window.storage = {
    get: (key) => Promise.resolve({ value: localStorage.getItem(key) }),
    set: (key, value) => { localStorage.setItem(key, value); return Promise.resolve(); },
  };
}

const SOUNDS = {
  rain: { label: "Rain", color: "#7B9EA8" },
  brown: { label: "Brown Noise", color: "#8B7355" },
  binaural: { label: "Binaural Beats", color: "#9B7ED8" },
  white: { label: "White Noise", color: "#B8B8B8" },
};
const PRESETS = [
  { label: "25 / 5", work: 25, brk: 5 },
  { label: "50 / 10", work: 50, brk: 10 },
  { label: "90 / 20", work: 90, brk: 20 },
];
const MANTRAS = [
  "Come back to center.", "You sat down for a reason.", "This is what matters right now.",
  "Gently return.", "Your intention is waiting.", "One thing at a time.",
  "Right here. This task.", "You chose this. Trust that.",
];
const BREAK_PROMPTS = [
  "Stand up and stretch your arms overhead.", "Drink some water.", "Look out the window for 20 seconds.",
  "Roll your shoulders back, then forward.", "Take three slow, deep breaths.",
  "Close your eyes for a moment.", "Wiggle your fingers and toes.", "Smile. You showed up today.",
];
const CELEBRATIONS = [
  "Done. You actually did the thing.", "Look at you, finishing what you started.",
  "That's one fewer thing on your mind.", "Checked off. Breathe that in.",
  "Intention met. That's not small.", "You said you'd do it. You did it.",
];

// ─── Theme Definitions ───
const THEMES = {
  dark: {
    key: "dark",
    label: "Deep",
    icon: "☽",
    bg: "linear-gradient(145deg, #1a1025 0%, #2d1b3d 40%, #1e1428 100%)",
    textPrimary: "#e8ddd3",
    textSecondary: "#8b7b8e",
    textMuted: "#6b5b6e",
    textDimmest: "#4a3d4e",
    accent: "#d4a574",
    accentSoft: "rgba(212,165,116,0.15)",
    panelBg: "rgba(255,255,255,0.02)",
    panelBorder: "rgba(139,123,142,0.1)",
    inputBg: "rgba(255,255,255,0.04)",
    inputBorder: "rgba(139,123,142,0.2)",
    overlayBg: "rgba(10,6,15,0.92)",
  },
  soft: {
    key: "soft",
    label: "Soft",
    icon: "◐",
    bg: "linear-gradient(145deg, #2a2433 0%, #3d3347 40%, #2e2838 100%)",
    textPrimary: "#f0e6dc",
    textSecondary: "#a89aad",
    textMuted: "#8a7d8f",
    textDimmest: "#6a5d6e",
    accent: "#e0b896",
    accentSoft: "rgba(224,184,150,0.18)",
    panelBg: "rgba(255,255,255,0.04)",
    panelBorder: "rgba(168,154,173,0.12)",
    inputBg: "rgba(255,255,255,0.06)",
    inputBorder: "rgba(168,154,173,0.25)",
    overlayBg: "rgba(30,24,38,0.94)",
  },
  light: {
    key: "light",
    label: "Awake",
    icon: "☀",
    bg: "linear-gradient(145deg, #f5f0eb 0%, #ebe4dc 40%, #f0ebe5 100%)",
    textPrimary: "#2d2433",
    textSecondary: "#6b5d70",
    textMuted: "#8a7d8f",
    textDimmest: "#b0a3b5",
    accent: "#9a6b4a",
    accentSoft: "rgba(154,107,74,0.12)",
    panelBg: "rgba(255,255,255,0.7)",
    panelBorder: "rgba(139,123,142,0.15)",
    inputBg: "rgba(255,255,255,0.8)",
    inputBorder: "rgba(139,123,142,0.25)",
    overlayBg: "rgba(245,240,235,0.96)",
  },
};

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (s) => { const m = Math.floor(s / 60), sc = s % 60; return `${String(m).padStart(2, "0")}:${String(sc).padStart(2, "0")}`; };
const fmtMins = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Audio builders ───
function buildRain(ctx, vol) {
  const gain = ctx.createGain();
  gain.gain.value = vol;
  gain.connect(ctx.destination);
  const sr = ctx.sampleRate;
  const bedLen = sr * 4;
  const bedBuf = ctx.createBuffer(1, bedLen, sr);
  const bd = bedBuf.getChannelData(0);
  let prev = 0;
  for (let i = 0; i < bedLen; i++) {
    prev = (prev + 0.005 * (Math.random() * 2 - 1)) / 1.005;
    bd[i] = prev * 5;
  }
  const bedSrc = ctx.createBufferSource();
  bedSrc.buffer = bedBuf; bedSrc.loop = true;
  const bedLp = ctx.createBiquadFilter();
  bedLp.type = "lowpass"; bedLp.frequency.value = 600;
  const bedVol = ctx.createGain(); bedVol.gain.value = 0.5;
  bedSrc.connect(bedLp).connect(bedVol).connect(gain);
  const dropLen = sr * 5;
  const dropBuf = ctx.createBuffer(2, dropLen, sr);
  for (let ch = 0; ch < 2; ch++) {
    const dd = dropBuf.getChannelData(ch);
    let i = 0;
    while (i < dropLen) {
      i += 20 + Math.floor(Math.random() * 180);
      if (i >= dropLen) break;
      const amp = 0.03 + Math.random() * 0.15;
      const len = 3 + Math.floor(Math.random() * 8);
      for (let j = 0; j < len && (i + j) < dropLen; j++) {
        dd[i + j] = amp * (1 - j / len);
      }
    }
  }
  const dropSrc = ctx.createBufferSource();
  dropSrc.buffer = dropBuf; dropSrc.loop = true;
  const dropBp = ctx.createBiquadFilter();
  dropBp.type = "bandpass"; dropBp.frequency.value = 3500; dropBp.Q.value = 0.4;
  const dropVol = ctx.createGain(); dropVol.gain.value = 0.5;
  dropSrc.connect(dropBp).connect(dropVol).connect(gain);
  const midLen = sr * 3;
  const midBuf = ctx.createBuffer(1, midLen, sr);
  const md = midBuf.getChannelData(0);
  let mp = 0;
  for (let i = 0; i < midLen; i++) {
    mp = (mp + 0.012 * (Math.random() * 2 - 1)) / 1.012;
    md[i] = mp * 3;
  }
  const midSrc = ctx.createBufferSource();
  midSrc.buffer = midBuf; midSrc.loop = true;
  const midBp = ctx.createBiquadFilter();
  midBp.type = "bandpass"; midBp.frequency.value = 1600; midBp.Q.value = 0.5;
  const midVol = ctx.createGain(); midVol.gain.value = 0.3;
  midSrc.connect(midBp).connect(midVol).connect(gain);
  bedSrc.start(); dropSrc.start(); midSrc.start();
  return { nodes: [bedSrc, dropSrc, midSrc], gain };
}

function buildBrown(ctx, vol) {
  const gain = ctx.createGain(); gain.gain.value = vol; gain.connect(ctx.destination);
  const n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  let l = 0; for (let i = 0; i < n; i++) { d[i] = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; l = d[i]; d[i] *= 3.5; }
  const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(gain); s.start();
  return { nodes: [s], gain };
}

function buildWhite(ctx, vol) {
  const gain = ctx.createGain(); gain.gain.value = vol; gain.connect(ctx.destination);
  const n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(gain); s.start();
  return { nodes: [s], gain };
}

function buildBinaural(ctx, vol) {
  const gain = ctx.createGain(); gain.gain.value = vol; gain.connect(ctx.destination);
  const oL = ctx.createOscillator(), oR = ctx.createOscillator();
  oL.frequency.value = 200; oR.frequency.value = 210; oL.type = oR.type = "sine";
  const m = ctx.createChannelMerger(2); oL.connect(m, 0, 0); oR.connect(m, 0, 1); m.connect(gain);
  oL.start(); oR.start();
  return { nodes: [oL, oR], gain };
}

const BUILDERS = { rain: buildRain, brown: buildBrown, white: buildWhite, binaural: buildBinaural };

function Overlay({ children, onClose, bg, theme }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: bg || theme.overlayBg, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(8px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ textAlign: "center", maxWidth: 460, animation: "fadeUp 0.6s ease", width: "100%" }}>{children}</div>
    </div>
  );
}

function StreakGrid({ log, theme }) {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = log.find(l => l.date === key);
    days.push({ key, label: d.toLocaleDateString(undefined, { weekday: "narrow" }), sessions: entry?.sessions || 0, mins: entry?.focusSecs ? Math.round(entry.focusSecs / 60) : 0 });
  }
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
      {days.map(d => (
        <div key={d.key} title={`${d.key}: ${d.sessions} sessions, ${d.mins}m`} style={{ width: 28, height: 28, borderRadius: 6, background: d.sessions === 0 ? `${theme.textMuted}14` : d.sessions < 3 ? `${theme.accent}33` : d.sessions < 6 ? `${theme.accent}66` : `${theme.accent}B3`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: d.sessions > 0 ? (theme.key === "light" ? "#fff" : "#1a1025") : theme.textMuted, fontWeight: 600 }}>
          {d.label}
        </div>
      ))}
    </div>
  );
}

// ─── Live Clock Component ───
function LiveClock({ theme }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const tick = () => setTime(new Date());
    let intervalId = null;

    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const timeout = setTimeout(() => {
      tick();
      intervalId = setInterval(tick, 60000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const formatted = time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <span style={{ fontSize: 13, color: theme.textSecondary, fontFamily: "'Courier New', monospace", letterSpacing: 1 }}>
      {formatted}
    </span>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [distractions, setDistractions] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [newDist, setNewDist] = useState("");
  const [focusId, setFocusId] = useState(null);
  const [timerSettings, setTimerSettings] = useState({ work: 25, brk: 5 });
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("work");
  const [activeSounds, setActiveSounds] = useState({});
  const [volume, setVolume] = useState(0.3);
  const [loaded, setLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customWork, setCustomWork] = useState("25");
  const [customBreak, setCustomBreak] = useState("5");
  const [sessionLog, setSessionLog] = useState([]);
  const [dailyIntention, setDailyIntention] = useState("");
  const [intentionInput, setIntentionInput] = useState("");
  const [zenMode, setZenMode] = useState(false);
  const [overlay, setOverlay] = useState(null);
  const [overlayData, setOverlayData] = useState({});
  const [reflectInput, setReflectInput] = useState("");
  const [showedIntention, setShowedIntention] = useState(false);
  // ── L4: Skip break ────────────────────────────────────────────────────────
  const [skipReason, setSkipReason] = useState("");
  const [showSkipInput, setShowSkipInput] = useState(false);
  // ── M3: Sort — now with direction ─────────────────────────────────────────
  const [sortBy, setSortBy] = useState("default"); // "default" | "alpha" | "time"
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"
  const [doneToBottom, setDoneToBottom] = useState(false);
  // ── M2: Drag visual feedback ──────────────────────────────────────────────
  const [dragOverId, setDragOverId] = useState(null);
  // ── Theme ─────────────────────────────────────────────────────────────────
  const [themeKey, setThemeKey] = useState("dark");
  const theme = THEMES[themeKey];
  // ── Parking lot collapse ──────────────────────────────────────────────────
  const [parkingOpen, setParkingOpen] = useState(true);

  const soundRefs = useRef({});
  const ctxRef = useRef(null);
  const intervalRef = useRef(null);
  const distRef = useRef(null);
  const saveTasksTimer = useRef(null);
  // ── M2: Drag item tracking ────────────────────────────────────────────────
  const dragItemId = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  };

  const toggleSound = useCallback((key) => {
    if (soundRefs.current[key]) {
      try {
        soundRefs.current[key].nodes.forEach(n => { try { n.stop(); } catch (_) {} });
        soundRefs.current[key].gain.disconnect();
      } catch (_) {}
      delete soundRefs.current[key];
      setActiveSounds(s => { const n = { ...s }; delete n[key]; return n; });
    } else {
      const ctx = getCtx();
      const builder = BUILDERS[key];
      if (!builder) return;
      soundRefs.current[key] = builder(ctx, volume);
      setActiveSounds(s => ({ ...s, [key]: true }));
    }
  }, [volume]);

  useEffect(() => {
    Object.values(soundRefs.current).forEach(ref => {
      if (ref.gain) ref.gain.gain.value = volume;
    });
  }, [volume]);

  const playChime = () => {
    try {
      const ctx = getCtx();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(528, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(396, ctx.currentTime + 1.5);
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      o.connect(g).connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 1.5);
    } catch (_) {}
  };

  // ─── Storage ───
  useEffect(() => {
    (async () => {
      try {
        const [tR, dR, sR, lR, iR, thR] = await Promise.all([
          window.storage.get("sage-tasks").catch(() => null),
          window.storage.get("sage-dist").catch(() => null),
          window.storage.get("sage-settings").catch(() => null),
          window.storage.get("sage-log").catch(() => null),
          window.storage.get("sage-intention").catch(() => null),
          window.storage.get("sage-theme").catch(() => null),
        ]);
        if (tR?.value) { const t = JSON.parse(tR.value); setTasks(t.tasks || []); setFocusId(t.focusId || null); }
        if (dR?.value) setDistractions(JSON.parse(dR.value));
        if (sR?.value) { const s = JSON.parse(sR.value); setTimerSettings(s); setTimeLeft(s.work * 60); setCustomWork(String(s.work)); setCustomBreak(String(s.brk)); }
        if (lR?.value) setSessionLog(JSON.parse(lR.value));
        if (iR?.value) { const i = JSON.parse(iR.value); if (i.date === today()) { setDailyIntention(i.text); setShowedIntention(true); } }
        if (thR?.value && THEMES[thR.value]) setThemeKey(thR.value);
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTasksTimer.current);
    saveTasksTimer.current = setTimeout(() => {
      window.storage.set("sage-tasks", JSON.stringify({ tasks, focusId })).catch(() => {});
    }, 1000);
  }, [tasks, focusId, loaded]);
  useEffect(() => { if (loaded) window.storage.set("sage-dist", JSON.stringify(distractions)).catch(() => {}); }, [distractions, loaded]);
  useEffect(() => { if (loaded) window.storage.set("sage-settings", JSON.stringify(timerSettings)).catch(() => {}); }, [timerSettings, loaded]);
  useEffect(() => { if (loaded) window.storage.set("sage-log", JSON.stringify(sessionLog)).catch(() => {}); }, [sessionLog, loaded]);
  useEffect(() => { if (loaded) window.storage.set("sage-theme", themeKey).catch(() => {}); }, [themeKey, loaded]);
  useEffect(() => { if (loaded && !showedIntention && !dailyIntention) { setOverlay("intention"); setShowedIntention(true); } }, [loaded, showedIntention, dailyIntention]);

  // Reset skip state when overlay changes
  useEffect(() => {
    if (overlay !== "refocus") { setShowSkipInput(false); setSkipReason(""); }
  }, [overlay]);

  // ─── Timer ───
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        if (phase === "work" && focusId) {
          setTasks(t => t.map(x => x.id === focusId ? { ...x, focusSecs: (x.focusSecs || 0) + 1 } : x));
        }
        setTimeLeft(t => {
          if (t <= 1) {
            playChime();
            if (phase === "work") {
              updateLog(1); setPhase("break");
              setOverlayData({ msg: pick(BREAK_PROMPTS), mantra: pick(MANTRAS) }); setOverlay("refocus");
              return timerSettings.brk * 60;
            } else {
              setPhase("work");
              setOverlayData({ mantra: pick(MANTRAS) }); setOverlay("refocus");
              return timerSettings.work * 60;
            }
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, phase, timerSettings, focusId]);

  const updateLog = (add) => {
    setSessionLog(prev => {
      const d = today(), idx = prev.findIndex(l => l.date === d);
      if (idx >= 0) { const u = [...prev]; u[idx] = { ...u[idx], sessions: u[idx].sessions + add, focusSecs: (u[idx].focusSecs || 0) + timerSettings.work * 60 }; return u; }
      return [...prev.slice(-29), { date: d, sessions: add, focusSecs: timerSettings.work * 60 }];
    });
  };

  const handleStartRef = useRef(null);
  const handleStart = useCallback(() => {
    if (running) { setRunning(false); return; }
    if (!focusId && tasks.filter(t => !t.done).length > 0) { setOverlay("nudge"); return; }
    getCtx(); setRunning(true);
  }, [running, focusId, tasks]);
  handleStartRef.current = handleStart;

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); handleStartRef.current?.(); }
      if (e.key === "d" || e.key === "D") { e.preventDefault(); setParkingOpen(true); distRef.current?.focus(); }
      if (e.key === "z" || e.key === "Z") { e.preventDefault(); setZenMode(z => !z); }
      if (e.key === "Escape") setOverlay(null);
      // Theme cycling with T key
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setThemeKey(k => k === "dark" ? "soft" : k === "soft" ? "light" : "dark");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ─── Focus mode ambient effect on html ───
  useEffect(() => {
    if (running) {
      document.documentElement.classList.add('focus-active');
    } else {
      document.documentElement.classList.remove('focus-active');
    }
    return () => document.documentElement.classList.remove('focus-active');
  }, [running]);

  // ─── Actions ───
  const addTask = () => { if (!newTask.trim()) return; setTasks(t => [...t, { id: Date.now(), text: newTask.trim(), done: false, focusSecs: 0 }]); setNewTask(""); };
  const toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.done && id === focusId) {
      setOverlayData({ msg: pick(CELEBRATIONS), task: task.text, secs: task.focusSecs || 0 });
      setOverlay("celebrate"); setFocusId(null);
    }
    setTasks(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x));
    if (focusId === id && task?.done) setFocusId(null);
  };
  const removeTask = (id) => { setTasks(t => t.filter(x => x.id !== id)); if (focusId === id) setFocusId(null); };
  const addDist = () => { if (!newDist.trim()) return; setDistractions(d => [{ id: Date.now(), text: newDist.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...d]); setNewDist(""); };
  // ── M1: Delete individual side quest ─────────────────────────────────────
  const removeDist = (id) => setDistractions(d => d.filter(x => x.id !== id));
  const clearDone = () => setTasks(t => t.filter(x => !x.done));
  const clearDist = () => setDistractions([]);
  const startWithTask = (id) => { setFocusId(id); setOverlay(null); getCtx(); setRunning(true); };
  const startAnyway = () => { setOverlay(null); getCtx(); setRunning(true); };
  const saveIntention = () => { const t = intentionInput.trim(); if (t) { setDailyIntention(t); window.storage.set("sage-intention", JSON.stringify({ date: today(), text: t })).catch(() => {}); } setOverlay(null); setIntentionInput(""); };
  const applyPreset = (w, b) => { setTimerSettings({ work: w, brk: b }); setCustomWork(String(w)); setCustomBreak(String(b)); if (!running) setTimeLeft(phase === "work" ? w * 60 : b * 60); };
  const applyCustom = () => { const w = Math.max(1, Math.min(180, parseInt(customWork) || 25)); const b = Math.max(1, Math.min(60, parseInt(customBreak) || 5)); applyPreset(w, b); setShowSettings(false); };
  const resetTimer = () => { setRunning(false); setPhase("work"); setTimeLeft(timerSettings.work * 60); };

  // ── L4: Skip break ────────────────────────────────────────────────────────
  const skipBreak = () => { setPhase("work"); setTimeLeft(timerSettings.work * 60); setOverlay(null); setSkipReason(""); setShowSkipInput(false); };

  // ── M2: Drag — only active on Default sort with doneToBottom off ──────────
  const canDrag = sortBy === "default" && !doneToBottom;

  const handleDragStart = (id) => { dragItemId.current = id; };
  const handleDragOver = (e, id) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!dragItemId.current || dragItemId.current === targetId) { setDragOverId(null); return; }
    setTasks(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(t => t.id === dragItemId.current);
      const toIdx = arr.findIndex(t => t.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [removed] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, removed);
      return arr;
    });
    dragItemId.current = null;
    setDragOverId(null);
  };
  const handleDragEnd = () => { dragItemId.current = null; setDragOverId(null); };

  // ── M3: Bidirectional sort toggle ─────────────────────────────────────────
  const toggleSort = (key) => {
    if (sortBy === key) {
      // Toggle direction
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      // Switch to new sort, default direction
      setSortBy(key);
      setSortDir("asc");
    }
  };

  // ── M3: Computed sorted task list ─────────────────────────────────────────
  const sortedTasks = (() => {
    let arr = [...tasks];
    if (sortBy === "alpha") {
      arr.sort((a, b) => sortDir === "asc"
        ? a.text.localeCompare(b.text)
        : b.text.localeCompare(a.text)
      );
    }
    if (sortBy === "time") {
      arr.sort((a, b) => sortDir === "asc"
        ? (b.focusSecs || 0) - (a.focusSecs || 0)  // asc = most time first (default)
        : (a.focusSecs || 0) - (b.focusSecs || 0)  // desc = least time first
      );
    }
    if (doneToBottom) arr.sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
    return arr;
  })();

  const focusTask = tasks.find(t => t.id === focusId);
  const totalSec = (phase === "work" ? timerSettings.work : timerSettings.brk) * 60;
  const pct = ((totalSec - timeLeft) / totalSec) * 100;
  const todayLog = sessionLog.find(l => l.date === today());
  const btn = (x) => ({ border: "none", cursor: "pointer", borderRadius: 24, fontSize: 13, transition: "all 0.3s", ...x });

  // Sort pill arrow helper
  const sortArrow = (key) => {
    if (sortBy !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: theme.accent, fontSize: 18, fontFamily: "'Outfit', sans-serif" }}>Loading your sanctuary...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", color: theme.textPrimary, fontFamily: "'Outfit', 'Segoe UI', system-ui, sans-serif", padding: "20px 16px", boxSizing: "border-box", width: "100%" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        input:focus,textarea:focus{border-color:${theme.accent}66!important;outline:none}
        html{
          min-height:100%;
          background:${theme.bg};
          background-attachment:fixed;
        }
        body{min-height:100%;background:transparent;margin:0;}
        #root{
          width:100%!important;
          max-width:100%!important;
          background:transparent!important;
          text-align:left!important;
          border:none!important;
          margin:0!important;
        }
        /* Smooth theme colour transitions — exclude draggable rows to avoid Chrome drag bug */
        *:not([draggable="true"]) { transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease; }
        html{ transition: background 0.3s ease; }
        /* Side quests collapsed/expanded transition */
        .parking-body{
          overflow: hidden;
          transition: max-height 0.25s ease, opacity 0.2s ease, background-color 0.2s ease;
        }
        .parking-body.open{ max-height: 400px; opacity: 1; }
        .parking-body.closed{ max-height: 0; opacity: 0; pointer-events: none; }
        /* M2: Drag styles */
        .task-row{ transition: border-top 0.1s ease, opacity 0.15s ease, background-color 0.2s ease, color 0.2s ease; }
        .task-row.drag-over{ border-top: 2px solid ${theme.accent}80 !important; }
        .drag-handle{
          cursor: grab;
          color: ${theme.textDimmest};
          font-size: 13px;
          padding: 0 4px 0 0;
          flex-shrink: 0;
          user-select: none;
          transition: color 0.2s ease;
          line-height: 1;
        }
        .drag-handle:hover{ color: ${theme.textSecondary}; }
        /* M3: Sort pills */
        .sort-pill{ transition: all 0.2s ease; }
        /* Pulsing Start button when idle */
        @keyframes gentlePulse {
          0%, 100% { box-shadow: 0 0 0 0 ${theme.accent}40; }
          50% { box-shadow: 0 0 12px 4px ${theme.accent}30; }
        }
        .start-pulse {
          animation: gentlePulse 2.5s ease-in-out infinite;
        }
        /* ═══ FOCUS MODE AMBIENT EFFECTS ═══ */
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes auroraWave {
          0% { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
          20% { opacity: 0.12; }
          80% { opacity: 0.12; }
          100% { transform: translateX(200%) skewX(-15deg); opacity: 0; }
        }
        @keyframes auroraWave2 {
          0% { transform: translateX(200%) skewX(15deg); opacity: 0; }
          20% { opacity: 0.08; }
          80% { opacity: 0.08; }
          100% { transform: translateX(-100%) skewX(15deg); opacity: 0; }
        }
        @keyframes timerGlow {
          0%, 100% { filter: drop-shadow(0 0 8px ${theme.accent}40); }
          50% { filter: drop-shadow(0 0 20px ${theme.accent}60); }
        }
        .focus-active {
          background: linear-gradient(270deg,
            ${theme.key === 'light' ? '#f5f0eb' : theme.key === 'soft' ? '#2a2433' : '#1a1025'},
            ${theme.key === 'light' ? '#ebe4dc' : theme.key === 'soft' ? '#3d3347' : '#2d1b3d'},
            ${theme.key === 'light' ? '#e6ddd4' : theme.key === 'soft' ? '#352d40' : '#251832'},
            ${theme.key === 'light' ? '#ddd8d0' : theme.key === 'soft' ? '#2e2838' : '#2a1f38'},
            ${theme.key === 'light' ? '#e8e2db' : theme.key === 'soft' ? '#322b3c' : '#1e1428'},
            ${theme.key === 'light' ? '#f0ebe5' : theme.key === 'soft' ? '#2a2433' : '#1a1025'}) !important;
          background-size: 400% 400% !important;
          animation: gradientShift 15s ease infinite !important;
        }
        .aurora-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }
        .aurora-wave {
          position: absolute;
          top: 10%;
          left: 0;
          width: 60%;
          height: 40%;
          background: linear-gradient(90deg, transparent, ${theme.key === 'light' ? 'rgba(154,107,74,0.15)' : theme.key === 'soft' ? 'rgba(224,184,150,0.16)' : 'rgba(212,165,116,0.19)'}, ${theme.key === 'light' ? 'rgba(123,158,168,0.12)' : theme.key === 'soft' ? 'rgba(155,126,216,0.14)' : 'rgba(155,126,216,0.12)'}, transparent);
          border-radius: 50%;
          animation: auroraWave 12s ease-in-out infinite;
        }
        .aurora-wave-2 {
          position: absolute;
          top: 50%;
          right: 0;
          width: 50%;
          height: 35%;
          background: linear-gradient(90deg, transparent, ${theme.key === 'light' ? 'rgba(123,158,168,0.14)' : theme.key === 'soft' ? 'rgba(123,158,168,0.13)' : 'rgba(123,158,168,0.12)'}, ${theme.key === 'light' ? 'rgba(154,107,74,0.12)' : theme.key === 'soft' ? 'rgba(224,184,150,0.14)' : 'rgba(212,165,116,0.15)'}, transparent);
          border-radius: 50%;
          animation: auroraWave2 16s ease-in-out infinite;
          animation-delay: 4s;
        }
        .aurora-wave-3 {
          position: absolute;
          top: 30%;
          left: 20%;
          width: 40%;
          height: 30%;
          background: linear-gradient(90deg, transparent, ${theme.key === 'light' ? 'rgba(155,126,216,0.10)' : theme.key === 'soft' ? 'rgba(155,126,216,0.11)' : 'rgba(155,126,216,0.09)'}, transparent);
          border-radius: 50%;
          animation: auroraWave 20s ease-in-out infinite;
          animation-delay: 8s;
        }
        .timer-glow svg {
          animation: timerGlow 3s ease-in-out infinite;
        }
      `}</style>

      {/* ═══ AURORA WAVES (only when timer running) ═══ */}
      {running && (
        <div className="aurora-container">
          <div className="aurora-wave"></div>
          <div className="aurora-wave-2"></div>
          <div className="aurora-wave-3"></div>
        </div>
      )}

      {/* ═══ OVERLAYS ═══ */}
      {overlay === "intention" && (
        <Overlay onClose={() => setOverlay(null)} theme={theme}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>☀</div>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 4, color: theme.textSecondary, marginBottom: 8 }}>New Day</div>
          <div style={{ fontSize: 24, fontFamily: "'Outfit', sans-serif", color: theme.accent, marginBottom: 24 }}>What matters most today?</div>
          <input value={intentionInput} onChange={e => setIntentionInput(e.target.value)} onKeyDown={e => e.key === "Enter" && saveIntention()} placeholder="My intention for today..." autoFocus
            style={{ width: "80%", maxWidth: 340, padding: "12px 16px", borderRadius: 12, border: `1px solid ${theme.accent}4D`, background: theme.inputBg, color: theme.textPrimary, fontSize: 15, textAlign: "center", fontFamily: "'Outfit', sans-serif" }} />
          <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={saveIntention} style={btn({ padding: "10px 32px", border: `1px solid ${theme.accent}66`, background: theme.accentSoft, color: theme.accent, letterSpacing: 1 })}>Set Intention</button>
            <button onClick={() => setOverlay(null)} style={btn({ padding: "10px 20px", border: `1px solid ${theme.textSecondary}33`, background: "transparent", color: theme.textSecondary })}>Skip</button>
          </div>
        </Overlay>
      )}

      {overlay === "refocus" && (
        <Overlay onClose={() => setOverlay(null)} theme={theme}>
          <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.6 }}>✦</div>
          <div style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 4, color: theme.textSecondary, marginBottom: 16 }}>{phase === "work" ? "Time to focus" : "Take a breath"}</div>
          {phase === "break" && overlayData.msg && <div style={{ fontSize: 20, fontFamily: "'Outfit', sans-serif", color: "#7B9EA8", marginBottom: 20, lineHeight: 1.5 }}>{overlayData.msg}</div>}
          {focusTask && phase === "work" && <div style={{ fontSize: 28, fontFamily: "'Outfit', sans-serif", color: theme.accent, lineHeight: 1.4, marginBottom: 20 }}>{focusTask.text}</div>}
          {!focusTask && phase === "work" && <div style={{ fontSize: 22, fontFamily: "'Outfit', sans-serif", color: theme.textPrimary, marginBottom: 20, fontStyle: "italic", opacity: 0.8 }}>What are you sitting down to do?</div>}
          <div style={{ fontSize: 15, color: theme.textSecondary, fontStyle: "italic", marginBottom: 28 }}>{overlayData.mantra}</div>
          <button onClick={() => setOverlay(null)} style={btn({ padding: "12px 40px", border: `1px solid ${theme.accent}66`, background: theme.accentSoft, color: theme.accent, fontSize: 15, letterSpacing: 2 })}>
            {phase === "work" ? "Back to it" : "Resting"}
          </button>
          {/* L4: Skip break — only during break phase */}
          {phase === "break" && (
            <div style={{ marginTop: 20 }}>
              {!showSkipInput ? (
                <button onClick={() => setShowSkipInput(true)} style={btn({ padding: "7px 18px", border: `1px solid ${theme.textSecondary}2E`, background: "transparent", color: theme.textMuted, fontSize: 12, letterSpacing: 0.5 })}>
                  Skip this break
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, animation: "fadeUp 0.3s ease" }}>
                  <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 2 }}>What's pulling you back? <span style={{ opacity: 0.5 }}>(optional)</span></div>
                  <input value={skipReason} onChange={e => setSkipReason(e.target.value)} onKeyDown={e => e.key === "Enter" && skipBreak()} placeholder="I'm on a roll / in a call / don't need one..." autoFocus
                    style={{ width: "80%", maxWidth: 300, padding: "8px 14px", borderRadius: 10, border: `1px solid ${theme.textSecondary}40`, background: theme.inputBg, color: theme.textPrimary, fontSize: 13, textAlign: "center" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={skipBreak} style={btn({ padding: "7px 22px", border: `1px solid ${theme.textSecondary}4D`, background: `${theme.textSecondary}1A`, color: theme.textPrimary, fontSize: 12 })}>Skip break →</button>
                    <button onClick={() => { setShowSkipInput(false); setSkipReason(""); }} style={btn({ padding: "7px 14px", border: "none", background: "transparent", color: theme.textMuted, fontSize: 12 })}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Overlay>
      )}

      {overlay === "celebrate" && (
        <Overlay onClose={() => setOverlay(null)} bg={`${theme.overlayBg}`} theme={theme}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✧</div>
          <div style={{ fontSize: 24, fontFamily: "'Outfit', sans-serif", color: theme.accent, lineHeight: 1.4, marginBottom: 8 }}>{overlayData.msg}</div>
          <div style={{ fontSize: 15, color: theme.textPrimary, marginBottom: 6, opacity: 0.8 }}>{overlayData.task}</div>
          {overlayData.secs > 0 && <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 28 }}>{fmtMins(overlayData.secs)} of focused time</div>}
          <button onClick={() => setOverlay(null)} style={btn({ padding: "12px 40px", border: `1px solid ${theme.accent}66`, background: theme.accentSoft, color: theme.accent, fontSize: 15, letterSpacing: 1 })}>Onward</button>
        </Overlay>
      )}

      {overlay === "nudge" && (
        <Overlay onClose={() => setOverlay(null)} theme={theme}>
          <div style={{ background: theme.panelBg, border: `1px solid ${theme.accent}33`, borderRadius: 24, padding: "36px 28px", backdropFilter: "blur(10px)" }}>
            <div style={{ fontSize: 20, fontFamily: "'Outfit', sans-serif", color: theme.accent, marginBottom: 8 }}>What are you sitting down to do?</div>
            <p style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>Pick a task to anchor your focus — or start without one.</p>
            <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 16 }}>
              {tasks.filter(t => !t.done).map(t => (
                <button key={t.id} onClick={() => startWithTask(t.id)} style={{ display: "block", width: "100%", padding: "10px 16px", marginBottom: 6, borderRadius: 12, border: `1px solid ${theme.accent}33`, background: theme.accentSoft, color: theme.textPrimary, cursor: "pointer", fontSize: 14, textAlign: "left" }}>{t.text}</button>
              ))}
            </div>
            <button onClick={startAnyway} style={btn({ padding: "10px 28px", border: `1px solid ${theme.textSecondary}4D`, background: "transparent", color: theme.textSecondary, letterSpacing: 1 })}>Start without a task</button>
          </div>
        </Overlay>
      )}

      {overlay === "reflect" && (
        <Overlay onClose={() => setOverlay(null)} theme={theme}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>☽</div>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 4, color: theme.textSecondary, marginBottom: 8 }}>End of Day</div>
          <div style={{ fontSize: 22, fontFamily: "'Outfit', sans-serif", color: theme.accent, marginBottom: 8 }}>What did you actually accomplish?</div>
          {dailyIntention && <div style={{ fontSize: 14, color: theme.textSecondary, fontStyle: "italic", marginBottom: 20 }}>Your intention: "{dailyIntention}"</div>}
          <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 20 }}>{todayLog ? `${todayLog.sessions} sessions · ${fmtMins(todayLog.focusSecs || 0)} focused` : "No sessions yet today"}</div>
          <textarea value={reflectInput} onChange={e => setReflectInput(e.target.value)} placeholder="A few words about today..." rows={3}
            style={{ width: "80%", maxWidth: 360, padding: "12px 16px", borderRadius: 12, border: `1px solid ${theme.accent}4D`, background: theme.inputBg, color: theme.textPrimary, fontSize: 14, fontFamily: "'Outfit', sans-serif", resize: "none" }} />
          <div style={{ marginTop: 16 }}>
            <button onClick={() => { setOverlay(null); setReflectInput(""); }} style={btn({ padding: "10px 32px", border: `1px solid ${theme.accent}66`, background: theme.accentSoft, color: theme.accent, letterSpacing: 1 })}>Close the day</button>
          </div>
        </Overlay>
      )}

      {/* ═══ HEADER ═══ */}
      <div style={{ textAlign: "center", marginBottom: 24, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 4 }}>
          <LiveClock theme={theme} />
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 500, color: theme.accent, margin: 0, letterSpacing: 1 }}>✦ Sage & Steph ✦</h1>
          {/* Theme switcher */}
          <div style={{ display: "flex", gap: 4 }}>
            {Object.values(THEMES).map(t => (
              <button
                key={t.key}
                onClick={() => setThemeKey(t.key)}
                title={`${t.label} (T)`}
                style={btn({
                  padding: "4px 8px",
                  fontSize: 14,
                  border: themeKey === t.key ? `1px solid ${theme.accent}66` : `1px solid ${theme.textSecondary}33`,
                  background: themeKey === t.key ? theme.accentSoft : "transparent",
                  color: themeKey === t.key ? theme.accent : theme.textSecondary,
                  borderRadius: 8,
                })}
              >
                {t.icon}
              </button>
            ))}
          </div>
        </div>
        <p style={{ color: theme.textSecondary, fontSize: 13, margin: "4px 0 0", letterSpacing: 2, textTransform: "uppercase" }}>Focus Dashboard</p>
        {dailyIntention && !zenMode && <div style={{ marginTop: 8, fontSize: 13, color: theme.textPrimary, fontStyle: "italic", opacity: 0.8 }}>Today's intention: {dailyIntention}</div>}
      </div>

      {focusTask && (
        <div style={{ textAlign: "center", marginBottom: 20, padding: "14px 20px", background: `linear-gradient(135deg, ${theme.accentSoft}, ${theme.accent}08)`, borderRadius: 16, border: `1px solid ${theme.accent}26`, position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: theme.textSecondary, marginBottom: 4 }}>Current Intention</div>
          <div style={{ fontSize: 20, fontFamily: "'Outfit', sans-serif", color: theme.accent }}>{focusTask.text}</div>
          {focusTask.focusSecs > 0 && <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>{fmtMins(focusTask.focusSecs)} invested</div>}
        </div>
      )}

      {/* Timer paused banner */}
      {focusTask && !running && (
        <div
          onClick={handleStart}
          style={{
            textAlign: "center",
            marginBottom: 16,
            padding: "10px 20px",
            background: `${theme.accent}15`,
            borderRadius: 12,
            border: `1px dashed ${theme.accent}50`,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <span style={{ fontSize: 13, color: theme.accent, letterSpacing: 1 }}>
            ⏸ Timer paused — <span style={{ textDecoration: "underline" }}>click to start</span>
          </span>
        </div>
      )}

      {/* ═══ TIMER ═══ */}
      <div style={{ textAlign: "center", marginBottom: 24, padding: "24px 20px", background: `radial-gradient(ellipse at center, ${theme.accentSoft} 0%, transparent 70%)`, borderRadius: 24, position: "relative", zIndex: 1 }}>
        <div className={running ? "timer-glow" : ""} style={{ position: "relative", width: 200, height: 200, margin: "0 auto 20px" }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="88" fill="none" stroke={`${theme.accent}1A`} strokeWidth="6" />
            <circle cx="100" cy="100" r="88" fill="none" stroke={phase === "work" ? theme.accent : "#7B9EA8"} strokeWidth="6"
              strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - pct / 100)}
              strokeLinecap="round" transform="rotate(-90 100 100)" style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.5s ease" }} />
            {running && <circle cx="100" cy="100" r="88" fill="none" stroke={phase === "work" ? theme.accent : "#7B9EA8"} strokeWidth="6" opacity="0.15">
              <animate attributeName="r" values="88;96;88" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0;0.15" dur="3s" repeatCount="indefinite" />
            </circle>}
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
            <div style={{ fontSize: 44, fontWeight: 300, fontFamily: "'Courier New', monospace", color: theme.textPrimary, letterSpacing: 2 }}>{fmt(timeLeft)}</div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: phase === "work" ? theme.accent : "#7B9EA8", marginTop: 2 }}>{phase === "work" ? "Focus" : "Break"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <button onClick={handleStart} className={!running ? "start-pulse" : ""} style={btn({ padding: "10px 32px", border: `1px solid ${theme.accent}66`, background: running ? theme.accentSoft : `${theme.accent}40`, color: theme.accent, letterSpacing: 1 })}>
            {running ? "Pause" : "Start"} <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 4 }}>⎵</span>
          </button>
          <button onClick={resetTimer} style={btn({ padding: "10px 20px", border: `1px solid ${theme.textSecondary}4D`, background: "transparent", color: theme.textSecondary, letterSpacing: 1 })}>Reset</button>
          <button onClick={() => setShowSettings(!showSettings)} style={btn({ padding: "10px 20px", border: `1px solid ${theme.textSecondary}4D`, background: showSettings ? `${theme.textSecondary}26` : "transparent", color: theme.textSecondary })}>⚙</button>
          <button onClick={() => setZenMode(z => !z)} title="Zen mode (Z)" style={btn({ padding: "10px 20px", border: `1px solid ${zenMode ? theme.accent + "66" : theme.textSecondary + "4D"}`, background: zenMode ? theme.accentSoft : "transparent", color: zenMode ? theme.accent : theme.textSecondary })}>◯</button>
        </div>
        {showSettings && (
          <div style={{ marginTop: 8, padding: 14, background: theme.panelBg, borderRadius: 16, display: "inline-block" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, justifyContent: "center" }}>
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => applyPreset(p.work, p.brk)} style={btn({ padding: "6px 14px", border: `1px solid ${timerSettings.work === p.work ? theme.accent : theme.textSecondary + "4D"}`, background: timerSettings.work === p.work ? theme.accentSoft : "transparent", color: timerSettings.work === p.work ? theme.accent : theme.textSecondary })}>{p.label}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
              <input value={customWork} onChange={e => setCustomWork(e.target.value)} placeholder="Work" style={{ width: 50, padding: "6px 8px", borderRadius: 8, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.textPrimary, textAlign: "center", fontSize: 13 }} />
              <span style={{ color: theme.textSecondary, fontSize: 12 }}>/</span>
              <input value={customBreak} onChange={e => setCustomBreak(e.target.value)} placeholder="Break" style={{ width: 50, padding: "6px 8px", borderRadius: 8, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.textPrimary, textAlign: "center", fontSize: 13 }} />
              <button onClick={applyCustom} style={btn({ padding: "6px 14px", border: `1px solid ${theme.accent}4D`, background: theme.accentSoft, color: theme.accent })}>Set</button>
            </div>
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 12, color: theme.textSecondary, textAlign: "center" }}>Sessions today: <span style={{ color: theme.accent }}>{todayLog?.sessions ?? 0}</span></div>
      </div>

      {/* ═══ SOUNDSCAPE ═══ */}
      {!zenMode && (
        <div style={{ marginBottom: 24, padding: "14px 20px", background: theme.panelBg, borderRadius: 16, border: `1px solid ${theme.panelBorder}`, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: theme.textSecondary }}>Soundscape</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: theme.textSecondary }}>♪</span>
              <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} style={{ width: 80, accentColor: theme.accent }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(SOUNDS).map(([k, v]) => (
              <button key={k} onClick={() => toggleSound(k)} style={btn({ padding: "8px 16px", borderRadius: 20, border: `1px solid ${activeSounds[k] ? v.color : theme.textSecondary + "33"}`, background: activeSounds[k] ? `${v.color}22` : "transparent", color: activeSounds[k] ? v.color : theme.textSecondary })}>
                {activeSounds[k] ? "◉" : "○"} {v.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {zenMode && (
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
            {Object.entries(SOUNDS).map(([k, v]) => (
              <button key={k} onClick={() => toggleSound(k)} style={btn({ padding: "5px 12px", borderRadius: 16, border: `1px solid ${activeSounds[k] ? v.color : theme.textSecondary + "1F"}`, background: activeSounds[k] ? `${v.color}15` : "transparent", color: activeSounds[k] ? v.color : theme.textMuted, fontSize: 11 })}>
                {activeSounds[k] ? "◉" : "○"} {v.label}
              </button>
            ))}
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} style={{ width: 60, accentColor: theme.accent }} />
          </div>
        </div>
      )}

      {/* ═══ PANELS ═══ */}
      {!zenMode && (
        <>
          {/* ══ TASKS PANEL — full width ══ */}
          <div style={{ padding: "18px", background: theme.panelBg, borderRadius: 16, border: `1px solid ${theme.panelBorder}`, marginBottom: 12, position: "relative", zIndex: 1 }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: theme.textSecondary }}>Tasks</span>
              {tasks.some(t => t.done) && <button onClick={clearDone} style={{ background: "none", border: "none", color: theme.textSecondary, cursor: "pointer", fontSize: 11, textDecoration: "underline" }}>Clear done</button>}
            </div>

            {/* Sort controls */}
            <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
              {[
                { key: "default", label: "Default" },
                { key: "alpha",   label: "A–Z" },
                { key: "time",    label: "Time" },
              ].map(s => (
                <button key={s.key} className="sort-pill" onClick={() => toggleSort(s.key)}
                  style={btn({ padding: "3px 11px", fontSize: 11, borderRadius: 12,
                    border: `1px solid ${sortBy === s.key ? theme.accent + "80" : theme.textSecondary + "33"}`,
                    background: sortBy === s.key ? theme.accentSoft : "transparent",
                    color: sortBy === s.key ? theme.accent : theme.textMuted,
                  })}>{s.label}{sortArrow(s.key)}
                </button>
              ))}
              <button className="sort-pill" onClick={() => setDoneToBottom(d => !d)}
                style={btn({ padding: "3px 11px", fontSize: 11, borderRadius: 12,
                  border: `1px solid ${doneToBottom ? theme.accent + "80" : theme.textSecondary + "33"}`,
                  background: doneToBottom ? theme.accentSoft : "transparent",
                  color: doneToBottom ? theme.accent : theme.textMuted,
                })}>Done ↓
              </button>
              {canDrag && tasks.length > 1 && (
                <span style={{ fontSize: 10, color: theme.textDimmest, marginLeft: 2 }}>drag ⠿ to reorder</span>
              )}
            </div>

            {/* Add task */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="Add a task..."
                style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.textPrimary, fontSize: 13 }} />
              <button onClick={addTask} style={btn({ padding: "8px 14px", borderRadius: 10, border: `1px solid ${theme.accent}4D`, background: theme.accentSoft, color: theme.accent, fontSize: 16, lineHeight: 1 })}>+</button>
            </div>

            {/* Task list */}
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {tasks.length === 0 && <p style={{ color: theme.textMuted, fontSize: 13, fontStyle: "italic", textAlign: "center", margin: "16px 0" }}>Your slate is clean</p>}
              {sortedTasks.map(t => (
                <div
                  key={t.id}
                  className={`task-row${dragOverId === t.id ? " drag-over" : ""}`}
                  draggable={canDrag}
                  onDragStart={() => handleDragStart(t.id)}
                  onDragOver={e => handleDragOver(e, t.id)}
                  onDrop={e => handleDrop(e, t.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 4px",
                    borderBottom: `1px solid ${theme.textSecondary}0F`,
                    borderTop: "2px solid transparent",
                    opacity: t.done ? 0.4 : 1,
                    background: focusId === t.id ? theme.accentSoft : "transparent",
                    borderRadius: focusId === t.id ? 8 : 0,
                  }}
                >
                  {canDrag && <span className="drag-handle" title="Drag to reorder">⠿</span>}
                  <button onClick={() => toggleTask(t.id)} style={{ background: "none", border: `1.5px solid ${t.done ? theme.accent : theme.textSecondary + "4D"}`, borderRadius: 4, width: 18, height: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: theme.accent, fontSize: 10, flexShrink: 0 }}>{t.done ? "✓" : ""}</button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, textDecoration: t.done ? "line-through" : "none", color: t.done ? theme.textSecondary : theme.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.text}</div>
                    {t.focusSecs > 0 && <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 1, opacity: t.done ? 0.5 : 1 }}>{fmtMins(t.focusSecs)}</div>}
                  </div>
                  {!t.done && <button onClick={() => { if (focusId === t.id) { setFocusId(null); } else { setFocusId(t.id); getCtx(); setRunning(true); } }} style={btn({ background: focusId === t.id ? theme.accentSoft : "none", border: `1px solid ${focusId === t.id ? theme.accent : theme.textSecondary + "26"}`, borderRadius: 12, padding: "2px 8px", color: focusId === t.id ? theme.accent : theme.textSecondary, fontSize: 10, letterSpacing: 1, flexShrink: 0 })}>{focusId === t.id ? "★" : "focus"}</button>}
                  <button onClick={() => removeTask(t.id)} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: 14, padding: "0 2px", flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* ══ SIDE QUESTS — collapsible bar below tasks ══ */}
          <div style={{ background: theme.panelBg, borderRadius: 16, border: `1px solid ${theme.panelBorder}`, marginBottom: 12, position: "relative", zIndex: 1, overflow: "hidden" }}>
            {/* Header — always visible */}
            <div onClick={() => setParkingOpen(o => !o)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", cursor: "pointer", userSelect: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: theme.textSecondary }}>Side Quests <span style={{ fontSize: 10, opacity: 0.5 }}>(D)</span></span>
                {distractions.length > 0 && (
                  <span style={{ fontSize: 11, color: "#9B7ED8", background: "rgba(155,126,216,0.15)", border: "1px solid rgba(155,126,216,0.3)", borderRadius: 10, padding: "1px 7px" }}>{distractions.length}</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {parkingOpen && distractions.length > 0 && <button onClick={e => { e.stopPropagation(); clearDist(); }} style={{ background: "none", border: "none", color: theme.textSecondary, cursor: "pointer", fontSize: 11, textDecoration: "underline" }}>Clear all</button>}
                <span style={{ fontSize: 14, color: theme.textMuted, lineHeight: 1, transition: "transform 0.2s", transform: parkingOpen ? "rotate(0deg)" : "rotate(-90deg)", display: "inline-block" }}>▾</span>
              </div>
            </div>
            {/* Body — smooth CSS transition */}
            <div className={`parking-body ${parkingOpen ? "open" : "closed"}`}>
              <div style={{ padding: "0 18px 14px" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input ref={distRef} value={newDist} onChange={e => setNewDist(e.target.value)} onKeyDown={e => e.key === "Enter" && addDist()} placeholder="Park a thought..."
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.textPrimary, fontSize: 13 }} />
                  <button onClick={addDist} style={btn({ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(155,126,216,0.3)", background: "rgba(155,126,216,0.1)", color: "#9B7ED8", fontSize: 16, lineHeight: 1 })}>+</button>
                </div>
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {distractions.length === 0 && <p style={{ color: theme.textMuted, fontSize: 13, fontStyle: "italic", textAlign: "center", margin: "12px 0" }}>Nothing parked yet — stay focused</p>}
                  {distractions.map(d => (
                    <div key={d.id} style={{ padding: "7px 4px", borderBottom: `1px solid ${theme.textSecondary}0F`, display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: theme.textMuted, flexShrink: 0, fontFamily: "monospace" }}>{d.time}</span>
                      <span style={{ fontSize: 13, color: theme.textPrimary, flex: 1, opacity: 0.85 }}>{d.text}</span>
                      <button onClick={() => removeDist(d.id)} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: 14, padding: "0 2px", flexShrink: 0, lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "18px 20px", background: theme.panelBg, borderRadius: 16, border: `1px solid ${theme.panelBorder}`, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: theme.textSecondary }}>Last 14 Days</span>
              <button onClick={() => setOverlay("reflect")} style={btn({ padding: "6px 16px", border: `1px solid ${theme.textSecondary}33`, background: "transparent", color: theme.textSecondary, fontSize: 12 })}>☽ Reflect</button>
            </div>
            <StreakGrid log={sessionLog} theme={theme} />
          </div>
        </>
      )}

      {zenMode && (
        <div style={{ maxWidth: 400, margin: "0 auto 20px", display: "flex", gap: 8 }}>
          <input ref={distRef} value={newDist} onChange={e => setNewDist(e.target.value)} onKeyDown={e => e.key === "Enter" && addDist()} placeholder="Park a thought... (D)"
            style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `1px solid ${theme.textSecondary}26`, background: theme.inputBg, color: theme.textPrimary, fontSize: 13 }} />
          <button onClick={addDist} style={btn({ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(155,126,216,0.2)", background: "rgba(155,126,216,0.06)", color: "#9B7ED8", fontSize: 16, lineHeight: 1 })}>+</button>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: theme.textDimmest, letterSpacing: 1 }}>{zenMode ? "◯ zen mode · press Z to exit" : "✦ breathe · focus · flow ✦"}</div>
      {!zenMode && <div style={{ textAlign: "center", marginTop: 6, fontSize: 10, color: theme.textDimmest, letterSpacing: 1 }}>⎵ start/pause · D distraction · Z zen · T theme · Esc dismiss</div>}
      <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, color: theme.textDimmest, letterSpacing: 1, opacity: 0.6 }}>v0.2.3 · updated March 23, 2026</div>
    </div>
  );
}
