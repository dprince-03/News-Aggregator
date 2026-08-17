import { API_URL } from '../utils/api';

// Plain <a> tags, not client-side routes: OAuth requires a full-page
// redirect to the provider, then back through the API's own callback route
// (which lands the browser on /auth/success with tokens in the query string).
const providers = [
  {
    name: 'Google',
    href: `${API_URL}/auth/google`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A10.99 10.99 0 0012 23z" />
        <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 015.5 12c0-.73.13-1.43.34-2.09V7.06H2.18A11 11 0 001 12c0 1.77.42 3.45 1.18 4.94l3.66-2.85z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: `${API_URL}/auth/facebook`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z" />
      </svg>
    ),
  },
  {
    name: 'Twitter',
    href: `${API_URL}/auth/twitter`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.24 2H21.5l-7.3 8.34L23 22h-6.85l-5.36-6.98L4.7 22H1.44l7.8-8.92L1 2h6.98l4.86 6.4L18.24 2zm-1.2 18h1.8L7.05 3.9H5.13L17.04 20z" />
      </svg>
    ),
  },
];

const OAuthButtons = () => (
  <div className="grid grid-cols-3 gap-3">
    {providers.map((provider) => (
      <a
        key={provider.name}
        href={provider.href}
        className="flex items-center justify-center gap-2 rounded-full border border-zinc-300 py-2.5 text-zinc-700 transition-colors hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-white dark:hover:bg-zinc-800"
        aria-label={`Continue with ${provider.name}`}
        title={`Continue with ${provider.name}`}
      >
        {provider.icon}
      </a>
    ))}
  </div>
);

export default OAuthButtons;
