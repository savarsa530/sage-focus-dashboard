// The session deck — one card is offered when a focus session ends.
// Pulling is never required and nothing is lost by skipping. Pulls only
// accumulate: today's spread, plus a running count of every card drawn.

import { safeGetJSON, safeSet, dayKey } from "./utils";

// kind: "invitation" (something for the break), "reflection", "wonder" (a true small fact).
export const DECK = [
  { id:"teacup",       art:"teacup",          name:"The Teacup",            kind:"invitation", line:"Pour something warm. Hold it with both hands before you drink." },
  { id:"moon-path",    art:"moon-path",       name:"The Moon Road",         kind:"invitation", line:"Find the farthest thing you can see. Rest your eyes there for ten slow breaths." },
  { id:"sleeping-cat", art:"sleeping-cat",    name:"The Sleeping Cat",      kind:"invitation", line:"Rest isn't the prize for the work. Stretch the way a cat does: all the way, no hurry." },
  { id:"bell-jar",     art:"bell-jar",        name:"The Bell Jar",          kind:"invitation", line:"Something kept under glass still needs air. Open a window, or step outside for a minute." },
  { id:"crystal-bundle", art:"crystal-bundle", name:"The Bundle",           kind:"invitation", line:"Drink some water. It isn't glamorous. It's the spell." },
  { id:"crystal-ball", art:"crystal-ball",    name:"The Seeing Glass",      kind:"invitation", line:"Don't look ahead yet. What does your body want in the next five minutes?" },
  { id:"hourglass",    art:"hourglass",       name:"The Hourglass",         kind:"reflection", line:"That time is spent now, and it was spent on something you chose." },
  { id:"crystal-lantern", art:"crystal-lantern", name:"The Lantern",        kind:"reflection", line:"Name one thing that got a little clearer in the last stretch." },
  { id:"twin-crystals", art:"twin-crystals",  name:"The Twins",             kind:"reflection", line:"It can have gone well and still feel unfinished. Let both be true." },
  { id:"crystal-books", art:"crystal-books",  name:"The Keeping Stone",     kind:"reflection", line:"Write down the one thought you don't want to lose. Let the rest go." },
  { id:"moon-wreath",  art:"moon-wreath",     name:"The Return",            kind:"reflection", line:"You came back to the work. Coming back is the whole practice." },
  { id:"lantern",      art:"lantern",         name:"The Waymark",           kind:"reflection", line:"Leave the next step easy to find: one line, for the you who comes back." },
  { id:"offering-hands", art:"offering-hands", name:"The Offering",         kind:"reflection", line:"Who made this hour possible? Hold them in mind for a moment." },
  { id:"night-vine",   art:"night-vine",      name:"The Night Bloom",       kind:"wonder",     line:"Moonflowers open at dusk, and fast enough to watch: a bud can unfurl in a few minutes." },
  { id:"moon-face",    art:"moon-face",       name:"The Faithful Face",     kind:"wonder",     line:"The moon turns exactly once for every trip around us, so it always shows the same face." },
  { id:"luna-moth",    art:"luna-moth",       name:"The Luna Moth",         kind:"wonder", rare:true, line:"A rare pull. Adult luna moths have no mouths. They live about a week, entirely for what matters to them." },
];

const PULLS_KEY = "sage_pulls_v1";   // [{ id, card, day, at, task }]

export function loadPulls() {
  const p = safeGetJSON(PULLS_KEY, []);
  return Array.isArray(p) ? p : [];
}

export const todaysPulls = (pulls = loadPulls()) => pulls.filter(p => p.day === dayKey());
export const cardById = (id) => DECK.find(c => c.id === id);

// Weighted draw. The rare card is a quarter as likely; cards already pulled
// today sit out until the day has seen the whole deck.
export function drawCard() {
  const seen = new Set(todaysPulls().map(p => p.card));
  let pool = DECK.filter(c => !seen.has(c.id));
  if (pool.length === 0) pool = DECK;
  const weight = (c) => (c.rare ? 0.25 : 1);
  let r = Math.random() * pool.reduce((a, c) => a + weight(c), 0);
  for (const c of pool) { r -= weight(c); if (r <= 0) return c; }
  return pool[pool.length - 1];
}

export function recordPull(card, taskText) {
  const pulls = loadPulls();
  pulls.push({ id: crypto.randomUUID(), card: card.id, day: dayKey(), at: Date.now(), task: taskText || null });
  safeSet(PULLS_KEY, pulls);
  return pulls;
}
