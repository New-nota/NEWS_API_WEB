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
      <h2>ОШИБКА ПОДКЛЮЧЕНИЯ</h2>
      <p className="muted">Сервер споткнулся пока создавался запрос.</p>
      <button className="button button-primary" onClick={() => reset()} type="button">
        ПОПЫТаться снова
      </button>
    </section>
  );
}
