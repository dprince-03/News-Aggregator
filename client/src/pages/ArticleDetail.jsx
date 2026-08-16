import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import articleService from '../services/articleService';
import { formatDate, isValidImageUrl, getPlaceholderImage, getCategoryColor } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import './ArticleDetail.css';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await articleService.getArticleById(id);
      setArticle(data.article);
      setIsSaved(data.article.is_saved || false);
    } catch (err) {
      setError(err.message || 'Failed to fetch article');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        await articleService.unsaveArticle(article.id);
        setIsSaved(false);
      } else {
        await articleService.saveArticle(article.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="article-detail-page">
        <div className="container container-md">
          <div className="loading-container">
            <div className="spinner spinner-lg" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
            <p>Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="article-detail-page">
        <div className="container container-md">
          <div className="error-container">
            <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2>Article Not Found</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={handleBack}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  const imageUrl = isValidImageUrl(article.url_to_image) ? article.url_to_image : getPlaceholderImage();

  return (
    <div className="article-detail-page">
      <div className="container container-md">
        <button className="back-button" onClick={handleBack}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
          </svg>
          Back
        </button>

        <article className="article-detail">
          <div className="article-detail-header">
            {article.category && (
              <span className={`badge ${getCategoryColor(article.category)}`}>
                {article.category}
              </span>
            )}
            <h1 className="article-detail-title">{article.title}</h1>

            <div className="article-detail-meta">
              <div className="article-detail-meta-left">
                {article.source_name && (
                  <span className="article-source">{article.source_name}</span>
                )}
                {article.author && (
                  <>
                    <span className="meta-divider">•</span>
                    <span className="article-author">{article.author}</span>
                  </>
                )}
                <span className="meta-divider">•</span>
                <span className="article-date">{formatDate(article.published_at)}</span>
              </div>

              <div className="article-detail-actions">
                {isAuthenticated && (
                  <button
                    className={`action-button ${isSaved ? 'saved' : ''}`}
                    onClick={handleSaveToggle}
                    disabled={isSaving}
                    title={isSaved ? 'Remove from saved' : 'Save for later'}
                  >
                    <svg width="20" height="20" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                )}

                {article.url && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Read Original
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="article-detail-image">
            <img
              src={imageUrl}
              alt={article.title}
              onError={(e) => {
                e.target.src = getPlaceholderImage();
              }}
            />
          </div>

          <div className="article-detail-content">
            {article.description && (
              <p className="article-description">{article.description}</p>
            )}

            {article.content && (
              <div className="article-body">
                <p>{article.content}</p>
              </div>
            )}

            {article.url && (
              <div className="article-source-link">
                <p>
                  Read the full article at{' '}
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    {article.source_name || 'source'}
                  </a>
                </p>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

export default ArticleDetail;
