import { redirect } from "next/navigation";
import { NewsApiKeyForm } from "@/components/profile/news-api-key-form";
import { getNewsApiKeyStatusForUser } from "@/lib/user-news-api-key";
import { getCurrentAppUser } from "@/lib/users";

export default async function ProfilePage() {
  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/login");
  }

  const newsApiKeyStatus = await getNewsApiKeyStatusForUser(user.id);

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
            <span className="muted">Имя</span>
            <strong>{user.name ?? "Не указано"}</strong>
          </div>

          <div className="profile-row">
            <span className="muted">Почта</span>
            <strong>{user.email}</strong>
          </div>

          <div className="profile-row">
            <span className="muted">NewsAPI ключик</span>
            <strong>
              {newsApiKeyStatus.hasNewsApiKey
                ? `Сохранён, заканчивается на ${newsApiKeyStatus.last4}`
                : "Не добавлен"}
            </strong>
          </div>
        </div>
      </section>

      <section className="card stack">
        <h2>Сохранить NewsAPI ключик</h2>
        <p className="muted">
         Твой ключ как парень 8 летней девочки. Тоже не тут и тоже под замком
        </p>

        <NewsApiKeyForm initialStatus={newsApiKeyStatus} />
      </section>
    </div>
  );
}