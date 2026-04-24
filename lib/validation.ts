import { AppError } from "./app-error";

const ISO_LANGUAGE_RE = /^[a-z]{2}$/;

type NumberOptions = {
  field: string;
  min: number;
  max: number;
  defaultValue: number;
};

type TextOptions = {
  field: string;
  maxLength: number;
  allowEmpty?: boolean;
};

export function parseSingleValue(input: string | string[] | null | undefined): string | undefined {
  if (Array.isArray(input)) {
    return input[0];
  }
  return input ?? undefined;
}

export function parseBoundedInteger(input: unknown, options: NumberOptions): number {
  const value =
    typeof input === "number"
      ? input
      : typeof input === "string"
        ? Number(input)
        : Number.NaN;

  if (!Number.isFinite(value)) return options.defaultValue;

  const integer = Math.trunc(value);
  if (integer < options.min) return options.min;
  if (integer > options.max) return options.max;
  return integer;
}

export function parseStrictPositiveInteger(input: unknown, field: string): number {
  const value =
    typeof input === "number"
      ? input
      : typeof input === "string"
        ? Number(input)
        : Number.NaN;

  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be a positive integer`);
  }

  return value;
}

export function parseOptionalText(input: unknown, options: TextOptions): string | undefined {
  if (input === undefined || input === null) return undefined;

  if (typeof input !== "string") {
    throw new AppError(400, "VALIDATION_ERROR", `${options.field} must be a string`);
  }

  const normalized = input.trim();
  if (!options.allowEmpty && normalized.length === 0) return undefined;

  if (normalized.length > options.maxLength) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      `${options.field} must not exceed ${options.maxLength} characters`,
    );
  }

  return normalized;
}

export function parseRequiredText(input: unknown, options: TextOptions): string {
  const value = parseOptionalText(input, options);
  if (!value) {
    throw new AppError(400, "VALIDATION_ERROR", `${options.field} is required`);
  }
  return value;
}

export function parseLanguage(input: unknown, fallback = "ru"): string {
  if (input === undefined || input === null || input === "") {
    return fallback;
  }

  if (typeof input !== "string") {
    throw new AppError(400, "VALIDATION_ERROR", "language must be a string");
  }

  const value = input.trim().toLowerCase();
  if (!ISO_LANGUAGE_RE.test(value)) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Invalid language. Expected ISO 639-1 code, e.g. 'ru'",
    );
  }

  return value;
}

export function parseOptionalLanguage(input: unknown): string | undefined {
  if (input === undefined || input === null || input === "") {
    return undefined;
  }
  return parseLanguage(input);
}
