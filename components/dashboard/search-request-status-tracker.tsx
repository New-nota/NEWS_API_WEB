"use client";

import { useEffect, useState } from "react";

type SearchRequestDetails = {
  id: number;
  status: "queued" | "running" | "success" | "failed";
  keyword: string;
  error_text: string | null;
  loaded_rows?: number;
};

type ApiSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
};

type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
};

type ApiResponse<T> = ApiSuccess<T> | ApiError;

type Props = {
  searchRequestId: number;
  onDone: () => void;
};

export function SearchRequestStatusTracker({ searchRequestId, onDone }: Props) {
  const [status, setStatus] = useState<"queued" | "running" | "success" | "failed">("queued");
  const [error, setError] = useState("");
  const [loadedRows, setLoadedRows] = useState<number | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const response = await fetch(`/api/searches/${searchRequestId}`, {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => null)) as
          | ApiResponse<SearchRequestDetails>
          | null;

        if (isCancelled) return;

        if (!response.ok || !payload || payload.ok === false) {
          const message =
            payload && payload.ok === false
              ? payload.error.message
              : "Не удалось получить статус запроса";

          setError(message);
          timeoutId = setTimeout(poll, 3000);
          return;
        }

        const request = payload.data;

        setStatus(request.status);
        setError(request.error_text ?? "");
        setLoadedRows(typeof request.loaded_rows === "number" ? request.loaded_rows : null);

        if (request.status === "success" || request.status === "failed") {
          onDone();
          return;
        }

        timeoutId = setTimeout(poll, 2000);
      } catch {
        if (!isCancelled) {
          setError("Ошибка сети при проверке статуса");
          timeoutId = setTimeout(poll, 3000);
        }
      }
    }

    poll();

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchRequestId, onDone]);

  if (status === "success") {
    return (
      <p className="success-message">
        Готово! Новости загружены{loadedRows !== null ? `: ${loadedRows}` : ""}.
      </p>
    );
  }

  if (status === "failed") {
    return <p className="alert">Запрос завершился ошибкой{error ? `: ${error}` : "."}</p>;
  }

  return (
    <p className="success-message">
      Запрос обрабатывается. Текущий статус: {status}
      {error ? ` (${error})` : ""}
    </p>
  );
}