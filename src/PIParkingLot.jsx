// ============================================================
// PI PLANNING PARKING LOT — Sage & Steph Focus Dashboard
// Drop this file into src/PIParkingLot.jsx
// Then import and add <PIParkingLot theme={theme} /> in App.jsx
// wherever you want the section to appear (suggested: below task panels)
// ============================================================

import { useState, useEffect } from "react";

// ── PI cycle options — extend as new PIs arrive ──────────────
const PI_CYCLES = ["2026.2", "2026.3", "2026.4", "2027.1"];

// ── Status badges ────────────────────────────────────────────
const STATUSES = [
  { key: "seeding",   label: "🌱 Seeding",    title: "Just landed — still forming" },
  { key: "digging",   label: "⛏️ Digging",    title: "Actively being thought through" },
  { key: "ready",     label: "✅ Ready",       title: "Enough shape to become an epic" },
  { key: "parked",    label: "🅿️ Parked",     title: "On hold — not this PI" },
];

// ── Empty item template ──────────────────────────────────────
const emptyItem = () => ({
  id: crypto.randomUUID(),
  pi: "2026.2",
  title: "",
  objectives: "",
  risks: "",
  dependencies: "",
  deadline: "",
  capacity: "",
  status: "seeding",
  createdAt: new Date().toISOString(),
});

// ── localStorage helpers ─────────────────────────────────────
const STORAGE_KEY = "sage_pi_parking_lot";

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ── Inline styles that inherit the dashboard's theme system ──
// The dashboard exposes theme.bg, theme.text, theme.accent, theme.card, theme.muted
// We use those same variables so this section feels native.

