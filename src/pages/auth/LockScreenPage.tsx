import { useState, type ComponentProps } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  LogOut,
  MessageCircle,
  ShieldCheck,
  UnlockKeyhole,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0];

export default function LockScreenPage() {
  const { user, unlock, logout } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await unlock(password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to unlock your account. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="flex min-h-0 w-full flex-1 items-center justify-center px-1 py-2">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex flex-col items-center text-center sm:mb-6">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <LockKeyhole size={28} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back!
          </h1>

          <p className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
            Your session is locked. Enter your password to continue.
          </p>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">
            {user?.name?.trim().charAt(0).toUpperCase() || 'U'}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {user?.name || 'ProductPulse user'}
            </p>
            <p className="break-all text-xs text-slate-500 dark:text-slate-400">
              {user?.email}
            </p>
          </div>

          <ShieldCheck
            size={20}
            className="shrink-0 text-emerald-600 dark:text-emerald-400"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="lock-password"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Password
            </label>

            <div className="flex min-h-11 items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800">
              <LockKeyhole
                size={18}
                className="shrink-0 text-emerald-600 dark:text-emerald-400"
              />

              <input
                id="lock-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                }}
                placeholder="Enter your password"
                required
                className="w-full min-w-0 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="shrink-0 text-slate-500 hover:text-emerald-600 dark:text-slate-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UnlockKeyhole size={18} />
            {loading ? 'Unlocking...' : 'Unlock workspace'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-emerald-300"
        >
          <LogOut size={17} />
          Sign out and return to login
        </button>

        <p className="mt-5 text-center text-xs text-slate-400">
          <MessageCircle className="mr-1 inline-block" size={14} />
          ProductPulse account security
        </p>

        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          Having trouble?{' '}
          <Link
            to="/forgot-password"
            className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
          >
            Reset your password
          </Link>
        </p>
      </div>
    </main>
  );
}
