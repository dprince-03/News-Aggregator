import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import { isValidEmail } from '../utils/helpers';
import { btn, input as inputClass, inputError, label as labelClass, fieldError, alert, spinner, card, cx } from '../utils/ui';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Email is required');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setApiError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className={cx(card, 'w-full max-w-md p-8')}>
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-bold">Reset Password</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Enter your email and we&apos;ll send you a link to reset your password
          </p>
        </div>

        {sent ? (
          <div className={alert.success}>
            If an account exists for that email, a reset link has been sent. Check your inbox.
          </div>
        ) : (
          <>
            {apiError && <div className={cx(alert.danger, 'mb-5')}>{apiError}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={cx(inputClass, error && inputError)}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  autoComplete="email"
                />
                {error && <span className={fieldError}>{error}</span>}
              </div>

              <button type="submit" className={btn({ size: 'lg', block: true, className: 'mt-2' })} disabled={loading}>
                {loading ? (
                  <>
                    <span className={spinner('h-4 w-4')} />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-rose-700 hover:underline dark:text-rose-400">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
