import { useState, useEffect } from 'react';
import preferenceService from '../services/preferenceService';
import './Preferences.css';

const Preferences = () => {
  const [preferences, setPreferences] = useState({
    preferred_sources: [],
    preferred_categories: [],
    preferred_authors: [],
  });
  const [availableSources, setAvailableSources] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [authorInput, setAuthorInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prefsData, sourcesData, categoriesData] = await Promise.all([
        preferenceService.getPreferences(),
        preferenceService.getAvailableSources(),
        preferenceService.getAvailableCategories()
      ]);

      setPreferences({
        preferred_sources: prefsData.preferences?.preferred_sources || [],
        preferred_categories: prefsData.preferences?.preferred_categories || [],
        preferred_authors: prefsData.preferences?.preferred_authors || [],
      });
      setAvailableSources(sourcesData.sources || []);
      setAvailableCategories(categoriesData.categories || []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleSourceToggle = (source) => {
    setPreferences(prev => ({
      ...prev,
      preferred_sources: prev.preferred_sources.includes(source)
        ? prev.preferred_sources.filter(s => s !== source)
        : [...prev.preferred_sources, source]
    }));
  };

  const handleCategoryToggle = (category) => {
    setPreferences(prev => ({
      ...prev,
      preferred_categories: prev.preferred_categories.includes(category)
        ? prev.preferred_categories.filter(c => c !== category)
        : [...prev.preferred_categories, category]
    }));
  };

  const handleAddAuthor = (e) => {
    e.preventDefault();
    if (authorInput.trim() && !preferences.preferred_authors.includes(authorInput.trim())) {
      setPreferences(prev => ({
        ...prev,
        preferred_authors: [...prev.preferred_authors, authorInput.trim()]
      }));
      setAuthorInput('');
    }
  };

  const handleRemoveAuthor = (author) => {
    setPreferences(prev => ({
      ...prev,
      preferred_authors: prev.preferred_authors.filter(a => a !== author)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await preferenceService.updatePreferences(preferences);
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="preferences-page">
        <div className="container container-md">
          <div className="loading-container">
            <div className="spinner spinner-lg" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
            <p>Loading preferences...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="preferences-page">
      <div className="container container-md">
        <div className="preferences-header">
          <h1>News Preferences</h1>
          <p>Customize your news feed based on your interests</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'danger' : 'success'}`}>
            {message.text}
          </div>
        )}

        <div className="preferences-section card">
          <div className="card-header">
            <h3>Preferred Sources</h3>
            <p className="section-description">Select news sources you want to follow</p>
          </div>
          <div className="card-body">
            <div className="preference-grid">
              {availableSources.map(source => (
                <label key={source} className="preference-item">
                  <input
                    type="checkbox"
                    checked={preferences.preferred_sources.includes(source)}
                    onChange={() => handleSourceToggle(source)}
                  />
                  <span className="preference-label">{source}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="preferences-section card">
          <div className="card-header">
            <h3>Preferred Categories</h3>
            <p className="section-description">Choose topics you're interested in</p>
          </div>
          <div className="card-body">
            <div className="preference-grid">
              {availableCategories.map(category => (
                <label key={category} className="preference-item">
                  <input
                    type="checkbox"
                    checked={preferences.preferred_categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                  />
                  <span className="preference-label">{category}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="preferences-section card">
          <div className="card-header">
            <h3>Preferred Authors</h3>
            <p className="section-description">Add authors you want to follow</p>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddAuthor} className="author-form">
              <input
                type="text"
                className="form-control"
                placeholder="Enter author name"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Add Author
              </button>
            </form>

            {preferences.preferred_authors.length > 0 && (
              <div className="author-list">
                {preferences.preferred_authors.map(author => (
                  <div key={author} className="author-tag">
                    <span>{author}</span>
                    <button
                      type="button"
                      className="author-remove"
                      onClick={() => handleRemoveAuthor(author)}
                      aria-label="Remove author"
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="preferences-actions">
          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
