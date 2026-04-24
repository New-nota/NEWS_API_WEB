import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { getCurrentSession } from "@/lib/users";

const errorMap: Record<string, string> = {
  AccessDenied: "Access denied. Verify that your Google account is confirmed.",
  OAuthSignin: "Failed to start Google sign-in flow.",
  OAuthCallbackError: "Google returned an OAuth callback error.",
  OAuthCreateAccount: "Failed to create a user session.",
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
        <div className="badge">News ETL Dashboard</div>
        <h1>Sign in to your dashboard</h1>
        <p className="muted">
          Authentication is required to access user-scoped news feeds and analytics.
        </p>

        {message ? <div className="alert">{message}</div> : null}

        <GoogleSignInButton />

        <div className="hint-block">
          <h2>Inside the app</h2>
          <ul>
            <li>PostgreSQL news feed view</li>
            <li>Filtering by keyword, author and language</li>
            <li>Analytics by search requests and loaded data</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
