import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import articleService from '../services/articleService';
import preferenceService from '../services/preferenceService';
import ArticleList from '../components/articles/ArticleList';
import SearchBar from '../components/SearchBar';
import { usePaginatedArticles } from '../hooks/useArticles';
import { useAuth } from '../context/useAuth';
import { formatDate, isValidImageUrl, getPlaceholderImage } from '../utils/helpers';
import { btn, kicker, input as inputClass, spinner } from '../utils/ui';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    source: '',
    category: '',
  });
  const [sources, setSources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [featuredSaving, setFeaturedSaving] = useState(false);

  // Fetch sources and categories
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [sourcesData, categoriesData] = await Promise.all([
          preferenceService.getAvailableSources(),
          preferenceService.getAvailableCategories(),
        ]);
        setSources(sourcesData.sources || []);
        setCategories(categoriesData.categories || []);
      } catch (err) {
        console.error('Error fetching filters:', err);
      }
    };
    fetchFilters();
  }, []);

  const fetchPage = useCallback(
    (page) => {
      if (searchTerm) return articleService.searchArticles(searchTerm, page);
      if (filters.source || filters.category) return articleService.filterArticles(filters, page);
      return articleService.getArticles(page);
    },
    [searchTerm, filters],
  );

  const resetSignal = `${searchTerm}|${filters.source}|${filters.category}`;
  const { articles, loading, loadingMore, error, hasMore, loadMore, updateArticle } = usePaginatedArticles(fetchPage, resetSignal);

  const handleSearch = (term) => setSearchTerm(term);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ source: '', category: '' });
    setSearchTerm('');
  };

  const handleSaveToggle = (articleId, isSaved) => {
    updateArticle(articleId, { is_saved: isSaved });
  };

  const handleFeaturedSaveToggle = async (e, featuredArticle) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      return;
    }

    setFeaturedSaving(true);
    try {
      if (featuredArticle.is_saved) {
        await articleService.unsaveArticle(featuredArticle.id);
      } else {
        await articleService.saveArticle(featuredArticle.id);
      }
      handleSaveToggle(featuredArticle.id, !featuredArticle.is_saved);
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setFeaturedSaving(false);
    }
  };

  const hasActiveFilters = filters.source || filters.category || searchTerm;
  const showHero = !hasActiveFilters && !loading && articles.length > 0;
  const featured = showHero ? articles[0] : null;
  const rest = showHero ? articles.slice(1) : articles;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 border-b border-zinc-200 pb-8 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Latest News</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">Stay updated with news from around the world</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <div className="sm:w-72">
            <SearchBar onSearch={handleSearch} placeholder="Search articles..." initialValue={searchTerm} />
          </div>
          <div className="flex gap-2">
            <button type="button" className={btn({ variant: 'outline' })} onClick={() => setShowFilters((v) => !v)}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs font-semibold text-white">
                  {[filters.source, filters.category, searchTerm].filter(Boolean).length}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button type="button" className={btn({ variant: 'ghost' })} onClick={handleClearFilters}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Source</label>
            <select
              className={inputClass}
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
            >
              <option value="">All Sources</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</label>
            <select
              className={inputClass}
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="mt-10">
        {loading ? (
          <ArticleList articles={[]} loading error={null} />
        ) : (
          <>
            {featured && (
              <div className="group relative mb-10 grid grid-cols-1 gap-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-2">
                <Link to={`/article/${featured.id}`} className="contents">
                  <div className="aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800 md:aspect-auto">
                    <img
                      src={isValidImageUrl(featured.url_to_image) ? featured.url_to_image : getPlaceholderImage()}
                      alt={featured.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = getPlaceholderImage();
                      }}
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-3 p-6 md:p-8">
                    {featured.category && <span className={kicker}>{featured.category}</span>}
                    <h2 className="font-display text-2xl font-bold leading-tight group-hover:underline sm:text-3xl">
                      {featured.title}
                    </h2>
                    {featured.description && (
                      <p className="line-clamp-3 text-zinc-500 dark:text-zinc-400">{featured.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                      {featured.source_name && (
                        <span className="font-medium text-zinc-600 dark:text-zinc-300">{featured.source_name}</span>
                      )}
                      <span>&middot;</span>
                      <span>{formatDate(featured.published_at)}</span>
                    </div>
                  </div>
                </Link>

                {isAuthenticated && (
                  <button
                    type="button"
                    className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-colors ${
                      featured.is_saved
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                        : 'bg-black/40 text-white hover:bg-black/60'
                    }`}
                    onClick={(e) => handleFeaturedSaveToggle(e, featured)}
                    disabled={featuredSaving}
                    aria-label={featured.is_saved ? 'Unsave article' : 'Save article'}
                    title={featured.is_saved ? 'Remove from saved' : 'Save for later'}
                  >
                    <svg width="16" height="16" fill={featured.is_saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            <ArticleList articles={rest} loading={false} error={error} onSaveToggle={handleSaveToggle} />
          </>
        )}

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
    </div>
  );
};

export default Home;
