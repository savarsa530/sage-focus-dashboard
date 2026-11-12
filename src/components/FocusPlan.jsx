import { useState, useEffect } from "react";
import { LineIcon } from "./Witchy";
import { ET, dayIn, minsIn } from "../tz";
import { safeGetJSON, safeSet } from "../utils";
import { cleanPlan, parsePlanText } from "../planText";

const PLAN_KEY = "sage_focusplan_data_v1";   // the pasted plan, kept only in this browser
const KEY = "sage_focusplan_v1";   // { open, progress: { "date#time#work": { step, done } } }

const padKey = (k) => k.split("-").map((p, i) => (i ? p.padStart(2, "0") : p)).join("-");
const asUTC  = (k) => { const [y, m, d] = k.split("-").map(Number); return Date.UTC(y, m - 1, d, 12); };
const fmtDay = (k) => new Intl.DateTimeFormat("en-US", { timeZone:"UTC", weekday:"short", month:"short", day:"numeric" }).format(new Date(asUTC(k)));

function useToday() {
  const [key, setKey] = useState(() => padKey(dayIn(ET, new Date())));
  useEffect(() => {
    const id = setInterval(() => setKey(padKey(dayIn(ET, new Date()))), 60000);
    return () => clearInterval(id);
  }, []);
  return key;
}

