import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatDate, isValidImageUrl, getPlaceholderImage } from '../../utils/helpers';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import { kicker } from '../../utils/ui';

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
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <Link to={`/article/${article.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <img
            src={imageUrl}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.src = getPlaceholderImage();
            }}
          />
        </div>

        <div className="flex flex-1 flex-col gap-2 p-5">
          {article.category && <span className={kicker}>{article.category}</span>}

          <h3 className="font-display text-lg font-semibold leading-snug text-zinc-900 group-hover:underline decoration-2 underline-offset-2 dark:text-white">
            {article.title}
          </h3>

          {article.description && (
            <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{article.description}</p>
          )}

          <div className="mt-auto flex items-center justify-between pt-3 text-xs text-zinc-400 dark:text-zinc-500">
            <div className="flex min-w-0 items-center gap-1.5">
              {article.source_name && (
                <span className="truncate font-medium text-zinc-600 dark:text-zinc-300">{article.source_name}</span>
              )}
              {article.author && (
                <>
                  <span>&middot;</span>
                  <span className="truncate">{article.author}</span>
                </>
              )}
            </div>
            <span className="flex-shrink-0">{formatDate(article.published_at)}</span>
          </div>
        </div>
      </Link>

      {isAuthenticated && (
        <button
          type="button"
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-colors ${
            isSaved ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-black/40 text-white hover:bg-black/60'
          }`}
          onClick={handleSaveToggle}
          disabled={isSaving}
          aria-label={isSaved ? 'Unsave article' : 'Save article'}
          title={isSaved ? 'Remove from saved' : 'Save for later'}
        >
          <svg width="16" height="16" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      )}
    </article>
  );
};

ArticleCard.propTypes = {
  article: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    source_name: PropTypes.string,
    author: PropTypes.string,
    published_at: PropTypes.string,
    url_to_image: PropTypes.string,
    is_saved: PropTypes.bool,
  }).isRequired,
  onSaveToggle: PropTypes.func,
};

export default ArticleCard;