export default function PIParkingLot({ theme }) {
  const [items, setItems] = useState(loadItems);
  const [activePi, setActivePi] = useState("2026.2");
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDraft, setNewDraft] = useState(emptyItem());
  const [filterStatus, setFilterStatus] = useState("all");

  // Persist on every change
  useEffect(() => {
    saveItems(items);
  }, [items]);

  // ── Derived: items for active PI, optionally filtered by status
  const piItems = items.filter(
    (i) =>
      i.pi === activePi &&
      (filterStatus === "all" || i.status === filterStatus)
  );

  // Count per PI for the tab badges
  const countForPi = (pi) => items.filter((i) => i.pi === pi).length;

  // ── CRUD ─────────────────────────────────────────────────────
  function addItem() {
    if (!newDraft.title.trim()) return;
    const toAdd = { ...newDraft, pi: activePi, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setItems((prev) => [toAdd, ...prev]);
    setNewDraft(emptyItem());
    setShowAddForm(false);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setDraft({ ...item });
    setExpandedId(item.id);
  }

  function saveEdit() {
    setItems((prev) => prev.map((i) => (i.id === editingId ? { ...draft } : i)));
    setEditingId(null);
    setDraft(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function deleteItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (expandedId === id) setExpandedId(null);
    if (editingId === id) { setEditingId(null); setDraft(null); }
  }

  function updateDraftField(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function updateNewField(field, value) {
    setNewDraft((prev) => ({ ...prev, [field]: value }));
  }

  // ── Promote item to next PI ──────────────────────────────────
  function promoteItem(id) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const idx = PI_CYCLES.indexOf(i.pi);
        const nextPi = PI_CYCLES[idx + 1] || i.pi;
        return { ...i, pi: nextPi };
      })
    );
  }

  // ── Style helpers that pull from the existing theme ──────────
  const isDark = theme?.isDark ?? false;

  const s = {
    section: {
      marginTop: "1.25rem",
    },
    card: {
      background: theme?.card || "rgba(255,255,255,0.05)",
      border: `1px solid ${theme?.border || "rgba(255,255,255,0.1)"}`,
      borderRadius: "16px",
      padding: "1.25rem",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "1rem",
      flexWrap: "wrap",
      gap: "0.5rem",
    },
    title: {
      fontFamily: "'Barlow', sans-serif",
      fontSize: "0.68rem",
      fontWeight: 700,
      color: theme?.accent || "#9B7ED8",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      margin: 0,
    },
    // PI cycle tabs
    tabs: {
      display: "flex",
      gap: "0.4rem",
      flexWrap: "wrap",
      marginBottom: "0.75rem",
    },
    tab: (pi) => ({
      padding: "0.3rem 0.75rem",
      borderRadius: "999px",
      border: `1px solid ${activePi === pi ? (theme?.accent || "#9B7ED8") : (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)")}`,
      background: activePi === pi ? (theme?.accent || "#9B7ED8") + "22" : "transparent",
      color: activePi === pi ? (theme?.accent || "#9B7ED8") : (theme?.text || "#e8e0f0"),
      fontSize: "0.8rem",
      fontWeight: activePi === pi ? 600 : 400,
      cursor: "pointer",
      fontFamily: "'Barlow', sans-serif",
      transition: "all 0.15s ease",
    }),
    // Status filter pills
    filterRow: {
      display: "flex",
      gap: "0.35rem",
      flexWrap: "wrap",
      marginBottom: "0.75rem",
    },
    filterPill: (key) => ({
      padding: "0.2rem 0.6rem",
      borderRadius: "999px",
      border: `1px solid ${filterStatus === key ? (theme?.accent || "#9B7ED8") : "transparent"}`,
      background: filterStatus === key ? (theme?.accent || "#9B7ED8") + "18" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
      color: filterStatus === key ? (theme?.accent || "#9B7ED8") : (theme?.muted || "#aaa"),
      fontSize: "0.72rem",
      cursor: "pointer",
      fontFamily: "'Barlow', sans-serif",
      transition: "all 0.15s ease",
    }),
    // Item card
    card: {
      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
      borderRadius: "12px",
      marginBottom: "0.6rem",
      overflow: "hidden",
      transition: "border-color 0.2s ease",
    },
    cardHeader: {
      display: "flex",
      alignItems: "center",
      gap: "0.6rem",
      padding: "0.75rem 1rem",
      cursor: "pointer",
      userSelect: "none",
    },
    cardTitle: {
      flex: 1,
      fontFamily: "'Barlow', sans-serif",
      fontSize: "0.95rem",
      fontWeight: 500,
      color: theme?.text || "#e8e0f0",
      margin: 0,
    },
    statusBadge: (status) => {
      const colors = {
        seeding:  isDark ? "#4caf50" : "#2e7d32",
        digging:  isDark ? "#ff9800" : "#e65100",
        ready:    isDark ? "#2196f3" : "#1565c0",
        parked:   isDark ? "#9e9e9e" : "#616161",
      };
      return {
        fontSize: "0.7rem",
        padding: "0.15rem 0.5rem",
        borderRadius: "999px",
        border: `1px solid ${colors[status]}44`,
        color: colors[status],
        background: colors[status] + "18",
        fontFamily: "'Barlow', sans-serif",
        whiteSpace: "nowrap",
      };
    },
    chevron: (expanded) => ({
      color: theme?.muted || "#888",
      fontSize: "0.7rem",
      transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.2s ease",
    }),
    // Expanded body
    expandedBody: {
      padding: "0 1rem 1rem 1rem",
      borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
    },
    fieldGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0.75rem",
      marginTop: "0.75rem",
    },
    fieldLabel: {
      fontFamily: "'Barlow', sans-serif",
      fontSize: "0.7rem",
      fontWeight: 600,
      color: theme?.accent || "#9B7ED8",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      marginBottom: "0.2rem",
    },
    fieldValue: {
      fontFamily: "'Barlow', sans-serif",
      fontSize: "0.82rem",
      color: theme?.text || "#e8e0f0",
      lineHeight: 1.5,
    },
    fieldEmpty: {
      fontFamily: "'Barlow', sans-serif",
      fontSize: "0.78rem",
      color: theme?.muted || "#888",
      fontStyle: "italic",
    },
    // Textarea / input in edit mode
    textarea: {
      width: "100%",
      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
      borderRadius: "8px",
      padding: "0.45rem 0.6rem",
      color: theme?.text || "#e8e0f0",
      fontFamily: "'Barlow', sans-serif",
      fontSize: "0.82rem",
      resize: "vertical",
      minHeight: "52px",
      outline: "none",
      boxSizing: "border-box",
    },
    input: {
      width: "100%",
      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
      borderRadius: "8px",
      padding: "0.45rem 0.6rem",
      color: theme?.text || "#e8e0f0",
      fontFamily: "'Barlow', sans-serif",
      fontSize: "0.82rem",
      outline: "none",
      boxSizing: "border-box",
    },
    select: {
      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
      borderRadius: "8px",
      padding: "0.35rem 0.6rem",
      color: theme?.text || "#e8e0f0",
      fontFamily: "'Barlow', sans-serif",
      fontSize: "0.78rem",
      outline: "none",
    },
    // Action buttons row
    actions: {
      display: "flex",
      gap: "0.5rem",
      marginTop: "0.75rem",
      flexWrap: "wrap",
    },
    btn: (variant) => {
      const variants = {
        primary: {
          background: theme?.accent || "#9B7ED8",
          color: "#fff",
          border: "none",
        },
        ghost: {
          background: "transparent",
          color: theme?.muted || "#aaa",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
        },
        danger: {
          background: "transparent",
          color: "#e57373",
          border: "1px solid #e5737344",
        },
        promote: {
          background: "transparent",
          color: isDark ? "#81c784" : "#2e7d32",
          border: `1px solid ${isDark ? "#81c78444" : "#2e7d3244"}`,
        },
      };
      return {
        ...variants[variant],
        padding: "0.3rem 0.75rem",
        borderRadius: "8px",
        fontSize: "0.75rem",
        fontFamily: "'Barlow', sans-serif",
        cursor: "pointer",
        fontWeight: 500,
        transition: "opacity 0.15s ease",
      };
    },
    // Add new item button
    addBtn: {
      display: "flex",
      alignItems: "center",
      gap: "0.4rem",
      background: "transparent",
      border: `1px dashed ${theme?.accent || "#9B7ED8"}66`,
      color: theme?.accent || "#9B7ED8",
      borderRadius: "10px",
      padding: "0.6rem 1rem",
      width: "100%",
      cursor: "pointer",
      fontFamily: "'Barlow', sans-serif",
      fontSize: "0.85rem",
      marginTop: "0.5rem",
      transition: "background 0.15s ease",
      justifyContent: "center",
    },
    // Add form card
    addCard: {
      background: isDark ? "rgba(155,126,216,0.08)" : "rgba(155,126,216,0.05)",
      border: `1px solid ${theme?.accent || "#9B7ED8"}44`,
      borderRadius: "12px",
      padding: "1rem",
      marginBottom: "0.75rem",
    },
    emptyState: {
      textAlign: "center",
      padding: "2rem 1rem",
      color: theme?.muted || "#888",
      fontFamily: "'Barlow', sans-serif",
      fontSize: "0.85rem",
      fontStyle: "italic",
    },
  };

  // ── Reusable field display ────────────────────────────────────
  const FieldView = ({ label, value }) => (
    <div>
      <div style={s.fieldLabel}>{label}</div>
      {value?.trim() ? (
        <div style={s.fieldValue}>{value}</div>
      ) : (
        <div style={s.fieldEmpty}>—</div>
      )}
    </div>
  );

  // ── Reusable field edit ───────────────────────────────────────
  const FieldEdit = ({ label, field, multiline, value, onChange }) => (
    <div>
      <div style={s.fieldLabel}>{label}</div>
      {multiline ? (
        <textarea
          style={s.textarea}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          rows={3}
        />
      ) : (
        <input
          style={s.input}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
        />
      )}
    </div>
  );

  // ── Next PI label helper ─────────────────────────────────────
  const nextPiLabel = (pi) => {
    const idx = PI_CYCLES.indexOf(pi);
    return PI_CYCLES[idx + 1] || null;
  };

  return (
    <div style={s.section}>
    <div style={s.card}>
      {/* ── Section header ── */}
      <div style={s.header}>
        <span style={s.title}>🅿️ PI Planning Parking Lot</span>
        <span style={{ fontSize: "0.75rem", color: theme?.muted || "#888", fontFamily: "'Barlow', sans-serif" }}>
          {items.length} item{items.length !== 1 ? "s" : ""} across all PIs
        </span>
      </div>

      {/* ── PI cycle tabs ── */}
      <div style={s.tabs}>
        {PI_CYCLES.map((pi) => (
          <button
            key={pi}
            style={s.tab(pi)}
            onClick={() => setActivePi(pi)}
          >
            PI {pi}
            {countForPi(pi) > 0 && (
              <span style={{ marginLeft: "0.35rem", opacity: 0.7 }}>
                ({countForPi(pi)})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Status filter pills ── */}
      <div style={s.filterRow}>
        <button style={s.filterPill("all")} onClick={() => setFilterStatus("all")}>All</button>
        {STATUSES.map((st) => (
          <button key={st.key} style={s.filterPill(st.key)} onClick={() => setFilterStatus(st.key)} title={st.title}>
            {st.label}
          </button>
        ))}
      </div>

      {/* ── Add new item form ── */}
      {showAddForm && (
        <div style={s.addCard}>
          <div style={{ marginBottom: "0.6rem" }}>
            <div style={s.fieldLabel}>Item Title *</div>
            <input
              style={s.input}
              placeholder="What's landing in your head?"
              value={newDraft.title}
              onChange={(e) => updateNewField("title", e.target.value)}
              autoFocus
            />
          </div>
          <div style={s.fieldGrid}>
            <div>
              <div style={s.fieldLabel}>Status</div>
              <select
                style={s.select}
                value={newDraft.status}
                onChange={(e) => updateNewField("status", e.target.value)}
              >
                {STATUSES.map((st) => (
                  <option key={st.key} value={st.key}>{st.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={s.fieldLabel}>Deadline / Forcing Function</div>
              <input
                style={s.input}
                placeholder="e.g. Sprint 4 or Q3 review"
                value={newDraft.deadline}
                onChange={(e) => updateNewField("deadline", e.target.value)}
              />
            </div>
          </div>
          <div style={{ ...s.fieldGrid, marginTop: "0.6rem" }}>
            <div>
              <div style={s.fieldLabel}>Objectives</div>
              <textarea style={{ ...s.textarea, minHeight: "42px" }} rows={2} placeholder="Why does this matter?"
                value={newDraft.objectives} onChange={(e) => updateNewField("objectives", e.target.value)} />
            </div>
            <div>
              <div style={s.fieldLabel}>Risks</div>
              <textarea style={{ ...s.textarea, minHeight: "42px" }} rows={2} placeholder="What could blow this up?"
                value={newDraft.risks} onChange={(e) => updateNewField("risks", e.target.value)} />
            </div>
            <div>
              <div style={s.fieldLabel}>Dependencies</div>
              <textarea style={{ ...s.textarea, minHeight: "42px" }} rows={2} placeholder="Who or what has to move first?"
                value={newDraft.dependencies} onChange={(e) => updateNewField("dependencies", e.target.value)} />
            </div>
            <div>
              <div style={s.fieldLabel}>Capacity Notes</div>
              <textarea style={{ ...s.textarea, minHeight: "42px" }} rows={2} placeholder="Team / bandwidth thoughts"
                value={newDraft.capacity} onChange={(e) => updateNewField("capacity", e.target.value)} />
            </div>
          </div>
          <div style={s.actions}>
            <button style={s.btn("primary")} onClick={addItem}>Add to Lot</button>
            <button style={s.btn("ghost")} onClick={() => { setShowAddForm(false); setNewDraft(emptyItem()); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Item cards ── */}
      {piItems.length === 0 && !showAddForm && (
        <div style={s.emptyState}>
          Nothing parked for PI {activePi} yet.{" "}
          {filterStatus !== "all" ? "Try clearing the status filter." : "Add something that's rolling around in your head."}
        </div>
      )}

      {piItems.map((item) => {
        const isExpanded = expandedId === item.id;
        const isEditing = editingId === item.id;
        const current = isEditing ? draft : item;

        return (
          <div key={item.id} style={{
            ...s.card,
            borderColor: isExpanded
              ? (theme?.accent || "#9B7ED8") + "55"
              : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"),
          }}>
            {/* Card header — always visible */}
            <div
              style={s.cardHeader}
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <span style={s.cardTitle}>{item.title || <em style={{ color: theme?.muted }}>Untitled</em>}</span>
              <span style={s.statusBadge(item.status)}>
                {STATUSES.find((s) => s.key === item.status)?.label}
              </span>
              {item.deadline && (
                <span style={{ fontSize: "0.72rem", color: theme?.muted || "#aaa", fontFamily: "'Barlow', sans-serif" }}>
                  📅 {item.deadline}
                </span>
              )}
              <span style={s.chevron(isExpanded)}>▼</span>
            </div>

            {/* Expanded body */}
            {isExpanded && (
              <div style={s.expandedBody}>
                {isEditing ? (
                  /* ── EDIT MODE ── */
                  <>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <div style={s.fieldLabel}>Title</div>
                      <input style={s.input} value={draft.title}
                        onChange={(e) => updateDraftField("title", e.target.value)} />
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                      <div>
                        <div style={s.fieldLabel}>Status</div>
                        <select style={s.select} value={draft.status}
                          onChange={(e) => updateDraftField("status", e.target.value)}>
                          {STATUSES.map((st) => (
                            <option key={st.key} value={st.key}>{st.label}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: "140px" }}>
                        <div style={s.fieldLabel}>Deadline / Forcing Function</div>
                        <input style={s.input} value={draft.deadline}
                          onChange={(e) => updateDraftField("deadline", e.target.value)} />
                      </div>
                    </div>
                    <div style={s.fieldGrid}>
                      <FieldEdit label="Objectives" field="objectives" multiline value={draft.objectives} onChange={updateDraftField} />
                      <FieldEdit label="Risks" field="risks" multiline value={draft.risks} onChange={updateDraftField} />
                      <FieldEdit label="Dependencies" field="dependencies" multiline value={draft.dependencies} onChange={updateDraftField} />
                      <FieldEdit label="Capacity Notes" field="capacity" multiline value={draft.capacity} onChange={updateDraftField} />
                    </div>
                    <div style={s.actions}>
                      <button style={s.btn("primary")} onClick={saveEdit}>Save</button>
                      <button style={s.btn("ghost")} onClick={cancelEdit}>Cancel</button>
                    </div>
                  </>
                ) : (
                  /* ── VIEW MODE ── */
                  <>
                    <div style={s.fieldGrid}>
                      <FieldView label="Objectives" value={current.objectives} />
                      <FieldView label="Risks" value={current.risks} />
                      <FieldView label="Dependencies" value={current.dependencies} />
                      <FieldView label="Capacity Notes" value={current.capacity} />
                    </div>
                    <div style={s.actions}>
                      <button style={s.btn("ghost")} onClick={() => startEdit(item)}>✏️ Edit</button>
                      {nextPiLabel(item.pi) && (
                        <button style={s.btn("promote")} onClick={() => promoteItem(item.id)}
                          title={`Move to PI ${nextPiLabel(item.pi)}`}>
                          → PI {nextPiLabel(item.pi)}
                        </button>
                      )}
                      <button style={s.btn("danger")} onClick={() => deleteItem(item.id)}>Delete</button>
                    </div>
                    {current.createdAt && (
                      <div style={{ marginTop: "0.5rem", fontSize: "0.68rem", color: theme?.muted || "#888", fontFamily: "'Barlow', sans-serif" }}>
                        Added {new Date(current.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Add button ── */}
      {!showAddForm && (
        <button style={s.addBtn} onClick={() => setShowAddForm(true)}>
          <span style={{ fontSize: "1rem" }}>+</span> Park something new in PI {activePi}
        </button>
      )}
    </div>
    </div>
  );
}
