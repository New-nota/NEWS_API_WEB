import { SENTIMENT_LABELS, type AISentimentLabel } from "@/lib/ai-report";

type AIAnalyticsSectionProps = {
  ai: {
    total_reports: number;
    failed_reports: number;
    avg_sentiment_score: number | null;
    positive_count: number;
    neutral_positive_count: number;
    neutral_count: number;
    neutral_negative_count: number;
    negative_count: number;
    top_topics: Array<{
      topic: string;
      count: number;
    }>;
  };
};

const SENTIMENT_ROWS: Array<{ key: AISentimentLabel; field: keyof AIAnalyticsSectionProps["ai"] }> = [
  { key: "positive", field: "positive_count" },
  { key: "neutral_positive", field: "neutral_positive_count" },
  { key: "neutral", field: "neutral_count" },
  { key: "neutral_negative", field: "neutral_negative_count" },
  { key: "negative", field: "negative_count" },
];

function formatAvg(score: number | null): string {
  if (score === null || !Number.isFinite(score)) return "—";
  return score.toFixed(2);
}

export function AIAnalyticsSection({ ai }: AIAnalyticsSectionProps) {
  const hasAnyReport = ai.total_reports > 0 || ai.failed_reports > 0;

  return (
    <>
      <section className="card stack">
        <h2>ИИ обзоры</h2>
        {!hasAnyReport ? (
          <p className="muted">Пока нет ИИ сводок. Сделайте первый запрос чтобы начать.</p>
        ) : null}

        <div className="stats-grid">
          <article className="stat-card">
            <span>Всего ИИ обзоров</span>
            <strong>{ai.total_reports}</strong>
          </article>
          <article className="stat-card">
            <span>Неполучившиеся ИИ обзоры</span>
            <strong>{ai.failed_reports}</strong>
          </article>
          <article className="stat-card">
            <span>Средний балл настроений</span>
            <strong>{formatAvg(ai.avg_sentiment_score)}</strong>
          </article>
        </div>
      </section>

      <section className="card stack">
        <h2>Распределение настроений</h2>
        <div className="ranking-list">
          {SENTIMENT_ROWS.map(({ key, field }) => (
            <div className="ranking-row" key={key}>
              <span>{SENTIMENT_LABELS[key]}</span>
              <strong>{ai[field] as number}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h2>Популярныы ИИ заголовки</h2>
        {ai.top_topics.length === 0 ? (
          <p className="muted">Пока нет заголовков.</p>
        ) : (
          <div className="ranking-list">
            {ai.top_topics.map((item) => (
              <div className="ranking-row" key={`${item.topic}-${item.count}`}>
                <span>{item.topic}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
