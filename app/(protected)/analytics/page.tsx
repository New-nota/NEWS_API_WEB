import { getAnalyticsForUser } from "@/lib/analytics";
import { getCurrentAppUser } from "@/lib/users";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const data = await getAnalyticsForUser(appUser.id);

  return (
    <div>
      <h1>Anal</h1>
      <p>Всего моих новостей: {data.summary.total_user_news}</p>
      <p>Уникальных статей: {data.summary.unique_articles}</p>
      <p>Успешных запросов: {data.requests.success_count}</p>
      <p>Отклоненных статей: {data.requests.total_rejected_articles}</p>
    </div>
  );
}
