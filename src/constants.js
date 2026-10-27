// The Deck Room design system — Candlelight (dark, default) and Daylight.
// Tokens: https://claude.ai/artifact/CNppAkVLLWUh7RFrkZ43bF
const DECK_ROOM_FONTS = {
  body:    "'Spectral', Georgia, serif",
  caps:    "'Cinzel', 'Trajan Pro', Georgia, serif",
  display: "'IM Fell English', 'Iowan Old Style', Georgia, serif",
};
const CLASSIC_FONTS = {
  body:    "'Outfit', system-ui, sans-serif",
  caps:    "'DM Mono', monospace",
  display: "'Outfit', system-ui, sans-serif",
};
const DECK_ROOM_SHARED = {
  deckRoom:true, fonts:DECK_ROOM_FONTS,
  velvet:"#2a1838", velvetHi:"#3b2152",
  parchment:"#efe4cc", parchmentLo:"#dccdaa", parchmentInk:"#33243f",
  brassHi:"#f1dca0", brass:"#c9a35b", brassLo:"#8a6630",
  gem:"#9b6fd8", rose:"#a83d86", cream:"#f4ebdd",
  shadowMetal:"0 3px 4px rgba(0,0,0,.45)",
};

export const THEMES = [
  { key:"candlelight", label:"Candlelight", ...DECK_ROOM_SHARED,
    accent:"#c6a15b", accentInk:"#d9b979", primary:"#8c5cc7",
    bg:"#17131f", panel:"#2b1838", card:"#211a2c", panelBorder:"#4f4032", line:"rgba(198,161,91,.32)",
    text:"#f4ebdd", textMuted:"#b8adc4", timerRing:"#c6a15b", breakColor:"#86c7c4", error:"#e79ac4",
    auroraColors:["#8c5cc7","#c6a15b","#0f5960"], shadowSoft:"none", isDark:true },
  { key:"daylight", label:"Daylight", ...DECK_ROOM_SHARED,
    accent:"#9a743c", accentInk:"#7a5a2b", primary:"#76529a",
    bg:"#f5efe3", panel:"#e7dcef", card:"#fbf7ef", panelBorder:"#d1bea0", line:"rgba(154,116,60,.4)",
    text:"#33243f", textMuted:"#5e4f69", timerRing:"#9a743c", breakColor:"#1d6366", error:"#9c2f6e",
    auroraColors:["#76529a","#9a743c","#24777a"], shadowSoft:"none", isDark:false },
  { key:"liminal",        label:"Liminal",        accent:"#c8923a", bg:"#0c0816", panel:"#1c1338", panelBorder:"#30204e", text:"#ecdff7", textMuted:"#9580b8", timerRing:"#c8923a", auroraColors:["#c8923a","#9b7dbd","#4ecdc0"], shadowSoft:"0 2px 8px rgba(0,0,0,0.15)", isDark:true,  fonts:CLASSIC_FONTS },
  { key:"liminal-botany", label:"Liminal Botany", accent:"#D9A441", bg:"#2A0F24", panel:"#4A2E47", panelBorder:"#5A3A57", text:"#F5F2F0", textMuted:"#8A837C", timerRing:"#D9A441", auroraColors:["#D9A441","#A8FFD9","#F2DCE2"], shadowSoft:"0 2px 8px rgba(0,0,0,0.15)", isDark:true,  fonts:CLASSIC_FONTS },
  { key:"dusk",      label:"Dusk",      accent:"#e89a2a", bg:"#0e0a06", panel:"#201610", panelBorder:"#3c2a18", text:"#f2e6d2", textMuted:"#8c7262", timerRing:"#e89a2a", auroraColors:["#e89a2a","#c46830","#d4a840"], shadowSoft:"0 2px 8px rgba(0,0,0,0.15)", isDark:true,  fonts:CLASSIC_FONTS },
  { key:"forest",    label:"Forest",    accent:"#4ecdc0", bg:"#060c0a", panel:"#0e1a14", panelBorder:"#1c3226", text:"#d6f0e8", textMuted:"#68a090", timerRing:"#4ecdc0", auroraColors:["#4ecdc0","#48a068","#8de8d0"], shadowSoft:"0 2px 8px rgba(0,0,0,0.15)", isDark:true,  fonts:CLASSIC_FONTS },
  { key:"dawn",      label:"Dawn",      accent:"#b85c72", bg:"#faf4f0", panel:"#f2e8e2", panelBorder:"#e0cec4", text:"#281a14", textMuted:"#8a6858", timerRing:"#b85c72", auroraColors:["#b85c72","#c8923a","#9b7dbd"], shadowSoft:"0 2px 8px rgba(0,0,0,0.06)", isDark:false, fonts:CLASSIC_FONTS },
  { key:"amethyst",  label:"Amethyst",  accent:"#6e3eaa", bg:"#f4eefa", panel:"#ece0f8", panelBorder:"#d0bce8", text:"#1c0e2e", textMuted:"#7a6494", timerRing:"#6e3eaa", auroraColors:["#6e3eaa","#b85c72","#c8923a"], shadowSoft:"0 2px 8px rgba(0,0,0,0.06)", isDark:false, fonts:CLASSIC_FONTS },
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
