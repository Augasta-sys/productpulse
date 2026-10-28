
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, SearchX } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-white">
      <section className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <SearchX size={38} />
        </div>

        <p className="mt-8 text-sm font-bold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">
          Error 404
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Page not found
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
          Sorry, we couldn't find the page you're looking for.
          It may have been moved or the address may be incorrect.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={17} />
            Go back
          </button>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
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
