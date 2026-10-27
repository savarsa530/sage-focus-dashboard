import { Component } from "react";

// Catches render/runtime errors so one crashing widget (or the whole
// app) shows a graceful fallback instead of a blank screen.
// Use with a `label` prop for a compact, retryable widget-level notice,
// or without one for the full-screen app-level fallback.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    const { label } = this.props;

    // Widget-level: compact inline notice with retry, keeps the rest of the app alive.
    if (label) {
      return (
        <div style={{
          border: "1px solid rgba(140,100,160,0.35)", borderRadius: 14,
          padding: "1rem 1.25rem", marginBottom: "1.1rem",
          background: "rgba(120,80,140,0.08)", color: "#c9b8d8",
          fontFamily: "var(--font-body)", fontSize: "0.85rem",
          textAlign: "center", lineHeight: 1.5,
        }}>
          <div style={{ marginBottom: "0.55rem" }}>🌿 The {label} panel hit a snag.</div>
          <button onClick={this.reset} style={{
            background: "transparent", border: "1px solid #8a6aa0",
            color: "#c9b8d8", borderRadius: 8, padding: "0.3rem 0.85rem",
            cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 600,
          }}>
            Try again
          </button>
        </div>
      );
    }

    // App-level: full neutral fallback with a reload.
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "1rem",
        background: "#0c0816", color: "#ecdff7",
        fontFamily: "var(--font-body)", padding: "2rem",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "2rem" }}>🌿</div>
        <div style={{ fontSize: "1.3rem", fontWeight: 600 }}>Something cracked here.</div>
        <div style={{ fontSize: "0.9rem", opacity: 0.7, maxWidth: 420, lineHeight: 1.55 }}>
          The dashboard hit an unexpected error. Your saved data is safe — a reload usually clears it.
        </div>
        <button onClick={() => window.location.reload()} style={{
          background: "#c8923a", color: "#000", border: "none",
          borderRadius: 10, padding: "0.6rem 1.5rem", cursor: "pointer",
          fontFamily: "inherit", fontWeight: 700, fontSize: "0.9rem",
        }}>
          Reload
        </button>
      </div>
    );
  }
}
