import { quoteIdentifier, quoteQualifiedIdentifier } from "@/lib/sql";

export const schema = {
  table: process.env.NEWS_TABLE ?? "bad_news_bears",
  columns: {
    id: process.env.NEWS_COL_ID ?? "id",
    title: process.env.NEWS_COL_TITLE ?? "title",
    description: process.env.NEWS_COL_DESCRIPTION ?? "description",
    author: process.env.NEWS_COL_AUTHOR ?? "author",
    url: process.env.NEWS_COL_URL ?? "url",
    publishedAt: process.env.NEWS_COL_PUBLISHED_AT ?? "published_at",
    fetchedAt: process.env.NEWS_COL_FETCHED_AT ?? "fetched_at",
    keyword: process.env.NEWS_COL_KEYWORD ?? "key_word",
    language: process.env.NEWS_COL_LANGUAGE ?? "language",
  },
};

export const newsTableSql = quoteQualifiedIdentifier(schema.table);
export const newsColumnSql = {
  id: quoteIdentifier(schema.columns.id),
  title: quoteIdentifier(schema.columns.title),
  description: quoteIdentifier(schema.columns.description),
  author: quoteIdentifier(schema.columns.author),
  url: quoteIdentifier(schema.columns.url),
  publishedAt: quoteIdentifier(schema.columns.publishedAt),
  fetchedAt: quoteIdentifier(schema.columns.fetchedAt),
  keyword: quoteIdentifier(schema.columns.keyword),
  language: quoteIdentifier(schema.columns.language),
};
