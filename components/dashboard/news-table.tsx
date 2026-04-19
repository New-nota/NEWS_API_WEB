import type { NewsRecord } from "@/lib/news";

type NewsTableProps = {
  rows: NewsRecord[];
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

export function NewsTable({ rows }: NewsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="empty-state">
        По выбранным фильтрам ничего не найдено. Проверь keyword/author/language или сначала
        загрузи данные в таблицу.
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="news-table">
        <thead>
          <tr>
            <th>Заголовок</th>
            <th>Автор</th>
            <th>Keyword</th>
            <th>Язык</th>
            <th>Опубликовано</th>
            <th>Загружено</th>
            <th>Ссылка</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
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
              <td>
                <a href={row.url} rel="noreferrer" target="_blank">
                  Открыть
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
