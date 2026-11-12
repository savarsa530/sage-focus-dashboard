// What's coming up at work, for the "Coming up" panel.
//
// This file is the whole source of the panel. To change it, edit the list
// below and bump UPDATED. Days whose date has passed (Eastern time) hide
// themselves, so old days can stay until the next update.
//
// The repo and site are public: keep the wording general. No ticket IDs,
// vendor or colleague names, and nothing personal.
//
// Each day: date "YYYY-MM-DD" (Eastern), an optional tag ("light",
// "stacked" or "crunch"), and items with an optional time and the text.

export const UPDATED = "2026-11-12";

export const COMING_UP = [
  { date: "2026-11-12", items: [
    { time: "3:45 PM", text: "Start wrapping up work" },
  ]},
  { date: "2026-11-13", tag: "light", items: [
    { time: "10:00 AM", text: "First mid-PI planning pass" },
    { text: "Finalize the agenda and review the materials for next Thursday's 10 AM call" },
    { text: "Compliance training" },
  ]},
  { date: "2026-11-16", items: [
    { text: "Decide whether the 11:30 review needs prep" },
  ]},
  { date: "2026-11-17", tag: "light", items: [
    { time: "10:00 AM", text: "Main mid-PI prep block" },
  ]},
  { date: "2026-11-18", tag: "stacked", items: [
    { text: "Sprint closes" },
    { time: "1 to 3 PM", text: "Busy, back to back" },
  ]},
  { date: "2026-11-19", tag: "crunch", items: [
    { time: "10:00 AM", text: "Call: have the materials ready" },
    { time: "12:00 PM", text: "Mid-PI final touches" },
    { time: "2:00 PM", text: "Vendor decision call: bring a recommendation" },
  ]},
  { date: "2026-11-20", tag: "crunch", items: [
    { time: "10 to 11:30 AM", text: "Mid-PI planning" },
    { text: "PO decisions due before a teammate's time off" },
  ]},
  { date: "2026-11-24", items: [
    { text: "Sprint demo (recorded): team ready to demo" },
  ]},
];
