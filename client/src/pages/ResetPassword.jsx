import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import { btn, input as inputClass, inputError, label as labelClass, fieldError, alert, spinner, card, cx } from '../utils/ui';

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.newPassword || formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!PASSWORD_RULE.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must include an uppercase letter, a lowercase letter, and a number';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setApiError('This reset link is missing its token. Request a new one.');
      return;
    }

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      await authService.resetPassword({ token, newPassword: formData.newPassword });
      navigate('/login');
    } catch (err) {
      setApiError(err.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className={cx(card, 'w-full max-w-md p-8')}>
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-bold">Set a New Password</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Choose a new password for your account</p>
        </div>

        {!token && (
          <div className={cx(alert.danger, 'mb-5')}>
            This link is missing its reset token.{' '}
            <Link to="/forgot-password" className="font-medium underline">
              Request a new one
            </Link>
            .
          </div>
        )}

        {apiError && <div className={cx(alert.danger, 'mb-5')}>{apiError}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="newPassword" className={labelClass}>
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              className={cx(inputClass, errors.newPassword && inputError)}
              placeholder="At least 8 characters"
              value={formData.newPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.newPassword && <span className={fieldError}>{errors.newPassword}</span>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={cx(inputClass, errors.confirmPassword && inputError)}
              placeholder="Repeat your new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className={fieldError}>{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className={btn({ size: 'lg', block: true, className: 'mt-2' })} disabled={loading}>
            {loading ? (
              <>
                <span className={spinner('h-4 w-4')} />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
