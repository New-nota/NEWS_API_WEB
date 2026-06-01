import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AIBriefingCard } from "@/components/searches/ai-briefing-card";
import { NewsTable } from "@/components/dashboard/news-table";
import { listNewsForUser } from "@/lib/news";
import { getSearchRequestByIdForUser } from "@/lib/searches";
import { getCurrentAppUserId } from "@/lib/users";
import { parseStrictPositiveInteger } from "@/lib/validation";

const REQUEST_NEWS_LIMIT = 50;

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return String(value);
}

export default async function SearchRequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const appUserId = await getCurrentAppUserId();
  if (!appUserId) redirect("/login");

  const { id } = await params;
  let searchRequestId: number;
  try {
    searchRequestId = parseStrictPositiveInteger(id, "id");
  } catch {
    notFound();
  }

  const searchRequest = await getSearchRequestByIdForUser(searchRequestId, appUserId);
  if (!searchRequest) {
    notFound();
  }

  const newsData = await listNewsForUser(appUserId, {
    searchRequestId,
    page: 1,
    limit: REQUEST_NEWS_LIMIT,
  });

  return (
    <div className="stack">
      <header className="page-intro">
        <p className="section-title">запрос / детали</p>
        <h1>
          #{searchRequest.id}
          <span className={`status-badge status-${searchRequest.status}`}>{searchRequest.status}</span>
        </h1>
        <p className="meta">
          <span>слово: {searchRequest.keyword}</span>
          <span className="sep">·</span>
          <span>язык {searchRequest.language}</span>
          <span className="sep">·</span>
          <span>лимит {searchRequest.limit_count}</span>
          <span className="sep">·</span>
          <span>стр. {searchRequest.page_size}</span>
        </p>
      </header>

      <section className="card stack">
        {searchRequest.error_text ? <p className="alert">{searchRequest.error_text}</p> : null}

        <div className="stats-grid">
          <article className="stat-card">
            <span>Получено</span>
            <strong>{formatNumber(searchRequest.income_articles)}</strong>
          </article>
          <article className="stat-card">
            <span>Принято</span>
            <strong>{formatNumber(searchRequest.accepted_articles)}</strong>
          </article>
          <article className="stat-card">
            <span>Отклонено</span>
            <strong>{formatNumber(searchRequest.rejected_articles)}</strong>
          </article>
          <article className="stat-card">
            <span>Загружено в БД</span>
            <strong>{formatNumber(searchRequest.loaded_rows)}</strong>
          </article>
        </div>

        <div className="filter-actions">
          <Link className="button button-secondary" href="/dashboard">
            ← Назад к дашборду
          </Link>
        </div>
      </section>

      <AIBriefingCard aiReport={searchRequest.ai_report} searchStatus={searchRequest.status} />

      <section className="card stack">
        <div className="section-header">
          <h2>Новости запроса</h2>
          <p className="muted">Всего: {newsData.total}</p>
        </div>

        <NewsTable rows={newsData.rows} />
        {newsData.total > REQUEST_NEWS_LIMIT ? (
          <p className="muted">
            Показаны первые {REQUEST_NEWS_LIMIT} из {newsData.total}. Используйте дашборд для полного списка.
          </p>
        ) : null}
      </section>
    </div>
  );
}
