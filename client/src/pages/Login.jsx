import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/helpers';
import { btn, input as inputClass, inputError, label as labelClass, fieldError, alert, spinner, card, cx } from '../utils/ui';
import OAuthButtons from '../components/OAuthButtons';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError('');

    const result = await login(formData);

    if (result.success) {
      navigate('/');
    } else {
      setApiError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className={cx(card, 'w-full max-w-md p-8')}>
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Login to access your personalized news feed
          </p>
        </div>

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
              className={cx(inputClass, errors.email && inputError)}
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <span className={fieldError}>{errors.email}</span>}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-medium text-rose-700 hover:underline dark:text-rose-400">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              className={cx(inputClass, errors.password && inputError)}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {errors.password && <span className={fieldError}>{errors.password}</span>}
          </div>

          <button type="submit" className={btn({ size: 'lg', block: true, className: 'mt-2' })} disabled={loading}>
            {loading ? (
              <>
                <span className={spinner('h-4 w-4')} />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Or continue with</span>
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <OAuthButtons />

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-rose-700 hover:underline dark:text-rose-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
