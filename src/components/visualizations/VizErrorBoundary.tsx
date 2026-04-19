"use client";

import React from "react";

interface State {
  hasError: boolean;
  error?: Error;
}

export class VizErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[280px] flex-col items-center justify-center gap-3 bg-bg-primary text-center">
          <svg
            className="h-8 w-8 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-text-muted">
            3D visualization could not load
          </p>
          <p className="max-w-xs text-xs text-text-muted/60">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-1 rounded-md bg-bg-tertiary px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-hover"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
