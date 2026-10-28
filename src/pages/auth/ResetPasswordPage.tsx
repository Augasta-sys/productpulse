import { useState, type ComponentProps } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const email =
    (location.state as { email?: string } | null)?.email
      ?.trim()
      .toLowerCase() ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();
    setError('');

    if (!email) {
      setError('Please start from the Forgot Password page.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.get('/users', {
        params: { email },
      });

      const user = response.data[0];

      if (!user) {
        setError('Account not found. Please try again.');
        return;
      }

      await api.patch(`/users/${user.id}`, { password });

      navigate('/login', {
        state: {
          message: 'Password updated successfully. Please sign in.',
          email,
        },
      });
    } catch {
      setError('Unable to reset your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputWrapper =
    'flex min-h-[38px] items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800';

  const inputClass =
    'auth-input w-full min-w-0 bg-transparent py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white';

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-1 py-1 sm:px-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 sm:mb-3 sm:h-10 sm:w-10">
        <ShieldCheck size={21} />
      </div>

      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 sm:text-xs">
        Account security
      </p>

      <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
        Reset your password
      </h1>

      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
        Create a new password for{' '}
        <span className="break-all font-medium text-slate-700 dark:text-slate-200">
          {email || 'your account'}
        </span>
        .
      </p>

      <form
        onSubmit={handleSubmit}
        className="auth-form-compact mt-3 space-y-2 sm:mt-4"
      >
        <div>
          <label
            htmlFor="password"
            className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-200 sm:text-sm"
          >
            New password
          </label>

          <div className={inputWrapper}>
            <LockKeyhole
              size={16}
              className="shrink-0 text-emerald-600 dark:text-emerald-400"
            />

            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              placeholder="Enter new password"
              minLength={8}
              required
              className={inputClass}
            />

            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="shrink-0 text-slate-500 hover:text-emerald-600 dark:text-slate-400"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
            Minimum 8 characters.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-200 sm:text-sm"
          >
            Confirm new password
          </label>

          <div className={inputWrapper}>
            <LockKeyhole
              size={16}
              className="shrink-0 text-emerald-600 dark:text-emerald-400"
            />

            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError('');
              }}
              placeholder="Re-enter new password"
              minLength={8}
              required
              className={inputClass}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((previous) => !previous)
              }
              aria-label={
                showConfirmPassword
                  ? 'Hide confirm password'
                  : 'Show confirm password'
              }
              className="shrink-0 text-slate-500 hover:text-emerald-600 dark:text-slate-400"
            >
              {showConfirmPassword ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="break-words rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400 sm:text-sm"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="auth-submit flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900"
        >
          <CheckCircle2 size={17} />
          {loading ? 'Updating password...' : 'Reset password'}
        </button>
      </form>

      <Link
        to="/login"
        className="mt-3 inline-flex items-center justify-center gap-2 text-xs font-medium text-slate-600 transition hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 sm:mt-4 sm:text-sm"
      >
        <ArrowLeft size={15} />
        Back to sign in
      </Link>
    </div>
  );
}
