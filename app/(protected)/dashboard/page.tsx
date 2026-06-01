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

      <header className="page-intro">
        <p className="section-title">очередь / поиск</p>
        <h1>Какие новости сегодня?</h1>
      </header>

      <section className="card stack">
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
        <header className="section-header">
          <h2>Мои запросы на поиск</h2>
        </header>
        {searches.length === 0 ? (
          <div className="state-block is-empty">
            <img src="/mascot-sleeping.svg" width="64" height="64" alt="" />
            <div className="state-copy">
              <p className="state-title">Пока тихо. Ни одного запроса.</p>
              <div className="state-sub">создай запрос выше</div>
            </div>
          </div>
        ) : (
          <div className="stack">
            {searches.map((item) => {
              const cardModifier =
                item.status === "queued" || item.status === "running"
                  ? " is-pending"
                  : item.status === "failed"
                    ? " is-failed"
                    : "";
              return (
                <article className={`request-card${cardModifier}`} key={item.id}>
                  <div>
                    <span className="keyword">{item.keyword}</span>
                    <span className={`status-badge status-${item.status}`}>{item.status}</span>
                  </div>
                  <div className="meta">
                    <span>язык {item.language}</span>
                    <span className="sep">·</span>
                    <span>стр. {item.page_size}</span>
                    <span className="sep">·</span>
                    <span>лимит {item.limit_count}</span>
                  </div>
                  {item.error_text ? <p className="alert">{item.error_text}</p> : null}
                  <Link className="button button-secondary" href={`/searches/${item.id}`}>
                    Открыть ИИ сводку
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
