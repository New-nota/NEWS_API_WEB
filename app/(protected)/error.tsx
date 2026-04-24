"use client";

import { useEffect } from "react";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Protected route error", error);
  }, [error]);

  return (
    <section className="card stack">
      <h2>Failed to load dashboard data</h2>
      <p className="muted">The server returned an error while loading protected data.</p>
      <button className="button button-primary" onClick={() => reset()} type="button">
        Retry
      </button>
    </section>
  );
}
