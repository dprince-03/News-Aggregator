import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import articleService from '../services/articleService';
import ArticleList from '../components/articles/ArticleList';
import './Personalized.css';

const Personalized = () => {
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

      const data = await articleService.getPersonalizedFeed(page);

      if (page === 1) {
        setArticles(data.articles || []);
      } else {
        setArticles(prev => [...prev, ...(data.articles || [])]);
      }

      setHasMore((data.articles || []).length === 20);
    } catch (err) {
      setError(err.message || 'Failed to fetch personalized feed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleSaveToggle = (articleId, isSaved) => {
    setArticles(prev =>
      prev.map(article =>
        article.id === articleId ? { ...article, is_saved: isSaved } : article
      )
    );
  };

  return (
    <div className="personalized-page">
      <div className="container">
        <div className="personalized-header">
          <div>
            <h1>For You</h1>
            <p>Personalized news based on your preferences</p>
          </div>
          <Link to="/preferences" className="btn btn-outline">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
            </svg>
            Manage Preferences
          </Link>
        </div>

        <ArticleList
          articles={articles}
          loading={loading && page === 1}
          error={error}
          onSaveToggle={handleSaveToggle}
          emptyMessage="No personalized articles found. Update your preferences to get started."
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

export default Personalized;
