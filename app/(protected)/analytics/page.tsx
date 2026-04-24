import { redirect } from "next/navigation";
import { getAnalyticsForUser } from "@/lib/analytics";
import { getCurrentAppUserId } from "@/lib/users";

export default async function AnalyticsPage() {
  const appUserId = await getCurrentAppUserId();
  if (!appUserId) redirect("/login");

  const data = await getAnalyticsForUser(appUserId);

  return (
    <div className="stack">
      <section className="card stack">
        <h1>Analytics</h1>
        <div className="stats-grid">
          <article className="stat-card">
            <span>Total loaded news</span>
            <strong>{data.summary.total_user_news}</strong>
          </article>
          <article className="stat-card">
            <span>Unique articles</span>
            <strong>{data.summary.unique_articles}</strong>
          </article>
          <article className="stat-card">
            <span>Successful requests</span>
            <strong>{data.requests.success_count}</strong>
          </article>
          <article className="stat-card">
            <span>Rejected articles</span>
            <strong>{data.requests.total_rejected_articles}</strong>
          </article>
        </div>
      </section>

      <section className="card stack">
        <h2>Top keywords</h2>
        {data.keywords.length === 0 ? (
          <p className="muted">No keyword analytics yet.</p>
        ) : (
          <div className="ranking-list">
            {data.keywords.map((item) => (
              <div className="ranking-row" key={`${item.keyword ?? "empty"}-${item.count}`}>
                <span>{item.keyword ?? "unknown"}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card stack">
        <h2>Top sources</h2>
        {data.sources.length === 0 ? (
          <p className="muted">No source analytics yet.</p>
        ) : (
          <div className="ranking-list">
            {data.sources.map((item) => (
              <div className="ranking-row" key={`${item.source_name ?? "empty"}-${item.count}`}>
                <span>{item.source_name ?? "unknown"}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
