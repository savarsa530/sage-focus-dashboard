import { useState } from "react";

// A small drawn plant, drawn from its growth points so that every finished
// task shows: 1 sprouts it, 2–9 each add a leaf and a little height, 10 sets
// the bud, 11 swells it, 12 blooms. Each species has its own leaf and flower.
// Parts that are new since the last render grow in from their base.

const stemH  = (p) => (p <= 0 ? 0 : Math.min(94, 12 + p * 7));
const leaves = (p) => Math.max(0, Math.min(8, p - 1));

const LOOK = {
  moonflower: { leaf:[16, 10], heart:true, flower:"#f4ecd8", ink:"#d9c99e" },
  foxglove:   { leaf:[24, 7],  flower:"#b874b9", ink:"#8a4f8c" },
  poppy:      { leaf:[18, 7],  lobed:true, flower:"#df6a4c", ink:"#a8432c" },
  lavender:   { leaf:[16, 3],  flower:"#9d86d6", ink:"#7461ab" },
};

const leafPath = (len, w, heart) => heart
  ? `M0 0 C ${len*0.15} ${-w}, ${len*0.75} ${-w}, ${len} 0 C ${len*0.75} ${w*0.9}, ${len*0.15} ${w*0.9}, 0 0Z`
  : `M0 0 C ${len*0.3} ${-w}, ${len*0.7} ${-w*0.8}, ${len} 0 C ${len*0.7} ${w*0.8}, ${len*0.3} ${w}, 0 0Z`;

function Flower({ species, x, y, look, open }) {
  if (!open) {
    // bud
    return species === "lavender" || species === "foxglove"
      ? <g>{[0,1,2,3].map(i => <ellipse key={i} cx={x + (i % 2 ? 2 : -2)} cy={y + 4 + i*6} rx={2.4} ry={3.4} fill={look.flower} opacity={0.55} stroke={look.ink} strokeWidth={0.6}/>)}</g>
      : <path d={`M${x} ${y+8} C ${x-6} ${y+2}, ${x-4} ${y-8}, ${x} ${y-11} C ${x+4} ${y-8}, ${x+6} ${y+2}, ${x} ${y+8}Z`} fill={look.flower} opacity={0.7} stroke={look.ink} strokeWidth={0.8}/>;
  }
  if (species === "moonflower") return (
    <g>
      <circle cx={x} cy={y-4} r={17} fill={look.flower} opacity={0.12}/>
      <circle cx={x} cy={y-4} r={13} fill={look.flower} stroke={look.ink} strokeWidth={0.9}/>
      {[0,72,144,216,288].map(a => <line key={a} x1={x} y1={y-4} x2={x + 12*Math.cos((a-90)*Math.PI/180)} y2={y-4 + 12*Math.sin((a-90)*Math.PI/180)} stroke={look.ink} strokeWidth={0.7}/>)}
      <circle cx={x} cy={y-4} r={2.6} fill="#e8d48a"/>
    </g>
  );
  if (species === "poppy") return (
    <g>
      {[[-6,-4],[6,-4],[-4,-12],[4,-12]].map(([dx,dy],i) => <circle key={i} cx={x+dx} cy={y+dy} r={8} fill={look.flower} stroke={look.ink} strokeWidth={0.8} opacity={0.95}/>)}
      <circle cx={x} cy={y-8} r={3.2} fill="#2a1d24"/>
    </g>
  );
  if (species === "foxglove") return (
    <g>{[0,1,2,3,4,5].map(i => (
      <path key={i} transform={`translate(${x + (i % 2 ? 4 : -4)} ${y + i*6 - 6}) rotate(${i % 2 ? 20 : -20})`}
        d="M-3.2 -3 C -3.6 2, -2.4 5, 0 5.2 C 2.4 5, 3.6 2, 3.2 -3 Z" fill={look.flower} stroke={look.ink} strokeWidth={0.7}/>
    ))}</g>
  );
  // lavender
  return <g>{Array.from({ length: 12 }, (_, i) => (
    <ellipse key={i} cx={x + (i % 2 ? 2.4 : -2.4)} cy={y - 10 + i*3.2} rx={2.2} ry={2.8} fill={look.flower} stroke={look.ink} strokeWidth={0.5}/>
  ))}</g>;
}

