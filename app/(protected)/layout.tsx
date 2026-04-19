import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/signout-button";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">News ETL</p>
          <h1 className="topbar-title">Панель управления новостями</h1>
        </div>

        <div className="topbar-actions">
          <nav className="nav-links">
            <Link href="/dashboard">Лента</Link>
            <Link href="/analytics">Аналитика</Link>
          </nav>
          <div className="user-block">
            <div>
              <div className="user-name">{session.user.name ?? "Пользователь"}</div>
              <div className="user-email">{session.user.email}</div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="content">{children}</main>
    </div>
  );
}
