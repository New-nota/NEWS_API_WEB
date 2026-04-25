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
        <div className="badge">BAD NEWS BEARS новости</div>
        <h1>Зарегестрироваться</h1>
        <p className="muted">
          Для доступа к новостным лентам и аналитике, доступным только пользователям, требуется аутентификация.
        </p>

        {message ? <div className="alert">{message}</div> : null}

        <GoogleSignInButton />

        <div className="hint-block">
          <h2>Что внутри?</h2>
          <ul>
            <li>PostgreSQL храним там ваши данные &#10084;</li>
            <li>Гарантируем что у новости будет максимальное количество информации</li>
            <li>АНАЛитика по уже существущим новостям и статьям</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
