import React from "react";

/**
 * App-level error boundary — catches unhandled render errors and
 * prevents the entire screen from going white.
 *
 * Offers a "Reset & Reload" escape hatch that clears the persisted
 * store and hard-reloads. This ensures even store-corruption crashes
 * are recoverable without dev tools.
 */
export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem("akademia-game-store");
    } catch { /* ignore */ }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", height: "100dvh", padding: 24,
          fontFamily: "system-ui, sans-serif", textAlign: "center",
          background: "#1a1a2e", color: "#eee",
        }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#aaa", marginBottom: 24, maxWidth: 400 }}>
            An unexpected error occurred. You can try reloading, or reset your
            save data if the problem persists.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: "10px 20px", borderRadius: 8, border: "none",
                background: "#4dabf5", color: "#fff", fontSize: 16,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
            <button
              onClick={this.handleReset}
              style={{
                padding: "10px 20px", borderRadius: 8, border: "none",
                background: "#e94560", color: "#fff", fontSize: 16,
                cursor: "pointer",
              }}
            >
              Reset &amp; Reload
            </button>
          </div>
          {this.state.error && (
            <pre style={{
              marginTop: 24, padding: 12, background: "#0d0d1a",
              borderRadius: 8, fontSize: 12, color: "#f66",
              maxWidth: "90vw", overflow: "auto", textAlign: "left",
            }}>
              {String(this.state.error)}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
