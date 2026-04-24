import Link from "next/link";
import { redirect } from "next/navigation";
import { FilterForm } from "@/components/dashboard/filter-form";
import { NewsTable } from "@/components/dashboard/news-table";
import { SearchRequestForm } from "@/components/dashboard/search-request-form";
import { getUserNewsFilterOptions, listNewsForUser } from "@/lib/news";
import { parseNewsFiltersFromSearchParams, type ParsedNewsFilters } from "@/lib/news-filters";
import { listSearchRequestsForUser } from "@/lib/searches";
import { getCurrentAppUserId } from "@/lib/users";

type DashboardSearchParams = Record<string, string | string[] | undefined>;

function buildDashboardQuery(filters: ParsedNewsFilters, overrides: Partial<ParsedNewsFilters>) {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (merged.q) params.set("q", merged.q);
  if (merged.keyword) params.set("keyword", merged.keyword);
  if (merged.author) params.set("author", merged.author);
  if (merged.language) params.set("language", merged.language);
  params.set("page", String(merged.page));
  params.set("limit", String(merged.limit));

  return `/dashboard?${params.toString()}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<DashboardSearchParams>;
}) {
  const appUserId = await getCurrentAppUserId();
  if (!appUserId) redirect("/login");

  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = parseNewsFiltersFromSearchParams(resolvedSearchParams);

  const [newsData, searches, filterOptions] = await Promise.all([
    listNewsForUser(appUserId, filters),
    listSearchRequestsForUser(appUserId, 20),
    getUserNewsFilterOptions(appUserId),
  ]);

  const hasPrevPage = filters.page > 1;
  const hasNextPage = filters.page < newsData.totalPages;

  return (
    <div className="stack">
      <section className="card stack">
        <h1>Dashboard</h1>
        <SearchRequestForm />
      </section>

      <section className="card stack">
        <h2>My search requests</h2>
        {searches.length === 0 ? (
          <p className="muted">No requests yet.</p>
        ) : (
          <div className="stack">
            {searches.map((item) => (
              <article className="request-card" key={item.id}>
                <div>
                  <strong>{item.keyword}</strong>
                  <span className={`status-badge status-${item.status}`}>{item.status}</span>
                </div>
                <div className="muted">
                  language={item.language}, page_size={item.page_size}, limit_count={item.limit_count}
                </div>
                {item.error_text ? <p className="alert">{item.error_text}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card stack">
        <div className="section-header">
          <h2>My news</h2>
          <p className="muted">
            Total: {newsData.total} - Page {filters.page} / {newsData.totalPages}
          </p>
        </div>

        <FilterForm
          current={{
            q: filters.q,
            keyword: filters.keyword,
            author: filters.author,
            language: filters.language,
            limit: filters.limit,
          }}
          options={filterOptions}
        />

        <NewsTable rows={newsData.rows} />

        <div className="pagination">
          {hasPrevPage ? (
            <Link className="button button-secondary" href={buildDashboardQuery(filters, { page: filters.page - 1 })}>
              Previous
            </Link>
          ) : (
            <span className="button button-secondary disabled">Previous</span>
          )}

          {hasNextPage ? (
            <Link className="button button-secondary" href={buildDashboardQuery(filters, { page: filters.page + 1 })}>
              Next
            </Link>
          ) : (
            <span className="button button-secondary disabled">Next</span>
          )}
        </div>
      </section>
    </div>
  );
}
