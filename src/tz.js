// Eastern and India time, worked out from the real time zones so daylight
// saving takes care of itself (India is 10h30 ahead of EST, 9h30 ahead of EDT).

export const ET  = "America/New_York";
export const IST = "Asia/Kolkata";

// The India team's shift, in India time: 3:00 PM to midnight IST
// (which is about 1:30 PM ET in winter).
export const TEAM_SHIFT = { start: 15 * 60, end: 24 * 60 };

const partsFmt = {};
function partsIn(tz, date) {
  partsFmt[tz] ||= new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const p = Object.fromEntries(partsFmt[tz].formatToParts(date).map(x => [x.type, x.value]));
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute };
}

// Wall-clock minutes since midnight in a zone, and that zone's calendar day.
export const minsIn = (tz, date) => { const p = partsIn(tz, date); return p.h * 60 + p.mi; };
export const dayIn  = (tz, date) => { const p = partsIn(tz, date); return `${p.y}-${p.mo}-${p.d}`; };

// Minutes the zone is ahead of UTC at that instant.
function offsetMins(tz, date) {
  const p = partsIn(tz, date);
  const wall = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi);
  return Math.round((wall - Math.floor(date.getTime() / 60000) * 60000) / 60000);
}

// The instant when it is `mins` past midnight on `refDate`'s calendar day in `tz`.
export function atZonedMins(tz, refDate, mins) {
  const p = partsIn(tz, refDate);
  const guess = Date.UTC(p.y, p.mo - 1, p.d, 0, mins);
  let t = guess - offsetMins(tz, new Date(guess)) * 60000;
  t = guess - offsetMins(tz, new Date(t)) * 60000;
  return new Date(t);
}

const fmtCache = {};
const fmtWith = (tz, opts) => {
  const k = tz + JSON.stringify(opts);
  return (fmtCache[k] ||= new Intl.DateTimeFormat("en-US", { timeZone: tz, ...opts }));
};
export const timeIn    = (tz, date) => fmtWith(tz, { hour: "numeric", minute: "2-digit" }).format(date);
export const weekdayIn = (tz, date) => fmtWith(tz, { weekday: "short" }).format(date);
export const dateIn    = (tz, date) => fmtWith(tz, { weekday: "short", month: "short", day: "numeric" }).format(date);
export const zoneAbbr  = (tz, date) => {
  const p = fmtWith(tz, { timeZoneName: "short" }).formatToParts(date).find(x => x.type === "timeZoneName");
  const n = p ? p.value : "";
  return tz === IST && /GMT\+5:30/.test(n) ? "IST" : n;
};

// How far India is ahead of Eastern at that instant, in minutes.
export const indiaAhead = (date) => offsetMins(IST, date) - offsetMins(ET, date);

export const fmtAhead = (mins) => {
  const h = Math.floor(mins / 60), m = mins % 60;
  return m === 30 ? `${h}½ hours` : m ? `${h}h ${m}m` : `${h} hours`;
};

// "8:00 AM ET / 6:30 PM IST", naming India's weekday when it's a different day.
export function meetLine(date) {
  const nextDay = dayIn(IST, date) !== dayIn(ET, date);
  return `${timeIn(ET, date)} ET / ${timeIn(IST, date)} IST${nextDay ? ` (${weekdayIn(IST, date)})` : ""}`;
}
