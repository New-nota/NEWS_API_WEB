import Link from "next/link";
import { redirect } from "next/navigation";
import { FilterForm } from "@/components/dashboard/filter-form";
import { NewsTable } from "@/components/dashboard/news-table";
import { NewsApiKeyForm } from "@/components/profile/news-api-key-form";
import { getUserNewsFilterOptions, listNewsForUser } from "@/lib/news";
import { parseNewsFiltersFromSearchParams, type ParsedNewsFilters } from "@/lib/news-filters";
import { getNewsApiKeyStatusForUser } from "@/lib/user-news-api-key";
import { getCurrentAppUser } from "@/lib/users";

type ProfileSearchParams = Record<string, string | string[] | undefined>;

function buildProfileQuery(filters: ParsedNewsFilters, overrides: Partial<ParsedNewsFilters>) {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (merged.q) params.set("q", merged.q);
  if (merged.keyword) params.set("keyword", merged.keyword);
  if (merged.author) params.set("author", merged.author);
  if (merged.language) params.set("language", merged.language);
  params.set("page", String(merged.page));
  params.set("limit", String(merged.limit));

  return `/profile?${params.toString()}`;
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<ProfileSearchParams>;
}) {
  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = parseNewsFiltersFromSearchParams(resolvedSearchParams);

  const [newsApiKeyStatus, newsData, filterOptions] = await Promise.all([
    getNewsApiKeyStatusForUser(user.id),
    listNewsForUser(user.id, filters),
    getUserNewsFilterOptions(user.id),
  ]);

  const hasPrevPage = filters.page > 1;
  const hasNextPage = filters.page < newsData.totalPages;
  return (
    <div className="stack">
      <section className="card stack">
        <div className="section-header">
          <div>
            <h1>Профиль</h1>
            <p className="muted">Данные аккаунта и NewsAPI ключ</p>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-row">
            <span className="muted">Имя: </span>
            <strong>{user.name ?? "Не указано"}</strong>
          </div>

          <div className="profile-row">
            <span className="muted">Почта: </span>
            <strong>{user.email}</strong>
          </div>

          <div className="profile-row">
            <span className="muted">NewsAPI ключик: </span>
            <strong>
              {newsApiKeyStatus.hasNewsApiKey
                ? `Сохранён, заканчивается на ${newsApiKeyStatus.last4}`
                : "Не добавлен"}
            </strong>
          </div>
        </div>
      </section>

      <section className="card stack">
        <h2>Сохранить NewsAPI ключ</h2>
        <p className="muted">
         Ключ защищен шифрованием. 
        </p>

        <NewsApiKeyForm initialStatus={newsApiKeyStatus} />
      </section>
      <section className="card stack">
  <div className="section-header">
    <h2>Мои новости</h2>
    <p className="muted">
      Итого: {newsData.total} - страница {filters.page} / {newsData.totalPages}
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
      <Link className="button button-secondary" href={buildProfileQuery(filters, { page: filters.page - 1 })}>
        Предыдущая
      </Link>
    ) : (
      <span className="button button-secondary disabled">Пердыдущая</span>
    )}

    {hasNextPage ? (
      <Link className="button button-secondary" href={buildProfileQuery(filters, { page: filters.page + 1 })}>
        Следущая
      </Link>
    ) : (
      <span className="button button-secondary disabled">Следущая</span>
    )}
  </div>
</section>
    </div>
  );
}