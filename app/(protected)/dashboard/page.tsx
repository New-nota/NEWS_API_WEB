import { FilterForm } from "@/components/dashboard/filter-form";
import { NewsTable } from "@/components/dashboard/news-table";
import { listNews } from "@/lib/news";
import Link from "next/link";

function asSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function buildPageHref(
  currentParams: Record<string, string | string[] | undefined>,
  page: number,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(currentParams)) {
    const singleValue = asSingleValue(value);
    if (singleValue) {
      params.set(key, singleValue);
    }
  }

  params.set("page", String(page));
  return `/dashboard?${params.toString()}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};

  const filters = {
    q: asSingleValue(params.q),
    keyword: asSingleValue(params.keyword),
    author: asSingleValue(params.author),
    language: asSingleValue(params.language),
    page: Number(asSingleValue(params.page) ?? 1),
    limit: Number(asSingleValue(params.limit) ?? 20),
  };

  const data = await listNews(filters);

  return (
    <section className="stack">
      <div className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Лента</p>
            <h2>Новости из PostgreSQL</h2>
          </div>
          <div className="stats-inline">
            <span>Всего: {data.total}</span>
            <span>Страница: {data.page}</span>
            <span>Лимит: {data.limit}</span>
          </div>
        </div>

        <FilterForm
          current={{
            q: filters.q,
            keyword: filters.keyword,
            author: filters.author,
            language: filters.language,
            limit: data.limit,
          }}
          options={data.options}
        />
      </div>

      <div className="card">
        <NewsTable rows={data.rows} />

        <div className="pagination">
          {data.page > 1 ? (
            <Link className="button button-secondary" href={buildPageHref(params, data.page - 1)}>
              ← Назад
            </Link>
          ) : (
            <span />
          )}

          <span>
            {data.page} / {data.totalPages}
          </span>

          {data.page < data.totalPages ? (
            <Link className="button button-secondary" href={buildPageHref(params, data.page + 1)}>
              Вперёд →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </section>
  );
}
