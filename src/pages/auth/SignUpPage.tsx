import { useState, type ComponentProps } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  UserRound,
  Mail,
  LockKeyhole,
} from 'lucide-react';
import api from '../../services/api';

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0];

export default function SignUpPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();
    setError('');

    const normalizedName = name.trim().replace(/\s+/g, ' ');
    const normalizedEmail = email.trim().toLowerCase();

   const namePattern = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;
   const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

    if (!namePattern.test(normalizedName)) {
      setError('Name must contain English letters and spaces only.');
      return;
    }

    if (normalizedName.replace(/\s/g, '').length < 2) {
      setError('Please enter a name with at least 2 letters.');
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const existingUsers = await api.get('/users', {
        params: { email: normalizedEmail },
      });

      if (existingUsers.data.length > 0) {
        setError('An account with this email already exists.');
        return;
      }

      const userId = `user-${Date.now()}`;
      const workspaceId = `workspace-${Date.now()}`;
      const memberId = `member-${Date.now()}`;

      await api.post('/users', {
        id: userId,
        name: normalizedName,
        email: normalizedEmail,
        password,
        status: 'active',
      });

      await api.post('/workspaces', {
        id: workspaceId,
        name: `${normalizedName}'s Workspace`,
        description: 'Your ProductPulse workspace',
        logoUrl: '',
        brandColor: '#059669',
        publicRoadmapEnabled: true,
      });

 await api.post('/workspaceMembers', {
  id: memberId,
  workspaceId,
  userId,
  role: 'customer',
  status: 'active',
});

      navigate('/login', {
        state: {
          message: 'Account created! Please sign in.',
          email: normalizedEmail,
        },
      });
    } catch {
      setError(
        'Unable to create your account. Check that the server is running and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'auth-input w-full min-w-0 bg-transparent py-1 text-sm text-slate-950 outline-none placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-400';

  const wrapperClass =
    'flex min-h-[36px] items-center gap-2 rounded-lg border border-emerald-100 bg-[#e2f6ef] px-3 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 dark:border-emerald-900 dark:bg-[#15352b]';

  const labelClass =
    'mb-1 block text-xs font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-sm';

  return (
    <div className="mx-auto flex w-full min-w-0 flex-col justify-center px-1 py-1 sm:px-3">
      {/* Heading */}
      <div className="mb-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300 sm:text-xs sm:tracking-[0.25em]">
          Get started for free
        </p>

        <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
          Create your account
        </h1>

        <p className="mt-1 text-xs leading-4 text-slate-600 dark:text-slate-300 sm:text-sm">
          Start turning customer ideas into progress.
        </p>
      </div>

      {/* Sign-up form */}
      <form
        onSubmit={handleSubmit}
        className="auth-form-compact space-y-2"
      >
        {/* Full name */}
        <div>
          <label htmlFor="signup-name" className={labelClass}>
            Full name
          </label>

          <div className={wrapperClass}>
            <UserRound
              size={17}
              className="shrink-0 text-slate-500 dark:text-emerald-200"
            />

            <input
              id="signup-name"
              name="name"
              type="text"
              required
              minLength={2}
              autoComplete="name"
              placeholder="Your full name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
              pattern="[A-Za-z]+( [A-Za-z]+)*"
              title="Use English letters and spaces only."
              className={inputClass}
            />
          </div>

          <p className="mt-0.5 text-[10px] leading-3 text-slate-500 dark:text-slate-400">
            English letters and spaces only.
          </p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="signup-email" className={labelClass}>
            Email address
          </label>

          <div className={wrapperClass}>
            <Mail
              size={17}
              className="shrink-0 text-slate-500 dark:text-emerald-200"
            />

            <input
              id="signup-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value.toLowerCase());
                setError('');
              }}
              className={inputClass}
            />
          </div>

          <p className="mt-0.5 text-[10px] leading-3 text-slate-500 dark:text-slate-400">
            Email is automatically converted to lowercase.
          </p>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="signup-password" className={labelClass}>
            Password
          </label>

          <div className={wrapperClass}>
            <LockKeyhole
              size={17}
              className="shrink-0 text-slate-500 dark:text-emerald-200"
            />

            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              className={inputClass}
            />

            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="shrink-0 text-slate-500 hover:text-emerald-700 dark:text-slate-300"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <p className="mt-0.5 text-[10px] leading-3 text-slate-500 dark:text-slate-400">
            Minimum 8 characters.
          </p>
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="signup-confirm-password"
            className={labelClass}
          >
            Confirm password
          </label>

          <div className={wrapperClass}>
            <LockKeyhole
              size={17}
              className="shrink-0 text-slate-500 dark:text-emerald-200"
            />

            <input
              id="signup-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError('');
              }}
              className={inputClass}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((visible) => !visible)
              }
              aria-label={
                showConfirmPassword
                  ? 'Hide confirm password'
                  : 'Show confirm password'
              }
              className="shrink-0 text-slate-500 hover:text-emerald-700 dark:text-slate-300"
            >
              {showConfirmPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p
            role="alert"
            className="break-words rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          >
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="auth-submit group flex min-h-[38px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition hover:from-emerald-700 hover:to-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creating account...' : 'Create account'}

          {!loading && (
            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          )}
        </button>
      </form>

      {/* Sign-in link */}
      <p className="mt-2 text-center text-xs leading-4 text-slate-600 dark:text-slate-300 sm:text-sm">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-bold text-emerald-700 underline underline-offset-4 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
