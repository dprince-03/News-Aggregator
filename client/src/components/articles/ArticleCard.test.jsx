import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ArticleCard from './ArticleCard';
import articleService from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../services/articleService', () => ({
  default: {
    saveArticle: vi.fn(),
    unsaveArticle: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const article = {
  id: 1,
  title: 'Test Headline',
  description: 'Test description',
  category: 'technology',
  source_name: 'The Guardian',
  author: 'Jordan Avery',
  published_at: new Date().toISOString(),
  url_to_image: 'https://example.com/image.jpg',
  is_saved: false,
};

const renderCard = (props = {}) =>
  render(
    <MemoryRouter>
      <ArticleCard article={article} {...props} />
    </MemoryRouter>,
  );

describe('ArticleCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render a save button for anonymous visitors', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    renderCard();
    expect(screen.queryByLabelText(/save article/i)).not.toBeInTheDocument();
  });

  it('saves the article when an authenticated user clicks save', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    articleService.saveArticle.mockResolvedValue({ success: true });

    renderCard();
    fireEvent.click(screen.getByLabelText(/save article/i));

    await waitFor(() => expect(articleService.saveArticle).toHaveBeenCalledWith(1));
    expect(await screen.findByLabelText(/unsave article/i)).toBeInTheDocument();
  });

  it('calls onSaveToggle with the new saved state', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    articleService.saveArticle.mockResolvedValue({ success: true });
    const onSaveToggle = vi.fn();

    renderCard({ onSaveToggle });
    fireEvent.click(screen.getByLabelText(/save article/i));

    await waitFor(() => expect(onSaveToggle).toHaveBeenCalledWith(1, true));
  });

  it('unsaves an already-saved article', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    articleService.unsaveArticle.mockResolvedValue({ success: true });

    renderCard({ article: { ...article, is_saved: true } });
    fireEvent.click(screen.getByLabelText(/unsave article/i));

    await waitFor(() => expect(articleService.unsaveArticle).toHaveBeenCalledWith(1));
  });
});
