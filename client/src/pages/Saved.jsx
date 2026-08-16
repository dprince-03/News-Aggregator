import { useState, useEffect } from 'react';
import articleService from '../services/articleService';
import ArticleList from '../components/articles/ArticleList';
import './Saved.css';

const Saved = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, [page]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await articleService.getSavedArticles(page);

      if (page === 1) {
        setArticles(data.articles || []);
      } else {
        setArticles(prev => [...prev, ...(data.articles || [])]);
      }

      setHasMore((data.articles || []).length === 20);
    } catch (err) {
      setError(err.message || 'Failed to fetch saved articles');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleSaveToggle = (articleId, isSaved) => {
    // Remove article from list when unsaved
    if (!isSaved) {
      setArticles(prev => prev.filter(article => article.id !== articleId));
    }
  };

  return (
    <div className="saved-page">
      <div className="container">
        <div className="saved-header">
          <h1>Saved Articles</h1>
          <p>Your bookmarked articles for later reading</p>
        </div>

        <ArticleList
          articles={articles}
          loading={loading && page === 1}
          error={error}
          onSaveToggle={handleSaveToggle}
          emptyMessage="No saved articles yet. Start bookmarking articles you want to read later."
        />

        {!loading && !error && articles.length > 0 && hasMore && (
          <div className="load-more-section">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Loading...
                </>
              ) : (
                'Load More Articles'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Saved;
