# Sage & Steph Focus Dashboard — Backlog

Enhancements and ideas captured as we build. Items move from **Backlog → In Progress → Done** as work happens.

---

## Done

- [x] **Refactor: Split monolithic App.jsx into components** *(2026-05-01)*
  Split 2,187-line App.jsx into 14 focused files across `src/components/`, `src/constants.js`, `src/utils.js`, and `src/audio.js`. QA passed fully.

---

## Backlog

### Quality / Reliability

- [ ] **Timer state persistence on refresh**
  Currently the timer resets to default on page refresh. Enhancement would save `phase`, `timeLeft`, and a timestamp so a mid-session refresh recovers correctly, accounting for elapsed time while the page was closed.

- [ ] **LocalStorage error handling**
  If localStorage is full or corrupt, things silently break. Add a safe wrapper so the app degrades gracefully instead of crashing.

- [ ] **Error boundary**
  Wrap the app in a React error boundary so a crash in one widget (e.g. audio, PI tab) doesn't blank the whole screen.

### User Experience

- [ ] **Data export**
  Allow exporting tasks, session logs, and PI data as JSON or CSV so data isn't permanently trapped in the browser.

- [ ] **PWA / installable app**
  Add a web app manifest and service worker so the dashboard can be installed on desktop or mobile like a native app.

- [ ] **Keyboard shortcut for soundscape**
  Quick key to toggle the last-used soundscape on/off without reaching for the mouse.

- [ ] **Mobile layout polish**
  Review and tighten spacing, tap targets, and overflow behavior on small screens.

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
