import { useState } from 'react';
import type { ComponentProps } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Mail,
} from 'lucide-react';
import api from '../../services/api';

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0];

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

    if (!emailPattern.test(normalizedEmail)) {
      setError('Please enter a valid email address using lowercase letters.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.get('/users', {
        params: { email: normalizedEmail },
      });

      if (!response.data.length) {
        setError('No account was found with this email address.');
        return;
      }

      navigate('/reset-password', {
        state: { email: normalizedEmail },
      });
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-5 py-5 sm:px-8">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        <LockKeyhole size={23} />
      </div>

      <p className="mb-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
        ACCOUNT RECOVERY
      </p>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Forgot password?
      </h1>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Enter the email address associated with your ProductPulse
        account to continue resetting your password.
      </p>

      <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Email address
          </label>

          <div className="flex min-h-[48px] items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800">
            <Mail
              size={18}
              className="shrink-0 text-emerald-600 dark:text-emerald-400"
            />

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value.toLowerCase());
                setError('');
              }}
              placeholder="you@example.com"
              required
              className="w-full min-w-0 bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </div>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Use lowercase letters in your email address.
          </p>
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
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900"
        >
          {loading ? 'Please wait...' : 'Continue to reset password'}
          {!loading && <ArrowRight size={18} />}
        </button>
      </form>

      <Link
        to="/login"
        className="mt-5 inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400"
      >
        <ArrowLeft size={16} />
        Back to sign in
      </Link>
    </div>
  );
}
