import { useState, type ComponentProps } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const successMessage = (
    location.state as { message?: string } | null
  )?.message;

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
   const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

    if (!emailPattern.test(normalizedEmail)) {
      setError('Enter a valid email address, such as you@example.com.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      await login({
        email: normalizedEmail,
        password,
      });

      navigate('/dashboard');
   } catch (error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : 'Unable to sign in. Please try again.';

  setError(message);
} finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[440px] text-sm sm:text-base">

      {/* ProductPulse logo */}
      <div className="mb-2 flex flex-col items-center text-center sm:mb-3">
        <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-700/20 sm:h-10 sm:w-10 lg:h-11 lg:w-11">
          <MessageCircle size={24} strokeWidth={2.5} />
        </div>

        <p className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-xl lg:text-2xl">
          Product
          <span className="text-emerald-600 dark:text-emerald-400">
            Pulse
          </span>
        </p>
      </div>

      {/* Heading */}
      <div className="mb-3 text-center sm:mb-4">
        <h1 className="text-[clamp(1.35rem,3vw,1.9rem)] font-extrabold leading-tight tracking-tight text-slate-950 dark:text-white">
          Welcome back
        </h1>

        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-600 dark:text-slate-300 sm:mt-2 sm:text-sm sm:leading-6">
          Sign in to your account and continue building products people love.
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <p
          role="status"
          className="mb-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 sm:mb-3 sm:px-4 sm:py-2.5 sm:text-sm"
        >
          {successMessage}
        </p>
      )}

      {/* Login form */}
      <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">

        {/* Email */}
        <div className="min-w-0">
          <label
            htmlFor="email"
            className="mb-1 block text-xs font-bold text-slate-900 dark:text-slate-100 sm:mb-1.5 sm:text-sm"
          >
            Email address
          </label>

          <div className="flex h-10 min-w-0 items-center gap-2.5 rounded-xl border border-emerald-100 bg-[#e2f6ef] px-3 transition duration-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 sm:h-11 sm:gap-3 sm:rounded-2xl sm:px-4 dark:border-emerald-900 dark:bg-[#15352b] dark:focus-within:border-emerald-400">
            <Mail
              size={18}
              className="shrink-0 text-slate-500 dark:text-emerald-200"
            />

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value.toLowerCase());
                setError('');
              }}
              className="w-full min-w-0 bg-transparent py-1 text-xs text-slate-950 outline-none placeholder:text-slate-500 sm:text-sm dark:text-white dark:placeholder:text-slate-400"
            />
          </div>

          <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">
            Your email is converted to lowercase automatically.
          </p>
        </div>

        {/* Password */}
        <div className="min-w-0">
          <label
            htmlFor="password"
            className="mb-1 block text-xs font-bold text-slate-900 dark:text-slate-100 sm:mb-1.5 sm:text-sm"
          >
            Password
          </label>

          <div className="flex h-10 min-w-0 items-center gap-2.5 rounded-xl border border-emerald-100 bg-[#e2f6ef] px-3 transition duration-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 sm:h-11 sm:gap-3 sm:rounded-2xl sm:px-4 dark:border-emerald-900 dark:bg-[#15352b] dark:focus-within:border-emerald-400">
            <LockKeyhole
              size={18}
              className="shrink-0 text-slate-500 dark:text-emerald-200"
            />

            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              className="w-full min-w-0 bg-transparent py-1 text-xs text-slate-950 outline-none placeholder:text-slate-500 sm:text-sm dark:text-white dark:placeholder:text-slate-400"
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:text-emerald-300"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">
              Minimum 8 characters.
            </p>

            <Link
              to="/forgot-password"
              className="shrink-0 text-xs font-semibold text-emerald-700 transition hover:underline sm:text-sm dark:text-emerald-300"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p
            role="alert"
            className="break-words rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-4 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200 sm:rounded-xl sm:py-2.5 sm:text-sm"
          >
            {error}
          </p>
        )}

        {/* Sign in */}
        <button
          type="submit"
          disabled={loading}
          className="group flex h-10 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition duration-200 hover:from-emerald-700 hover:to-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:gap-3 sm:text-base"
        >
          {loading ? 'Signing in...' : 'Sign in'}

          {!loading && (
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          )}
        </button>
      </form>

      {/* Create account */}
      <p className="mt-3 text-center text-xs leading-5 text-slate-600 dark:text-slate-300 sm:mt-4 sm:text-sm">
        Don’t have an account?{' '}
        <Link
          to="/signup"
          className="font-bold text-emerald-700 underline decoration-emerald-300 underline-offset-4 transition hover:text-emerald-900 dark:text-emerald-300 dark:decoration-emerald-700 dark:hover:text-emerald-200"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
