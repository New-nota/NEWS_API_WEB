import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/signout-button";
import { getCurrentSession } from "@/lib/users";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">
          <img src="/mascot.svg" alt="Bad News Bears" width="48" height="48" />
          <div>
            <p className="brand-eyebrow">
              <span>bnb · news desk</span>
              <span className="sep">·</span>
              <span className="live">live</span>
            </p>
            <span className="topbar-title">Новости</span>
          </div>
        </div>

        <div className="topbar-actions">
          <nav className="nav-links">
            <Link href="/dashboard">Найти по слову</Link>
            <Link href="/analytics">ААААналитика</Link>
            <Link href="/profile">Профиль</Link>
          </nav>
          <div className="user-block">
            <div className="name-block">
              <div className="user-name">{session.user.name ?? "User"}</div>
              <div className="user-email">{session.user.email ?? "email-not-available"}</div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="content">{children}</main>
    </div>
  );
}
