// ============================================================
// PI READINESS CHECKLIST — Sage & Steph Focus Dashboard
// Drop this file into src/PIReadiness.jsx
// Then import and add <PIReadiness theme={theme} /> in App.jsx
// ============================================================

import { useState, useEffect } from "react";

const PI_CYCLES = ["2026.2", "2026.3", "2026.4", "2027.1"];

const BUCKETS = [
  {
    id: "artifacts",
    label: "Artifacts in Jira",
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
    label: "Risk & dependencies",
    color: "#D85A30",
    items: [
      {
        id: "risks-mapped",
        label: "Risks mapped for each objective",
        sub: "Or flagged as a planning discussion item — either is fine, just decided",
      },
      {
        id: "deps-mapped",
        label: "Dependencies mapped for each objective",
        sub: "Cross-team, cross-system, or external — identified and noted",
      },
      {
        id: "deps-communicated",
        label: "Dependency owners notified",
        sub: "Relevant teams or individuals are aware they're in the picture",
      },
    ],
  },
  {
    id: "logistics",
    label: "Planning logistics",
    color: "#1D9E75",
    items: [
      {
        id: "sprints-loaded",
        label: "Sprints loaded with realistic capacity",
        sub: "Accounting for PTO, holidays, and part-time contributors",
      },
      {
        id: "roadmap-written",
        label: "Roadmap written and shared",
        sub: "Stakeholders can see what's coming and why",
      },
      {
        id: "constraints-noted",
        label: "Constraints already baked in",
        sub: "Known blockers, tech debt, or dependencies reflected in loaded sprints",
      },
      {
        id: "schedule-exists",
        label: "Planning schedule exists",
        sub: "Agenda with time blocks so everything gets covered",
      },
    ],
  },
  {
    id: "people",
    label: "People & capacity",
    color: "#7F77DD",
    items: [
      {
        id: "capacity-confirmed",
        label: "Capacity confirmed across all three regions",
        sub: "US, India, Canada — actual headcount for the PI, not assumed",
      },
      {
        id: "rollover-accounted",
        label: "Rollover from previous PI accounted for",
        sub: "Unfinished work has a home or is explicitly parked",
      },
      {
        id: "leads-context",
        label: "Leads have enough context to participate",
        sub: "Not hearing objectives for the first time in the planning room",
      },
      {
        id: "stakeholders-aligned",
        label: "Stakeholder expectations validated",
        sub: "Nothing assumed 'definitely in' without capacity backing it",
      },
    ],
  },
  {
    id: "culture",
    label: "Culture & engagement",
    color: "#D4537E",
    items: [
      {
        id: "fun-parked",
        label: "Something fun is in the agenda",
        sub: "A moment of levity, a team activity, anything that makes it human",
      },
      {
        id: "consultation-flagged",
        label: "Cross-group consultations identified",
        sub: "Anything requiring input from outside the team — before, during, or after",
      },
    ],
  },
  {
    id: "forward",
    label: "Forward-looking",
    color: "#BA7517",
    items: [
      {
        id: "ai-options",
        label: "AI options considered per objective",
        sub: "Where could AI tooling accelerate, automate, or enhance this work?",
      },
      {
        id: "next-pi-seeds",
        label: "Early seeds for next PI captured",
        sub: "Anything already known for the following PI is in the parking lot",
      },
    ],
  },
];

const TOTAL = BUCKETS.reduce((a, b) => a + b.items.length, 0);
const STORAGE_PREFIX = "sage_pi_readiness_";

function storageKey(pi) {
  return STORAGE_PREFIX + pi.replace(".", "_");
}

function loadData(pi) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(pi)) || "{}");
  } catch {
    return {};
  }
}

function saveData(pi, data) {
  localStorage.setItem(storageKey(pi), JSON.stringify(data));
}

