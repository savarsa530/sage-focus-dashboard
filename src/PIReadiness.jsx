// ═══════════════════════════════════════════════════════════════════
// PI READINESS CHECKLIST — Sage & Steph Focus Dashboard
// src/PIReadiness.jsx
// ═══════════════════════════════════════════════════════════════════
// Rich preflight check: 6 themed buckets, 3 states (Done/Partial/No),
// per-item notes, per-bucket progress, overall metrics, per-PI storage

import { useState, useEffect } from "react";

const PI_CYCLES = ["2026.2", "2026.3", "2026.4", "2027.1"];

// ── The 6 themed buckets with all items ──────────────────────────────
const BUCKETS = [
  {
    id: "artifacts",
    label: "📋 Artifacts in Jira",
    color: "#378ADD",
    items: [
      {
        id: "obj-exist",
        label: "All objectives exist in Jira",
        sub: "Not just ideas — actual epics or objective records created",
      },
      {
        id: "stories-exist",
        label: "Stories are in Jira",
        sub: "Even placeholder stories attached to each objective",
      },
      {
        id: "stories-built",
        label: "Stories are fully built out",
        sub: "Acceptance criteria, descriptions, estimates — not just titles",
      },
    ],
  },
  {
    id: "risk-dep",
    label: "⚠️ Risk & Dependencies",
    color: "#D85A30",
    items: [
      {
        id: "risks-mapped",
        label: "Risks mapped for each objective",
        sub: "Known unknowns documented — not just 'some risk exists'",
      },
      {
        id: "deps-identified",
        label: "Dependencies identified",
        sub: "Other teams, systems, or approvals that must move first",
      },
      {
        id: "deps-communicated",
        label: "Dependencies communicated",
        sub: "Dependent parties are aware and have acknowledged",
      },
      {
        id: "mitigations",
        label: "Mitigations defined for top risks",
        sub: "At least one 'if this, then that' for each high-severity risk",
      },
    ],
  },
  {
    id: "logistics",
    label: "🗓 Planning Logistics",
    color: "#7B5EA7",
    items: [
      {
        id: "dates-confirmed",
        label: "PI planning dates confirmed",
        sub: "Everyone knows when and where — no 'I think it's the 14th'",
      },
      {
        id: "agenda-set",
        label: "Agenda distributed",
        sub: "Teams know what to expect and what to prepare",
      },
      {
        id: "facilitators-set",
        label: "Facilitators assigned",
        sub: "Who is running each session — not left to the day-of chaos",
      },
      {
        id: "rooms-tools",
        label: "Rooms / tools confirmed",
        sub: "Physical space or virtual tooling locked in (Miro, Teams, etc.)",
      },
    ],
  },
  {
    id: "capacity",
    label: "👥 People & Capacity",
    color: "#3A9E7E",
    items: [
      {
        id: "capacity-pulled",
        label: "Capacity pulled for each team",
        sub: "Actual availability — accounting for PTO, holidays, part-time",
      },
      {
        id: "velocity-reviewed",
        label: "Team velocity reviewed",
        sub: "Last 2–3 PIs of actuals, not just theoretical capacity",
      },
      {
        id: "po-sm-ready",
        label: "POs and SMs are prepared",
        sub: "Product owners and scrum masters have reviewed objectives and backlog",
      },
      {
        id: "specialists-available",
        label: "Key specialists available",
        sub: "Architects, shared engineers, SMEs — not double-booked during planning",
      },
    ],
  },
  {
    id: "culture",
    label: "🤝 Culture & Engagement",
    color: "#C07B3A",
    items: [
      {
        id: "retro-done",
        label: "Last PI retrospective completed",
        sub: "Teams had a chance to reflect — issues aren't carrying forward silently",
      },
      {
        id: "improvements-visible",
        label: "Improvement items visible",
        sub: "Actions from last retro are tracked and can be discussed in planning",
      },
      {
        id: "teams-aligned",
        label: "Teams understand PI goals",
        sub: "Not just the POs — developers and QA know what we're going for",
      },
    ],
  },
  {
    id: "forward",
    label: "🔭 Forward-Looking",
    color: "#6B8F71",
    items: [
      {
        id: "next-pi-seeded",
        label: "Next PI has initial seeds",
        sub: "At least a few items in the parking lot for the PI after this one",
      },
      {
        id: "strategic-alignment",
        label: "Objectives tie to strategic themes",
        sub: "Can each objective be connected to a company or portfolio goal?",
      },
      {
        id: "metrics-defined",
        label: "Success metrics defined",
        sub: "How will you know at end of PI whether each objective was achieved?",
      },
    ],
  },
];

