// The garden: one seed at a time, fed by finished tasks. It only grows —
// nothing wilts, nothing resets except by blooming and being pressed.

import { safeGetJSON, safeSet, dayKey } from "./utils";

const GARDEN_KEY = "sage_garden_v1";

export const SPECIES = {
  moonflower: { name:"Moonflower", note:"opens at dusk" },
  foxglove:   { name:"Foxglove",   note:"a spire of bells" },
  poppy:      { name:"Poppy",      note:"silk in the wind" },
  lavender:   { name:"Lavender",   note:"for calm" },
};

// Growth points needed to reach each stage: seed, sprout, first leaves,
// more leaves, full leaf, bud, bloom.
export const STAGES = [0, 1, 2, 4, 6, 9, 12];
export const STAGE_NAMES = ["a seed in the soil", "sprouting", "first leaves", "growing", "in full leaf", "budding", "in bloom"];

export const stageOf = (points) => STAGES.reduce((s, need, i) => (points >= need ? i : s), 0);
export const toNext = (points) => {
  const st = stageOf(points);
  return st >= STAGES.length - 1 ? 0 : STAGES[st + 1] - points;
};

const fresh = (species = "moonflower") => ({ species, plantedAt: Date.now(), points: 0, credited: [] });

export function loadGarden() {
  const g = safeGetJSON(GARDEN_KEY);
  if (g && g.plant) return { pressed: [], days: {}, ...g };
  return { plant: fresh(), pressed: [], days: {} };
}
const save = (g) => { safeSet(GARDEN_KEY, g); return g; };

// Credit a finished thing once, by a stable key, so re-checking can't farm growth.
export function feed(key) {
  const g = loadGarden();
  if (g.plant.credited.includes(key)) return { garden: g, grew: false };
  const before = stageOf(g.plant.points);
  g.plant.points += 1;
  g.plant.credited = [...g.plant.credited, key].slice(-400);
  const dk = dayKey();
  g.days = { ...(g.days || {}), [dk]: ((g.days || {})[dk] || 0) + 1 };
  save(g);
  return { garden: g, grew: stageOf(g.plant.points) > before };
}

export function pressBloom() {
  const g = loadGarden();
  if (stageOf(g.plant.points) < STAGES.length - 1) return g;
  g.pressed = [...g.pressed, { species: g.plant.species, plantedAt: g.plant.plantedAt, bloomedAt: Date.now() }];
  g.plant = { ...g.plant, pressed: true };
  return save(g);
}

export function plantSeed(species) {
  const g = loadGarden();
  g.plant = { ...fresh(species), credited: g.plant.credited };
  return save(g);
}
