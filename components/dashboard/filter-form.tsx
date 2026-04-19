import Link from "next/link";

type FilterFormProps = {
  current: {
    q?: string;
    keyword?: string;
    author?: string;
    language?: string;
    limit: number;
  };
  options: {
    keywords: string[];
    authors: string[];
    languages: string[];
  };
};

export function FilterForm({ current, options }: FilterFormProps) {
  return (
    <form className="filters" method="GET">
      <div className="field">
        <label htmlFor="q">Поиск по заголовку / описанию</label>
        <input defaultValue={current.q ?? ""} id="q" name="q" placeholder="Например, AI" />
      </div>

      <div className="field">
        <label htmlFor="keyword">Keyword</label>
        <select defaultValue={current.keyword ?? ""} id="keyword" name="keyword">
          <option value="">Все</option>
          {options.keywords.map((keyword) => (
            <option key={keyword} value={keyword}>
              {keyword}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="author">Автор</label>
        <select defaultValue={current.author ?? ""} id="author" name="author">
          <option value="">Все</option>
          {options.authors.map((author) => (
            <option key={author} value={author}>
              {author}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="language">Язык</label>
        <select defaultValue={current.language ?? ""} id="language" name="language">
          <option value="">Все</option>
          {options.languages.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="limit">На странице</label>
        <select defaultValue={String(current.limit)} id="limit" name="limit">
          {[10, 20, 50, 100].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-actions">
        <button className="button button-primary" type="submit">
          Применить
        </button>
        <Link className="button button-secondary" href="/dashboard">
          Сбросить
        </Link>
      </div>
    </form>
  );
}
