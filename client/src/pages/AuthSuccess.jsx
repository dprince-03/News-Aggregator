import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { spinner, btn } from '../utils/ui';

// Landing page for the OAuth redirect: googleCallback/facebookCallback/
// twitterCallback on the backend send the browser here with tokens in the
// query string after a successful Google/Facebook/Twitter login.
const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithOAuthTokens } = useAuth();
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (!token || !refreshToken) {
      setError('Missing authentication tokens in the redirect.');
      return;
    }

    loginWithOAuthTokens(token, refreshToken).then((result) => {
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setError(result.error || 'Sign-in failed');
      }
    });
  }, [searchParams, loginWithOAuthTokens, navigate]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">{error}</p>
        <a href="/login" className={btn()}>
          Back to login
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <span className={spinner('h-8 w-8 text-zinc-400')} />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Signing you in...</p>
    </div>
  );
};

export default AuthSuccess;
