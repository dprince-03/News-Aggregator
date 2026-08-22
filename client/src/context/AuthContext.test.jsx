import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';
import authService from '../services/authService';

vi.mock('../services/authService', () => ({
  default: {
    getToken: vi.fn(),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    getProfile: vi.fn(),
  },
}));

const Probe = () => {
  const { user, isAuthenticated, loading, login, logout } = useAuth();

  if (loading) return <span>loading</span>;

  return (
    <div>
      <span data-testid="auth-state">{isAuthenticated ? 'authenticated' : 'anonymous'}</span>
      <span data-testid="user-name">{user?.name || 'none'}</span>
      <button onClick={() => login({ email: 'a@b.com', password: 'secret123' })}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
};

const renderWithProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.getToken.mockReturnValue(null);
    authService.getCurrentUser.mockReturnValue(null);
  });

  it('starts unauthenticated when there is no stored session', async () => {
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous'));
  });

  it('restores an existing session from localStorage on mount', async () => {
    authService.getToken.mockReturnValue('a-token');
    authService.getCurrentUser.mockReturnValue({ name: 'Jordan' });

    renderWithProvider();

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('user-name')).toHaveTextContent('Jordan');
  });

  it('updates state after a successful login', async () => {
    authService.login.mockResolvedValue({ user: { name: 'Jordan' }, token: 't', refreshToken: 'r' });

    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous'));

    fireEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('user-name')).toHaveTextContent('Jordan');
  });

  it('clears state after logout', async () => {
    authService.getToken.mockReturnValue('a-token');
    authService.getCurrentUser.mockReturnValue({ name: 'Jordan' });
    authService.logout.mockResolvedValue();

    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated'));

    fireEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous'));
  });
});
