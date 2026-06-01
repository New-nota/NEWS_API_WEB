import { redirect } from "next/navigation";
import { AIAnalyticsSection } from "@/components/analytics/ai-analytics-section";
import { getAnalyticsForUser } from "@/lib/analytics";
import { getCurrentAppUserId } from "@/lib/users";

function topValue<T extends { count: number }>(rows: T[]): number {
  return rows.reduce((max, r) => (r.count > max ? r.count : max), 0);
}

export default async function AnalyticsPage() {
  const appUserId = await getCurrentAppUserId();
  if (!appUserId) redirect("/login");

  const data = await getAnalyticsForUser(appUserId);
  const keywordTop = topValue(data.keywords);
  const sourceTop = topValue(data.sources);

  return (
    <div className="stack">
      <header className="page-intro">
        <p className="section-title">аналитика / агрегаты</p>
        <h1>ААААналитика</h1>
      </header>

      <section className="card stack">
        <div className="stats-grid">
          <article className="stat-card">
            <span>Общее количество новостей</span>
            <strong>{data.summary.total_user_news}</strong>
          </article>
          <article className="stat-card">
            <span>Уникальные статьи</span>
            <strong>{data.summary.unique_articles}</strong>
          </article>
          <article className="stat-card">
            <span>Успешный запрос</span>
            <strong>{data.requests.success_count}</strong>
          </article>
          <article className="stat-card">
            <span>Отклоненные новости</span>
            <strong>{data.requests.total_rejected_articles}</strong>
          </article>
        </div>
      </section>

      <section className="card stack">
        <h2>Популярные ключесвые слова</h2>
        {data.keywords.length === 0 ? (
          <div className="state-block is-empty">
            <img src="/mascot-sleeping.svg" width="56" height="56" alt="" />
            <div className="state-copy">
              <p className="state-title">Пока таких нет.</p>
              <div className="state-sub">создай первый запрос</div>
            </div>
          </div>
        ) : (
          <div className="ranking-list">
            {data.keywords.map((item, index) => {
              const pct = keywordTop > 0 ? Math.round((item.count / keywordTop) * 100) : 0;
              return (
                <div className="ranking-row has-bar" key={`${item.keyword ?? "empty"}-${item.count}`}>
                  <div className="rank-head">
                    <span className="rank-idx">{String(index + 1).padStart(2, "0")}</span>
                    <span className="rank-label">{item.keyword ?? "unknown"}</span>
                  </div>
                  <div className="rank-track">
                    <div className="rank-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card stack">
        <h2>Популярные источники</h2>
        {data.sources.length === 0 ? (
          <div className="state-block is-empty">
            <img src="/mascot-sleeping.svg" width="56" height="56" alt="" />
            <div className="state-copy">
              <p className="state-title">пока нет аналитики.</p>
              <div className="state-sub">подожди немного</div>
            </div>
          </div>
        ) : (
          <div className="ranking-list">
            {data.sources.map((item, index) => {
              const pct = sourceTop > 0 ? Math.round((item.count / sourceTop) * 100) : 0;
              return (
                <div className="ranking-row has-bar" key={`${item.source_name ?? "empty"}-${item.count}`}>
                  <div className="rank-head">
                    <span className="rank-idx">{String(index + 1).padStart(2, "0")}</span>
                    <span className="rank-label">{item.source_name ?? "unknown"}</span>
                  </div>
                  <div className="rank-track">
                    <div className="rank-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AIAnalyticsSection ai={data.ai} />
    </div>
  );
}