export default function PIReadiness({ theme }) {
  const [currentPi, setCurrentPi] = useState("2026.2");
  const [data, setData] = useState(() => loadData("2026.2"));
  const [openBuckets, setOpenBuckets] = useState(
    Object.fromEntries(BUCKETS.map((b) => [b.id, true]))
  );

  // Reload data when PI changes
  useEffect(() => {
    setData(loadData(currentPi));
  }, [currentPi]);

  // Persist on every data change
  useEffect(() => {
    saveData(currentPi, data);
  }, [data, currentPi]);

  const isDark = theme?.key !== "light";

  // ── Derived metrics ─────────────────────────────────────────
  const allStatuses = BUCKETS.flatMap((b) =>
    b.items.map((item) => data[item.id]?.status || "none")
  );
  const yesCount = allStatuses.filter((s) => s === "yes").length;
  const partialCount = allStatuses.filter((s) => s === "partial").length;
  const pct = Math.round(((yesCount + partialCount * 0.5) / TOTAL) * 100);

  function bucketProgress(bucket) {
    const yes = bucket.items.filter(
      (i) => data[i.id]?.status === "yes"
    ).length;
    const partial = bucket.items.filter(
      (i) => data[i.id]?.status === "partial"
    ).length;
    return {
      yes,
      partial,
      pct: Math.round(((yes + partial * 0.5) / bucket.items.length) * 100),
    };
  }

  function setStatus(itemId, status) {
    setData((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], status },
    }));
  }

  function setNote(itemId, note) {
    setData((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], note },
    }));
  }

  function toggleBucket(id) {
    setOpenBuckets((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function resetPi() {
    if (window.confirm(`Reset all checklist items for PI ${currentPi}?`)) {
      setData({});
    }
  }

  // ── Shared style helpers ─────────────────────────────────────
  const s = {
    section: { marginTop: "2rem" },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "1rem",
      flexWrap: "wrap",
      gap: "0.5rem",
    },
    title: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "1.1rem",
      fontWeight: 600,
      color: theme?.accent || "#9B7ED8",
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      margin: 0,
    },
    piSelect: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "0.78rem",
      padding: "0.3rem 0.6rem",
      borderRadius: "8px",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
      color: theme?.text || "#e8e0f0",
      cursor: "pointer",
      outline: "none",
    },
    resetBtn: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "0.72rem",
      padding: "0.25rem 0.6rem",
      borderRadius: "8px",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
      background: "transparent",
      color: theme?.muted || "#888",
      cursor: "pointer",
    },
    // Metric cards row
    metricRow: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0,1fr))",
      gap: "0.5rem",
      marginBottom: "1rem",
    },
    metricCard: {
      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
      borderRadius: "10px",
      padding: "0.65rem 0.75rem",
    },
    metricVal: (color) => ({
      fontFamily: "'Outfit', sans-serif",
      fontSize: "1.4rem",
      fontWeight: 600,
      color,
      lineHeight: 1,
    }),
    metricLbl: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "0.68rem",
      color: theme?.muted || "#888",
      marginTop: "0.2rem",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    overallPct: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "0.78rem",
      color: theme?.muted || "#888",
      marginBottom: "0.5rem",
    },
    // Progress bar
    progressTrack: {
      height: "4px",
      background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
      borderRadius: "999px",
      overflow: "hidden",
      marginBottom: "1rem",
    },
    progressFill: {
      height: "100%",
      borderRadius: "999px",
      background: theme?.accent || "#9B7ED8",
      width: `${pct}%`,
      transition: "width 0.3s ease",
    },
    // Bucket card
    bucket: {
      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
      borderRadius: "12px",
      marginBottom: "0.6rem",
      overflow: "hidden",
    },
    bucketHeader: {
      display: "flex",
      alignItems: "center",
      gap: "0.6rem",
      padding: "0.7rem 1rem",
      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
      cursor: "pointer",
      userSelect: "none",
    },
    bucketDot: (color) => ({
      width: "9px",
      height: "9px",
      borderRadius: "50%",
      background: color,
      flexShrink: 0,
    }),
    bucketTitle: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "0.9rem",
      fontWeight: 500,
      color: theme?.text || "#e8e0f0",
      flex: 1,
    },
    miniProgressWrap: {
      width: "70px",
      height: "3px",
      background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
      borderRadius: "999px",
      overflow: "hidden",
    },
    bucketCount: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "0.7rem",
      color: theme?.muted || "#888",
    },
    chevron: (open) => ({
      fontSize: "0.65rem",
      color: theme?.muted || "#888",
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.2s ease",
    }),
    // Check row
    itemsWrap: {
      padding: "0.25rem 1rem 0.75rem",
      borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
    },
    checkRow: {
      display: "flex",
      gap: "0.75rem",
      padding: "0.6rem 0",
      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
      alignItems: "flex-start",
    },
    checkRowLast: {
      borderBottom: "none",
    },
    checkLabel: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "0.85rem",
      color: theme?.text || "#e8e0f0",
      lineHeight: 1.4,
    },
    checkSub: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "0.72rem",
      color: theme?.muted || "#888",
      marginTop: "0.15rem",
      lineHeight: 1.4,
    },
    noteInput: {
      marginTop: "0.35rem",
      width: "100%",
      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
      borderRadius: "6px",
      padding: "0.3rem 0.5rem",
      color: theme?.text || "#e8e0f0",
      fontFamily: "'Outfit', sans-serif",
      fontSize: "0.75rem",
      resize: "none",
      outline: "none",
    },
    // Status buttons
    statusBtnBase: {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "0.68rem",
      padding: "0.2rem 0.5rem",
      borderRadius: "999px",
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "all 0.12s ease",
      flexShrink: 0,
    },
  };

  function statusBtnStyle(btnStatus, currentStatus) {
    const active = btnStatus === currentStatus;
    const colors = {
      yes: {
        active: { background: "rgba(29,158,117,0.2)", color: "#1D9E75", border: "1px solid rgba(29,158,117,0.4)" },
        idle: { background: "transparent", color: theme?.muted || "#888", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}` },
      },
      partial: {
        active: { background: "rgba(186,117,23,0.2)", color: "#BA7517", border: "1px solid rgba(186,117,23,0.4)" },
        idle: { background: "transparent", color: theme?.muted || "#888", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}` },
      },
      no: {
        active: { background: "rgba(216,90,48,0.15)", color: "#D85A30", border: "1px solid rgba(216,90,48,0.35)" },
        idle: { background: "transparent", color: theme?.muted || "#888", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}` },
      },
    };
    return { ...s.statusBtnBase, ...(active ? colors[btnStatus].active : colors[btnStatus].idle) };
  }

  return (
    <div style={s.section}>
      {/* ── Header ── */}
      <div style={s.header}>
        <h2 style={s.title}>✈️ PI Readiness Check</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            style={s.piSelect}
            value={currentPi}
            onChange={(e) => setCurrentPi(e.target.value)}
          >
            {PI_CYCLES.map((pi) => (
              <option key={pi} value={pi}>PI {pi}</option>
            ))}
          </select>
          <button style={s.resetBtn} onClick={resetPi}>Reset</button>
        </div>
      </div>

      {/* ── Overall progress bar ── */}
      <div style={s.overallPct}>{pct}% ready for PI {currentPi}</div>
      <div style={s.progressTrack}>
        <div style={s.progressFill} />
      </div>

      {/* ── Metric cards ── */}
      <div style={s.metricRow}>
        <div style={s.metricCard}>
          <div style={s.metricVal("#1D9E75")}>{yesCount}</div>
          <div style={s.metricLbl}>Done</div>
        </div>
        <div style={s.metricCard}>
          <div style={s.metricVal("#BA7517")}>{partialCount}</div>
          <div style={s.metricLbl}>In progress</div>
        </div>
        <div style={s.metricCard}>
          <div style={s.metricVal(theme?.muted || "#888")}>{TOTAL - yesCount - partialCount}</div>
          <div style={s.metricLbl}>Not started</div>
        </div>
      </div>

      {/* ── Buckets ── */}
      {BUCKETS.map((bucket) => {
        const { yes, pct: bPct } = bucketProgress(bucket);
        const isOpen = openBuckets[bucket.id];

        return (
          <div key={bucket.id} style={s.bucket}>
            {/* Bucket header */}
            <div style={s.bucketHeader} onClick={() => toggleBucket(bucket.id)}>
              <div style={s.bucketDot(bucket.color)} />
              <div style={s.bucketTitle}>{bucket.label}</div>
              <span style={s.bucketCount}>{yes}/{bucket.items.length}</span>
              <div style={s.miniProgressWrap}>
                <div style={{
                  height: "100%",
                  width: `${bPct}%`,
                  background: bucket.color,
                  borderRadius: "999px",
                  transition: "width 0.3s ease",
                }} />
              </div>
              <span style={s.chevron(isOpen)}>▼</span>
            </div>

            {/* Bucket items */}
            {isOpen && (
              <div style={s.itemsWrap}>
                {bucket.items.map((item, idx) => {
                  const status = data[item.id]?.status || "none";
                  const note = data[item.id]?.note || "";
                  const isLast = idx === bucket.items.length - 1;

                  return (
                    <div
                      key={item.id}
                      style={{ ...s.checkRow, ...(isLast ? s.checkRowLast : {}) }}
                    >
                      {/* Status buttons */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", paddingTop: "0.1rem", flexShrink: 0 }}>
                        {["yes", "partial", "no"].map((btnStatus) => (
                          <button
                            key={btnStatus}
                            style={statusBtnStyle(btnStatus, status)}
                            onClick={() =>
                              setStatus(item.id, status === btnStatus ? "none" : btnStatus)
                            }
                          >
                            {btnStatus === "yes" ? "Done" : btnStatus === "partial" ? "Partial" : "No"}
                          </button>
                        ))}
                      </div>

                      {/* Label + note */}
                      <div style={{ flex: 1 }}>
                        <div style={s.checkLabel}>{item.label}</div>
                        <div style={s.checkSub}>{item.sub}</div>
                        <textarea
                          style={s.noteInput}
                          rows={1}
                          placeholder="Add a note..."
                          value={note}
                          onChange={(e) => setNote(item.id, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
