const audioRefs = {};

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
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.015 * w) / 1.015;
      d[i] = last * 2.5;
      if (Math.random() < 0.0012) d[i] += (Math.random() * 2 - 1) * 0.6;
    }
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

function buildBinaural(ctx) {
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

export function startSound(key, volume) {
  stopSound(key);
  const ctx  = new (window.AudioContext || window.webkitAudioContext)();
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.2);
  gain.connect(ctx.destination);
  let cleanup;
  if (key === "binaural") {
    const { node, cleanup: c } = buildBinaural(ctx);
    node.connect(gain);
    cleanup = c;
  } else {
    const noiseType = key === "rain" ? "rain" : key === "brown" ? "brown" : "white";
    const src = buildNoise(ctx, noiseType);
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
    cleanup = () => { try { src.stop(); } catch { /* already stopped */ } };
  }
  audioRefs[key] = { ctx, gain, cleanup };
}

export function stopSound(key) {
  const ref = audioRefs[key];
  if (!ref) return;
  try {
    ref.gain.gain.linearRampToValueAtTime(0, ref.ctx.currentTime + 0.4);
    setTimeout(() => {
      ref.cleanup?.();
      try { ref.ctx.close(); } catch { /* already closed */ }
    }, 500);
  } catch { /* best-effort teardown */ }
  delete audioRefs[key];
}

export function setVolume(key, vol) {
  const ref = audioRefs[key];
  if (!ref) return;
  ref.gain.gain.cancelScheduledValues(ref.ctx.currentTime);
  ref.gain.gain.linearRampToValueAtTime(vol, ref.ctx.currentTime + 0.1);
}

export function stopAllSounds() {
  Object.keys(audioRefs).forEach(stopSound);
}

// ── End-of-session chime ───────────────────────────────────────
// Every chime is synthesized here, so nothing loads from the network.
// The choice lives in Time toggles and is remembered per browser.
const CHIME_KEY = "sage_chime_v1";

export const CHIMES = [
  ["bowl",     "Singing bowl"],
  ["chimes",   "Wind chimes"],
  ["musicbox", "Music box"],
  ["glass",    "Glass bell"],
  ["gong",     "Temple gong"],
  ["ding",     "Original ding"],
  ["none",     "Silence"],
];

export function getChime() {
  try {
    const v = localStorage.getItem(CHIME_KEY);
    return CHIMES.some(([id]) => id === v) ? v : "ding";
  } catch { return "ding"; }
}

export function setChime(id) {
  try { localStorage.setItem(CHIME_KEY, id); } catch { /* storage unavailable */ }
}

// Each note: f (Hz), at (s offset), g (peak gain), d (decay s),
// a (attack s), vib/vd (vibrato rate Hz / depth Hz).
function chimeNotes(id) {
  const n = [];
  const add = (f, at, g, d, o = {}) => n.push({ f, at, g, d, ...o });
  if (id === "ding") {
    add(880, 0, 0.5, 1.8); add(1109, 0, 0.25, 1.2); add(1318, 0, 0.12, 0.8);
  } else if (id === "bowl") {
    // Inharmonic bowl partials, each doubled a hair sharp for the slow beating.
    [[1, 0.42, 7], [2.71, 0.2, 5], [5.15, 0.08, 3.4], [8.4, 0.03, 2]].forEach(([r, g, d]) => {
      add(196 * r, 0, g, d, { a:0.025 });
      add(196 * r + 1.3, 0, g * 0.6, d, { a:0.025 });
    });
  } else if (id === "chimes") {
    // Pentatonic strikes in a new random order each time.
    const scale = [1047, 1175, 1397, 1568, 1760, 2093, 2349];
    let t = 0;
    for (let k = 0; k < 7; k++) {
      const f = scale[Math.floor(Math.random() * scale.length)];
      add(f, t, 0.22, 2.4); add(f * 2.76, t, 0.05, 1.1);
      t += 0.12 + Math.random() * 0.28;
    }
  } else if (id === "musicbox") {
    [[784, 0], [988, 0.2], [1175, 0.4], [1568, 0.6], [1175, 0.95], [1319, 1.15]].forEach(([f, at], k) => {
      add(f, at, k === 3 ? 0.3 : 0.22, 1.5); add(f * 3, at, 0.03, 0.4);
    });
  } else if (id === "glass") {
    add(659, 0, 0.3, 4.2, { a:0.35, vib:5, vd:2 });
    add(988, 0.55, 0.24, 4, { a:0.35, vib:5.5, vd:2.5 });
    add(1318, 1.1, 0.12, 3.6, { a:0.4, vib:6, vd:2 });
  } else if (id === "gong") {
    [[1, 0.5, 7], [1.48, 0.22, 5.5], [2.1, 0.14, 4], [2.92, 0.07, 3], [4.1, 0.03, 2]].forEach(([r, g, d]) => {
      add(98 * r, 0, g, d, { a:0.04 });
      add(98 * r + 0.8, 0, g * 0.5, d, { a:0.06 });
    });
  }
  return n;
}

export function playChime(id) {
  if (id === "none") return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    let end = 0;
    chimeNotes(id).forEach(n => {
      const t0 = ctx.currentTime + n.at;
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = n.f;
      if (n.vib) {
        const lfo = ctx.createOscillator(), depth = ctx.createGain();
        lfo.frequency.value = n.vib; depth.gain.value = n.vd;
        lfo.connect(depth); depth.connect(osc.frequency);
        lfo.start(t0); lfo.stop(t0 + n.d);
      }
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(n.g, t0 + (n.a || 0.006));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.d);
      osc.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + n.d + 0.05);
      end = Math.max(end, n.at + n.d);
    });
    setTimeout(() => { try { ctx.close(); } catch { /* already closed */ } }, end * 1000 + 500);
  } catch { /* audio unavailable */ }
}

// Plays whichever chime is chosen in Time toggles.
export function playDing() {
  playChime(getChime());
}

// A softer, lower turn-of-the-card tone: two notes rising a fifth,
// with a high shimmer added for a rare pull.
export function playTurn(rare = false) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    const notes = [
      { freq: 392, at: 0,    gain: 0.35, decay: 1.6 },
      { freq: 587, at: 0.14, gain: 0.28, decay: 1.9 },
      ...(rare ? [{ freq: 1175, at: 0.32, gain: 0.12, decay: 2.4 }, { freq: 1568, at: 0.42, gain: 0.07, decay: 2.2 }] : []),
    ];
    notes.forEach(({ freq, at, gain, decay }) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      const t0  = ctx.currentTime + at;
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + decay);
      osc.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + decay);
    });
    setTimeout(() => { try { ctx.close(); } catch { /* already closed */ } }, 3200);
  } catch { /* audio unavailable */ }
}

// A small bright note for each bit of growth; a fuller one at a new stage.
export function playGrow(stage = false) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const g = ctx.createGain(); g.connect(ctx.destination);
    const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = stage ? 784 : 659;
    const t0 = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(stage ? 0.12 : 0.07, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.1);
    o.connect(g); o.start(t0); o.stop(t0 + 1.1);
    setTimeout(() => { try { ctx.close(); } catch { /* closed */ } }, 1500);
  } catch { /* audio unavailable */ }
}
