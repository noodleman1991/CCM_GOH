"use client";

import { useEffect } from "react";

/**
 * Top-level error boundary — catches errors in the root layout that the
 * per-locale error.tsx can't. Reports to the monitoring hook if present.
 * Must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry (or any monitor) picks this up via the instrumentation hook; this
    // is a belt-and-braces client log.
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.error("Global error:", error);
    }
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 480 }}>
          <h1 style={{ fontSize: "1.5rem", color: "#0f172a" }}>Something went wrong</h1>
          <p style={{ color: "#475569" }}>An unexpected error occurred. Please try again.</p>
          <button
            onClick={() => reset()}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: 8, background: "#0e7490", color: "white", border: 0, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
