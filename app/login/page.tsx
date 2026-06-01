import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { getCurrentSession } from "@/lib/users";

const errorMap: Record<string, string> = {
  AccessDenied: "Доступ запрещен. Верефицируй гугл аккаунт.",
  OAuthSignin: "Ты запорол аутентификацию. как..",
  OAuthCallbackError: "Гугл вернул ошибку.",
  OAuthCreateAccount: "Полный провал создания сессии.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await getCurrentSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const message = params.error ? errorMap[params.error] ?? "Sign-in error." : null;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="login-brand">
          <img src="/mascot.svg" alt="Bad News Bears" width="80" height="80" />
          <div>
            <p className="brand-eyebrow" style={{ margin: 0 }}>
              <span>bnb · news desk</span>
              <span className="sep">·</span>
              <span className="live">live</span>
            </p>
            <span className="topbar-title">Новости</span>
          </div>
        </div>

        <span className="badge">BAD NEWS BEARS новости</span>
        <h1>Зарегестрироваться</h1>
        <p className="muted">
          Для доступа к новостным лентам и аналитике, доступным только пользователям, требуется аутентификация.
        </p>

        {message ? <div className="alert">{message}</div> : null}

        <GoogleSignInButton />

        <div className="hint-block">
          <h2>Что внутри?</h2>
          <ul>
            <li>PostgreSQL храним там ваши данные</li>
            <li>Гарантируем что у новости будет максимальное количество информации</li>
            <li>ААААналитика по уже существущим новостям и статьям</li>
            <li>Без NewsApiKey у пользователя есть возможность сделать 3 запроса</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
