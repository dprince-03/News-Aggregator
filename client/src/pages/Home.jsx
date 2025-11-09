import { useState, useEffect } from 'react';
import articleService from '../services/articleService';
import preferenceService from '../services/preferenceService';
import ArticleList from '../components/articles/ArticleList';
import SearchBar from '../components/SearchBar';
import './Home.css';

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    source: '',
    category: '',
  });
  const [sources, setSources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch sources and categories
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [sourcesData, categoriesData] = await Promise.all([
          preferenceService.getAvailableSources(),
          preferenceService.getAvailableCategories()
        ]);
        setSources(sourcesData.sources || []);
        setCategories(categoriesData.categories || []);
      } catch (err) {
        console.error('Error fetching filters:', err);
      }
    };
    fetchFilters();
  }, []);

  // Fetch articles
  useEffect(() => {
    fetchArticles();
  }, [page, searchTerm, filters]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError('');

      let data;
      if (searchTerm) {
        data = await articleService.searchArticles(searchTerm, page);
      } else if (filters.source || filters.category) {
        data = await articleService.filterArticles(filters, page);
      } else {
        data = await articleService.getArticles(page);
      }

      if (page === 1) {
        setArticles(data.articles || []);
      } else {
        setArticles(prev => [...prev, ...(data.articles || [])]);
      }

      setHasMore((data.articles || []).length === 20);
    } catch (err) {
      setError(err.message || 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      source: '',
      category: '',
    });
    setSearchTerm('');
    setPage(1);
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

  const hasActiveFilters = filters.source || filters.category || searchTerm;

  return (
    <div className="home-page">
      <div className="container">
        <div className="home-header">
          <div className="home-title-section">
            <h1>Latest News</h1>
            <p>Stay updated with news from around the world</p>
          </div>

          <div className="home-search-section">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search articles..."
              initialValue={searchTerm}
            />
          </div>

          <div className="home-filter-section">
            <button
              className="btn btn-outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
              </svg>
              Filters
              {hasActiveFilters && <span className="filter-badge">{[filters.source, filters.category, searchTerm].filter(Boolean).length}</span>}
            </button>

            {hasActiveFilters && (
              <button className="btn btn-secondary" onClick={handleClearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="form-group">
                <label className="form-label">Source</label>
                <select
                  className="form-control"
                  value={filters.source}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                >
                  <option value="">All Sources</option>
                  {sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="home-content">
          <ArticleList
            articles={articles}
            loading={loading && page === 1}
            error={error}
            onSaveToggle={handleSaveToggle}
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
    </div>
  );
};

export default Home;
