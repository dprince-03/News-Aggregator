import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { debounce } from '../utils/helpers';

const SearchBar = ({ onSearch, placeholder = 'Search articles...', initialValue = '' }) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  useEffect(() => {
    const debouncedSearch = debounce(() => {
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, 500);

    debouncedSearch();
  }, [searchTerm, onSearch]);

  const handleClear = () => {
    setSearchTerm('');
  };

  return (
    <div className="relative flex items-center rounded-full border border-zinc-300 bg-white transition-colors focus-within:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:border-white">
      <svg
        className="pointer-events-none absolute left-4 h-4 w-4 text-zinc-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        className="w-full rounded-full bg-transparent py-2.5 pl-11 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <button
          className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          onClick={handleClear}
          aria-label="Clear search"
          type="button"
        >
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
          </svg>
        </button>
      )}
    </div>
  );
};

SearchBar.propTypes = {
  onSearch: PropTypes.func,
  placeholder: PropTypes.string,
  initialValue: PropTypes.string,
};

export default SearchBar;
