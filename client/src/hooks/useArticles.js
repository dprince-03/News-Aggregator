import { useState, useEffect, useRef, useCallback } from 'react';

// Shared paginated-article-list state for Home/Personalized/Saved, which
// otherwise each duplicated the same fetch/page/loadMore/error logic.
//
// `fetchPage(page)` must resolve to `{ articles, pagination }`.
// `resetSignal` is any value that, when it changes, resets back to page 1
// and refetches (e.g. a search term or filter combination for Home).
export const usePaginatedArticles = (fetchPage, resetSignal) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Always call the latest fetchPage without needing it (a fresh closure
  // every render) in the effect's dependency array.
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  useEffect(() => {
    setPage(1);
  }, [resetSignal]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchPageRef.current(page);
        if (cancelled) return;

        setArticles((prev) => (page === 1 ? data.articles : [...prev, ...data.articles]));
        setHasMore(Boolean(data.pagination?.hasNextPage));
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to fetch articles');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, resetSignal]);

  const loadMore = useCallback(() => setPage((prev) => prev + 1), []);

  const updateArticle = useCallback((articleId, updates) => {
    setArticles((prev) => prev.map((article) => (article.id === articleId ? { ...article, ...updates } : article)));
  }, []);

  const removeArticle = useCallback((articleId) => {
    setArticles((prev) => prev.filter((article) => article.id !== articleId));
  }, []);

  return {
    articles,
    loading: loading && page === 1,
    loadingMore: loading && page > 1,
    error,
    hasMore,
    loadMore,
    updateArticle,
    removeArticle,
  };
};
