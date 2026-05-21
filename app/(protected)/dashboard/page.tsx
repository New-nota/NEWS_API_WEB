import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchRequestForm } from "@/components/dashboard/search-request-form";
import { listSearchRequestsForUser } from "@/lib/searches";
import { getCurrentAppUserId, getTrialStatus } from "@/lib/users";
import { DashboardAutoRefresh } from "@/components/dashboard/dashboard-auto-refresh";

export default async function DashboardPage() {
  const appUserId = await getCurrentAppUserId();
  if (!appUserId) redirect("/login");

  const [searches, trialStatus] = await Promise.all([
    listSearchRequestsForUser(appUserId, 20),
    getTrialStatus(appUserId),
  ]);

  const hasActiveRequests = searches.some(
    (item) => item.status === "queued" || item.status === "running",
  );

  // показываем форму если есть рабочий ключ ИЛИ есть trial запросы
  const canMakeRequests = trialStatus.hasUsableKey || trialStatus.trialsRemaining > 0;

  return (
    <div className="stack">
      <DashboardAutoRefresh hasActiveRequests={hasActiveRequests} />
      <section className="card stack">
        <h1>Какие новости сегодня?</h1>
        {canMakeRequests ? (
          <SearchRequestForm trialStatus={trialStatus} />
        ) : (
          <div className="alert">
            Пробные запросы закончились. Добавьте свой NewsAPI ключ в{" "}
            <Link href="/profile">профиле</Link>.
          </div>
        )}
      </section>

      <section className="card stack">
        <h2>Мои запросы на поиск</h2>
        {searches.length === 0 ? (
          <p className="muted">Пока нет запросов.</p>
        ) : (
          <div className="stack">
            {searches.map((item) => (
              <article className="request-card" key={item.id}>
                <div>
                  <strong>{item.keyword}</strong>
                  <span className={`status-badge status-${item.status}`}>{item.status}</span>
                </div>
                <div className="muted">
                  язык: {item.language}, размер страницы: {item.page_size}, лимит новостей: {item.limit_count}
                </div>
                {item.error_text ? <p className="alert">{item.error_text}</p> : null}
                <Link className="button button-secondary" href={`/searches/${item.id}`}>
                  Открыть ИИ сводку
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}