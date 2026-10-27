// Which line icon a daily op or task wears (icons live in components/Witchy.jsx).
// Which glyph a daily op wears, by what it's called.
export function opIcon(text = "") {
  const t = text.toLowerCase();
  if (/mail|inbox|outlook/.test(t)) return "mail";
  if (/calendar|schedule|meeting/.test(t)) return "calendar";
  if (/jira|backlog|ticket|story|stories/.test(t)) return "diamond";
  if (/sprint|release|pi\b|progress/.test(t)) return "branch";
  if (/stand-?up|team|1:1|sync/.test(t)) return "people";
  return "sprig";
}

// A task grows as it's tended: seed → sprout (time logged) → bud (in focus) → bloom (done).
export function taskStage(task, focused) {
  if (task.done) return { icon:"bloom", label:"Bloomed — done" };
  if (focused) return { icon:"bud", label:"In focus now" };
  if ((task.focusSecs || 0) > 0) return { icon:"sprout", label:"Sprouting — time tended" };
  return { icon:"seed", label:"A seed — not tended yet" };
}
