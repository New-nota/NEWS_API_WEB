import {
  formatSentimentLabel,
  formatSentimentScore,
  type AIHighlight,
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
  const highlights: AIHighlight[] = Array.isArray(aiReport.highlights)? aiReport.highlights.filter((h): h is AIHighlight => h !== null && typeof h === "object"): [];
  const warnings = safeArray(aiReport.data_quality_warnings);

  const sentimentLabel = formatSentimentLabel(aiReport.sentiment_label);
  const sentimentScore = formatSentimentScore(aiReport.sentiment_score);
  const distribution = aiReport.sentiment_distribution;

  const subtitle = [`Сводка основана на ${aiReport.news_count} новостных статьях`];
  if (aiReport.model_name) {
    subtitle.push(`Модель ИИ: ${aiReport.model_provider ? `${aiReport.model_provider}/` : ""}${aiReport.model_name}`);
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
              <strong>{clampPercent(distribution.positive)}%</strong>
            </article>
            <article className="stat-card">
              <span>Нейтральное</span>
              <strong>{clampPercent(distribution.neutral)}%</strong>
            </article>
            <article className="stat-card">
              <span>Негативное</span>
              <strong>{clampPercent(distribution.negative)}%</strong>
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

      {Array.isArray(aiReport.highlights) && aiReport.highlights.filter(Boolean).length > 0 ? (
        <div className="stack">
          <h3>Основная статья</h3>
          {aiReport.highlights.filter(Boolean).map((h, index) =>(
            <article className="stat-card" key={index}>
              <a href={h.url} rel="noreferrer" target="_blank">
                <strong>{h.title}</strong>
              </a>
              {h.author ? <span className="muted">{h.author}</span> : null}
              {h.description ? <p>{h.description}</p>: null}
              <span className="muted">{h.reason}</span>
            </article>
          ))}
        </div>
      ) : null}

      <div className="stack">
        <h3 className="h3-with-mascot">
          <img src="/mascot-skeptical.svg" width="22" height="22" alt="" />
          Качество данных и ограничения
        </h3>
        <ul>
          {(warnings.length > 0 ? warnings : DEFAULT_WARNINGS).map((warning, index) => (
            <li key={`${index}-${warning.slice(0, 32)}`}>{warning}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
