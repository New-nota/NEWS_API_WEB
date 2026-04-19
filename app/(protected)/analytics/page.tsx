import { getAnalytics } from "@/lib/analytics";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function RankingTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; count: number }>;
}) {
  return (
    <section className="card">
      <div className="section-header">
        <h2>{title}</h2>
      </div>
      <div className="ranking-list">
        {rows.length === 0 ? (
          <div className="empty-state">Пока пусто.</div>
        ) : (
          rows.map((row) => (
            <div className="ranking-row" key={`${title}-${row.label}`}>
              <span>{row.label}</span>
              <strong>{row.count}</strong>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();

  return (
    <section className="stack">
      <div className="stats-grid">
        <article className="stat-card">
          <span>Всего новостей</span>
          <strong>{data.cards.totalNews}</strong>
        </article>
        <article className="stat-card">
          <span>Уникальных авторов</span>
          <strong>{data.cards.uniqueAuthors}</strong>
        </article>
        <article className="stat-card">
          <span>Уникальных keyword</span>
          <strong>{data.cards.uniqueKeywords}</strong>
        </article>
        <article className="stat-card">
          <span>Последняя публикация</span>
          <strong>{formatDate(data.cards.latestPublication)}</strong>
        </article>
      </div>

      <div className="analytics-grid">
        <RankingTable rows={data.byLanguage} title="Распределение по языку" />
        <RankingTable rows={data.byAuthor} title="Топ авторов" />
        <RankingTable rows={data.byKeyword} title="Топ keyword" />
        <RankingTable rows={data.byDay} title="Публикации по дням" />
      </div>
    </section>
  );
}
