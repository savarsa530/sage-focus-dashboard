export const fmt   = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
export const pad   = (n) => String(n).padStart(2,"0");
export const uuid  = ()  => crypto.randomUUID();
export const today = ()  => new Date().toDateString();
