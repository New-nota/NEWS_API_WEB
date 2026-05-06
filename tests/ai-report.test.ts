import assert from "node:assert/strict";
import test from "node:test";
import {
  formatSentimentLabel,
  formatSentimentScore,
  getDominantSentiment,
  SENTIMENT_LABELS,
} from "../lib/ai-report";

test("formatSentimentLabel maps known labels", () => {
  assert.equal(formatSentimentLabel("positive"), SENTIMENT_LABELS.positive);
  assert.equal(formatSentimentLabel("neutral_positive"), SENTIMENT_LABELS.neutral_positive);
  assert.equal(formatSentimentLabel("neutral"), SENTIMENT_LABELS.neutral);
  assert.equal(formatSentimentLabel("neutral_negative"), SENTIMENT_LABELS.neutral_negative);
  assert.equal(formatSentimentLabel("negative"), SENTIMENT_LABELS.negative);
});

test("formatSentimentLabel returns null for null/undefined", () => {
  assert.equal(formatSentimentLabel(null), null);
  assert.equal(formatSentimentLabel(undefined), null);
});

test("formatSentimentScore formats finite numbers and rejects others", () => {
  assert.equal(formatSentimentScore(0.5), "0.50");
  assert.equal(formatSentimentScore(-0.123), "-0.12");
  assert.equal(formatSentimentScore(null), null);
  assert.equal(formatSentimentScore(undefined), null);
  assert.equal(formatSentimentScore(Number.NaN), null);
  assert.equal(formatSentimentScore(Number.POSITIVE_INFINITY), null);
});

test("getDominantSentiment returns the highest bucket", () => {
  assert.equal(
    getDominantSentiment({ positive_percent: 60, neutral_percent: 30, negative_percent: 10 }),
    "positive",
  );
  assert.equal(
    getDominantSentiment({ positive_percent: 10, neutral_percent: 30, negative_percent: 60 }),
    "negative",
  );
  assert.equal(
    getDominantSentiment({ positive_percent: 20, neutral_percent: 70, negative_percent: 10 }),
    "neutral",
  );
});

test("getDominantSentiment guards against null/empty/invalid input", () => {
  assert.equal(getDominantSentiment(null), null);
  assert.equal(getDominantSentiment(undefined), null);
  assert.equal(
    getDominantSentiment({ positive_percent: 0, neutral_percent: 0, negative_percent: 0 }),
    null,
  );
  assert.equal(
    getDominantSentiment({
      positive_percent: Number.NaN,
      neutral_percent: 0,
      negative_percent: 0,
    }),
    null,
  );
});
