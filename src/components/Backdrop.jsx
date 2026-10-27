// What moves behind the page during a focus session.
//  · Slow constellation — a field of faint stars; one figure draws itself
//    line by line as the session runs, finishing as the timer ends.
//  · Candle glow — two warm pools of light in opposite corners, flickering.
// The choice lives in Time toggles and is remembered per browser.
import { useEffect, useMemo, useState } from "react";
import { BACKDROPS, setBackdrop, useBackdrop } from "../backdrop";

function useWindowSize() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

// Small seeded PRNG so a session keeps its figure across pauses and re-renders.
function seededRandom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h += 1831565813;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CONTENT_WIDTH = 900; // the dashboard column; stars prefer the margins around it

function Constellation({ theme, progress, seed }) {
  const { w, h } = useWindowSize();
  const ink = theme.accentInk || theme.accent;

  const { stars, dust } = useMemo(() => {
    const rand = seededRandom(`${new Date().toDateString()}${seed}:${Math.round(w / 50)}x${Math.round(h / 50)}`);
    const dust = Array.from({ length: 55 }, () => ({
      x: rand() * w, y: rand() * h, r: 0.5 + rand() * 0.9, o: 0.12 + rand() * 0.3,
      delay: (rand() * 6).toFixed(2), dur: (4 + rand() * 4).toFixed(2),
    }));
    const gutter = (w - CONTENT_WIDTH) / 2 - 24;
    let stars;
    if (gutter >= 110) {
      // Down the left margin, then up the right; the link between runs behind the panels.
      const column = (x0, dir) => Array.from({ length: 5 }, (_, i) => ({ x: x0 + 18 + rand() * (gutter - 36), y: h * (0.1 + 0.16 * i + rand() * 0.1) }))
        .sort((a, b) => dir * (a.y - b.y));
      stars = [...column(0, 1), ...column(w - gutter, -1)];
    } else {
      // Narrow screens: scatter across the page and join nearest neighbours.
      const pool = Array.from({ length: 9 }, () => ({ x: w * (0.06 + rand() * 0.88), y: h * (0.06 + rand() * 0.88) }));
      stars = [pool.shift()];
      while (pool.length) {
        const last = stars[stars.length - 1];
        const near = pool.reduce((best, p, i) =>
          Math.hypot(p.x - last.x, p.y - last.y) < Math.hypot(pool[best].x - last.x, pool[best].y - last.y) ? i : best, 0);
        stars.push(pool.splice(near, 1)[0]);
      }
    }
    return { stars, dust };
  }, [seed, w, h]);

  const reached = Math.max(0, Math.min(1, progress)) * (stars.length - 1);

  return (
    <svg className="bd-layer" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {dust.map((d, i) => (
        <circle key={`d${i}`} className="bd-twinkle" cx={d.x} cy={d.y} r={d.r} fill={ink}
          style={{ opacity: d.o, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` }}/>
      ))}
      {stars.slice(0, -1).map((a, i) => {
        const f = Math.max(0, Math.min(1, reached - i));
        if (f <= 0) return null;
        const b = stars[i + 1];
        return <line key={`l${i}`} x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * f} y2={a.y + (b.y - a.y) * f}
          stroke={ink} strokeWidth={1} strokeLinecap="round" opacity={0.42}/>;
      })}
      {stars.map((s, i) => {
        const lit = reached >= i;
        return (
          <g key={`s${i}`}>
            {lit && <circle cx={s.x} cy={s.y} r={7} fill={ink} opacity={0.12}/>}
            <circle cx={s.x} cy={s.y} r={lit ? 2.3 : 1.4} fill={ink} opacity={lit ? 0.9 : 0.3} style={{ transition: "r .8s, opacity .8s" }}/>
          </g>
        );
      })}
    </svg>
  );
}

function CandleGlow({ theme }) {
  const c = theme.accentInk || theme.accent;
  return (
    <div className="bd-layer" aria-hidden="true">
      <div className="bd-flame bd-flame-a" style={{ background: `radial-gradient(circle at center, ${c}40 0%, ${c}18 32%, transparent 68%)` }}/>
      <div className="bd-flame bd-flame-b" style={{ background: `radial-gradient(circle at center, ${c}33 0%, ${c}12 34%, transparent 70%)` }}/>
    </div>
  );
}

export default function Backdrop({ theme, progress, seed }) {
  const choice = useBackdrop();
  if (choice === "constellation") return <Constellation theme={theme} progress={progress} seed={seed}/>;
  if (choice === "candle") return <CandleGlow theme={theme}/>;
  return null;
}

export function BackdropPicker({ pill, muted }) {
  const choice = useBackdrop();
  return (
    <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", justifyContent:"center", alignItems:"center", marginBottom:"1rem" }}>
      <span style={{ fontSize:"0.85rem", color:muted, fontWeight:500, fontFamily:"var(--font-body)" }}>While focusing:</span>
      {BACKDROPS.map(([id, label]) => (
        <button key={id} style={pill(choice === id)} onClick={() => setBackdrop(id)}>{label}</button>
      ))}
    </div>
  );
}
