import { SearchRequestForm } from "@/components/dashboard/search-request-form";
import { listNewsForUser } from "@/lib/news";
import { listSearchRequestsForUser } from "@/lib/searches";
import { getCurrentAppUser } from "@/lib/users";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const appUser = await getCurrentAppUser();
  if (!appUser) redirect("/login");

  const [newsData, searches] = await Promise.all([
    listNewsForUser(appUser.id, { page: 1, limit: 20 }),
    listSearchRequestsForUser(appUser.id, 20),
  ]);

  return (
    <div>
      <h1>Dashboard</h1>
      <SearchRequestForm />
      <section>
        <h2>Мои запросы</h2>
        {searches.map((item) =>(
          <div key={item.id}>
            <strong>{item.keyword}</strong> - {item.status}
          </div>
        ))}
      </section>
      <section>
        <h2>Мои новости</h2>
        {newsData.rows.map((item) => (
          <article key={`${item.search_request_id}-${item.id}`}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>))}
      </section>
    </div>
  );
}
