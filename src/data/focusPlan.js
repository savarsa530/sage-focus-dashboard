// What each focus block is for, decided ahead of time, so a block opens
// with a first step instead of a decision.
//
// This file is the whole source of the "This block" panel. To change it,
// edit the list below and bump UPDATED.
//
// The repo and site are public: keep the wording general. No ticket IDs,
// vendor or colleague names, and nothing personal.
//
// Each block: date "YYYY-MM-DD" (Eastern), an optional time, the work,
// its steps (small enough to do without deciding anything), and doneWhen:
// the point where it's done enough for today. A block with rest: true is
// a breather, with nothing to work on.

export const UPDATED = "2026-11-12";

export const BLOCKS = [
  { date: "2026-11-12", time: "12:30",
    work: "Agenda and materials for next Thursday's 10 AM call",
    steps: [
      "Open the folder and write down each file name (about 10 minutes)",
      "Open the agenda and mark anything missing or unclear",
      "Skim each file once and jot one line on what it says",
      "List your questions",
    ],
    doneWhen: "The agenda is marked up and the question list exists, even rough" },

  { date: "2026-11-13", time: "12:30",
    work: "Compliance training",
    steps: [
      "Open the training site and see what's assigned",
      "Start the first module",
      "Keep going until the block ends",
    ],
    doneWhen: "One module is finished, or all of it" },

  { date: "2026-11-16", time: "12:30",
    work: "Recommendation for Thursday's vendor decision call",
    steps: [
      "Write the two options as two headings",
      "Under each, one line on its value and one on your concern",
      "Add any alternative you'd raise",
      "Write one sentence: which you'd pick, and why",
    ],
    doneWhen: "That one-sentence recommendation exists" },

  { date: "2026-11-17", time: "12:30",
    work: "PO decisions to settle before a teammate's time off",
    steps: [
      "List the decisions that need them before they're out",
      "Mark the ones you can decide on your own",
      "Decide the easiest one",
      "Write the rest down as questions for them",
    ],
    doneWhen: "The list exists and at least one decision is made" },

  { date: "2026-11-18", rest: true,
    work: "A breather. The afternoon is busy, so this block is yours." },
];
