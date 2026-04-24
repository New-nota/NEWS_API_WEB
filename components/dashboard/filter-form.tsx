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
      <input name="page" type="hidden" value="1" />

      <div className="field">
        <label htmlFor="q">Search by title or description</label>
        <input defaultValue={current.q ?? ""} id="q" name="q" placeholder="For example: AI" />
      </div>

      <div className="field">
        <label htmlFor="keyword">Keyword</label>
        <select defaultValue={current.keyword ?? ""} id="keyword" name="keyword">
          <option value="">All</option>
          {options.keywords.map((keyword) => (
            <option key={keyword} value={keyword}>
              {keyword}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="author">Author</label>
        <select defaultValue={current.author ?? ""} id="author" name="author">
          <option value="">All</option>
          {options.authors.map((author) => (
            <option key={author} value={author}>
              {author}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="language">Language</label>
        <select defaultValue={current.language ?? ""} id="language" name="language">
          <option value="">All</option>
          {options.languages.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="limit">Per page</label>
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
          Apply filters
        </button>
        <Link className="button button-secondary" href="/dashboard">
          Reset
        </Link>
      </div>
    </form>
  );
}
