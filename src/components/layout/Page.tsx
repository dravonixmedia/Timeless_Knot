import { ViewTransition, type ReactNode } from "react";

/**
 * Wraps each page so route changes cross-fade with a short, gentle rise.
 * Uses the browser View Transitions API through React; unsupported browsers
 * simply navigate instantly.
 */
export function Page({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
