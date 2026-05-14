export type AIReportStatus = "success" | "failed" | "pending";

export type AISentimentLabel =
  | "positive"
  | "neutral_positive"
  | "neutral"
  | "neutral_negative"
  | "negative";

export type AISentimentDistribution = {
  positive: number;
  neutral: number;
  negative: number;
};
export type AIHighlight = {
  url: string;
  title: string;
  author?: string | null;
  description?: string | null;
  reason: string
};

export type AIReport = {
  status: AIReportStatus;
  error_text: string | null;
  model_provider: string | null;
  model_name: string | null;
  news_count: number;
  summary: string | null;
  key_points: string[] | null;
  sentiment_label: AISentimentLabel | null;
  sentiment_score: number | null;
  sentiment_distribution: AISentimentDistribution | null;
  main_topics: string[] | null;
  highlights: AIHighlight[]| null;
  data_quality_warnings: string[] | null;
  created_at: string | null;
};

export const SENTIMENT_LABELS = {
  positive: "Positive",
  neutral_positive: "Mostly positive",
  neutral: "Neutral",
  neutral_negative: "Mostly negative",
  negative: "Negative",
} as const;

export function formatSentimentLabel(label: AISentimentLabel | null | undefined): string | null {
  if (!label) return null;
  return SENTIMENT_LABELS[label] ?? null;
}

export function formatSentimentScore(score: number | null | undefined): string | null {
  if (score === null || score === undefined || !Number.isFinite(score)) return null;
  return score.toFixed(2);
}

export function getDominantSentiment(
  distribution: AISentimentDistribution | null | undefined,
): "positive" | "neutral" | "negative" | null {
  if (!distribution) return null;

  const { positive, neutral, negative } = distribution;
  if (
    !Number.isFinite(positive) ||
    !Number.isFinite(neutral) ||
    !Number.isFinite(negative)
  ) {
    return null;
  }

  const max = Math.max(positive, neutral, negative);
  if (max <= 0) return null;
  if (max === positive) return "positive";
  if (max === negative) return "negative";
  return "neutral";
}
