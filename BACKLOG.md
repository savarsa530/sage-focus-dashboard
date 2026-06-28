# Sage & Steph Focus Dashboard — Backlog

Enhancements and ideas captured as we build. Items move from **Backlog → In Progress → Done** as work happens.

---

## Done

- [x] **Timer reliability overhaul — persistence, accuracy & auto-cycle (v5.6.0)** *(2026-06-28)*
  Rebuilt the timer on a wall-clock `endsAt` model so it survives refresh **and** background-tab throttling; focus seconds now credit by real elapsed time. Recovers conservatively on reload — resumes if time remains, otherwise credits exactly one session and lands paused. Added an **auto-cycle** toggle (default on) that flows focus → break → focus automatically with a completion chime, keeping the reflective skip-break reachable as a non-blocking link; toggling off restores the original blocking flow. Restored the `playDing()` completion sound + completion flash.

- [x] **LocalStorage error handling** *(2026-06-28)*
  Added `safeGet`/`safeGetJSON`/`safeSet` wrappers in `utils.js` and migrated all storage access across App + components, so a full, blocked, or corrupt store degrades gracefully instead of crashing.

- [x] **Error boundary** *(2026-06-28)*
  New `ErrorBoundary` component wraps the app root **and** each risky widget (ambience, sprint pulse, all three tabs); a crash in one panel shows a retryable fallback instead of blanking the whole screen.

- [x] **Quick-win cleanups (v5.6.0)** *(2026-06-28)*
  Cleared all 6 ESLint errors (empty catches + `PaceIndicator` render purity) plus a `border`/`borderTop` React warning in tasks, bumped the displayed version to 5.6.0, fixed the dead default theme key (`obsidian` → `liminal`), made the Schedule sidebar full-width on mobile, and resolved all `npm audit` vulnerabilities.

- [x] **Refactor: Split monolithic App.jsx into components** *(2026-05-01)*
  Split 2,187-line App.jsx into 14 focused files across `src/components/`, `src/constants.js`, `src/utils.js`, and `src/audio.js`. QA passed fully.

---

## Backlog

### User Experience

- [ ] **Data export**
  Allow exporting tasks, session logs, and PI data as JSON or CSV so data isn't permanently trapped in the browser.

- [ ] **PWA / installable app**
  Add a web app manifest and service worker so the dashboard can be installed on desktop or mobile like a native app.

- [ ] **Keyboard shortcut for soundscape**
  Quick key to toggle the last-used soundscape on/off without reaching for the mouse.

- [ ] **Mobile layout polish**
  Review and tighten spacing, tap targets, and overflow behavior on small screens. *(Schedule sidebar full-width on mobile shipped in v5.6.0; broader spacing/tap-target pass still open.)*

### PI Planning

- [ ] **PI cycle configuration**
  Currently PI cycles (2026.2, 2026.3, etc.) are hardcoded. Allow adding/removing cycles from the UI so the app doesn't need a code change each PI.

### Nice-to-Have

- [ ] **Session journal / end-of-day summary**
  A lightweight end-of-session or end-of-day reflection prompt, separate from the daily intention.

- [ ] **Streak milestones**
  Small celebration moments at streak milestones (7 days, 30 days, etc.) — consistent with the humanistic design language.

---

## How to use this file

Add new ideas under **Backlog** with a short description of the *why*, not just the *what*.
Move items to **Done** with the date when shipped.
Keep it honest — a parked idea is better than a forgotten one.
