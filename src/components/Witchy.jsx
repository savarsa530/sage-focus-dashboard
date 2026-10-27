import { useState } from "react";
import { moonOf } from "../moon";
import { emblemUrl } from "../glyphs";

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
  // From the iconography sheet: daily-op glyphs, the four growth stages, and the break/ledger marks.
  mail:       "M3.5 6.5h17v11h-17Z M3.5 7.2 12 13.5l8.5-6.3",
  calendar:   "M4.5 6h15v14h-15Z M4.5 10h15 M8.5 3.5v4 M15.5 3.5v4 M13.4 12.2a3 3 0 1 0 1.6 5.3 2.4 2.4 0 1 1-1.6-5.3Z",
  diamond:    "M12 3.5 20.5 12 12 20.5 3.5 12Z M12 8 16 12 12 16 8 12Z M12 3.5V8 M20.5 12H16 M12 20.5V16 M3.5 12H8",
  branch:     "M8.8 5a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0Z M8.8 19a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0Z M18.8 8a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0Z M7 6.8v10.4 M17 9.8c0 4.2-10 2.8-10 7.4",
  people:     "M14.5 6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z M7.5 19.5v-1.8a4.5 4.5 0 0 1 9 0v1.8 M7.5 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z M2.5 17.5v-1a3 3 0 0 1 4.3-2.7 M20.5 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z M21.5 17.5v-1a3 3 0 0 0-4.3-2.7",
  seed:       "M12 20v-4.5 M12 15.5c-2.5 0-4.2-1.4-4.6-3.8 2.5 0 4.2 1.4 4.6 3.8Z M12 15.5c2.5 0 4.2-1.4 4.6-3.8-2.5 0-4.2 1.4-4.6 3.8Z M7.5 20.5h9",
  sprout:     "M12 20.5V7.5 M12 15c-2.8 0-4.8-1.6-5.3-4.3 2.8 0 4.8 1.6 5.3 4.3Z M12 11.5c2.7 0 4.6-1.5 5.1-4.1-2.7 0-4.6 1.5-5.1 4.1Z M12 7.5c-.9-.9-1.2-2.2-.8-3.7 1.2.8 1.4 2.2.8 3.7Z M7.5 20.5h9",
  bud:        "M12 20.5V11 M12 16.5c-2.5 0-4.3-1.4-4.8-3.8 2.5 0 4.3 1.4 4.8 3.8Z M12 16.5c2.5 0 4.3-1.4 4.8-3.8-2.5 0-4.3 1.4-4.8 3.8Z M12 11c-2.4-1-3-4.2 0-7.6 3 3.4 2.4 6.6 0 7.6Z M12 11c-.9-1.6-.9-4 0-6 M7.5 20.5h9",
  bloom:      "M12 20.5v-8.2 M12 17.5c-2.3 0-4-1.3-4.4-3.5 2.3 0 4 1.3 4.4 3.5Z M13.4 8.5a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0Z M12 7.1C10.6 5.8 10.6 3.9 12 2.6c1.4 1.3 1.4 3.2 0 4.5Z M13.3 8.1c.6-1.8 2.3-2.7 4.2-2.3-.5 1.9-2.2 2.9-4.2 2.3Z M10.7 8.1c-.6-1.8-2.3-2.7-4.2-2.3.5 1.9 2.2 2.9 4.2 2.3Z M12.9 9.6c1.6.8 2.3 2.6 1.6 4.3-1.6-.7-2.3-2.5-1.6-4.3Z M11.1 9.6c-1.6.8-2.3 2.6-1.6 4.3 1.6-.7 2.3-2.5 1.6-4.3Z M7.5 20.5h9",
  teacup:     "M5 10.5h11v3.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5Z M16 11.5h1.4a2.1 2.1 0 0 1 0 4.2H15.6 M4 21h13 M9 8c-.9-1.1.9-2.1 0-4 M12.5 8c-.9-1.1.9-2.1 0-4",
  hourglass:  "M6.5 3h11 M6.5 21h11 M7.5 3c0 5.2 4.5 6.4 4.5 9s-4.5 3.8-4.5 9 M16.5 3c0 5.2-4.5 6.4-4.5 9s4.5 3.8 4.5 9 M9.3 19.3c1-1.3 1.8-1.7 2.7-1.7s1.7.4 2.7 1.7Z M9.8 7.5h4.4",
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
// If a load fails it retries once; if that fails too it shows a quiet star
// instead of a broken-image box.
export function Emblem({ name, size = 40, alt = "", style }) {
  const [tries, setTries] = useState(0);
  if (tries > 1) {
    return (
      <span role={alt ? "img" : undefined} aria-label={alt || undefined} style={{ width:size, height:size, display:"inline-flex", alignItems:"center", justifyContent:"center", flex:"none", color:"#c9a35b", opacity:.7, ...style }}>
        <LineIcon name="star" size={Math.max(16, Math.round(size * 0.35))}/>
      </span>
    );
  }
  return (
    <img key={tries} src={emblemUrl(name) + (tries ? `?retry=${tries}` : "")} alt={alt}
      width={size} height={size} onError={() => setTries(t => t + 1)}
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

