import { useState, useEffect } from "react";
import { pad } from "../utils";

export default function LiveClock({ color }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => { const d = new Date(); setT(`${pad(d.getHours())}:${pad(d.getMinutes())}`); };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <span style={{ fontFamily:"'Outfit', system-ui, sans-serif", fontSize:"0.9rem", color, letterSpacing:"0.08em", fontStyle:"italic" }}>
      {t}
    </span>
  );
}
