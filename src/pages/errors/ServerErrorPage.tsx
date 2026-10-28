
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function ServerErrorPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-white">
      <section className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
          <AlertTriangle size={38} />
        </div>

        <p className="mt-8 text-sm font-bold uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
          Error 500
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Something went wrong
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
          An unexpected error occurred. Please try again.
          If the problem continues, check your connection or
          contact your administrator.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <RefreshCw size={17} />
            Try again
          </button>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <Home size={17} />
            Go to dashboard
          </Link>
        </div>

        <p className="mt-10 text-xs text-slate-400">
          ProductPulse · Customer feedback made simple
        </p>
      </section>
    </main>
  );
}
