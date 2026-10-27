import { useState } from "react";

// Optional daily intention, shown inline beneath the timer.
// Nothing pops up: if no intention is set, a quiet field invites one.
export default function IntentionChip({ intention, theme, onSet }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(intention || "");

  const save = () => { onSet(draft.trim()); setEditing(false); };
  const cancel = () => { setDraft(intention || ""); setEditing(false); };

  const label = {
    fontFamily:"var(--font-caps)", fontSize:"0.62rem", letterSpacing:"0.22em",
    textTransform:"uppercase", color: theme.accentInk || theme.accent,
  };

  if (!intention || editing) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.35rem", width:"100%", maxWidth:420, margin:"0 auto" }}>
        <span style={label}>Today's intention · optional</span>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          onBlur={() => { if (draft.trim() !== (intention || "")) save(); else setEditing(false); }}
          autoFocus={editing}
          placeholder="What would make today feel well spent?"
          aria-label="Today's intention (optional)"
          style={{
            width:"100%", textAlign:"center", background:"transparent",
            border:`1px solid ${theme.line || theme.panelBorder}`,
            borderRadius: theme.deckRoom ? 3 : 10,
            color:theme.text, padding:"0.45rem 0.75rem", outline:"none",
            fontFamily:"var(--font-display)", fontSize:"1rem",
          }}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(intention); setEditing(true); }}
      title="Edit today's intention"
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:"0.2rem",
        background:"transparent", border:"none", cursor:"pointer",
        margin:"0 auto", maxWidth:420, padding:"0.25rem 0.5rem",
      }}
    >
      <span style={label}>Today's intention</span>
      <span style={{ fontFamily:"var(--font-display)", fontSize:"1.05rem", fontStyle:"italic", color:theme.text, lineHeight:1.35 }}>
        {intention}
      </span>
    </button>
  );
}
