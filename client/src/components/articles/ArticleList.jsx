import PropTypes from 'prop-types';
import ArticleCard from './ArticleCard';

const SkeletonCard = () => (
  <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
    <div className="aspect-[16/10] bg-zinc-200 dark:bg-zinc-800" />
    <div className="flex flex-col gap-3 p-5">
      <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-5 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-5 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  </div>
);

const ArticleList = ({ articles, loading, error, onSaveToggle, emptyMessage = 'No articles found' }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 py-20 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>{error}</p>
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 py-20 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
        <p className="max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} onSaveToggle={onSaveToggle} />
      ))}
    </div>
  );
};

ArticleList.propTypes = {
  articles: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onSaveToggle: PropTypes.func,
  emptyMessage: PropTypes.string,
};

export default ArticleList;
