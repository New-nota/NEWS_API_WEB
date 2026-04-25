"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const LIMIT_COUNT_MIN = 1;
const LIMIT_COUNT_MAX = 500;
const PAGE_SIZE_MIN = 1;
const PAGE_SIZE_MAX = 100;

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

export function SearchRequestForm() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [language, setLanguage] = useState("ru");
  const [limitCount, setLimitCount] = useState(20);
  const [pageSize, setPageSize] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      setError("Keyword is required");
      setIsSubmitting(false);
      return;
    }

    if (limitCount < LIMIT_COUNT_MIN || limitCount > LIMIT_COUNT_MAX) {
      setError(`limitCount must be between ${LIMIT_COUNT_MIN} and ${LIMIT_COUNT_MAX}`);
      setIsSubmitting(false);
      return;
    }

    if (pageSize < PAGE_SIZE_MIN || pageSize > PAGE_SIZE_MAX) {
      setError(`pageSize must be between ${PAGE_SIZE_MIN} and ${PAGE_SIZE_MAX}`);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: normalizedKeyword,
          language,
          limitCount,
          pageSize,
        }),
      });

      const payload = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;

      if (!response.ok || !payload || payload.ok === false) {
        const message = payload && payload.ok === false ? payload.error.message : "Failed to create search request";
        setError(message);
        return;
      }

      setKeyword("");
      setSuccess("Search request queued");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card stack" onSubmit={onSubmit}>
      <h2>Create search request</h2>

      <div className="field">
        <label htmlFor="keyword-input">Ключевое слово</label>
        <input
          id="keyword-input"
          maxLength={120}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="слово"
          required
          value={keyword}
        />
      </div>

      <div className="field">
        <label htmlFor="language-input">Язык </label>
        <input
          id="language-input"
          maxLength={2}
          minLength={2}
          onChange={(event) => setLanguage(event.target.value.toLowerCase())}
          pattern="[a-z]{2}"
          required
          value={language}
        />
      </div>

      <div className="field">
        <label htmlFor="limit-count-input">Лимит по новостям</label>
        <input
          id="limit-count-input"
          max={LIMIT_COUNT_MAX}
          min={LIMIT_COUNT_MIN}
          onChange={(event) => setLimitCount(Number(event.target.value))}
          required
          type="number"
          value={limitCount}
        />
      </div>

      <div className="field">
        <label htmlFor="page-size-input">Размер новостей на страницу (при плохом интернете лучше 20)</label>
        <input
          id="page-size-input"
          max={PAGE_SIZE_MAX}
          min={PAGE_SIZE_MIN}
          onChange={(event) => setPageSize(Number(event.target.value))}
          required
          type="number"
          value={20}
        />
      </div>

      <div className="filter-actions">
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Submitting..." : "Закинуть в очередь"}
        </button>
      </div>

      {error ? <p className="alert">{error}</p> : null}
      {success ? <p className="success-message">{success}</p> : null}
    </form>
  );
}
