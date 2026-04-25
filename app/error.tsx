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
        <h1>ШОТО тут не так</h1>
        <p className="muted">
          Поиск не смог. Пожалуйста, нажмите "АААА" если не помогло, то это грустно.
        </p>
        <button className="button button-primary" onClick={() => reset()} type="button">
          АААА
        </button>
      </section>
    </main>
  );
}
