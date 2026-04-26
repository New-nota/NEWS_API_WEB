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
        <div>
          <p className="eyebrow">Сборник ачишуительных новостей</p>
          <h1 className="topbar-title">Новости</h1>
        </div>

        <div className="topbar-actions">
          <nav className="nav-links">
            <Link href="/dashboard">Найти по слову</Link>
            <Link href="/analytics">ААНАЛИТИКА</Link>
            <Link href="/profile">Профиль</Link>
          </nav>
          <div className="user-block">
            <div>
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
