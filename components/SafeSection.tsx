"use client";

import { ErrorBoundary } from "./ErrorBoundary";

interface Props {
  children: React.ReactNode;
  label?: string;
  fallback?: React.ReactNode;
}

/**
 * Thin client wrapper that isolates a page section inside an ErrorBoundary.
 * Use this to wrap individual dashboard sections so one failure doesn't
 * take down the entire page.
 */
export function SafeSection({ children, label, fallback }: Props) {
  return (
    <ErrorBoundary label={label} fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}
