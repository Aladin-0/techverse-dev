import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props { children?: ReactNode; }
interface State { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null; }

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null, errorInfo: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", color: "white", background: "black", minHeight: "100vh" }}>
          <h1 style={{ color: "red" }}>React Crashed!</h1>
          <p><strong>{this.state.error?.toString()}</strong></p>
          <pre style={{ color: "orange", whiteSpace: "pre-wrap" }}>
            {this.state.error?.stack}
          </pre>
          <pre style={{ color: "gray", whiteSpace: "pre-wrap" }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
