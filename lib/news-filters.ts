import { NEWS_LIMIT_MAX, NEWS_TEXT_MAX_LENGTH, type NewsFilters } from "@/lib/news";
import { parseBoundedInteger, parseOptionalLanguage, parseOptionalText, parseSingleValue } from "@/lib/validation";

export type ParsedNewsFilters = NewsFilters & {
  page: number;
  limit: number;
};

type RawFilterInput = {
  q?: unknown;
  keyword?: unknown;
  author?: unknown;
  language?: unknown;
  page?: unknown;
  limit?: unknown;
};

function parseNewsFilters(input: RawFilterInput): ParsedNewsFilters {
  return {
    q: parseOptionalText(input.q, {
      field: "q",
      maxLength: NEWS_TEXT_MAX_LENGTH,
    }),
    keyword: parseOptionalText(input.keyword, {
      field: "keyword",
      maxLength: NEWS_TEXT_MAX_LENGTH,
    }),
    author: parseOptionalText(input.author, {
      field: "author",
      maxLength: NEWS_TEXT_MAX_LENGTH,
    }),
    language: parseOptionalLanguage(input.language),
    page: parseBoundedInteger(input.page, {
      field: "page",
      min: 1,
      max: 100_000,
      defaultValue: 1,
    }),
    limit: parseBoundedInteger(input.limit, {
      field: "limit",
      min: 1,
      max: NEWS_LIMIT_MAX,
      defaultValue: 20,
    }),
  };
}

export function parseNewsFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): ParsedNewsFilters {
  return parseNewsFilters({
    q: parseSingleValue(searchParams.q),
    keyword: parseSingleValue(searchParams.keyword),
    author: parseSingleValue(searchParams.author),
    language: parseSingleValue(searchParams.language),
    page: parseSingleValue(searchParams.page),
    limit: parseSingleValue(searchParams.limit),
  });
}

export function parseNewsFiltersFromUrl(url: string): ParsedNewsFilters {
  const { searchParams } = new URL(url);
  return parseNewsFilters({
    q: searchParams.get("q"),
    keyword: searchParams.get("keyword"),
    author: searchParams.get("author"),
    language: searchParams.get("language"),
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  });
}

