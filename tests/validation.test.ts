import assert from "node:assert/strict";
import test from "node:test";
import { checkRateLimit } from "../lib/rate-limit";
import {
  parseBoundedInteger,
  parseLanguage,
  parseOptionalLanguage,
  parseOptionalText,
  parseStrictPositiveInteger,
} from "../lib/validation";

test("parseBoundedInteger clamps and defaults", () => {
  assert.equal(
    parseBoundedInteger("Infinity", {
      field: "page",
      min: 1,
      max: 50,
      defaultValue: 1,
    }),
    1,
  );

  assert.equal(
    parseBoundedInteger("999", {
      field: "page",
      min: 1,
      max: 50,
      defaultValue: 1,
    }),
    50,
  );
});

test("parseStrictPositiveInteger validates positive integer", () => {
  assert.equal(parseStrictPositiveInteger("5", "id"), 5);
  assert.throws(() => parseStrictPositiveInteger("-1", "id"));
  assert.throws(() => parseStrictPositiveInteger("abc", "id"));
});

test("text and language validation normalize values", () => {
  assert.equal(
    parseOptionalText("  hello  ", {
      field: "q",
      maxLength: 10,
    }),
    "hello",
  );
  assert.equal(parseLanguage("EN"), "en");
  assert.equal(parseOptionalLanguage(undefined), undefined);
  assert.throws(() =>
    parseOptionalText("x".repeat(11), {
      field: "q",
      maxLength: 10,
    }),
  );
});

test("rate limiter blocks requests above threshold", () => {
  const key = `test-key-${Date.now()}`;
  const config = { windowMs: 10_000, maxRequests: 2 };

  assert.equal(checkRateLimit(key, config).allowed, true);
  assert.equal(checkRateLimit(key, config).allowed, true);

  const blocked = checkRateLimit(key, config);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 1);
});
