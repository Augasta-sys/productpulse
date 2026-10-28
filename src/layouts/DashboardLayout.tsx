
import { useEffect, useState, type ReactNode } from 'react';
import {
  Activity,
  Building2,
  ChevronDown,
  CircleHelp,
  Clock3,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Moon,
  RefreshCw,
  Search,
  Settings,
  Sun,
  Tags,
  Users,
  X,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth, type UserRole } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type DashboardLayoutProps = {
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onRefresh?: () => void;
};

type NavItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
};


const ALL_ROLES: UserRole[] = [
  'owner',
  'admin',
  'product_manager',
  'customer',
];

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
  {
    label: 'Feedback',
    path: '/feedback',
    icon: MessageSquare,
    roles: ALL_ROLES,
  },
  {
    label: 'Roadmap',
    path: '/roadmap',
    icon: Map,
    roles: ALL_ROLES,
  },
  {
    label: 'Categories & Tags',
    path: '/categories',
    icon: Tags,
    roles: ['owner', 'admin', 'product_manager'],
  },
  {
    label: 'Team Management',
    path: '/team',
    icon: Users,
    roles: ['owner', 'admin'],
  },
  {
    label: 'Release Notes',
    path: '/release-notes',
    icon: FileText,
    roles: ALL_ROLES,
  },
  {
    label: 'Subscription & Usage',
    path: '/subscription',
    icon: CreditCard,
    roles: ['owner'],
  },
  {
    label: 'Workspace Settings',
    path: '/settings',
    icon: Settings,
    roles: ['owner'],
  },
  {
    label: 'Workspaces',
    path: '/workspaces',
    icon: Building2,
    roles: ALL_ROLES,
  },
];

interface Workspace {
  id: string | number;
  name: string;
}