// Today's focus block, decided ahead: the work, one step at a time, and
// the point where it's done enough. Only the step you're on is shown, so
// the whole plan can't pull you into planning instead of doing.
export default function FocusPlan({ theme, panelStyle, btnStyle, onBegin, onDone }) {
  const today = useToday();
  // The plan is pasted in (see src/planText.js) and kept in this browser, never in the repo.
  const [plan, setPlan] = useState(() => cleanPlan(safeGetJSON(PLAN_KEY)));
  const [pasting, setPasting] = useState(false);
  const [draft, setDraft] = useState("");
  const [pasteMsg, setPasteMsg] = useState("");
  const savePasted = () => {
    const p = parsePlanText(draft);
    if (!p) { setPasteMsg("I couldn't find any blocks in that. Copy the whole plan email, from the first date down, and paste it again."); return; }
    safeSet(PLAN_KEY, p); setPlan(p); setPasting(false); setDraft("");
    setPasteMsg(`Plan saved: ${p.blocks.length} block${p.blocks.length === 1 ? "" : "s"}.`);
  };
  const BLOCKS = plan?.blocks || [];
  const [store, setStore] = useState(() => ({ open:true, progress:{}, ...(safeGetJSON(KEY) || {}) }));
  const save = (s) => { setStore(s); safeSet(KEY, s); };
  const ink = theme.accentInk || theme.accent;

  const todays = BLOCKS.map((b) => ({ ...b, id:`${b.date}#${b.time}#${b.work}` })).filter(b => b.date === today)
    .sort((a, b) => a.time.padStart(5, "0").localeCompare(b.time.padStart(5, "0")));
  const next = BLOCKS.filter(b => b.date > today && !b.rest).sort((a, b) => a.date.localeCompare(b.date))[0];
  // With two blocks today, show the one that has started (the later one once it begins).
  const [pick, setPick] = useState(null);
  const toMins = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const nowMins = minsIn(ET, new Date());
  const auto = Math.max(0, todays.reduce((at, b, i) => (b.time && toMins(b.time) <= nowMins ? i : at), 0));
  const block = todays[Math.min(pick ?? auto, Math.max(0, todays.length - 1))];
  const prog = (block && store.progress[block.id]) || { step:0, done:false };
  const setProg = (p) => save({ ...store, progress:{ ...store.progress, [block.id]:{ ...prog, ...p } } });

  const steps = block?.steps || [];
  const atLast = prog.step >= steps.length - 1;
  const toggle = () => save({ ...store, open:!store.open });

  const toggleBtn = (
    <button onClick={toggle} aria-expanded={store.open} aria-controls="this-block-body"
      style={{ background:"none", border:`1px solid ${theme.line}`, color:ink, cursor:"pointer", padding:"0.25rem 0.6rem", fontSize:"0.88rem", display:"inline-flex", alignItems:"center", gap:"0.35rem", flex:"none" }}>
      {store.open ? "Minimize" : "Show"}<span aria-hidden="true" style={{ fontSize:"0.7rem" }}>{store.open ? "▲" : "▼"}</span>
    </button>
  );
  const label = (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"0.45rem", fontFamily:"var(--font-display)", fontSize:"1.25rem", color:theme.text, flex:"none" }}>
      <LineIcon name="candle" size={16} style={{ color:ink }}/>This block{block?.time ? <span style={{ fontFamily:"var(--font-body)", fontSize:"0.9rem", color:theme.textMuted, fontStyle:"italic" }}>· {block.time}</span> : null}
    </span>
  );
  const nextLine = next && (
    <span style={{ color:theme.textMuted, fontSize:"0.88rem", fontStyle:"italic" }}>Next block: {fmtDay(next.date)} · {next.work}</span>
  );

  // One line: what this block is for and where you are in it.
  const summary = !plan ? <span style={{ color:theme.textMuted, fontStyle:"italic" }}>No plan yet</span>
    : !block ? (nextLine || <span style={{ color:theme.textMuted, fontStyle:"italic" }}>Nothing planned yet</span>)
    : block.rest ? <span style={{ color:theme.textMuted }}>A breather</span>
    : <span style={{ color:theme.textMuted, fontSize:"0.95rem" }}>{block.work} · {prog.done ? "done for today" : `step ${prog.step + 1} of ${steps.length}`}</span>;

  const quiet = { background:"none", border:`1px solid ${theme.line}`, color:ink, cursor:"pointer", padding:"0.4rem 0.8rem", fontSize:"0.9rem" };
  const linkBtn = { background:"none", border:"none", padding:0, color:ink, cursor:"pointer", textDecoration:"underline", textUnderlineOffset:"3px", font:"inherit" };
  const openPaste = () => { setPasting(true); setPasteMsg(""); };

  // Paste the weekly plan email; it's read and kept in this browser.
  if (pasting) return (
    <div id="this-block" style={{ ...panelStyle, padding:"1rem 1.5rem 1.1rem" }}>
      <div style={{ marginBottom:"0.5rem" }}>{label}</div>
      <label htmlFor="plan-paste" style={{ display:"block", color:theme.textMuted, fontSize:"0.92rem", marginBottom:"0.4rem" }}>
        Copy the whole plan email and paste it here. It stays in this browser.
      </label>
      <textarea id="plan-paste" value={draft} onChange={(e) => { setDraft(e.target.value); setPasteMsg(""); }} rows={8} autoFocus
        style={{ width:"100%", boxSizing:"border-box", background:theme.card, color:theme.text, border:`1px solid ${theme.line}`, padding:"0.6rem 0.75rem", font:"inherit", fontSize:"0.9rem", lineHeight:1.4, resize:"vertical" }}/>
      {pasteMsg && <div role="alert" style={{ color:theme.rose, fontSize:"0.9rem", marginTop:"0.4rem" }}>{pasteMsg}</div>}
      <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginTop:"0.7rem" }}>
        <button style={{ ...btnStyle("invite"), fontSize:"0.82rem", padding:"0.5rem 1.2rem" }} onClick={savePasted} disabled={!draft.trim()}>Save plan</button>
        <button style={quiet} onClick={() => { setPasting(false); setDraft(""); setPasteMsg(""); }}>Cancel</button>
      </div>
    </div>
  );

  if (!store.open || !block) return (
    <div id="this-block" style={{ ...panelStyle, padding:"0.6rem 1.5rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem", flexWrap:"wrap" }}>
        {label}
        <span style={{ display:"inline-flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap", minWidth:0 }}>
          {summary}
          {block ? toggleBtn : <button style={{ ...quiet, padding:"0.25rem 0.6rem", fontSize:"0.88rem" }} onClick={openPaste}>Paste plan</button>}
        </span>
      </div>
      {pasteMsg && <div style={{ color:theme.textMuted, fontSize:"0.85rem", fontStyle:"italic", marginTop:"0.3rem" }}>{pasteMsg}</div>}
    </div>
  );

  return (
    <div id="this-block" style={{ ...panelStyle, padding:"1rem 1.5rem 1.1rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem", marginBottom:"0.5rem" }}>
        {label}
        <span style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem" }}>
          {todays.length > 1 && todays.map((b, i) => (
            <button key={b.id} onClick={() => setPick(i)} aria-pressed={b.id === block.id}
              style={{ ...quiet, padding:"0.2rem 0.5rem", fontSize:"0.82rem", borderColor: b.id === block.id ? theme.rose : theme.line }}>{b.time || i + 1}</button>
          ))}
          {toggleBtn}
        </span>
      </div>

      <div id="this-block-body">
        <div style={{ fontFamily:"var(--font-display)", fontSize:"1.35rem", lineHeight:1.25, color:theme.text, marginBottom:"0.7rem", textWrap:"balance" }}>
          {block.work}
        </div>
        {block.context && (
          <div style={{ color:theme.textMuted, fontSize:"0.95rem", lineHeight:1.45, marginTop:"-0.35rem", marginBottom:"0.75rem" }}>{block.context}</div>
        )}

        {block.rest ? (
          <div style={{ color:theme.textMuted, fontStyle:"italic" }}>Nothing to work on in it. Step away from the screen if you can.</div>
        ) : prog.done ? (
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"0.45rem", color:theme.text }}>
              <LineIcon name="bloom" size={18} style={{ color:ink }}/>Done for today. That counts.
            </div>
            <div><button style={quiet} onClick={() => setProg({ done:false })}>Open it again</button></div>
          </div>
        ) : (<>
          <div style={{ border:`1px solid ${theme.line}`, borderLeft:`3px solid ${theme.rose}`, background:theme.card, padding:"0.75rem 1rem", display:"flex", flexDirection:"column", gap:"0.3rem" }}>
            <span style={{ fontSize:"0.8rem", color:theme.textMuted, fontStyle:"italic" }}>
              Step {prog.step + 1} of {steps.length}
              <span aria-hidden="true" style={{ marginLeft:"0.5rem", letterSpacing:"0.2em" }}>
                {steps.map((_, i) => <span key={i} style={{ color: i <= prog.step ? theme.rose : theme.line }}>●</span>)}
              </span>
            </span>
            <span style={{ fontSize:"1.08rem", lineHeight:1.4, color:theme.text }}>{steps[prog.step]}</span>
          </div>

          {atLast && block.doneWhen && (
            <div style={{ marginTop:"0.55rem", fontSize:"0.9rem", color:theme.textMuted }}>
              <span style={{ color:ink, fontStyle:"italic" }}>Done enough when:</span> {block.doneWhen}
            </div>
          )}

          <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", alignItems:"center", marginTop:"0.8rem" }}>
            {atLast
              ? <button style={{ ...btnStyle("invite"), fontSize:"0.82rem", padding:"0.5rem 1.2rem" }} onClick={() => { setProg({ done:true }); onDone?.(`block:${block.id}`); }}>Done for today</button>
              : <button style={{ ...btnStyle("invite"), fontSize:"0.82rem", padding:"0.5rem 1.2rem" }} onClick={() => setProg({ step:prog.step + 1 })}>Next step</button>}
            {prog.step > 0 && <button style={quiet} onClick={() => setProg({ step:prog.step - 1 })}>Back</button>}
            {onBegin && <button style={quiet} onClick={() => onBegin({ id:`block:${block.id}`, text:block.work })} title="Puts this work in your tasks and starts the timer on it">Focus the timer on this</button>}
          </div>
        </>)}

        {nextLine && <div style={{ marginTop:"0.8rem" }}>{nextLine}</div>}
        <div style={{ marginTop:"0.3rem", color:theme.textMuted, fontSize:"0.78rem", fontStyle:"italic" }}>
          {pasteMsg ? `${pasteMsg} ` : plan?.updated ? `Plan from ${fmtDay(plan.updated)} · ` : ""}
          <button style={linkBtn} onClick={openPaste}>Paste a new plan</button>
        </div>
      </div>
    </div>
  );
}
