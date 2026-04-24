import type { NewsRecord } from "@/lib/news";

type DashboardNewsRow = NewsRecord & {
  searchRequestId?: number;
  sourceName?: string | null;
};

type NewsTableProps = {
  rows: DashboardNewsRow[];
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSafeExternalUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export function NewsTable({ rows }: NewsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="empty-state">
        No news found for selected filters. Create a search request or loosen filter constraints.
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="news-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Keyword</th>
            <th>Language</th>
            <th>Published at</th>
            <th>Fetched at</th>
            <th>Source</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const externalUrl = getSafeExternalUrl(row.url);
            const rowKey = `${row.id}-${row.searchRequestId ?? row.fetchedAt ?? "row"}`;

            return (
              <tr key={rowKey}>
                <td>
                  <div className="news-title">{row.title}</div>
                  {row.description ? <div className="news-description">{row.description}</div> : null}
                </td>
                <td>{row.author ?? "—"}</td>
                <td>{row.keyword ?? "—"}</td>
                <td>
                  <span className="pill">{row.language ?? "—"}</span>
                </td>
                <td>{formatDate(row.publishedAt)}</td>
                <td>{formatDate(row.fetchedAt)}</td>
                <td>{row.sourceName ?? "—"}</td>
                <td>
                  {externalUrl ? (
                    <a href={externalUrl} rel="noreferrer noopener" target="_blank">
                      Open
                    </a>
                  ) : (
                    <span className="muted">Invalid URL</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
