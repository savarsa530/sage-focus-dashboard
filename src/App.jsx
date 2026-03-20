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

function Overlay({ children, onClose, bg }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: bg || "rgba(10,6,15,0.92)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(8px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ textAlign: "center", maxWidth: 460, animation: "fadeUp 0.6s ease", width: "100%" }}>{children}</div>
    </div>
  );
}

function StreakGrid({ log }) {
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
        <div key={d.key} title={`${d.key}: ${d.sessions} sessions, ${d.mins}m`} style={{ width: 28, height: 28, borderRadius: 6, background: d.sessions === 0 ? "rgba(139,123,142,0.08)" : d.sessions < 3 ? "rgba(212,165,116,0.2)" : d.sessions < 6 ? "rgba(212,165,116,0.4)" : "rgba(212,165,116,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: d.sessions > 0 ? "#1a1025" : "#6b5b6e", fontWeight: 600 }}>
          {d.label}
        </div>
      ))}
    </div>
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
  const [sessions, setSessions] = useState(0);
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
  // ── L4: Skip break state ──────────────────────────────────────────────────
  const [skipReason, setSkipReason] = useState("");
  const [showSkipInput, setShowSkipInput] = useState(false);

  const soundRefs = useRef({});
  const ctxRef = useRef(null);
  const intervalRef = useRef(null);
  const distRef = useRef(null);

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
        const [tR, dR, sR, lR, iR] = await Promise.all([
          window.storage.get("sage-tasks").catch(() => null),
          window.storage.get("sage-dist").catch(() => null),
          window.storage.get("sage-settings").catch(() => null),
          window.storage.get("sage-log").catch(() => null),
          window.storage.get("sage-intention").catch(() => null),
        ]);
        if (tR?.value) { const t = JSON.parse(tR.value); setTasks(t.tasks || []); setFocusId(t.focusId || null); setSessions(t.sessions || 0); }
        if (dR?.value) setDistractions(JSON.parse(dR.value));
        if (sR?.value) { const s = JSON.parse(sR.value); setTimerSettings(s); setTimeLeft(s.work * 60); setCustomWork(String(s.work)); setCustomBreak(String(s.brk)); }
        if (lR?.value) setSessionLog(JSON.parse(lR.value));
        if (iR?.value) { const i = JSON.parse(iR.value); if (i.date === today()) { setDailyIntention(i.text); setShowedIntention(true); } }
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) window.storage.set("sage-tasks", JSON.stringify({ tasks, focusId, sessions })).catch(() => {}); }, [tasks, focusId, sessions, loaded]);
  useEffect(() => { if (loaded) window.storage.set("sage-dist", JSON.stringify(distractions)).catch(() => {}); }, [distractions, loaded]);
  useEffect(() => { if (loaded) window.storage.set("sage-settings", JSON.stringify(timerSettings)).catch(() => {}); }, [timerSettings, loaded]);
  useEffect(() => { if (loaded) window.storage.set("sage-log", JSON.stringify(sessionLog)).catch(() => {}); }, [sessionLog, loaded]);
  useEffect(() => { if (loaded && !showedIntention && !dailyIntention) { setOverlay("intention"); setShowedIntention(true); } }, [loaded, showedIntention, dailyIntention]);

  // ── Reset skip state when leaving the refocus overlay ────────────────────
  useEffect(() => {
    if (overlay !== "refocus") {
      setShowSkipInput(false);
      setSkipReason("");
    }
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
              setSessions(s => s + 1); updateLog(1); setPhase("break");
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
      if (e.key === "d" || e.key === "D") { e.preventDefault(); distRef.current?.focus(); }
      if (e.key === "z" || e.key === "Z") { e.preventDefault(); setZenMode(z => !z); }
      if (e.key === "Escape") setOverlay(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
  const clearDone = () => setTasks(t => t.filter(x => !x.done));
  const clearDist = () => setDistractions([]);
  const startWithTask = (id) => { setFocusId(id); setOverlay(null); getCtx(); setRunning(true); };
  const startAnyway = () => { setOverlay(null); getCtx(); setRunning(true); };
  const saveIntention = () => { const t = intentionInput.trim(); if (t) { setDailyIntention(t); window.storage.set("sage-intention", JSON.stringify({ date: today(), text: t })).catch(() => {}); } setOverlay(null); setIntentionInput(""); };
  const applyPreset = (w, b) => { setTimerSettings({ work: w, brk: b }); setCustomWork(String(w)); setCustomBreak(String(b)); if (!running) setTimeLeft(phase === "work" ? w * 60 : b * 60); };
  const applyCustom = () => { const w = Math.max(1, Math.min(180, parseInt(customWork) || 25)); const b = Math.max(1, Math.min(60, parseInt(customBreak) || 5)); applyPreset(w, b); setShowSettings(false); };
  const resetTimer = () => { setRunning(false); setPhase("work"); setTimeLeft(timerSettings.work * 60); };

  // ── L4: Skip the current break ───────────────────────────────────────────
  const skipBreak = () => {
    setPhase("work");
    setTimeLeft(timerSettings.work * 60);
    setOverlay(null);
    setSkipReason("");
    setShowSkipInput(false);
  };

  const focusTask = tasks.find(t => t.id === focusId);
  const totalSec = (phase === "work" ? timerSettings.work : timerSettings.brk) * 60;
  const pct = ((totalSec - timeLeft) / totalSec) * 100;
  const todayLog = sessionLog.find(l => l.date === today());
  const btn = (x) => ({ border: "none", cursor: "pointer", borderRadius: 24, fontSize: 13, transition: "all 0.3s", ...x });

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #1a1025 0%, #2d1b3d 40%, #1e1428 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#d4a574", fontSize: 18, fontFamily: "Georgia, serif" }}>Loading your sanctuary...</div>
    </div>
  );

  return (
    // ── L2: Background removed from this div — now lives on html/body via <style> below ──
    <div style={{ minHeight: "100vh", color: "#e8ddd3", fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "20px 16px", boxSizing: "border-box", width: "100%" }}>

      {/*
        ── BATCH 1 CSS INJECTIONS ───────────────────────────────────────────
        L1: #root text-align overridden to left (panel text left-justified)
            Centered elements keep their inline textAlign:"center" so nothing breaks.
        L2: Background gradient moved to html element — covers full viewport
            regardless of horizontal scroll. body is transparent.
        L3: .sage-panels grid — side quests get 1.5x the tasks column.
            Stacks to 1 column below 700px.
        ─────────────────────────────────────────────────────────────────────
      */}
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        input:focus,textarea:focus{border-color:rgba(212,165,116,0.4)!important;outline:none}
        html{
          min-height:100%;
          background:linear-gradient(145deg,#1a1025 0%,#2d1b3d 40%,#1e1428 100%);
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
        .sage-panels{
          display:grid;
          grid-template-columns:1fr 1.5fr;
          gap:16px;
          margin-bottom:24px;
        }
        @media(max-width:700px){
          .sage-panels{grid-template-columns:1fr;}
        }
      `}</style>

      {/* ═══ OVERLAYS ═══ */}
      {overlay === "intention" && (
        <Overlay onClose={() => setOverlay(null)}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>☀</div>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 4, color: "#8b7b8e", marginBottom: 8 }}>New Day</div>
          <div style={{ fontSize: 24, fontFamily: "Georgia, serif", color: "#d4a574", marginBottom: 24 }}>What matters most today?</div>
          <input value={intentionInput} onChange={e => setIntentionInput(e.target.value)} onKeyDown={e => e.key === "Enter" && saveIntention()} placeholder="My intention for today..." autoFocus
            style={{ width: "80%", maxWidth: 340, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(212,165,116,0.3)", background: "rgba(255,255,255,0.05)", color: "#e8ddd3", fontSize: 15, textAlign: "center", fontFamily: "Georgia, serif" }} />
          <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={saveIntention} style={btn({ padding: "10px 32px", border: "1px solid rgba(212,165,116,0.4)", background: "rgba(212,165,116,0.15)", color: "#d4a574", letterSpacing: 1 })}>Set Intention</button>
            <button onClick={() => setOverlay(null)} style={btn({ padding: "10px 20px", border: "1px solid rgba(139,123,142,0.2)", background: "transparent", color: "#8b7b8e" })}>Skip</button>
          </div>
        </Overlay>
      )}

      {overlay === "refocus" && (
        <Overlay onClose={() => setOverlay(null)}>
          <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.6 }}>✦</div>
          <div style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 4, color: "#8b7b8e", marginBottom: 16 }}>{phase === "work" ? "Time to focus" : "Take a breath"}</div>
          {phase === "break" && overlayData.msg && <div style={{ fontSize: 20, fontFamily: "Georgia, serif", color: "#7B9EA8", marginBottom: 20, lineHeight: 1.5 }}>{overlayData.msg}</div>}
          {focusTask && phase === "work" && <div style={{ fontSize: 28, fontFamily: "Georgia, serif", color: "#d4a574", lineHeight: 1.4, marginBottom: 20 }}>{focusTask.text}</div>}
          {!focusTask && phase === "work" && <div style={{ fontSize: 22, fontFamily: "Georgia, serif", color: "#c4b8c9", marginBottom: 20, fontStyle: "italic" }}>What are you sitting down to do?</div>}
          <div style={{ fontSize: 15, color: "#8b7b8e", fontStyle: "italic", marginBottom: 28 }}>{overlayData.mantra}</div>
          <button onClick={() => setOverlay(null)} style={btn({ padding: "12px 40px", border: "1px solid rgba(212,165,116,0.4)", background: "rgba(212,165,116,0.15)", color: "#d4a574", fontSize: 15, letterSpacing: 2 })}>
            {phase === "work" ? "Back to it" : "Resting"}
          </button>

          {/* ── L4: Skip break option — only shown during break phase ──────── */}
          {phase === "break" && (
            <div style={{ marginTop: 20 }}>
              {!showSkipInput ? (
                <button
                  onClick={() => setShowSkipInput(true)}
                  style={btn({ padding: "7px 18px", border: "1px solid rgba(139,123,142,0.18)", background: "transparent", color: "#6b5b6e", fontSize: 12, letterSpacing: 0.5 })}
                >
                  Skip this break
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, animation: "fadeUp 0.3s ease" }}>
                  <div style={{ fontSize: 12, color: "#8b7b8e", marginBottom: 2 }}>What's pulling you back? <span style={{ opacity: 0.5 }}>(optional)</span></div>
                  <input
                    value={skipReason}
                    onChange={e => setSkipReason(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && skipBreak()}
                    placeholder="I'm on a roll / in a call / don't need one..."
                    autoFocus
                    style={{ width: "80%", maxWidth: 300, padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(139,123,142,0.25)", background: "rgba(255,255,255,0.04)", color: "#e8ddd3", fontSize: 13, textAlign: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={skipBreak} style={btn({ padding: "7px 22px", border: "1px solid rgba(139,123,142,0.3)", background: "rgba(139,123,142,0.1)", color: "#c4b8c9", fontSize: 12 })}>
                      Skip break →
                    </button>
                    <button onClick={() => { setShowSkipInput(false); setSkipReason(""); }} style={btn({ padding: "7px 14px", border: "none", background: "transparent", color: "#6b5b6e", fontSize: 12 })}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Overlay>
      )}

      {overlay === "celebrate" && (
        <Overlay onClose={() => setOverlay(null)} bg="rgba(10,6,15,0.95)">
          <div style={{ fontSize: 56, marginBottom: 16 }}>✧</div>
          <div style={{ fontSize: 24, fontFamily: "Georgia, serif", color: "#d4a574", lineHeight: 1.4, marginBottom: 8 }}>{overlayData.msg}</div>
          <div style={{ fontSize: 15, color: "#c4b8c9", marginBottom: 6 }}>{overlayData.task}</div>
          {overlayData.secs > 0 && <div style={{ fontSize: 13, color: "#8b7b8e", marginBottom: 28 }}>{fmtMins(overlayData.secs)} of focused time</div>}
          <button onClick={() => setOverlay(null)} style={btn({ padding: "12px 40px", border: "1px solid rgba(212,165,116,0.4)", background: "rgba(212,165,116,0.15)", color: "#d4a574", fontSize: 15, letterSpacing: 1 })}>Onward</button>
        </Overlay>
      )}

      {overlay === "nudge" && (
        <Overlay onClose={() => setOverlay(null)}>
          <div style={{ background: "rgba(45,27,61,0.9)", border: "1px solid rgba(212,165,116,0.2)", borderRadius: 24, padding: "36px 28px" }}>
            <div style={{ fontSize: 20, fontFamily: "Georgia, serif", color: "#d4a574", marginBottom: 8 }}>What are you sitting down to do?</div>
            <p style={{ color: "#8b7b8e", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>Pick a task to anchor your focus — or start without one.</p>
            <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 16 }}>
              {tasks.filter(t => !t.done).map(t => (
                <button key={t.id} onClick={() => startWithTask(t.id)} style={{ display: "block", width: "100%", padding: "10px 16px", marginBottom: 6, borderRadius: 12, border: "1px solid rgba(212,165,116,0.2)", background: "rgba(212,165,116,0.06)", color: "#e8ddd3", cursor: "pointer", fontSize: 14, textAlign: "left" }}>{t.text}</button>
              ))}
            </div>
            <button onClick={startAnyway} style={btn({ padding: "10px 28px", border: "1px solid rgba(139,123,142,0.3)", background: "transparent", color: "#8b7b8e", letterSpacing: 1 })}>Start without a task</button>
          </div>
        </Overlay>
      )}

      {overlay === "reflect" && (
        <Overlay onClose={() => setOverlay(null)}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>☽</div>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 4, color: "#8b7b8e", marginBottom: 8 }}>End of Day</div>
          <div style={{ fontSize: 22, fontFamily: "Georgia, serif", color: "#d4a574", marginBottom: 8 }}>What did you actually accomplish?</div>
          {dailyIntention && <div style={{ fontSize: 14, color: "#8b7b8e", fontStyle: "italic", marginBottom: 20 }}>Your intention: "{dailyIntention}"</div>}
          <div style={{ fontSize: 13, color: "#8b7b8e", marginBottom: 20 }}>{todayLog ? `${todayLog.sessions} sessions · ${fmtMins(todayLog.focusSecs || 0)} focused` : "No sessions yet today"}</div>
          <textarea value={reflectInput} onChange={e => setReflectInput(e.target.value)} placeholder="A few words about today..." rows={3}
            style={{ width: "80%", maxWidth: 360, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(212,165,116,0.3)", background: "rgba(255,255,255,0.05)", color: "#e8ddd3", fontSize: 14, fontFamily: "Georgia, serif", resize: "none" }} />
          <div style={{ marginTop: 16 }}>
            <button onClick={() => { setOverlay(null); setReflectInput(""); }} style={btn({ padding: "10px 32px", border: "1px solid rgba(212,165,116,0.4)", background: "rgba(212,165,116,0.15)", color: "#d4a574", letterSpacing: 1 })}>Close the day</button>
          </div>
        </Overlay>
      )}

      {/* ═══ HEADER ═══ */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 400, color: "#d4a574", margin: 0, letterSpacing: 1 }}>✦ Sage & Steph ✦</h1>
        <p style={{ color: "#8b7b8e", fontSize: 13, margin: "4px 0 0", letterSpacing: 2, textTransform: "uppercase" }}>Focus Dashboard</p>
        {dailyIntention && !zenMode && <div style={{ marginTop: 8, fontSize: 13, color: "#c4b8c9", fontStyle: "italic" }}>Today's intention: {dailyIntention}</div>}
      </div>

      {focusTask && (
        <div style={{ textAlign: "center", marginBottom: 20, padding: "14px 20px", background: "linear-gradient(135deg, rgba(212,165,116,0.08), rgba(212,165,116,0.03))", borderRadius: 16, border: "1px solid rgba(212,165,116,0.15)" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: "#8b7b8e", marginBottom: 4 }}>Current Intention</div>
          <div style={{ fontSize: 20, fontFamily: "Georgia, serif", color: "#d4a574" }}>{focusTask.text}</div>
          {focusTask.focusSecs > 0 && <div style={{ fontSize: 12, color: "#8b7b8e", marginTop: 4 }}>{fmtMins(focusTask.focusSecs)} invested</div>}
        </div>
      )}

      {/* ═══ TIMER ═══ */}
      <div style={{ textAlign: "center", marginBottom: 24, padding: "24px 20px", background: "radial-gradient(ellipse at center, rgba(212,165,116,0.08) 0%, transparent 70%)", borderRadius: 24 }}>
        <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto 20px" }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(212,165,116,0.1)" strokeWidth="6" />
            <circle cx="100" cy="100" r="88" fill="none" stroke={phase === "work" ? "#d4a574" : "#7B9EA8"} strokeWidth="6"
              strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - pct / 100)}
              strokeLinecap="round" transform="rotate(-90 100 100)" style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.5s ease" }} />
            {running && <circle cx="100" cy="100" r="88" fill="none" stroke={phase === "work" ? "#d4a574" : "#7B9EA8"} strokeWidth="6" opacity="0.15">
              <animate attributeName="r" values="88;96;88" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0;0.15" dur="3s" repeatCount="indefinite" />
            </circle>}
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
            <div style={{ fontSize: 44, fontWeight: 300, fontFamily: "'Courier New', monospace", color: "#e8ddd3", letterSpacing: 2 }}>{fmt(timeLeft)}</div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: phase === "work" ? "#d4a574" : "#7B9EA8", marginTop: 2 }}>{phase === "work" ? "Focus" : "Break"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <button onClick={handleStart} style={btn({ padding: "10px 32px", border: "1px solid rgba(212,165,116,0.4)", background: running ? "rgba(212,165,116,0.15)" : "rgba(212,165,116,0.25)", color: "#d4a574", letterSpacing: 1 })}>
            {running ? "Pause" : "Start"} <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 4 }}>⎵</span>
          </button>
          <button onClick={resetTimer} style={btn({ padding: "10px 20px", border: "1px solid rgba(139,123,142,0.3)", background: "transparent", color: "#8b7b8e", letterSpacing: 1 })}>Reset</button>
          <button onClick={() => setShowSettings(!showSettings)} style={btn({ padding: "10px 20px", border: "1px solid rgba(139,123,142,0.3)", background: showSettings ? "rgba(139,123,142,0.15)" : "transparent", color: "#8b7b8e" })}>⚙</button>
          <button onClick={() => setZenMode(z => !z)} title="Zen mode (Z)" style={btn({ padding: "10px 20px", border: `1px solid ${zenMode ? "rgba(212,165,116,0.4)" : "rgba(139,123,142,0.3)"}`, background: zenMode ? "rgba(212,165,116,0.1)" : "transparent", color: zenMode ? "#d4a574" : "#8b7b8e" })}>◯</button>
        </div>
        {showSettings && (
          <div style={{ marginTop: 8, padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 16, display: "inline-block" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, justifyContent: "center" }}>
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => applyPreset(p.work, p.brk)} style={btn({ padding: "6px 14px", border: `1px solid ${timerSettings.work === p.work ? "#d4a574" : "rgba(139,123,142,0.3)"}`, background: timerSettings.work === p.work ? "rgba(212,165,116,0.15)" : "transparent", color: timerSettings.work === p.work ? "#d4a574" : "#8b7b8e" })}>{p.label}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
              <input value={customWork} onChange={e => setCustomWork(e.target.value)} placeholder="Work" style={{ width: 50, padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(139,123,142,0.3)", background: "rgba(255,255,255,0.05)", color: "#e8ddd3", textAlign: "center", fontSize: 13 }} />
              <span style={{ color: "#8b7b8e", fontSize: 12 }}>/</span>
              <input value={customBreak} onChange={e => setCustomBreak(e.target.value)} placeholder="Break" style={{ width: 50, padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(139,123,142,0.3)", background: "rgba(255,255,255,0.05)", color: "#e8ddd3", textAlign: "center", fontSize: 13 }} />
              <button onClick={applyCustom} style={btn({ padding: "6px 14px", border: "1px solid rgba(212,165,116,0.3)", background: "rgba(212,165,116,0.15)", color: "#d4a574" })}>Set</button>
            </div>
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 12, color: "#8b7b8e", textAlign: "center" }}>Sessions today: <span style={{ color: "#d4a574" }}>{todayLog?.sessions || sessions}</span></div>
      </div>

      {/* ═══ SOUNDSCAPE ═══ */}
      {!zenMode && (
        <div style={{ marginBottom: 24, padding: "14px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(139,123,142,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#8b7b8e" }}>Soundscape</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#8b7b8e" }}>♪</span>
              <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} style={{ width: 80, accentColor: "#d4a574" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(SOUNDS).map(([k, v]) => (
              <button key={k} onClick={() => toggleSound(k)} style={btn({ padding: "8px 16px", borderRadius: 20, border: `1px solid ${activeSounds[k] ? v.color : "rgba(139,123,142,0.2)"}`, background: activeSounds[k] ? `${v.color}22` : "transparent", color: activeSounds[k] ? v.color : "#8b7b8e" })}>
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
              <button key={k} onClick={() => toggleSound(k)} style={btn({ padding: "5px 12px", borderRadius: 16, border: `1px solid ${activeSounds[k] ? v.color : "rgba(139,123,142,0.12)"}`, background: activeSounds[k] ? `${v.color}15` : "transparent", color: activeSounds[k] ? v.color : "#6b5b6e", fontSize: 11 })}>
                {activeSounds[k] ? "◉" : "○"} {v.label}
              </button>
            ))}
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} style={{ width: 60, accentColor: "#d4a574" }} />
          </div>
        </div>
      )}

      {/* ═══ PANELS ═══ */}
      {!zenMode && (
        <>
          {/* ── L1 + L3: className="sage-panels" — CSS handles grid ratio and left-align ── */}
          <div className="sage-panels">

            {/* Tasks panel */}
            <div style={{ padding: "18px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(139,123,142,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#8b7b8e" }}>Tasks</span>
                {tasks.some(t => t.done) && <button onClick={clearDone} style={{ background: "none", border: "none", color: "#8b7b8e", cursor: "pointer", fontSize: 11, textDecoration: "underline" }}>Clear done</button>}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="Add a task..."
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(139,123,142,0.2)", background: "rgba(255,255,255,0.04)", color: "#e8ddd3", fontSize: 13 }} />
                <button onClick={addTask} style={btn({ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(212,165,116,0.3)", background: "rgba(212,165,116,0.1)", color: "#d4a574", fontSize: 16, lineHeight: 1 })}>+</button>
              </div>
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {tasks.length === 0 && <p style={{ color: "#6b5b6e", fontSize: 13, fontStyle: "italic", textAlign: "center", margin: "16px 0" }}>Your slate is clean</p>}
                {tasks.map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 4px", borderBottom: "1px solid rgba(139,123,142,0.06)", opacity: t.done ? 0.4 : 1, background: focusId === t.id ? "rgba(212,165,116,0.05)" : "transparent", borderRadius: focusId === t.id ? 8 : 0 }}>
                    <button onClick={() => toggleTask(t.id)} style={{ background: "none", border: `1.5px solid ${t.done ? "#d4a574" : "rgba(139,123,142,0.3)"}`, borderRadius: 4, width: 18, height: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#d4a574", fontSize: 10, flexShrink: 0 }}>{t.done ? "✓" : ""}</button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#8b7b8e" : "#e8ddd3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.text}</div>
                      {t.focusSecs > 0 && !t.done && <div style={{ fontSize: 10, color: "#6b5b6e", marginTop: 1 }}>{fmtMins(t.focusSecs)}</div>}
                    </div>
                    {!t.done && <button onClick={() => setFocusId(focusId === t.id ? null : t.id)} style={btn({ background: focusId === t.id ? "rgba(212,165,116,0.2)" : "none", border: `1px solid ${focusId === t.id ? "#d4a574" : "rgba(139,123,142,0.15)"}`, borderRadius: 12, padding: "2px 8px", color: focusId === t.id ? "#d4a574" : "#8b7b8e", fontSize: 10, letterSpacing: 1, flexShrink: 0 })}>{focusId === t.id ? "★" : "focus"}</button>}
                    <button onClick={() => removeTask(t.id)} style={{ background: "none", border: "none", color: "#6b5b6e", cursor: "pointer", fontSize: 14, padding: "0 2px", flexShrink: 0 }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Side quests panel — L3: gets 1.5fr width via .sage-panels CSS */}
            <div style={{ padding: "18px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(139,123,142,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#8b7b8e" }}>Side Quests <span style={{ fontSize: 10, opacity: 0.5 }}>(D)</span></span>
                {distractions.length > 0 && <button onClick={clearDist} style={{ background: "none", border: "none", color: "#8b7b8e", cursor: "pointer", fontSize: 11, textDecoration: "underline" }}>Clear all</button>}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input ref={distRef} value={newDist} onChange={e => setNewDist(e.target.value)} onKeyDown={e => e.key === "Enter" && addDist()} placeholder="Park a thought..."
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(139,123,142,0.2)", background: "rgba(255,255,255,0.04)", color: "#e8ddd3", fontSize: 13 }} />
                <button onClick={addDist} style={btn({ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(155,126,216,0.3)", background: "rgba(155,126,216,0.1)", color: "#9B7ED8", fontSize: 16, lineHeight: 1 })}>+</button>
              </div>
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {distractions.length === 0 && <p style={{ color: "#6b5b6e", fontSize: 13, fontStyle: "italic", textAlign: "center", margin: "16px 0" }}>Nothing parked yet — stay focused</p>}
                {distractions.map(d => (
                  <div key={d.id} style={{ padding: "7px 4px", borderBottom: "1px solid rgba(139,123,142,0.06)", display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span style={{ fontSize: 10, color: "#6b5b6e", flexShrink: 0, fontFamily: "monospace" }}>{d.time}</span>
                    <span style={{ fontSize: 13, color: "#c4b8c9" }}>{d.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div style={{ padding: "18px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(139,123,142,0.1)", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: "#8b7b8e" }}>Last 14 Days</span>
              <button onClick={() => setOverlay("reflect")} style={btn({ padding: "6px 16px", border: "1px solid rgba(139,123,142,0.2)", background: "transparent", color: "#8b7b8e", fontSize: 12 })}>☽ Reflect</button>
            </div>
            <StreakGrid log={sessionLog} />
          </div>
        </>
      )}

      {zenMode && (
        <div style={{ maxWidth: 400, margin: "0 auto 20px", display: "flex", gap: 8 }}>
          <input ref={distRef} value={newDist} onChange={e => setNewDist(e.target.value)} onKeyDown={e => e.key === "Enter" && addDist()} placeholder="Park a thought... (D)"
            style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(139,123,142,0.15)", background: "rgba(255,255,255,0.03)", color: "#e8ddd3", fontSize: 13 }} />
          <button onClick={addDist} style={btn({ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(155,126,216,0.2)", background: "rgba(155,126,216,0.06)", color: "#9B7ED8", fontSize: 16, lineHeight: 1 })}>+</button>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#4a3d4e", letterSpacing: 1 }}>{zenMode ? "◯ zen mode · press Z to exit" : "✦ breathe · focus · flow ✦"}</div>
      {!zenMode && <div style={{ textAlign: "center", marginTop: 6, fontSize: 10, color: "#3d3242", letterSpacing: 1 }}>⎵ start/pause · D distraction · Z zen · Esc dismiss</div>}
    </div>
  );
}
