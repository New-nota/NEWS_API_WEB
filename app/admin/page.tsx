import { auth } from "@/auth"; // TODO: point to wherever your Auth.js v5 config exports `auth`
import { getAdminStats } from "@/lib/admin-stats"; // TODO: adjust to your path alias

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ---------- helpers ----------
const nf = new Intl.NumberFormat("ru-RU");
const n = (x: unknown) => Number(x ?? 0);
const fmt = (x: unknown) => nf.format(n(x));

function isAdmin(email?: string | null) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

function fmtDuration(sec: number) {
  if (!sec || sec <= 0) return "—";
  if (sec < 60) return `${sec.toFixed(1)} с`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m} м ${s} с`;
}

// ---------- presentational ----------
function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-neutral-50">{value}</div>
      {sub && <div className="mt-1 text-sm text-neutral-400">{sub}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">{title}</h2>
      {children}
    </div>
  );
}

function BarList({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <div className="text-sm text-neutral-500">нет данных</div>;
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-40 shrink-0 truncate text-sm text-neutral-300" title={r.label}>
            {r.label}
          </div>
          <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-neutral-800/60">
            <div
              className="h-full rounded-md bg-teal-500/70"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
          <div className="w-14 shrink-0 text-right text-sm tabular-nums text-neutral-200">
            {fmt(r.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function DayBars({ rows }: { rows: { day: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <div className="text-sm text-neutral-500">нет данных</div>;
  return (
    <div className="flex h-32 items-end gap-1">
      {rows.map((r, i) => (
        <div
          key={i}
          className="group relative flex-1 rounded-t bg-teal-500/60 transition-colors hover:bg-teal-400"
          style={{ height: `${Math.max(2, (r.value / max) * 100)}%` }}
          title={`${r.day}: ${fmt(r.value)}`}
        />
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    done: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    error: "bg-red-500/15 text-red-300 border-red-500/30",
    failed: "bg-red-500/15 text-red-300 border-red-500/30",
    queued: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    processing: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };
  const cls = map[status] ?? "bg-neutral-700/30 text-neutral-300 border-neutral-600/40";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>
  );
}

// ---------- page ----------
export default async function AdminPage() {
  const session = await auth();

  if (!isAdmin(session?.user?.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-neutral-100">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 text-center">
          <div className="text-2xl font-semibold">Доступ только для админов</div>
          <div className="mt-2 text-sm text-neutral-400">
            Добавь свой email в переменную окружения <code className="text-teal-300">ADMIN_EMAILS</code>.
          </div>
        </div>
      </div>
    );
  }

  let stats: Awaited<ReturnType<typeof getAdminStats>>;
  try {
    stats = await getAdminStats();
  } catch (e) {
    return (
      <div className="min-h-screen bg-neutral-950 p-8 text-red-400">
        Ошибка загрузки статистики: {String(e instanceof Error ? e.message : e)}
      </div>
    );
  }

  const {
    kpis,
    topKeywords,
    topUsers,
    requestsPerDay,
    statusBreakdown,
    timing,
    tokensPerDay,
    sentiment,
    signupsPerDay,
    recentRequests,
  } = stats;

  const total = n(kpis.total_requests);
  const done = n(kpis.requests_done);
  const successRate = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-neutral-100 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold">Панель статистики</h1>
          <span className="text-sm text-neutral-500">{session?.user?.email}</span>
        </header>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card label="Пользователи" value={fmt(kpis.total_users)} sub={`+${fmt(kpis.new_users_7d)} за 7 дней`} />
          <Card label="Активны (7д)" value={fmt(kpis.active_7d)} sub={`${fmt(kpis.active_30d)} за 30 дней`} />
          <Card label="Запросы" value={fmt(kpis.total_requests)} sub={`${fmt(kpis.requests_7d)} за 7 дней`} />
          <Card label="Успешно" value={`${successRate}%`} sub={`${fmt(kpis.requests_error)} ошибок · ${fmt(kpis.requests_pending)} в очереди`} />
          <Card label="ИИ-сводок" value={fmt(kpis.total_reports)} />
          <Card label="Токенов Mistral" value={fmt(kpis.total_tokens)} />
          <Card label="Статей в базе" value={fmt(kpis.total_articles)} />
          <Card label="Триал-запросов" value={fmt(kpis.trial_requests)} sub={`ср. время ${fmtDuration(n(timing.avg_seconds))}`} />
        </div>

        {/* Time series */}
        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Запросы по дням (30 дней)">
            <DayBars rows={requestsPerDay.map((r) => ({ day: r.day, value: n(r.c) }))} />
          </Section>
          <Section title="Расход токенов по дням (30 дней)">
            <DayBars rows={tokensPerDay.map((r) => ({ day: r.day, value: n(r.tokens) }))} />
          </Section>
          <Section title="Регистрации по дням (30 дней)">
            <DayBars rows={signupsPerDay.map((r) => ({ day: r.day, value: n(r.c) }))} />
          </Section>
          <Section title="Статусы запросов">
            <BarList rows={statusBreakdown.map((r) => ({ label: r.status, value: n(r.c) }))} />
          </Section>
        </div>

        {/* Top lists */}
        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Самые частые запросы">
            <BarList rows={topKeywords.map((r) => ({ label: r.keyword, value: n(r.c) }))} />
          </Section>
          <Section title="Топ пользователей по запросам">
            <BarList rows={topUsers.map((r) => ({ label: r.email, value: n(r.c) }))} />
          </Section>
          <Section title="Тональность ИИ-сводок">
            <BarList rows={sentiment.map((r) => ({ label: r.label, value: n(r.c) }))} />
          </Section>
          <Section title="Время обработки">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Среднее (done)</span>
                <span className="tabular-nums text-neutral-100">{fmtDuration(n(timing.avg_seconds))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Максимум</span>
                <span className="tabular-nums text-neutral-100">{fmtDuration(n(timing.max_seconds))}</span>
              </div>
            </div>
          </Section>
        </div>

        {/* Live feed */}
        <Section title="Последние запросы">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-neutral-500">
                <tr className="border-b border-neutral-800">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Запрос</th>
                  <th className="py-2 pr-4">Пользователь</th>
                  <th className="py-2 pr-4">Статус</th>
                  <th className="py-2 pr-4">Когда</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-900">
                    <td className="py-2 pr-4 tabular-nums text-neutral-500">{r.id}</td>
                    <td className="py-2 pr-4 text-neutral-200">
                      {r.keyword}
                      {r.is_trial && <span className="ml-2 text-xs text-amber-400">trial</span>}
                    </td>
                    <td className="py-2 pr-4 text-neutral-400">{r.email}</td>
                    <td className="py-2 pr-4">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="py-2 pr-4 tabular-nums text-neutral-500">{r.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </div>
  );
}
