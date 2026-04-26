"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { NewsApiKeyStatus } from "@/lib/user-news-api-key";

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
  initialStatus: NewsApiKeyStatus;
};

export function NewsApiKeyForm({ initialStatus }: Props) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedKey = apiKey.trim();

    if (!normalizedKey) {
      setError("Введите NewsAPI key");
      return;
    }

    if (normalizedKey.length < 20 || normalizedKey.length > 256) {
      setError("Ключ выглядит некорректно");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile/news-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: normalizedKey }),
      });

      const payload = (await response.json().catch(() => null)) as ApiResponse<NewsApiKeyStatus> | null;

      if (!response.ok || !payload || payload.ok === false) {
        const message = payload && payload.ok === false ? payload.error.message : "Не удалось сохранить ключ";
        setError(message);
        return;
      }

      setApiKey("");
      setStatus(payload.data);
      setSuccess("Ключ сохранён");
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуй ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onDelete() {
    setError("");
    setSuccess("");
    setIsDeleting(true);

    try {
      const response = await fetch("/api/profile/news-api-key", {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as ApiResponse<NewsApiKeyStatus> | null;

      if (!response.ok || !payload || payload.ok === false) {
        const message = payload && payload.ok === false ? payload.error.message : "Не удалось удалить ключ";
        setError(message);
        return;
      }

      setStatus(payload.data);
      setSuccess("Ключ удалён");
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуй ещё раз.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      {status.hasNewsApiKey ? (
        <p className="success-message">
          Сейчас ключ сохранён. Последние 4 символа: {status.last4}
        </p>
      ) : (
        <p className="alert">
          Ключ ещё не добавлен. Без него нельзя создавать запросы на новости.
        </p>
      )}

      <div className="field">
        <label htmlFor="news-api-key-input">NewsAPI key</label>
        <input
          autoComplete="off"
          id="news-api-key-input"
          maxLength={256}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="Вставь ключ NewsAPI"
          type="password"
          value={apiKey}
        />
      </div>

      <div className="filter-actions">
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Сохраняю..." : "Сохранить ключ"}
        </button>

        {status.hasNewsApiKey ? (
          <button
            className="button button-secondary"
            disabled={isDeleting}
            onClick={onDelete}
            type="button"
          >
            {isDeleting ? "Удаляю..." : "Удалить ключ"}
          </button>
        ) : null}
      </div>

      {error ? <p className="alert">{error}</p> : null}
      {success ? <p className="success-message">{success}</p> : null}
    </form>
  );
}