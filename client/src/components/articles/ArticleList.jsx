import ArticleCard from './ArticleCard';
import './ArticleList.css';

const ArticleList = ({ articles, loading, error, onSaveToggle, emptyMessage = 'No articles found' }) => {
  if (loading) {
    return (
      <div className="article-list-loading">
        <div className="spinner spinner-lg" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
        <p>Loading articles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="article-list-error">
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>{error}</p>
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="article-list-empty">
        <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="article-list">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onSaveToggle={onSaveToggle}
        />
      ))}
    </div>
  );
};

export default ArticleList;
