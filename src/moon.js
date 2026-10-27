// Moon age and phase from the real date (synodic month).
const SYN = 29.530588853;
const PHASES = [[1.84,"New moon"],[5.53,"Waxing crescent"],[9.22,"First quarter"],[12.91,"Waxing gibbous"],[16.61,"Full moon"],[20.3,"Waning gibbous"],[23.99,"Last quarter"],[27.68,"Waning crescent"],[99,"New moon"]];

export function moonOf(date) {
  const jd  = date.getTime() / 86400000 + 2440587.5;
  const age = (((jd - 2451550.26) % SYN) + SYN) % SYN;
  const illum = (1 - Math.cos((2 * Math.PI * age) / SYN)) / 2;
  const name = PHASES.find(([limit]) => age < limit)[1];
  return { age, illum, waxing: age < SYN / 2, name };
}
