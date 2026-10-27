import { moonOf } from "../moon";

// Ornament from The Deck Room design system: line icons, painted emblems,
// the real moon, corner flourishes and the star divider.

const ICONS = {
  crystal:    "M12 2.5 15.5 7 14.5 19 12 21.5 9.5 19 8.5 7Z M12 2.5V21.5 M8.5 7h7 M9.5 19h5 M15.5 7 19 10 18.2 18 14.5 19 M8.5 7 5 10 5.8 18 9.5 19",
  crescent:   "M15.5 3.2A9 9 0 1 0 20.8 16 7.2 7.2 0 0 1 15.5 3.2Z M18.5 4.5v3 M17 6h3",
  eye:        "M3.5 12.5S7 7.5 12 7.5s8.5 5 8.5 5-3.5 5-8.5 5-8.5-5-8.5-5Z M12 10.3a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4Z M12 2v2.6 M5.6 4.2l1.5 2 M18.4 4.2l-1.5 2 M2.2 8.5l2.3 1 M21.8 8.5l-2.3 1 M12 20.4V22",
  sprig:      "M12 22V7.5 M12 7.5c0-2 1-4 2-5 M12 17c-2.6 0-4.6-1.6-5.3-4.3 2.6 0 4.6 1.6 5.3 4.3Z M12 17c2.6 0 4.6-1.6 5.3-4.3-2.6 0-4.6 1.6-5.3 4.3Z M12 12.3c-2.1 0-3.8-1.3-4.4-3.5 2.1 0 3.8 1.3 4.4 3.5Z M12 12.3c2.1 0 3.8-1.3 4.4-3.5-2.1 0-3.8 1.3-4.4 3.5Z M12 7.5c-1.4-.6-2.3-1.8-2.5-3.4 1.4.6 2.3 1.8 2.5 3.4Z",
  star:       "M12 2.5 13.6 10.4 21.5 12 13.6 13.6 12 21.5 10.4 13.6 2.5 12 10.4 10.4Z",
  cards:      "M9.2 4.5h7.6a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H9.2a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z M8.2 7.2 4.6 8.1a1 1 0 0 0-.7 1.2l2.6 10.3 M13 9.5a2.5 2.5 0 1 0 2 4 2 2 0 1 1 0-3.4 2.5 2.5 0 0 0-2-.6Z",
  candle:     "M9.5 10h5v10.5h-5Z M7 21.5h10 M12 10V8 M12 8c-1.3-1-1.5-2.6 0-5 1.5 2.4 1.3 4 0 5Z M9.5 12.5c1 .8 1.8.8 2.5 0",
  planchette: "M12 2.8C16.2 7.8 19 12.3 19 15.6c0 3.3-2.6 5.6-7 5.6s-7-2.3-7-5.6C5 12.3 7.8 7.8 12 2.8Z M12 10.2a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Z M12 6.5v1.2",
};

export function LineIcon({ name, size = 16, weight = 1.3, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ flex:"none", verticalAlign:"-0.15em", ...style }}>
      <path d={ICONS[name] || ICONS.star}/>
    </svg>
  );
}

// Painted emblems live in /public/emblems. Never shown below 24px.
export function Emblem({ name, size = 40, alt = "", style }) {
  return (
    <img src={`${import.meta.env.BASE_URL}emblems/${name}.webp`} alt={alt}
      width={size} height={size}
      style={{ objectFit:"contain", flex:"none", filter:"drop-shadow(0 2px 3px rgba(0,0,0,.45))", ...style }}/>
  );
}

// A CSS disc computed from the real date: lit part plus an inset shade.
export function MoonPhase({ theme, size = 18, date = new Date() }) {
  const m = moonOf(date);
  const off = Math.round(size * (1 - m.illum)) * (m.waxing ? 1 : -1);
  return (
    <span title={m.name} role="img" aria-label={m.name} style={{
      display:"inline-block", flex:"none", width:size, height:size, borderRadius:"50%",
      background: theme.moonLit, boxShadow:`inset ${off}px 0 0 0 ${theme.moonShade}, 0 0 0 1px ${theme.line}`,
    }}/>
  );
}

const CORNER = "M1 33V12C1 6 6 1 12 1h21 M6 33V15a9 9 0 0 1 9-9h18 M1 1c5.5 0 9 3 10 8 M14 14c2.2-2.2 5.4-2.2 7.6 0-2.2 2.2-5.4 2.2-7.6 0Z";
const CORNER_POS = {
  tl: { top:-2, left:-2 },
  tr: { top:-2, right:-2, transform:"scaleX(-1)" },
  bl: { bottom:-2, left:-2, transform:"scaleY(-1)" },
  br: { bottom:-2, right:-2, transform:"scale(-1,-1)" },
};

// Corner flourishes for the one featured thing on the view (the timer).
export function OrnateCorners({ color }) {
  return Object.entries(CORNER_POS).map(([k, pos]) => (
    <svg key={k} viewBox="0 0 34 34" width={34} height={34} fill="none" stroke={color} strokeWidth={1}
      aria-hidden="true" style={{ position:"absolute", pointerEvents:"none", ...pos }}>
      <path d={CORNER}/>
    </svg>
  ));
}

// A rule, a four-point star, a rule.
export function StarDivider({ color, width = 64, children, style }) {
  const rule = (flip) => (
    <span style={{ width, maxWidth:"30vw", height:1, background:`linear-gradient(90deg, transparent, ${color})`, transform: flip ? "scaleX(-1)" : undefined }}/>
  );
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, color, lineHeight:1, ...style }}>
      {rule(false)}
      <LineIcon name="star" size={12}/>
      {children}
      {children && <LineIcon name="star" size={12}/>}
      {rule(true)}
    </div>
  );
}