export default function DashboardLayout({
  children,
  searchValue = '',
  onSearchChange,
  onRefresh,
}: DashboardLayoutProps) {
  const { user, logout, lock } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('ProductPulse');

  // Load the active workspace name.
  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      if (!user?.workspaceId) {
        setWorkspaceName('ProductPulse');
        return;
      }

      try {
        const response = await api.get<Workspace[]>('/workspaces');

        if (cancelled) return;

        const workspace = response.data.find(
          (item) =>
            String(item.id) === String(user.workspaceId),
        );

        setWorkspaceName(workspace?.name || 'ProductPulse');
      } catch (error) {
        console.error('Could not load workspace name:', error);

        if (!cancelled) {
          setWorkspaceName('ProductPulse');
        }
      }
    }

    void loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [user?.workspaceId]);

  // Determine the active navigation link.
  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/dashboard' &&
      location.pathname.startsWith(`${path}/`));

  const linkClass = (path: string) =>
    `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition duration-200 ${
      isActive(path)
        ? 'bg-[#7c452a] text-white shadow-md shadow-[#7c452a]/15 dark:bg-[#e5f55b] dark:text-[#171a10] dark:shadow-[#e5f55b]/10'
        : 'text-[#755a49] hover:translate-x-0.5 hover:bg-[#f5eee8] dark:text-slate-300 dark:hover:bg-white/5'
    }`;

  const closeMobileSidebar = () => setSidebarOpen(false);

  // Normalize the role before filtering navigation items.
  // This keeps the sidebar consistent if a stored role contains
  // different casing or accidental whitespace.
  const normalizedRole = String(user?.role ?? '')
    .trim()
    .toLowerCase() as UserRole;

  const visibleNavItems = navItems.filter(({ roles }) =>
    Boolean(user && roles.includes(normalizedRole)),
  );

  return (
    <div className="dashboard-theme min-h-screen overflow-x-hidden bg-[#faf7f3] text-[#542f1e] dark:bg-[#0b0d0f] dark:text-slate-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-[#eadfd5] bg-white transition-all duration-300 dark:border-white/10 dark:bg-[#111416] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          collapsed ? 'md:w-[78px]' : 'md:w-[250px]'
        } md:translate-x-0`}
      >
        {/* Branding */}
        <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-[#eadfd5] px-5 dark:border-white/10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7c452a] text-white dark:bg-[#e5f55b] dark:text-[#171a10]">
            <Activity size={23} />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold">
                ProductPulse
              </h1>
              <p className="truncate text-[11px] text-[#8b7668] dark:text-slate-400">
                Feedback workspace
              </p>
            </div>
          )}

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={closeMobileSidebar}
            className="ml-auto rounded-lg p-1.5 hover:bg-[#f5eee8] dark:hover:bg-white/10 md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role-based navigation */}
        <nav className="sidebar-scroll min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
          <p
            className={`px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a18a79] dark:text-slate-500 ${
              collapsed ? 'md:hidden' : ''
            }`}
          >
            Workspace
          </p>

          {visibleNavItems.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={closeMobileSidebar}
              title={collapsed ? label : undefined}
              className={linkClass(path)}
            >
              <Icon size={19} className="shrink-0" />
              {!collapsed && (
                <span className="truncate">{label}</span>
              )}
            </Link>
          ))}

          {/* Help & Support: available to every role */}
          <p
            className={`px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a18a79] dark:text-slate-500 ${
              collapsed ? 'md:hidden' : ''
            }`}
          >
            Help
          </p>

          <Link
            to="/help"
            onClick={closeMobileSidebar}
            title={collapsed ? 'Help & Support' : undefined}
            className={linkClass('/help')}
          >
            <CircleHelp size={19} className="shrink-0" />
            {!collapsed && <span>Help & Support</span>}
          </Link>
        </nav>

        {/* Collapse sidebar */}
        <div className="shrink-0 border-t border-[#eadfd5] p-3 dark:border-white/10">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={
              collapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
            className="hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-[#8b7668] transition hover:bg-[#f5eee8] dark:text-slate-400 dark:hover:bg-white/5 md:flex"
          >
            <Menu size={17} />
            {!collapsed && 'Collapse sidebar'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`min-h-screen transition-[padding] duration-300 ${
          collapsed ? 'md:pl-[78px]' : 'md:pl-[250px]'
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex min-h-[76px] flex-wrap items-center gap-3 border-b border-[#eadfd5] bg-[#faf7f3]/95 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0d0f]/95 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl border border-[#eadfd5] p-2.5 transition hover:bg-white dark:border-white/10 dark:hover:bg-white/5 md:hidden"
          >
            <Menu size={19} />
          </button>

          {/* Active workspace */}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold sm:text-xl">
              {workspaceName}
            </h2>
            <p className="text-xs text-[#8b7668] dark:text-slate-400">
              Customer feedback and product roadmap
            </p>
          </div>

          {/* Search */}
          <label className="relative order-last w-full sm:order-none sm:w-auto sm:max-w-[280px] sm:flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7668] dark:text-slate-400"
            />
            <input
              value={searchValue}
              onChange={(event) =>
                onSearchChange?.(event.target.value)
              }
              placeholder="Search feedback..."
              aria-label="Search feedback"
              className="w-full rounded-xl border border-[#eadfd5] bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-[#a18a79] focus:border-[#b87a51] focus:ring-2 focus:ring-[#b87a51]/15 dark:border-white/10 dark:bg-[#151a1c] dark:placeholder:text-slate-500 dark:focus:border-[#e5f55b] dark:focus:ring-[#e5f55b]/10"
            />
          </label>

          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            {/* Light / dark mode */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              title="Toggle light/dark mode"
              className="rounded-xl border border-[#eadfd5] bg-white p-2.5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#151a1c] dark:hover:border-[#e5f55b]/40"
            >
              {theme === 'light' ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} className="text-[#e5f55b]" />
              )}
            </button>

            {/* Optional refresh */}
            {onRefresh && (
              <button
                type="button"
                aria-label="Refresh data"
                title="Refresh data"
                onClick={onRefresh}
                className="rounded-xl border border-[#eadfd5] bg-white p-2.5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#151a1c]"
              >
                <RefreshCw size={18} />
              </button>
            )}

            {/* Profile menu */}
            <div className="relative">
              <button
                type="button"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((value) => !value)}
                className="flex items-center gap-2 rounded-xl border border-[#eadfd5] bg-white p-1.5 pr-2 transition hover:shadow-md dark:border-white/10 dark:bg-[#151a1c]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e9d3c0] text-sm font-bold text-[#542f1e] dark:bg-[#e5f55b] dark:text-[#171a10]">
                  {(user?.name || 'U').slice(0, 1).toUpperCase()}
                </span>

                <span className="hidden max-w-[110px] truncate text-sm font-medium sm:block">
                  {user?.name || 'User'}
                </span>

                <ChevronDown size={15} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[#eadfd5] bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#151a1c]">
                  <p className="truncate px-3 py-2 text-xs text-[#8b7668] dark:text-slate-400">
                    {user?.email || 'Signed in'}
                  </p>

                  <p className="px-3 pb-2 text-xs capitalize text-[#8b7668] dark:text-slate-400">
                    Role: {user?.role?.replace('_', ' ') || 'User'}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      lock();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#f5eee8] dark:hover:bg-white/5"
                  >
                    <Clock3 size={16} />
                    Lock screen
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
