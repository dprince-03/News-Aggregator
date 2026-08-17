import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import preferenceService from '../services/preferenceService';
import { btn, input as inputClass, alert, card, cx } from '../utils/ui';

const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cx(
      'rounded-full border px-4 py-2 text-sm font-medium capitalize transition-colors',
      active
        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
        : 'border-zinc-300 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-white dark:hover:text-white'
    )}
  >
    {children}
  </button>
);

Chip.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node,
};

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
        preferenceService.getAvailableCategories(),
      ]);

      setPreferences({
        preferred_sources: prefsData.preferences?.preferred_sources || [],
        preferred_categories: prefsData.preferences?.preferred_categories || [],
        preferred_authors: prefsData.preferences?.preferred_authors || [],
      });
      setAvailableSources(sourcesData.sources || []);
      setAvailableCategories(categoriesData.categories || []);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleSourceToggle = (source) => {
    setPreferences((prev) => ({
      ...prev,
      preferred_sources: prev.preferred_sources.includes(source)
        ? prev.preferred_sources.filter((s) => s !== source)
        : [...prev.preferred_sources, source],
    }));
  };

  const handleCategoryToggle = (category) => {
    setPreferences((prev) => ({
      ...prev,
      preferred_categories: prev.preferred_categories.includes(category)
        ? prev.preferred_categories.filter((c) => c !== category)
        : [...prev.preferred_categories, category],
    }));
  };

  const handleAddAuthor = (e) => {
    e.preventDefault();
    if (authorInput.trim() && !preferences.preferred_authors.includes(authorInput.trim())) {
      setPreferences((prev) => ({
        ...prev,
        preferred_authors: [...prev.preferred_authors, authorInput.trim()],
      }));
      setAuthorInput('');
    }
  };

  const handleRemoveAuthor = (author) => {
    setPreferences((prev) => ({
      ...prev,
      preferred_authors: prev.preferred_authors.filter((a) => a !== author),
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">News Preferences</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">Customize your news feed based on your interests</p>
      </div>

      {message.text && (
        <div className={cx(message.type === 'error' ? alert.danger : alert.success, 'mb-6')}>{message.text}</div>
      )}

      <div className={cx(card, 'mb-6')}>
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="font-semibold">Preferred Sources</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Select news sources you want to follow</p>
        </div>
        <div className="flex flex-wrap gap-2 p-6">
          {availableSources.map((source) => (
            <Chip key={source} active={preferences.preferred_sources.includes(source)} onClick={() => handleSourceToggle(source)}>
              {source}
            </Chip>
          ))}
        </div>
      </div>

      <div className={cx(card, 'mb-6')}>
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="font-semibold">Preferred Categories</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Choose topics you&apos;re interested in</p>
        </div>
        <div className="flex flex-wrap gap-2 p-6">
          {availableCategories.map((category) => (
            <Chip
              key={category}
              active={preferences.preferred_categories.includes(category)}
              onClick={() => handleCategoryToggle(category)}
            >
              {category}
            </Chip>
          ))}
        </div>
      </div>

      <div className={cx(card, 'mb-8')}>
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="font-semibold">Preferred Authors</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Add authors you want to follow</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleAddAuthor} className="flex gap-2">
            <input
              type="text"
              className={inputClass}
              placeholder="Enter author name"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
            />
            <button type="submit" className={btn({ className: 'flex-shrink-0' })}>
              Add
            </button>
          </form>

          {preferences.preferred_authors.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {preferences.preferred_authors.map((author) => (
                <div
                  key={author}
                  className="flex items-center gap-2 rounded-full bg-zinc-100 py-1.5 pl-3.5 pr-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <span>{author}</span>
                  <button
                    type="button"
                    className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-white"
                    onClick={() => handleRemoveAuthor(author)}
                    aria-label="Remove author"
                  >
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button type="button" className={btn({ size: 'lg', block: true })} onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
};

export default Preferences;
