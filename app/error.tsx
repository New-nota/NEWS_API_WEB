"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error", error);
  }, [error]);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Something went wrong</h1>
        <p className="muted">
          Request could not be completed. Please retry, and if the issue persists contact support.
        </p>
        <button className="button button-primary" onClick={() => reset()} type="button">
          Retry
        </button>
      </section>
    </main>
  );
}
