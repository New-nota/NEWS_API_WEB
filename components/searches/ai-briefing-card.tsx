import {
  formatSentimentLabel,
  formatSentimentScore,
  type AIReport,
} from "@/lib/ai-report";

type AIBriefingCardProps = {
  aiReport: AIReport | null;
  searchStatus: string;
};

const DEFAULT_WARNINGS = ["Analysis is based on available article metadata."];

function safeArray(input: string[] | null | undefined): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item) => typeof item === "string" && item.trim().length > 0);
}

function clampPercent(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function StateMessage({ tone, children }: { tone: "muted" | "alert" | "success"; children: React.ReactNode }) {
  if (tone === "alert") return <p className="alert">{children}</p>;
  if (tone === "success") return <p className="success-message">{children}</p>;
  return <p className="muted">{children}</p>;
}

export function AIBriefingCard({ aiReport, searchStatus }: AIBriefingCardProps) {
  if (searchStatus === "queued") {
    return (
      <section className="card stack">
        <h2>Сводка от ИИ</h2>
        <StateMessage tone="muted">
          Сводка от ИИ появится когда создастся запрос.
        </StateMessage>
      </section>
    );
  }

  if (searchStatus === "running") {
    return (
      <section className="card stack">
        <h2>ИИ сводка</h2>
        <StateMessage tone="muted">
          Новости в процессе обработки. ИИ сводка появится после загрузки статей.
        </StateMessage>
      </section>
    );
  }

  if (searchStatus === "success" && aiReport === null) {
    return (
      <section className="card stack">
        <h2>ИИ сводка</h2>
        <StateMessage tone="muted">
          ИИ сводка пока не доступна по данному запросу.
        </StateMessage>
      </section>
    );
  }

  if (aiReport === null) {
    return (
      <section className="card stack">
        <h2>ИИ сводка</h2>
        <StateMessage tone="muted"> ИИ сводка не доступна для данного запроса </StateMessage>
      </section>
    );
  }

  if (aiReport.status === "pending") {
    return (
      <section className="card stack">
        <h2>ИИ сводка</h2>
        <StateMessage tone="muted">
          ИИ сводка генерируется. Обновите страницу.
        </StateMessage>
      </section>
    );
  }

  if (aiReport.status === "failed") {
    return (
      <section className="card stack">
        <h2>ИИ сводка</h2>
        <StateMessage tone="alert">
          ИИ сводка не сгенерирована. Нет новостей.
        </StateMessage>
        {aiReport.error_text ? <p className="muted">Reason: {aiReport.error_text}</p> : null}
      </section>
    );
  }

  const keyPoints = safeArray(aiReport.key_points);
  const topics = safeArray(aiReport.main_topics);
  const highlights = safeArray(aiReport.highlights);
  const warnings = safeArray(aiReport.data_quality_warnings);

  const sentimentLabel = formatSentimentLabel(aiReport.sentiment_label);
  const sentimentScore = formatSentimentScore(aiReport.sentiment_score);
  const distribution = aiReport.sentiment_distribution;

  const subtitle = [`Summary based on ${aiReport.news_count} news articles`];
  if (aiReport.model_name) {
    subtitle.push(`model: ${aiReport.model_provider ? `${aiReport.model_provider}/` : ""}${aiReport.model_name}`);
  }

  return (
    <section className="card stack">
      <div className="section-header">
        <div>
          <h2>ИИ сводка</h2>
          <p className="muted">{subtitle.join(" • ")}</p>
        </div>
      </div>

      {aiReport.summary ? (
        <p>{aiReport.summary}</p>
      ) : (
        <p className="muted">ИИ обзор не доступен для этого запроса</p>
      )}

      {keyPoints.length > 0 ? (
        <div className="stack">
          <h3>Ключевые моменты</h3>
          <ul>
            {keyPoints.map((point, index) => (
              <li key={`${index}-${point.slice(0, 32)}`}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {(sentimentLabel || sentimentScore) && (
        <div className="stack">
          <h3>Настроение</h3>
          <div className="ranking-row">
            <span>{sentimentLabel ?? "Unknown"}</span>
            {sentimentScore ? <strong>{sentimentScore}</strong> : null}
          </div>
        </div>
      )}

      {distribution ? (
        <div className="stack">
          <h3>Распределение настроений</h3>
          <div className="stats-grid">
            <article className="stat-card">
              <span>Позитивное</span>
              <strong>{clampPercent(distribution.positive_percent)}%</strong>
            </article>
            <article className="stat-card">
              <span>Нейтральное</span>
              <strong>{clampPercent(distribution.neutral_percent)}%</strong>
            </article>
            <article className="stat-card">
              <span>Негативное</span>
              <strong>{clampPercent(distribution.negative_percent)}%</strong>
            </article>
          </div>
        </div>
      ) : null}

      {topics.length > 0 ? (
        <div className="stack">
          <h3>Главные темы</h3>
          <div className="topic-badges">
            {topics.map((topic) => (
              <span className="badge" key={topic}>
                {topic}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {highlights.length > 0 ? (
        <div className="stack">
          <h3>Основные моменты</h3>
          <ul>
            {highlights.map((highlight, index) => (
              <li key={`${index}-${highlight.slice(0, 32)}`}>{highlight}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="stack">
        <h3>Качество данных и ограничения</h3>
        <ul>
          {(warnings.length > 0 ? warnings : DEFAULT_WARNINGS).map((warning, index) => (
            <li key={`${index}-${warning.slice(0, 32)}`}>{warning}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
