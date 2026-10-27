// ── Task groups ────────────────────────────────────────────────
// Buckets that say who a piece of work is for (Team Support, Leadership…).
// A task carries `group: <groupId>`; no group (or a removed one) means Unsorted.
// Daily ops that were focused into the task list sit in their own section.
import { safeGetJSON, safeSet } from "./utils";

const GROUPS_KEY = "sage_task_groups_v1";
export const GROUPS_UI_KEY = "sage_task_groups_ui_v1"; // which sections are collapsed

// Sigils a new group can take; clicking a group's sigil cycles through these.
export const GROUP_ICONS = ["people", "crystal", "sprig", "crescent", "diamond", "branch", "eye", "star", "candle", "seed"];

const DEFAULT_GROUPS = [{ id:"team-support", name:"Team Support", icon:"people" }];

export function loadGroups() {
  const saved = safeGetJSON(GROUPS_KEY);
  return Array.isArray(saved) ? saved : DEFAULT_GROUPS;
}

export function saveGroups(groups) {
  safeSet(GROUPS_KEY, groups);
}

// The name of the bucket a task's time counts toward in the ledger.
export function groupNameFor(task) {
  if (!task) return "Unsorted";
  const g = loadGroups().find(x => x.id === task.group);
  if (g) return g.name;
  return task.opId ? "Daily Ops" : "Unsorted";
}

// "Team Support · " for a grouped task, "" otherwise. Used as a subtitle prefix.
export function groupPrefix(task) {
  const name = groupNameFor(task);
  return name === "Unsorted" || name === "Daily Ops" ? "" : `${name} · `;
}

export function groupIconFor(name) {
  if (name === "Daily Ops") return "candle";
  if (name === "Unsorted") return "cards";
  return loadGroups().find(g => g.name === name)?.icon || "star";
}
