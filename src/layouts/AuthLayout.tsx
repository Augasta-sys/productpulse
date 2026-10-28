import { Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  MessageCircle,
  Users,
  Lightbulb,
  ChartNoAxesColumnIncreasing,
  Sun,
  Moon,
} from 'lucide-react';

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="auth-screen h-dvh w-full overflow-hidden bg-[#eafff7] p-0 dark:bg-[#071a15] sm:p-2 lg:p-3 xl:p-4 2xl:p-5">
      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[1800px] overflow-hidden rounded-none bg-white shadow-2xl shadow-emerald-950/10 dark:bg-[#0b1714] sm:rounded-2xl lg:rounded-[28px] xl:rounded-[32px] 2xl:rounded-[36px]">

        {/* GREEN HERO PANEL */}
       <section className="relative hidden h-full w-[45%] shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#006b46] via-[#007c50] to-[#00573c] px-5 py-5 text-white md:flex lg:w-[48%] lg:px-8 lg:py-8 xl:w-[52%] xl:px-10 2xl:w-[55%] 2xl:px-14">

          {/* Decorative background */}
          <div className="pointer-events-none absolute -left-24 -top-40 h-[360px] w-[440px] rounded-[50%] bg-gradient-to-br from-[#008b5a] to-[#00583d] opacity-90" />

          <div className="pointer-events-none absolute -left-44 -top-36 h-[330px] w-[530px] rounded-[50%] border-[48px] border-emerald-300/10" />

          <div className="pointer-events-none absolute -bottom-40 -left-28 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-emerald-400/70 to-teal-400/10" />

          <div className="pointer-events-none absolute -bottom-44 right-[-120px] h-[500px] w-[500px] rounded-full bg-emerald-500/25" />

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_65%_40%,rgba(16,185,129,0.25),transparent_60%)]" />

          {/* Curved edge */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute -right-px top-0 z-10 hidden h-full w-[130px] xl:block 2xl:w-[180px]"
            viewBox="0 0 220 800"
            preserveAspectRatio="none"
          >
            <path
              d="M 75 0 C 170 65, 215 150, 220 260 C 225 370, 190 470, 165 565 C 140 665, 145 735, 220 800 L 220 0 Z"
              fill="currentColor"
              className="text-white dark:text-[#0b1714]"
            />
          </svg>

          {/* Brand */}
          <div className="relative z-20 flex shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-emerald-800 shadow-lg xl:h-12 xl:w-12 xl:rounded-2xl">
              <MessageCircle size={26} fill="currentColor" strokeWidth={1.7} />
            </div>

            <span className="text-xl font-extrabold tracking-tight xl:text-2xl 2xl:text-3xl">
              Product<span className="text-emerald-300">Pulse</span>
            </span>
          </div>

          {/* Hero message */}
          <div className="relative z-20 my-3 min-h-0 max-w-[690px]">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-100 xl:text-[10px] 2xl:text-xs">
              Customer feedback. Real progress.
            </p>

            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight xl:mt-5 xl:text-4xl 2xl:text-6xl">
              Turn feedback
              <span className="mt-1 block bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent">
                into better products.
              </span>
            </h1>

            <p className="mt-3 max-w-xl text-xs leading-5 text-emerald-50/90 xl:mt-4 xl:text-sm xl:leading-6 2xl:text-base 2xl:leading-7">
              Collect customer ideas, prioritize what matters, and build a
              roadmap your users will love.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="relative z-20 grid shrink-0 grid-cols-3 gap-2 border-t border-white/15 pt-3 xl:gap-4 xl:pt-5">
            <div className="flex flex-col items-center px-1 text-center">
              <div className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-300/20 text-emerald-50 ring-1 ring-white/10 xl:mb-2 xl:h-11 xl:w-11">
                <Users size={21} />
              </div>
              <p className="text-[10px] leading-4 xl:text-xs 2xl:text-sm">
                Understand
                <br />
                your customers
              </p>
            </div>

            <div className="flex flex-col items-center border-x border-white/15 px-1 text-center">
              <div className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-300/20 text-emerald-50 ring-1 ring-white/10 xl:mb-2 xl:h-11 xl:w-11">
                <Lightbulb size={21} />
              </div>
              <p className="text-[10px] leading-4 xl:text-xs 2xl:text-sm">
                Prioritize
                <br />
                with clarity
              </p>
            </div>

            <div className="flex flex-col items-center px-1 text-center">
              <div className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-300/20 text-emerald-50 ring-1 ring-white/10 xl:mb-2 xl:h-11 xl:w-11">
                <ChartNoAxesColumnIncreasing size={21} />
              </div>
              <p className="text-[10px] leading-4 xl:text-xs 2xl:text-sm">
                Build better
                <br />
                products
              </p>
            </div>
          </div>
        </section>

        {/* AUTHENTICATION PANEL */}
       <section className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden bg-white px-4 py-2 dark:bg-[#0b1714] sm:px-6 md:w-[55%] md:flex-none md:px-6 lg:w-[52%] lg:px-8 xl:w-[48%] xl:px-10">

          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-28 -top-36 h-80 w-80 rounded-full bg-emerald-50 dark:bg-emerald-900/15" />

          <div className="pointer-events-none absolute -bottom-36 right-0 h-80 w-80 rounded-full bg-teal-50/80 dark:bg-teal-900/10" />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="absolute right-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-white text-slate-800 shadow-sm transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-slate-800 sm:right-4 sm:top-4 sm:h-10 sm:w-10 lg:right-5 lg:top-5"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Show a layout logo only on mobile */}
  <div className="auth-content relative z-10 flex min-h-0 w-full min-w-0 max-w-[440px] flex-col justify-center">
    <div className="min-h-0 w-full min-w-0">
      <Outlet />
    </div>

    <p className="mt-2 shrink-0 text-center text-[10px] text-slate-500 dark:text-slate-400">
      © {new Date().getFullYear()} ProductPulse. All rights reserved.
    </p>
  </div>
</section>
      </div>
    </main>
  );
}
