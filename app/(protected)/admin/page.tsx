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

const KNOWN_TONES = new Set([
  "positive",
  "neutral_positive",
  "neutral",
  "neutral_negative",
  "negative",
]);

function statusTone(status: string): string | undefined {
  switch (status) {
    case "success":
      return "positive";
    case "error":
    case "failed":
      return "negative";
    case "queued":
    case "pending":
      return "neutral_negative";
    case "running":
    case "processing":
      return undefined; // default cyan fill
    default:
      return "neutral";
  }
}

function sentimentTone(label: string): string {
  const l = label.toLowerCase();
  if (KNOWN_TONES.has(l)) return l;
  if (l.includes("pos")) return "positive";
  if (l.includes("neg")) return "negative";
  return "neutral";
}

// ---------- presentational ----------
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && (
        <div className="muted" style={{ fontSize: "11px", letterSpacing: "0.02em" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Ranking({
  rows,
}: {
  rows: { label: string; value: number; tone?: string }[];
}) {
  if (rows.length === 0) return <div className="muted">нет данных</div>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="ranking-list">
      {rows.map((r, i) => (
        <div
          key={i}
          className="ranking-row has-bar"
          {...(r.tone ? { "data-tone": r.tone } : {})}
        >
          <div className="rank-head">
            <span className="rank-idx">{String(i + 1).padStart(2, "0")}</span>
            <span className="rank-label" title={r.label}>
              {r.label}
            </span>
          </div>
          <div className="rank-track">
            <div className="rank-fill" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <strong>{fmt(r.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function DayChart({ rows }: { rows: { day: string; value: number }[] }) {
  if (rows.length === 0) return <div className="muted">нет данных</div>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "120px" }}>
      {rows.map((r, i) => (
        <div
          key={i}
          title={`${r.day}: ${fmt(r.value)}`}
          style={{
            flex: 1,
            height: `${Math.max(2, (r.value / max) * 100)}%`,
            minHeight: "2px",
            background: "var(--bnb-accent)",
            opacity: 0.55,
            borderRadius: "2px 2px 0 0",
          }}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: "status-success",
    failed: "status-failed",
    error: "status-failed",
    queued: "status-queued",
    running: "status-running",
    processing: "status-running",
    pending: "status-queued",
  };
  const cls = map[status];
  if (!cls) return <span className="pill">{status}</span>;
  return (
    <span className={`status-badge ${cls}`} style={{ marginLeft: 0 }}>
      {status}
    </span>
  );
}

const num = { textAlign: "right" as const, fontVariantNumeric: "tabular-nums" as const };

// ---------- page ----------
export default async function AdminPage() {
  const session = await auth();

  if (!isAdmin(session?.user?.email)) {
    return (
      <div className="stack">
        <div className="state-block is-error">
          <div className="state-copy">
            <p className="state-title">Доступ только для админов</p>
            <div className="state-sub">
              Добавь свой email в переменную окружения ADMIN_EMAILS
            </div>
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
      <div className="stack">
        <div className="alert">
          Ошибка загрузки статистики: {String(e instanceof Error ? e.message : e)}
        </div>
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
    usersDetail,
  } = stats;

  const total = n(kpis.total_requests);
  const success = n(kpis.requests_done);
  const successRate = total ? Math.round((success / total) * 100) : 0;

  return (
    <div className="stack">
      <div className="page-intro">
        <h3 className="section-title">Admin</h3>
        <h1>Панель статистики</h1>
        <div className="meta">
          <span>{session?.user?.email}</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="stats-grid">
        <StatCard label="Пользователи" value={fmt(kpis.total_users)} sub={`+${fmt(kpis.new_users_7d)} за 7 дней`} />
        <StatCard label="Активны (7д)" value={fmt(kpis.active_7d)} sub={`${fmt(kpis.active_30d)} за 30 дней`} />
        <StatCard label="Запросы" value={fmt(kpis.total_requests)} sub={`${fmt(kpis.requests_7d)} за 7 дней`} />
        <StatCard label="Успешно" value={`${successRate}%`} sub={`${fmt(kpis.requests_error)} ошибок · ${fmt(kpis.requests_pending)} в работе`} />
        <StatCard label="ИИ-сводок" value={fmt(kpis.total_reports)} />
        <StatCard label="Токенов Mistral" value={fmt(kpis.total_tokens)} />
        <StatCard label="Статей в базе" value={fmt(kpis.total_articles)} />
        <StatCard label="Триал-запросов" value={fmt(kpis.trial_requests)} sub={`ср. время ${fmtDuration(n(timing.avg_seconds))}`} />
      </div>

      {/* Time series + status */}
      <div className="analytics-grid">
        <Panel title="Запросы по дням · 30 дней">
          <DayChart rows={requestsPerDay.map((r) => ({ day: r.day, value: n(r.c) }))} />
        </Panel>
        <Panel title="Расход токенов по дням · 30 дней">
          <DayChart rows={tokensPerDay.map((r) => ({ day: r.day, value: n(r.tokens) }))} />
        </Panel>
        <Panel title="Регистрации по дням · 30 дней">
          <DayChart rows={signupsPerDay.map((r) => ({ day: r.day, value: n(r.c) }))} />
        </Panel>
        <Panel title="Статусы запросов">
          <Ranking
            rows={statusBreakdown.map((r) => ({
              label: r.status,
              value: n(r.c),
              tone: statusTone(r.status),
            }))}
          />
        </Panel>
      </div>

      {/* Top lists */}
      <div className="analytics-grid">
        <Panel title="Самые частые запросы">
          <Ranking rows={topKeywords.map((r) => ({ label: r.keyword, value: n(r.c) }))} />
        </Panel>
        <Panel title="Топ пользователей по запросам">
          <Ranking rows={topUsers.map((r) => ({ label: r.email, value: n(r.c) }))} />
        </Panel>
        <Panel title="Тональность ИИ-сводок">
          <Ranking
            rows={sentiment.map((r) => ({
              label: r.label,
              value: n(r.c),
              tone: sentimentTone(r.label),
            }))}
          />
        </Panel>
        <Panel title="Время обработки">
          <div className="profile-grid">
            <div className="profile-row">
              <span className="muted">Среднее (success)</span>
              <strong>{fmtDuration(n(timing.avg_seconds))}</strong>
            </div>
            <div className="profile-row">
              <span className="muted">Максимум</span>
              <strong>{fmtDuration(n(timing.max_seconds))}</strong>
            </div>
          </div>
        </Panel>
      </div>

      {/* Per-user breakdown */}
      <div className="card">
        <div className="section-header">
          <h3>Пользователи — по каждому</h3>
          <span className="muted">{usersDetail.length}</span>
        </div>
        <div className="table-wrap">
          <table className="news-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th style={num}>Запросов</th>
                <th style={num}>Успех</th>
                <th style={num}>Ошибок</th>
                <th style={num}>Триал</th>
                <th>Регистрация</th>
                <th>Последний вход</th>
              </tr>
            </thead>
            <tbody>
              {usersDetail.map((u) => (
                <tr key={u.id}>
                  <td style={{ color: "var(--bnb-fg-strong)" }}>{u.name}</td>
                  <td className="muted">{u.email}</td>
                  <td style={num}>{fmt(u.requests)}</td>
                  <td style={{ ...num, color: "var(--bnb-status-success-fg)" }}>{fmt(u.success)}</td>
                  <td style={{ ...num, color: "var(--bnb-status-failed-fg)" }}>{fmt(u.errors)}</td>
                  <td style={{ ...num }} className="muted">{fmt(u.trial_uses)}</td>
                  <td className="muted">{u.created_at}</td>
                  <td className="muted">{u.last_login_at ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live feed */}
      <div className="card">
        <h3>Последние запросы</h3>
        <div className="table-wrap">
          <table className="news-table">
            <thead>
              <tr>
                <th style={num}>#</th>
                <th>Запрос</th>
                <th>Пользователь</th>
                <th>Статус</th>
                <th>Когда</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((r) => (
                <tr key={r.id}>
                  <td style={num} className="muted">{r.id}</td>
                  <td style={{ color: "var(--bnb-fg-strong)" }}>
                    {r.keyword}
                    {r.is_trial && (
                      <span className="pill" style={{ marginLeft: 10 }}>
                        trial
                      </span>
                    )}
                  </td>
                  <td className="muted">{r.email}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="muted">{r.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
