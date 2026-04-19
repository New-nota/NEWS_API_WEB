import { auth } from "@/auth";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { redirect } from "next/navigation";

const errorMap: Record<string, string> = {
  AccessDenied: "Вход отклонён. Проверь, что аккаунт Google подтверждён.",
  OAuthSignin: "Не удалось начать вход через Google.",
  OAuthCallbackError: "Google вернул ошибку при входе.",
  OAuthCreateAccount: "Не удалось создать сессию пользователя.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const message = params.error ? errorMap[params.error] ?? "Ошибка входа." : null;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="badge">News ETL Dashboard</div>
        <h1>Веб-морда для проекта по новостям</h1>
        <p className="muted">
          Логин нужен, чтобы пускать пользователя внутрь дашборда с лентой новостей и
          аналитикой.
        </p>

        {message ? <div className="alert">{message}</div> : null}

        <GoogleSignInButton />

        <div className="hint-block">
          <h2>Что внутри</h2>
          <ul>
            <li>Просмотр новостей из PostgreSQL</li>
            <li>Фильтрация по keyword, author, language</li>
            <li>Страница аналитики по данным ETL</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
