import { useState } from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  Moon,
  Search,
  Sun,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
  onSearch: (value: string) => void;
}

export default function DashboardHeader({
  onToggleSidebar,
  onSearch,
}: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <header className="sticky top-0 z-30 flex min-h-[76px] items-center gap-3 border-b border-[#eadfd5] bg-white/95 px-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1014]/95 sm:px-5 lg:px-7">
      <button
        type="button"
        aria-label="Toggle sidebar"
        onClick={onToggleSidebar}
        className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px] rounded-xl border border-[#eadfd5] transition hover:bg-orange-50 dark:border-white/10 dark:hover:bg-white/5"
      >
        <span className="h-[2px] w-5 rounded-full bg-current" />
        <span className="h-[2px] w-5 rounded-full bg-current" />
        <span className="h-[2px] w-5 rounded-full bg-current" />
      </button>

      <form
        className="relative min-w-0 max-w-[460px] flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(search);
        }}
      >
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50"
        />
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            onSearch(event.target.value);
          }}
          placeholder="Search dashboard..."
          aria-label="Search dashboard"
          className="h-11 w-full rounded-full border border-[#eadfd5] bg-[#faf7f4] pl-10 pr-4 text-sm outline-none transition placeholder:text-[#9b887b] focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10"
        />
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-orange-50 dark:hover:bg-white/10"
        >
          {theme === 'light' ? (
            <Moon size={19} />
          ) : (
            <Sun size={19} className="text-yellow-300" />
          )}
        </button>

        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-orange-50 dark:hover:bg-white/10"
        >
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500 dark:border-[#0b1014]" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
            className="flex items-center gap-2 rounded-full p-1.5 transition hover:bg-orange-50 dark:hover:bg-white/5 sm:gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-orange-300 bg-orange-100 text-sm font-bold text-[#8f421d] dark:border-yellow-400 dark:bg-yellow-400/10 dark:text-yellow-300">
              {(user?.name || 'User').charAt(0).toUpperCase()}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-[120px] truncate text-sm font-bold">
                {user?.name || 'User'}
              </p>
              <p className="text-[11px] capitalize opacity-60">
                {(user?.role || 'member').replace('_', ' ')}
              </p>
            </div>

            <ChevronDown size={15} className="hidden opacity-60 sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[#eadfd5] bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#151b20]">
              <div className="border-b border-[#eadfd5] px-3 py-2 dark:border-white/10">
                <p className="truncate text-sm font-semibold">
                  {user?.name || 'User'}
                </p>
                <p className="truncate text-xs opacity-60">
                  {user?.email || ''}
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-3 text-xs opacity-70">
                <UserRound size={15} />
                {user?.role || 'member'}
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
