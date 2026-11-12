// What's coming up at work, for the "Coming up" calendar on the dashboard.
//
// This file is the whole source of the panel. To change it, edit the list
// below and bump UPDATED. Days whose date has passed (Eastern time) fade
// out on the calendar, so old days can stay until the next update.
//
// The repo and site are public: keep the wording general. No ticket IDs,
// vendor or colleague names, and nothing personal.
//
// Each day: date "YYYY-MM-DD" (Eastern), an optional tag ("light",
// "stacked" or "crunch"), and items. Each item has a kind:
//   "due"     something to deliver or have ready
//   "prep"    a block of time set aside to work on it
//   "meeting" a call or meeting to attend
//   "nudge"   a reminder (shown as quiet text)
// plus an optional time, the text, and milestone: true to count it down
// at the top of the panel (short: names it there).

export const UPDATED = "2026-11-12";

export const COMING_UP = [
  { date: "2026-11-12", items: [
    { kind: "nudge", time: "3:45", text: "Start wrapping up" },
  ]},
  { date: "2026-11-13", tag: "light", items: [
    { kind: "prep", time: "10", text: "First mid-PI planning pass" },
    { kind: "due", text: "Agenda and materials for next Thursday's 10 AM call" },
    { kind: "due", text: "Compliance training" },
  ]},
  { date: "2026-11-16", items: [
    { kind: "meeting", text: "Backlog refinement, all-area call" },
    { kind: "due", time: "11:30", text: "Review: decide if it needs prep" },
  ]},
  { date: "2026-11-17", tag: "light", items: [
    { kind: "prep", time: "10", text: "Main mid-PI prep block" },
  ]},
  { date: "2026-11-18", tag: "stacked", items: [
    { kind: "due", text: "Sprint closes" },
    { kind: "meeting", time: "1", text: "Two check-ins, 1 and 1:30" },
    { kind: "prep", time: "1 to 3", text: "Backlog hygiene block" },
  ]},
  { date: "2026-11-19", tag: "crunch", items: [
    { kind: "meeting", time: "10", text: "Call (materials ready)" },
    { kind: "prep", time: "12", text: "Mid-PI final touches" },
    { kind: "due", time: "2", text: "Vendor decision call: bring a recommendation", short: "Vendor decision", milestone: true },
  ]},
  { date: "2026-11-20", tag: "crunch", items: [
    { kind: "due", time: "10 to 11:30", text: "Mid-PI planning", milestone: true },
    { kind: "due", text: "PO decisions before a teammate's time off" },
  ]},
  { date: "2026-11-24", items: [
    { kind: "due", text: "Sprint demo (recorded), team ready", short: "Sprint demo", milestone: true },
  ]},
];