const STORAGE_KEY = (pi) => `sage_pi_readiness_${pi.replace(".", "_")}`;

function loadData(pi) {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY(pi)) || "{}");
  } catch {
    return {};
  }
}

function saveData(pi, data) {
  localStorage.setItem(STORAGE_KEY(pi), JSON.stringify(data));
}

// ── STATUS helpers ─────────────────────────────────────────────────
function getStatus(data, id) { return data[id]?.status || "none"; }
function getNote(data, id)   { return data[id]?.note   || ""; }
function setStatus(data, id, status) {
  return { ...data, [id]: { ...data[id], status } };
}
function setNote(data, id, note) {
  return { ...data, [id]: { ...data[id], note } };
}

function statusScore(s) { return s === "yes" ? 1 : s === "partial" ? 0.5 : 0; }

// ── METRICS ────────────────────────────────────────────────────────
function calcMetrics(data) {
  const all = BUCKETS.flatMap(b => b.items);
  const done    = all.filter(i => getStatus(data, i.id) === "yes").length;
  const partial = all.filter(i => getStatus(data, i.id) === "partial").length;
  const none    = all.filter(i => getStatus(data, i.id) === "none").length;
  const total   = all.length;
  const pct     = Math.round(((done + partial * 0.5) / total) * 100);
  return { done, partial, none, total, pct };
}

