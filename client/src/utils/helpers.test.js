import { describe, it, expect, vi } from 'vitest';
import { isValidEmail, isValidPassword, truncateText, getInitials, isValidImageUrl, debounce } from './helpers';

describe('isValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('rejects addresses missing an @ or domain', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('requires at least 8 characters', () => {
    expect(isValidPassword('1234567')).toBe(false);
    expect(isValidPassword('12345678')).toBe(true);
  });

  it('rejects empty/undefined input', () => {
    expect(isValidPassword('')).toBeFalsy();
    expect(isValidPassword(undefined)).toBeFalsy();
  });
});

describe('truncateText', () => {
  it('leaves short text untouched', () => {
    expect(truncateText('short', 100)).toBe('short');
  });

  it('truncates and appends an ellipsis past the limit', () => {
    expect(truncateText('a'.repeat(120), 10)).toBe(`${'a'.repeat(10)}...`);
  });

  it('handles empty input', () => {
    expect(truncateText('')).toBe('');
    expect(truncateText(null)).toBe('');
  });
});

describe('getInitials', () => {
  it('combines first and last name initials', () => {
    expect(getInitials('Jordan Avery')).toBe('JA');
  });

  it('handles a single name', () => {
    expect(getInitials('Jordan')).toBe('J');
  });

  it('falls back to a placeholder when there is no name', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials(undefined)).toBe('?');
  });
});

describe('isValidImageUrl', () => {
  it('accepts absolute URLs', () => {
    expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true);
  });

  it('rejects missing or malformed URLs', () => {
    expect(isValidImageUrl('')).toBe(false);
    expect(isValidImageUrl('not a url')).toBe(false);
  });
});

describe('debounce', () => {
  it('only invokes the wrapped function once after the wait elapses', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
