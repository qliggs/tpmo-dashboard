"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  /** Optional custom fallback. If omitted, a default error card is rendered. */
  fallback?: React.ReactNode;
  /** Optional label shown in the default fallback */
  label?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="rounded border border-red-500/30 bg-red-950/20 p-4 text-sm font-mono">
          <p className="text-red-400 font-semibold mb-1">
            {this.props.label ?? "Section failed to render"}
          </p>
          <p className="text-zinc-500 text-xs break-all">
            {this.state.error.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
