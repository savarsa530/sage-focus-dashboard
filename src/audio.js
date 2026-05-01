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
  let cleanup = null;
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
    cleanup = () => { try { src.stop(); } catch(_){} };
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
      try { ref.ctx.close(); } catch(_){}
    }, 500);
  } catch(_){}
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
