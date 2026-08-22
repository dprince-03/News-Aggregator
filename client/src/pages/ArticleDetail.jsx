import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import articleService from '../services/articleService';
import { formatDate, isValidImageUrl, getPlaceholderImage, cleanArticleContent } from '../utils/helpers';
import { useAuth } from '../context/useAuth';
import { btn, kicker, cx } from '../utils/ui';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-zinc-400">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="font-display text-2xl font-bold">Article Not Found</h2>
        <p className="text-zinc-500 dark:text-zinc-400">{error}</p>
        <button type="button" className={btn()} onClick={handleBack}>
          Go Back
        </button>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  const imageUrl = isValidImageUrl(article.url_to_image) ? article.url_to_image : getPlaceholderImage();
  const { text: contentText, isTruncated } = cleanArticleContent(article.content);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <button
        type="button"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        onClick={handleBack}
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path
            fillRule="evenodd"
            d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
          />
        </svg>
        Back
      </button>

      <article>
        <div className="mb-6">
          {article.category && <span className={kicker}>{article.category}</span>}
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">{article.title}</h1>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              {article.source_name && <span className="font-medium text-zinc-700 dark:text-zinc-200">{article.source_name}</span>}
              {article.author && (
                <>
                  <span>&middot;</span>
                  <span>{article.author}</span>
                </>
              )}
              <span>&middot;</span>
              <span>{formatDate(article.published_at)}</span>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <button
                  type="button"
                  className={cx(
                    btn({ variant: isSaved ? 'primary' : 'outline', size: 'sm' })
                  )}
                  onClick={handleSaveToggle}
                  disabled={isSaving}
                  title={isSaved ? 'Remove from saved' : 'Save for later'}
                >
                  <svg width="16" height="16" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  {isSaved ? 'Saved' : 'Save'}
                </button>
              )}

              {article.url && (
                <a href={article.url} target="_blank" rel="noopener noreferrer" className={btn({ variant: 'outline', size: 'sm' })}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Read Original
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <img
            src={imageUrl}
            alt={article.title}
            className="w-full object-cover"
            onError={(e) => {
              e.target.src = getPlaceholderImage();
            }}
          />
        </div>

        <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-display">
          {article.description && <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">{article.description}</p>}

          {contentText && (
            <div>
              <p>{contentText}{isTruncated && <span className="text-zinc-400 dark:text-zinc-500">&hellip;</span>}</p>
            </div>
          )}

          {isTruncated && (
            <p className="rounded-lg bg-zinc-100 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              This is a preview from {article.source_name || 'the source'}. The full article isn&apos;t available
              through our news provider &mdash; read the rest at the original source below.
            </p>
          )}

          {article.url && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Read the full article at{' '}
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-rose-700 dark:text-rose-400">
                {article.source_name || 'source'}
              </a>
            </p>
          )}
        </div>
      </article>
    </div>
  );
};

export default ArticleDetail;
