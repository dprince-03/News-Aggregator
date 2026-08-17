import { useCallback } from 'react';
import articleService from '../services/articleService';
import ArticleList from '../components/articles/ArticleList';
import { usePaginatedArticles } from '../hooks/useArticles';
import { btn, spinner } from '../utils/ui';

const Saved = () => {
  const fetchPage = useCallback((page) => articleService.getSavedArticles(page), []);
  const { articles, loading, loadingMore, error, hasMore, loadMore, removeArticle } = usePaginatedArticles(fetchPage, null);

  const handleSaveToggle = (articleId, isSaved) => {
    // Remove article from list when unsaved
    if (!isSaved) {
      removeArticle(articleId);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Saved Articles</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">Your bookmarked articles for later reading</p>
      </div>

      <ArticleList
        articles={articles}
        loading={loading}
        error={error}
        onSaveToggle={handleSaveToggle}
        emptyMessage="No saved articles yet. Start bookmarking articles you want to read later."
      />

      {!loading && !error && articles.length > 0 && hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            className={btn({ variant: 'outline', size: 'lg' })}
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <span className={spinner('h-4 w-4')} />
                Loading...
              </>
            ) : (
              'Load More Articles'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Saved;
