import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { isValidEmail } from '../utils/helpers';
import authService from '../services/authService';
import { btn, input as inputClass, inputError, label as labelClass, fieldError, alert, card, cx } from '../utils/ui';

const Profile = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email || !isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    return newErrors;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'New password must be at least 8 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateProfile();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const result = await updateProfile(formData);
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      await refreshUser();
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validatePassword();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
    setLoading(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({ name: user?.name || '', email: user?.email || '' });
    setErrors({});
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Profile Settings</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">Manage your account information</p>
      </div>

      {message.text && (
        <div className={cx(message.type === 'error' ? alert.danger : alert.success, 'mb-6')}>{message.text}</div>
      )}

      <div className={cx(card, 'mb-6')}>
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="font-semibold">Personal Information</h3>
          {!isEditing && (
            <button type="button" className={btn({ variant: 'outline', size: 'sm' })} onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>
        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={cx(inputClass, errors.name && inputError)}
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <span className={fieldError}>{errors.name}</span>}
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={cx(inputClass, errors.email && inputError)}
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <span className={fieldError}>{errors.email}</span>}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className={btn()} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className={btn({ variant: 'secondary' })} onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">Name</span>
                <span className="font-medium">{user?.name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">Email</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Member since</span>
                <span className="font-medium">
                  {new Date(user?.create_at || user?.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={card}>
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="font-semibold">Security</h3>
          {!showPasswordForm && (
            <button
              type="button"
              className={btn({ variant: 'outline', size: 'sm' })}
              onClick={() => setShowPasswordForm(true)}
            >
              Change Password
            </button>
          )}
        </div>
        <div className="p-6">
          {showPasswordForm ? (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="currentPassword" className={labelClass}>
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  className={cx(inputClass, errors.currentPassword && inputError)}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                />
                {errors.currentPassword && <span className={fieldError}>{errors.currentPassword}</span>}
              </div>

              <div>
                <label htmlFor="newPassword" className={labelClass}>
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  className={cx(inputClass, errors.newPassword && inputError)}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
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
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                />
                {errors.confirmPassword && <span className={fieldError}>{errors.confirmPassword}</span>}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className={btn()} disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  className={btn({ variant: 'secondary' })}
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setErrors({});
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Password was last changed recently</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
