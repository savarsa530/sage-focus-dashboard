export const THEMES = [
  { key:"obsidian", label:"Obsidian", accent:"#c084fc", bg:"#0d0b14", panel:"#18152a", panelBorder:"#2a2440", text:"#e8e2f8", textMuted:"#7c6fa0", timerRing:"#c084fc", auroraColors:["#c084fc","#818cf8","#a78bfa"], isDark:true },
  { key:"solar",    label:"Solar",    accent:"#f97316", bg:"#fefaf4", panel:"#fff7ed", panelBorder:"#fde8cc", text:"#431407", textMuted:"#9a7151", timerRing:"#f97316", auroraColors:["#fbbf24","#f97316","#fcd34d"], isDark:false },
  { key:"electric", label:"Electric", accent:"#38bdf8", bg:"#f0f9ff", panel:"#e0f2fe", panelBorder:"#bae6fd", text:"#0c2a42", textMuted:"#4b7fa3", timerRing:"#38bdf8", auroraColors:["#38bdf8","#818cf8","#7dd3fc"], isDark:false },
  { key:"sage",     label:"Sage",     accent:"#4ade80", bg:"#f2f7f2", panel:"#e8f5e8", panelBorder:"#c3e6c3", text:"#0f2d0f", textMuted:"#4a7a4a", timerRing:"#4ade80", auroraColors:["#4ade80","#86efac","#34d399"], isDark:false },
  { key:"bloom",    label:"Bloom 🌸", accent:"#f472b6", bg:"#fff0f7", panel:"#fce7f3", panelBorder:"#fbcfe8", text:"#500724", textMuted:"#9d4068", timerRing:"#f472b6", auroraColors:["#f472b6","#f9a8d4","#fb7185"], isDark:false },
];

export const PRESETS = [
  { label:"25 / 5",  work:25, brk:5  },
  { label:"50 / 10", work:50, brk:10 },
  { label:"90 / 20", work:90, brk:20 },
  { label:"15 / 3",  work:15, brk:3  },
];

export const SOUND_DEFS = {
  rain:     { label:"🌧 Rain",        color:"#7B9EA8" },
  brown:    { label:"🌫 Brown Noise", color:"#8B7355" },
  binaural: { label:"🎵 Binaural",    color:"#9B7ED8" },
  white:    { label:"⬜ White Noise", color:"#B8B8B8" },
};

export const PI_CYCLES = ["2026.2","2026.3","2026.4","2027.1"];

export const PI_STATUSES = [
  { key:"seeding",  label:"🌱 Seeding"  },
  { key:"digging",  label:"⛏️ Digging"  },
  { key:"ready",    label:"✅ Ready"    },
  { key:"parked",   label:"🅿️ Parked"   },
];

export const PI_SECTION_TYPES = {
  capacity: {
    key: "capacity",
    label: "Capacity",
    icon: "🌿",
    color: "#4ade80",
    description: "Team capacity constraints",
    fields: ["impactLevel", "owner"],
  },
  dependencies: {
    key: "dependencies",
    label: "Dependencies",
    icon: "🔗",
    color: "#7c3aed",
    description: "External blockers & dependencies",
    fields: ["blockingTeam", "targetResolution", "status"],
  },
  risk: {
    key: "risk",
    label: "Risk",
    icon: "⚠️",
    color: "#f97316",
    description: "Known risks & concerns",
    fields: [],
  },
};

export const SKIP_REASONS = [
  { key:"flow",       label:"🌊 In flow state — don't want to break it" },
  { key:"overloaded", label:"🌿 Too much on my plate right now" },
  { key:"physical",   label:"🚶 Taking a physical break myself" },
  { key:"incomplete", label:"🌱 Session felt incomplete" },
  { key:"other",      label:"✦ Other" },
];

export const PI_READINESS_CYCLES = ["2026.2", "2026.3", "2026.4", "2027.1"];

export const READINESS_BUCKETS = [
  {
    id: "artifacts",
    label: "📋 Artifacts in Jira",
    color: "#378ADD",
    items: [
      { id: "obj-exist",     label: "All objectives exist in Jira",     sub: "Not just ideas — actual epics or objective records created" },
      { id: "stories-exist", label: "Stories are in Jira",               sub: "Even placeholder stories attached to each objective" },
      { id: "stories-built", label: "Stories are fully built out",        sub: "Acceptance criteria, descriptions, estimates — not just titles" },
    ],
  },
  {
    id: "risk-dep",
    label: "⚠️ Risk & Dependencies",
    color: "#D85A30",
    items: [
      { id: "risks-mapped",      label: "Risks mapped for each objective",       sub: "Known unknowns documented — or flagged as a planning discussion item" },
      { id: "deps-mapped",       label: "Dependencies mapped for each objective", sub: "Cross-team, cross-system, or external — identified and noted" },
      { id: "deps-communicated", label: "Dependency owners notified",             sub: "Relevant teams or individuals are aware they're in the picture" },
    ],
  },
  {
    id: "logistics",
    label: "🗓 Planning Logistics",
    color: "#1D9E75",
    items: [
      { id: "sprints-loaded",    label: "Sprints loaded with realistic capacity", sub: "Accounting for PTO, holidays, and part-time contributors" },
      { id: "roadmap-written",   label: "Roadmap written and shared",              sub: "Stakeholders can see what's coming and why" },
      { id: "constraints-noted", label: "Constraints already baked in",            sub: "Known blockers, tech debt, or dependencies reflected in loaded sprints" },
      { id: "schedule-exists",   label: "Planning schedule exists",                sub: "Agenda with time blocks so everything gets covered" },
    ],
  },
  {
    id: "people",
    label: "👥 People & Capacity",
    color: "#7F77DD",
    items: [
      { id: "capacity-confirmed",    label: "Capacity confirmed across all three regions", sub: "US, India, Canada — actual headcount for the PI, not assumed" },
      { id: "rollover-accounted",    label: "Rollover from previous PI accounted for",     sub: "Unfinished work has a home or is explicitly parked" },
      { id: "leads-context",         label: "Leads have enough context to participate",    sub: "Not hearing objectives for the first time in the planning room" },
      { id: "stakeholders-aligned",  label: "Stakeholder expectations validated",          sub: "Nothing assumed to be 'definitely in' without capacity backing it" },
    ],
  },
  {
    id: "culture",
    label: "🌱 Culture & Engagement",
    color: "#D4537E",
    items: [
      { id: "fun-parked",           label: "Something fun is in the agenda",       sub: "A moment of levity, a team activity, anything that makes it human" },
      { id: "consultation-flagged", label: "Cross-group consultations identified", sub: "Anything requiring input from outside the team — before, during, or after" },
    ],
  },
  {
    id: "forward",
    label: "✦ Forward-Looking",
    color: "#BA7517",
    items: [
      { id: "ai-options",      label: "AI options considered per objective", sub: "Where could AI tooling accelerate, automate, or enhance this work?" },
      { id: "next-pi-seeds",   label: "Early seeds for next PI captured",    sub: "Anything already known for the next cycle is in the parking lot" },
    ],
  },
];

export const READINESS_TOTAL = READINESS_BUCKETS.reduce((a, b) => a + b.items.length, 0);
