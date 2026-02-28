import { Component, type ReactNode } from "react";
import { Layout } from "./app/Layout";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: unknown) {
    console.error("App error:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", padding: 24, fontFamily: "sans-serif" }}>
          <h1 style={{ margin: "0 0 12px 0" }}>Something went wrong</h1>
          <p style={{ margin: 0, color: "#aaa" }}>Check the browser console for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Layout />
    </ErrorBoundary>
  );
}

export default App;
