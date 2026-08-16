import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate, getCategoryColor, isValidImageUrl, getPlaceholderImage } from '../../utils/helpers';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import './ArticleCard.css';

const ArticleCard = ({ article, onSaveToggle }) => {
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(article.is_saved || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

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
      if (onSaveToggle) {
        onSaveToggle(article.id, !isSaved);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const imageUrl = isValidImageUrl(article.url_to_image) ? article.url_to_image : getPlaceholderImage();

  return (
    <article className="article-card">
      <Link to={`/article/${article.id}`} className="article-card-link">
        <div className="article-image-container">
          <img
            src={imageUrl}
            alt={article.title}
            className="article-image"
            loading="lazy"
            onError={(e) => {
              e.target.src = getPlaceholderImage();
            }}
          />
          {article.category && (
            <span className={`article-category badge ${getCategoryColor(article.category)}`}>
              {article.category}
            </span>
          )}
        </div>

        <div className="article-card-content">
          <h3 className="article-title">{article.title}</h3>

          {article.description && (
            <p className="article-description line-clamp-2">{article.description}</p>
          )}

          <div className="article-meta">
            <div className="article-meta-left">
              {article.source_name && (
                <span className="article-source">{article.source_name}</span>
              )}
              {article.author && (
                <>
                  <span className="article-meta-divider">•</span>
                  <span className="article-author">{article.author}</span>
                </>
              )}
            </div>
            <span className="article-date">{formatDate(article.published_at)}</span>
          </div>
        </div>
      </Link>

      {isAuthenticated && (
        <button
          className={`save-button ${isSaved ? 'saved' : ''}`}
          onClick={handleSaveToggle}
          disabled={isSaving}
          aria-label={isSaved ? 'Unsave article' : 'Save article'}
          title={isSaved ? 'Remove from saved' : 'Save for later'}
        >
          <svg width="20" height="20" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      )}
    </article>
  );
};

export default ArticleCard;
