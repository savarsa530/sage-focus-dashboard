# Sage & Steph Focus Dashboard — Backlog

Enhancements and ideas captured as we build. Items move from **Backlog → In Progress → Done** as work happens.

---

## Done

- [x] **This block: each focus block decided ahead (v6.4.0)** *(2026-11-12)*
  A "This block" panel right under the timer names what today's focus block is for, so the block opens with a first step instead of a decision. It shows one step at a time ("Step 2 of 4") with **Next step** and **Back**; the whole plan stays out of view so it can't turn into more planning. On the last step it shows where the work is done enough for today, and **Done for today** feeds the seed on the sill. **Focus the timer on this** puts the work in the task list and starts the timer on it. A breather day says so. Under it, one quiet line names the next block. **Minimize** folds it to one line (the work and the step you're on). Progress is kept per block in this browser. The plan lives in `src/data/focusPlan.js` and changes by pull request.

- [x] **India team's shift ends at 11:00 PM IST (v6.3.1)** *(2026-11-12)*
  The shaded shift on the Eastern / India clock now runs 3:00 PM to 11:00 PM IST (12:30 PM ET in winter, 1:30 PM ET in summer), not midnight.

- [x] **Their side of the clock: Eastern and India time (v6.3.0)** *(2026-11-12)*
  The header now shows India's time beside the clock ("India 9:50 PM"), and a "Their side of the clock" panel sits above the day arc: Eastern and India times side by side with their dates (India's marked "next day" when it is), how far ahead India is, and whether the India team is on shift. A slider moves through today's Eastern day in 15-minute steps and both times move together; "Now" snaps back. Bands above the slider shade the India team's shift (3:00 PM to about 11:00 PM IST) and your own workday from **Hours**. The line under it ("8:00 AM ET / 6:30 PM IST", with India's weekday added when it's a different day) copies with one press. Uses the real time zones, so daylight saving is handled (10½ hours ahead in winter, 9½ in summer). **Minimize** folds the panel to one line with the live times and a **Show** button (the header's India time does the same); open or folded is remembered.

- [x] **The day arc, the evening face, and the seed on the sill (v6.2.0)** *(2026-10-27)*
  **Day arc:** a panel above the timer traces the workday from start to hard stop, with a rose mark at the log-off aim (defaults: 8:00 start, log off by 3:30, hard stop 4:00, Mon–Fri; edit under **Hours**). It counts down to the aim, then says "You can go" with a **Close the day** plaque.
  **What this work pays for:** her own list (in Hours), one line shown under the arc through the day, all of it on the evening face.
  **Evening face:** after Close the day, or automatically past the hard stop (never mid-session), the work folds away: "The workday is closed," focused time, things finished, evenings reclaimed this month (days closed on or before the hard stop; only counts up), what the work paid for, and the plant. "Open the work again for a bit" brings it back for that day.
  **The seed on the sill:** a drawn plant fed by finished tasks and daily ops (each counts once, so re-checking can't farm it). Seed → sprout → leaves → bud → bloom at 12; press the bloom into the herbarium and choose the next seed (moonflower, foxglove, poppy, lavender). Every finished thing visibly grows it (1 sprouts it, 2–9 each add a leaf and height, 10 sets the bud, 11 swells it, 12 blooms), lands a pip in a row of twelve, and plays a soft note — a fuller one at each named stage. It sways slowly; it never wilts.

- [x] **End-of-session pull, Spectral labels, sheet iconography (v6.1.0)** *(2026-10-27)*
  **Session pull:** when a focus session ends, a face-down card is offered (the break keeps running behind it). Turn it with a click or Enter, or "Not now" at no cost. 16 cards — invitations for the break, reflections, and a few true small wonders — with painted art; the Luna Moth is a rare pull. Cards already drawn today sit out until the whole deck has been seen. Every turned card is kept: **Today's spread** in the Ledger, plus a running count of all cards drawn. Soft rising two-note tone on the turn (a shimmer on the rare one). `?pull` or `#pull` in the URL offers a practice card.
  **Type:** Cinzel now only marks the plaques you commit with (Begin Focus, Add, Park, Pause), the Focus/Break inscription and the wordmark subtitle. Every small label, chip, tab, sort control and quiet button moved to Spectral in sentence case at readable sizes (0.8–0.95rem). IM Fell English unchanged. Buttons and inputs now inherit the page font (fixed the Arial fallbacks).
  **Iconography (from the icon sheet):** line glyphs for daily ops (mail, calendar, Jira diamond, sprint branch, standup people), a growth stage on every task (seed → sprout once time is tended → bud while in focus → bloom when done), teacup for breaks, hourglass for the Ledger tab, star on Begin Focus. Painted pieces from the sheet are card art and Ledger emblems (hourglass header, sleeping cat when quiet); baked-in slogans were cropped out.
  **Pop-ups:** the "What's next?" (task done mid-focus) and skip-break pop-ups were still in the pre-6.0 rounded-glass look. Both now use the Deck Room panel: square double rule, corner flourishes, IM Fell heading, growth-stage glyphs instead of priority dots, a brass Focus plaque, and theme colors in place of hard-coded lavender.

- [x] **Deck Room theme + calmer start (v6.0.0)** *(2026-10-27)*
  New default themes **Candlelight** and **Daylight** from The Deck Room design system: Cinzel / IM Fell English / Spectral type (Barlow removed), square double-ruled panels, brass-framed plaque buttons (parchment "Begin Focus" invitation), rose underline on the active chip, focus ring in amethyst. The six classic themes (Liminal, Liminal Botany, Dusk, Forest, Dawn, Amethyst) were retired; the swatch row is now the Deck Room crescent toggle between Candlelight and Daylight. Removed the Morning Gate and the intention pop-up — today's intention is now an optional inline field right beneath the timer. Removed Sprint Pulse, PI Readiness, the Pace Indicator and the Schedule pop-out.
  Deck Room ornament: moon-face emblem by the wordmark, the real moon phase in the header, corner flourishes on the timer, star dividers, line icons in place of emoji, grain on panels, crystal-bundle and lantern emblems for empty and ledger states. **Daily Ops are starter tasks** — "focus" on an op pops it into the task list, focused, and the two checkboxes stay in step. New **Ledger** tab: focus time by task and by day (today / 7 / 30 days / all time), sessions, and the Daily Ops share; time logged before the ledger is kept as undated "earlier" time.

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
