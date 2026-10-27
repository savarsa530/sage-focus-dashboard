// Which backdrop plays behind a focus session, shared between the
// picker in Time toggles and the backdrop itself.
import { useEffect, useState } from "react";

const BACKDROP_KEY = "sage_backdrop_v1";
export const BACKDROPS = [
  ["constellation", "Slow constellation"],
  ["candle",        "Candle glow"],
  ["none",          "None"],
];

const subscribers = new Set();
function getBackdrop() {
  try {
    const v = localStorage.getItem(BACKDROP_KEY);
    return BACKDROPS.some(([id]) => id === v) ? v : "constellation";
  } catch { return "constellation"; }
}
export function setBackdrop(id) {
  try { localStorage.setItem(BACKDROP_KEY, id); } catch { /* storage unavailable */ }
  subscribers.forEach(fn => fn(id));
}
export function useBackdrop() {
  const [value, setValue] = useState(getBackdrop);
  useEffect(() => { subscribers.add(setValue); return () => { subscribers.delete(setValue); }; }, []);
  return value;
}

export const BACKDROP_CSS = `
  .bd-layer{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;animation:bdFade 1.2s ease both;}
  @keyframes bdFade{from{opacity:0}to{opacity:1}}
  .bd-twinkle{animation:bdTwinkle 5s ease-in-out infinite;}
  @keyframes bdTwinkle{0%,100%{opacity:.1}50%{opacity:.45}}
  .bd-flame{position:absolute;width:62vmax;height:62vmax;border-radius:50%;transform-origin:50% 60%;}
  .bd-flame-a{left:-24vmax;bottom:-26vmax;animation:bdFlicker 4.7s ease-in-out infinite;}
  .bd-flame-b{right:-26vmax;top:-22vmax;animation:bdFlicker 6.3s ease-in-out infinite;animation-delay:-2.1s;}
  @keyframes bdFlicker{0%,100%{opacity:.85;transform:scale(1)}18%{opacity:.7;transform:scale(.985)}22%{opacity:.92;transform:scale(1.01)}47%{opacity:.78;transform:scale(.99)}63%{opacity:1;transform:scale(1.015)}71%{opacity:.82;transform:scale(1)}88%{opacity:.95;transform:scale(1.005)}}
  @media (prefers-reduced-motion: reduce){.bd-twinkle,.bd-flame,.bd-layer{animation:none!important}}
`;