function bucketProgress(data, bucket) {
  const scores = bucket.items.map(i => statusScore(getStatus(data, i.id)));
  const pct = Math.round((scores.reduce((a, b) => a + b, 0) / bucket.items.length) * 100);
  return pct;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function PIReadiness({ theme }) {
  const [currentPi, setCurrentPi] = useState("2026.2");
  const [data,      setData]      = useState(() => loadData("2026.2"));
  const [open,      setOpen]      = useState({ artifacts: true }); // first bucket open by default

  // Reload when PI changes
  useEffect(() => {
    setData(loadData(currentPi));
  }, [currentPi]);

  const update = (newData) => {
    setData(newData);
    saveData(currentPi, newData);
  };

  const handleStatus = (id, s) => {
    const current = getStatus(data, id);
    const next = current === s ? "none" : s; // toggle off if already selected
    update(setStatus(data, id, next));
  };

  const handleNote = (id, note) => {
    update(setNote(data, id, note));
  };

  const handleReset = () => {
    if (window.confirm(`Reset all checklist items for PI ${currentPi}?`)) {
      update({});
    }
  };

  const toggleBucket = (id) => setOpen(prev => ({ ...prev, [id]: !prev[id] }));

  const metrics = calcMetrics(data);

  // ── STYLES ──────────────────────────────────────────────────────
  const panelStyle = {
    background: theme.panel,
    border: `1px solid ${theme.panelBorder}`,
    borderRadius: 18,
    padding: "1.25rem 1.5rem",
    marginBottom: "1.1rem",
  };

  const statusBtnStyle = (itemId, s) => {
    const active = getStatus(data, itemId) === s;
    const colors = {
      yes:     { bg: "#22c55e22", border: "#22c55e", text: "#16a34a" },
      partial: { bg: "#f59e0b22", border: "#f59e0b", text: "#b45309" },
      no:      { bg: "#f8717122", border: "#f87171", text: "#dc2626" },
    };
    const c = colors[s];
    return {
      background:   active ? c.bg : "transparent",
      border:       `1px solid ${active ? c.border : theme.panelBorder}`,
      color:        active ? c.text : theme.textMuted,
      borderRadius: 20,
      padding:      "0.2rem 0.65rem",
      fontSize:     "0.68rem",
      fontWeight:   700,
      fontFamily:   "'Barlow', sans-serif",
      cursor:       "pointer",
      letterSpacing:"0.04em",
      transition:   "all 0.15s",
      whiteSpace:   "nowrap",
    };
  };

  return (
    <div style={panelStyle}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: theme.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            PI Readiness Checklist
          </div>
          <div style={{ fontSize: "0.75rem", color: theme.textMuted, marginTop: 2 }}>
            Preflight check — are we actually ready to plan?
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            value={currentPi}
            onChange={e => setCurrentPi(e.target.value)}
            style={{ background: theme.panel, color: theme.text, border: `1px solid ${theme.panelBorder}`, borderRadius: 8, padding: "5px 10px", fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", outline: "none" }}
          >
            {PI_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={handleReset}
            style={{ background: "transparent", border: `1px solid ${theme.panelBorder}`, color: theme.textMuted, borderRadius: 8, padding: "5px 10px", fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", cursor: "pointer" }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Overall metrics bar ── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 120, background: theme.panelBorder, borderRadius: 20, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${metrics.pct}%`, background: theme.accent, height: "100%", borderRadius: 20, transition: "width 0.3s ease" }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: metrics.pct === 100 ? theme.accent : theme.text, minWidth: 40 }}>
            {metrics.pct}%
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", fontSize: "0.72rem" }}>
          <span style={{ color: "#16a34a", fontWeight: 700 }}>✓ {metrics.done} done</span>
          <span style={{ color: "#b45309", fontWeight: 700 }}>◑ {metrics.partial} partial</span>
          <span style={{ color: theme.textMuted }}>○ {metrics.none} not started</span>
        </div>
        {metrics.pct === 100 && (
          <div style={{ marginTop: "0.5rem", color: theme.accent, fontWeight: 800, fontSize: "0.88rem" }}>
            ✅ PI {currentPi} is go for planning!
          </div>
        )}
      </div>

      {/* ── Buckets ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {BUCKETS.map(bucket => {
          const isOpen = !!open[bucket.id];
          const bPct   = bucketProgress(data, bucket);

          return (
            <div
              key={bucket.id}
              style={{ border: `1px solid ${theme.panelBorder}`, borderRadius: 12, overflow: "hidden" }}
            >
              {/* Bucket header */}
              <div
                onClick={() => toggleBucket(bucket.id)}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.9rem", cursor: "pointer", background: `${bucket.color}10`, userSelect: "none" }}
              >
                <span style={{ flex: 1, fontWeight: 700, fontSize: "0.88rem", color: theme.text }}>
                  {bucket.label}
                </span>

                {/* Mini progress bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <div style={{ width: 60, height: 5, background: theme.panelBorder, borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ width: `${bPct}%`, height: "100%", background: bucket.color, borderRadius: 10, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: "0.68rem", color: theme.textMuted, minWidth: 28, textAlign: "right" }}>{bPct}%</span>
                </div>

                <span style={{ color: theme.textMuted, fontSize: "0.75rem", transition: "transform 0.2s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
              </div>

              {/* Bucket items */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${theme.panelBorder}` }}>
                  {bucket.items.map((item, idx) => {
                    const status = getStatus(data, item.id);
                    const note   = getNote(data, item.id);
                    const isLast = idx === bucket.items.length - 1;

                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: "0.65rem 0.9rem",
                          borderBottom: isLast ? "none" : `1px solid ${theme.panelBorder}`,
                          background: status === "yes" ? "#22c55e08" : status === "partial" ? "#f59e0b08" : "transparent",
                        }}
                      >
                        {/* Item label + status buttons */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: theme.text, marginBottom: 2 }}>
                              {item.label}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: theme.textMuted, lineHeight: 1.4 }}>
                              {item.sub}
                            </div>
                          </div>

                          {/* Done / Partial / No buttons */}
                          <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0, paddingTop: 1 }}>
                            {["yes", "partial", "no"].map(s => (
                              <button
                                key={s}
                                onClick={() => handleStatus(item.id, s)}
                                style={statusBtnStyle(item.id, s)}
                              >
                                {s === "yes" ? "Done" : s === "partial" ? "Partial" : "No"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Note field — shown if item has any non-none status */}
                        {status !== "none" && (
                          <textarea
                            value={note}
                            onChange={e => handleNote(item.id, e.target.value)}
                            placeholder="Add a note…"
                            rows={1}
                            style={{
                              marginTop: "0.45rem",
                              width: "100%",
                              background: "transparent",
                              border: `1px solid ${theme.panelBorder}`,
                              borderRadius: 8,
                              color: theme.text,
                              fontFamily: "'Barlow', sans-serif",
                              fontSize: "0.78rem",
                              padding: "0.35rem 0.6rem",
                              outline: "none",
                              resize: "vertical",
                              boxSizing: "border-box",
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