export default function Plant({ species = "moonflower", points = 0, size = 150, theme }) {
  // Remember the points we last drew, so only newly grown parts animate.
  const [seen, setSeen] = useState({ points, from: points });
  if (seen.points !== points) setSeen({ points, from: seen.points });
  const from = seen.points !== points ? seen.points : seen.from;
  const grewNow = points > from;
  const look = LOOK[species] || LOOK.moonflower;
  const dark = theme?.isDark !== false;
  const stem = dark ? "#8fae7a" : "#5d7a4a";
  const leafFill = dark ? "#5f7f52" : "#7d9b67";
  const soil = theme?.card || "#211a2c";
  const rim  = theme?.accentInk || "#d9b979";

  const H = stemH(points);
  const top = 146 - H;
  const stemD = `M60 146 C 56 ${146 - H*0.35}, 64 ${146 - H*0.7}, 60 ${top}`;
  const grow = (isNew) => isNew ? { animation:"partIn .9s cubic-bezier(.2,.8,.2,1) both", transformBox:"fill-box", transformOrigin:"0% 50%" } : undefined;

  const parts = [];
  for (let i = 0; i < leaves(points); i++) {
    const side = i % 2 ? -1 : 1;
    const y = 146 - H * Math.min(0.12 + i * 0.09, 0.8);   // alternate up the stem
    const [len, w] = look.leaf;
    const isNew = grewNow && i >= leaves(from);
    parts.push(
      <g key={i} transform={`translate(60 ${y}) rotate(${side > 0 ? -28 : 208})`}>
        <path d={leafPath(len, w, look.heart)} fill={leafFill} stroke={stem} strokeWidth={0.9} style={grow(isNew)}/>
      </g>
    );
  }
  const budScale = points >= 12 ? 1 : points === 11 ? 1 : 0.7;
  const flowerNew = grewNow && ((points >= 10 && from < 10) || (points >= 11 && from < 11) || (points >= 12 && from < 12));

  return (
    <svg viewBox="0 0 120 160" width={size} height={size * 160 / 120} role="img"
      aria-label={`${species}, ${Math.min(points, 12)} of 12`} className="plant-sway" style={{ overflow:"visible" }}>
      {/* soil */}
      <path d="M22 148 C 34 138, 86 138, 98 148 Z" fill={soil} stroke={rim} strokeWidth={1}/>
      <line x1={18} y1={148} x2={102} y2={148} stroke={rim} strokeWidth={1}/>
      {points <= 0 && <ellipse cx={60} cy={143} rx={4.5} ry={3} fill="#b08a55" stroke={rim} strokeWidth={0.6}/>}
      {points >= 1 && <path d={stemD} fill="none" stroke={stem} strokeWidth={2} strokeLinecap="round" style={{ transition:"d .9s cubic-bezier(.2,.8,.2,1)" }}/>}
      {points === 1 && <g transform={`translate(60 ${top})`} style={grow(grewNow)}>
        <path d={leafPath(8, 4)} transform="rotate(-40)" fill={leafFill} stroke={stem} strokeWidth={0.8}/>
        <path d={leafPath(8, 4)} transform="rotate(220)" fill={leafFill} stroke={stem} strokeWidth={0.8}/>
      </g>}
      {parts}
      {points >= 10 && (
        <g key={points >= 12 ? "bloom" : `bud${points}`} style={flowerNew ? { animation:"partIn .9s cubic-bezier(.2,.8,.2,1) both", transformBox:"fill-box", transformOrigin:"50% 100%" } : undefined}>
          <g transform={`translate(60 ${top}) scale(${budScale}) translate(-60 ${-top})`}>
            <Flower species={species} x={60} y={top} look={look} open={points >= 12}/>
          </g>
        </g>
      )}
    </svg>
  );
}
