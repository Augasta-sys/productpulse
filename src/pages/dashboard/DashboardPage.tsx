import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Activity,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Tags,
  ThumbsUp,
  Users,
  X,
  CreditCard,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type Feedback = {
  id: string | number;
  workspaceId?: string;
  title: string;
  description?: string;
  categoryId?: string;
  category?: string;
  status?: string;
  priority?: string;
  createdAt?: string;
  votes?: number;
  submitter?: string;
  submitterId?: string;
};

type Vote = {
  id: string | number;
  workspaceId?: string;
  feedbackId: string;
  userId: string;
};

type RoadmapItem = {
  id: string | number;
  workspaceId?: string;
  title: string;
  status?: string;
  stage?: string;
};

type Category = {
  id: string | number;
  workspaceId?: string;
  name: string;
  color?: string;
};

type ActivityLog = {
  id: string | number;
  workspaceId?: string;
  action?: string;
  description?: string;
  createdAt?: string;
  timestamp?: string;
};

type Workspace = {
  id: string;
  name: string;
  brandColor?: string;
};

const chartColors = ['#A9653A', '#D6A77A', '#6F9E80', '#8B83C9', '#D17C80'];

const ALL_ROLES: UserRole[] = [
  'owner',
  'admin',
  'product_manager',
  'customer',
];

const navItems: {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
  { label: 'Feedback', path: '/feedback', icon: MessageSquare, roles: ALL_ROLES },
  { label: 'Roadmap', path: '/roadmap', icon: Map, roles: ALL_ROLES },
  { label: 'Categories & Tags', path: '/categories', icon: Tags, roles: ['owner', 'admin', 'product_manager'] },
  { label: 'Team Management', path: '/team', icon: Users, roles: ['owner', 'admin'] },
  { label: 'Release Notes', path: '/release-notes', icon: FileText, roles: ALL_ROLES },
  { label: 'Subscription & Usage', path: '/subscription', icon: CreditCard, roles: ['owner'] },
  { label: 'Workspace Settings', path: '/settings', icon: Settings, roles: ['owner'] },
  { label: 'Workspaces', path: '/workspaces', icon: Building2, roles: ALL_ROLES },
];

const statusColors: Record<string, string> = {
  'under review': 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300',
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-400/10 dark:text-blue-300',
  'in progress': 'bg-violet-100 text-violet-800 dark:bg-violet-400/10 dark:text-violet-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300',
  open: 'bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300',
  new: 'bg-sky-100 text-sky-800 dark:bg-sky-400/10 dark:text-sky-300',
};

function normalize(value?: string) {
  return (value || '').toLowerCase().replaceAll('_', ' ').trim();
}

function getStatus(item: { status?: string; stage?: string }) {
  return item.status || item.stage || 'Under Review';
}

function isOpenFeedback(item: Feedback) {
  return !['completed', 'closed', 'rejected', 'merged', 'duplicate'].includes(
    normalize(item.status),
  );
}

function isWorkspaceRecord<T extends { workspaceId?: string }>(
  item: T,
  workspaceId?: string,
) {
  return !workspaceId || !item.workspaceId || item.workspaceId === workspaceId;
}

function formatDate(date?: string) {
  if (!date) return 'Recently';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  tone: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 rounded-2xl border border-[#eadfd5] bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#c99a78] hover:shadow-lg dark:border-white/10 dark:bg-[#151a1c] dark:hover:border-[#e5f55b]/50 dark:hover:shadow-black/20 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#8b7668] dark:text-slate-400">
            {title}
          </p>
          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-[#542f1e] dark:text-slate-50 sm:text-3xl">
            {value}
          </p>
        </div>
        <span className={`rounded-xl p-3 ${tone}`}>
          <Icon size={21} />
        </span>
      </div>
      <p className="mt-4 text-xs text-[#8b7668] dark:text-slate-400">
        {subtitle}
      </p>
    </button>
  );
}

function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-[#eadfd5] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151a1c] sm:p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[#542f1e] dark:text-slate-100">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-[#8b7668] dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function LoadingPanel() {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-2xl border border-[#eadfd5] bg-white text-sm text-[#8b7668] dark:border-white/10 dark:bg-[#151a1c] dark:text-slate-400">
      <RefreshCw className="mr-2 animate-spin" size={17} />
      Loading workspace data…
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout, lock } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleNavItems = navItems.filter(
    ({ roles }) => Boolean(user && roles.includes(user.role)),
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const workspaceId = user?.workspaceId;

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [
        feedbackResponse,
        votesResponse,
        roadmapResponse,
        categoriesResponse,
        activityResponse,
        workspaceResponse,
      ] = await Promise.all([
        axios.get<Feedback[]>(`${API_URL}/feedback`),
        axios.get<Vote[]>(`${API_URL}/votes`),
        axios.get<RoadmapItem[]>(`${API_URL}/roadmapItems`),
        axios.get<Category[]>(`${API_URL}/categories`),
        axios.get<ActivityLog[]>(`${API_URL}/activityLogs`),
        axios.get<Workspace[]>(`${API_URL}/workspaces`),
      ]);

      const allFeedback = feedbackResponse.data.filter((item) =>
        isWorkspaceRecord(item, workspaceId),
      );
      const allVotes = votesResponse.data.filter((item) =>
        isWorkspaceRecord(item, workspaceId),
      );
      const allRoadmap = roadmapResponse.data.filter((item) =>
        isWorkspaceRecord(item, workspaceId),
      );
      const allCategories = categoriesResponse.data.filter((item) =>
        isWorkspaceRecord(item, workspaceId),
      );
      const allActivities = activityResponse.data.filter((item) =>
        isWorkspaceRecord(item, workspaceId),
      );

      setFeedback(allFeedback);
      setVotes(allVotes);
      setRoadmap(allRoadmap);
      setCategories(allCategories);
      setActivities(allActivities);

      const matchedWorkspace = workspaceResponse.data.find(
        (item) => item.id === workspaceId,
      );
      setWorkspace(
        matchedWorkspace ||
          workspaceResponse.data[0] ||
          null,
      );
    } catch (err) {
      console.error('Dashboard data loading failed:', err);
      setError(
        'Could not load dashboard data. Make sure JSON Server is running on port 5000 and your db.json contains the required resources.',
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const visibleFeedback = useMemo(() => {
    const query = search.toLowerCase().trim();

    return feedback
      .filter((item) => {
        if (!query) return true;
        return (
          item.title.toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query)
        );
      })
      .filter((item) => {
        if (dateRange === 'all' || !item.createdAt) return true;
        const created = new Date(item.createdAt).getTime();
        const days = dateRange === '7d' ? 7 : 30;
        return Date.now() - created <= days * 24 * 60 * 60 * 1000;
      })
      .sort((a, b) => {
        const aDate = new Date(a.createdAt || 0).getTime();
        const bDate = new Date(b.createdAt || 0).getTime();
        return bDate - aDate;
      });
  }, [feedback, search, dateRange]);

  const totalVotes = useMemo(() => {
    if (votes.length) return votes.length;
    return feedback.reduce((sum, item) => sum + (Number(item.votes) || 0), 0);
  }, [votes, feedback]);

  const openRequests = feedback.filter(isOpenFeedback).length;
  const completedItems = roadmap.filter(
    (item) => normalize(getStatus(item)) === 'completed',
  ).length;
  const roadmapProgress = roadmap.length
    ? Math.round((completedItems / roadmap.length) * 100)
    : 0;

  const categoryChartData = categories.map((category) => ({
    name: category.name,
    total: feedback.filter(
      (item) =>
        item.categoryId === String(category.id) ||
        normalize(item.category) === normalize(category.name),
    ).length,
  }));

  const monthlyChartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const month = monthDate.toLocaleDateString(undefined, { month: 'short' });

      const count = feedback.filter((item) => {
        if (!item.createdAt) return false;
        const created = new Date(item.createdAt);
        return (
          created.getFullYear() === monthDate.getFullYear() &&
          created.getMonth() === monthDate.getMonth()
        );
      }).length;

      return { month, feedback: count };
    });
  }, [feedback]);

  const roadmapChartData = [
    {
      name: 'Under Review',
      value: roadmap.filter((item) => normalize(getStatus(item)) === 'under review').length,
    },
    {
      name: 'Planned',
      value: roadmap.filter((item) => normalize(getStatus(item)) === 'planned').length,
    },
    {
      name: 'In Progress',
      value: roadmap.filter((item) => normalize(getStatus(item)) === 'in progress').length,
    },
    { name: 'Completed', value: completedItems },
  ];

  const recentFeedback = visibleFeedback.slice(0, 5);
  const recentRoadmap = roadmap.slice(0, 4);
  const recentActivities = activities
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.timestamp || 0).getTime() -
        new Date(a.createdAt || a.timestamp || 0).getTime(),
    )
    .slice(0, 5);

  const goToFeedback = () => navigate('/feedback');

  return (
    <div className="dashboard-theme min-h-screen overflow-x-hidden bg-[#faf7f3] text-[#542f1e] dark:bg-[#0b0d0f] dark:text-slate-100">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#eadfd5] bg-white transition-all duration-300 dark:border-white/10 dark:bg-[#111416] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-[78px]' : 'md:w-[250px]'} w-[250px] md:translate-x-0`}
      >
        <div className="flex h-[76px] items-center gap-3 border-b border-[#eadfd5] px-5 dark:border-white/10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7c452a] text-white dark:bg-[#e5f55b] dark:text-[#171a10]">
            <Activity size={23} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold">ProductPulse</h1>
              <p className="truncate text-[11px] text-[#8b7668] dark:text-slate-400">
                Feedback workspace
              </p>
            </div>
          )}
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-1.5 hover:bg-[#f5eee8] dark:hover:bg-white/10 md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-scroll min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
          <p className={`px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a18a79] dark:text-slate-500 ${collapsed ? 'md:hidden' : ''}`}>
            Workspace
          </p>
          {visibleNavItems.map(({ label, path, icon: Icon }) => {
            const active =
              location.pathname === path ||
              (path !== '/dashboard' &&
                location.pathname.startsWith(`${path}/`));

            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? label : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition duration-200 ${
                  active
                    ? 'bg-[#7c452a] text-white shadow-md shadow-[#7c452a]/15 dark:bg-[#e5f55b] dark:text-[#171a10] dark:shadow-[#e5f55b]/10'
                    : 'text-[#755a49] hover:translate-x-0.5 hover:bg-[#f5eee8] dark:text-slate-300 dark:hover:bg-white/5'
                }`}
              >
                <Icon size={19} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
          <p className={`px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a18a79] dark:text-slate-500 ${collapsed ? 'md:hidden' : ''}`}>
            Help
          </p>
          <button
            type="button"
            onClick={() => navigate('/help')}
            title={collapsed ? 'Help & Support' : undefined}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#755a49] transition hover:bg-[#f5eee8] dark:text-slate-300 dark:hover:bg-white/5"
          >
            <CircleHelp size={19} />
            {!collapsed && 'Help & Support'}
          </button>
        </nav>

        <div className="border-t border-[#eadfd5] p-3 dark:border-white/10">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-[#8b7668] transition hover:bg-[#f5eee8] dark:text-slate-400 dark:hover:bg-white/5 md:flex"
          >
            <Menu size={17} />
            {!collapsed && 'Collapse sidebar'}
          </button>
        </div>
      </aside>

      <div className={`min-h-screen transition-[padding] duration-300 ${collapsed ? 'md:pl-[78px]' : 'md:pl-[250px]'}`}>
        <header className="sticky top-0 z-30 flex min-h-[76px] flex-wrap items-center gap-3 border-b border-[#eadfd5] bg-[#faf7f3]/95 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0d0f]/95 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl border border-[#eadfd5] p-2.5 transition hover:bg-white dark:border-white/10 dark:hover:bg-white/5 md:hidden"
          >
            <Menu size={19} />
          </button>

         <div className="min-w-0 flex-1">
  <h2 className="truncate text-lg font-bold sm:text-xl">
    {workspace?.name || 'ProductPulse'}
  </h2>
  <p className="text-xs text-[#8b7668] dark:text-slate-400">
    Customer feedback and product roadmap
  </p>
</div>

          <label className="relative order-last w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-[280px]">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b7668] dark:text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search feedback..."
              className="w-full rounded-xl border border-[#eadfd5] bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-[#a18a79] focus:border-[#b87a51] focus:ring-2 focus:ring-[#b87a51]/15 dark:border-white/10 dark:bg-[#151a1c] dark:placeholder:text-slate-500 dark:focus:border-[#e5f55b] dark:focus:ring-[#e5f55b]/10"
            />
          </label>

          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              title="Toggle light/dark mode"
              className="rounded-xl border border-[#eadfd5] bg-white p-2.5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#151a1c] dark:hover:border-[#e5f55b]/40"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-[#e5f55b]" />}
            </button>

            <button
              type="button"
              aria-label="Refresh dashboard"
              title="Refresh data"
              onClick={() => void loadDashboard()}
              className="rounded-xl border border-[#eadfd5] bg-white p-2.5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#151a1c]"
            >
              <RefreshCw size={18} />
            </button>

            <div className="relative">
              <button
                type="button"
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
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[#eadfd5] bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#151a1c]">
                  <p className="truncate px-3 py-2 text-xs text-[#8b7668] dark:text-slate-400">
                    {user?.email || 'Signed in'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      lock();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#f5eee8] dark:hover:bg-white/5"
                  >
                    <Clock3 size={16} /> Lock screen
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
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm text-[#8b7668] dark:text-slate-400">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="mt-2 text-sm text-[#8b7668] dark:text-slate-400">
                Here’s what’s happening with your customer feedback.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
                aria-label="Filter feedback by date"
                className="rounded-xl border border-[#eadfd5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b87a51] dark:border-white/10 dark:bg-[#151a1c] dark:focus:border-[#e5f55b]"
              >
                <option value="all">All time</option>
                <option value="30d">Last 30 days</option>
                <option value="7d">Last 7 days</option>
              </select>
              <button
                type="button"
                onClick={goToFeedback}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#65371f] hover:shadow-md dark:bg-[#e5f55b] dark:text-[#171a10] dark:hover:bg-[#f0ff7a]"
              >
                <Plus size={17} /> Add feedback
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-start gap-2">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                {error}
              </span>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="self-start rounded-lg border border-current px-3 py-1.5 font-semibold hover:opacity-75 sm:self-center"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <LoadingPanel />
          ) : (
            <>
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  title="Total feedback"
                  value={feedback.length.toLocaleString()}
                  subtitle="All requests in this workspace"
                  icon={MessageSquare}
                  tone="bg-orange-100 text-orange-800 dark:bg-orange-400/10 dark:text-orange-300"
                  onClick={() => navigate('/feedback')}
                />
                <MetricCard
                  title="Total votes"
                  value={totalVotes.toLocaleString()}
                  subtitle="Community votes on feedback"
                  icon={ThumbsUp}
                  tone="bg-violet-100 text-violet-800 dark:bg-violet-400/10 dark:text-violet-300"
                  onClick={() => navigate('/feedback')}
                />
                <MetricCard
                  title="Open requests"
                  value={openRequests.toLocaleString()}
                  subtitle="Requests not yet closed"
                  icon={Activity}
                  tone="bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"
                  onClick={() => navigate('/feedback')}
                />
                <MetricCard
                  title="Roadmap completed"
                  value={`${roadmapProgress}%`}
                  subtitle={`${completedItems} of ${roadmap.length} roadmap items completed`}
                  icon={CheckCircle2}
                  tone="bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300"
                  onClick={() => navigate('/roadmap')}
                />
              </section>

              <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-3">
                <div className="min-w-0 xl:col-span-2">
                  <Panel
                    title="Feedback activity"
                    subtitle="New feedback submitted over the last six calendar months"
                    action={
                      <span className="rounded-lg bg-[#f5eee8] px-2.5 py-1.5 text-xs font-medium text-[#7c452a] dark:bg-white/5 dark:text-[#e5f55b]">
                        Last 6 months
                      </span>
                    }
                  >
                    {monthlyChartData.every((item) => item.feedback === 0) ? (
                      <div className="flex h-[260px] flex-col items-center justify-center text-center">
                        <MessageSquare size={30} className="text-[#b9a18e] dark:text-slate-600" />
                        <p className="mt-3 text-sm font-medium">No feedback activity yet</p>
                        <p className="mt-1 text-xs text-[#8b7668] dark:text-slate-400">
                          New submissions will appear in this chart.
                        </p>
                      </div>
                    ) : (
                      <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={monthlyChartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="feedbackGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#b87950" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#b87950" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: 'var(--chart-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fill: 'var(--chart-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip
                              contentStyle={{
                                background: 'var(--chart-tooltip)',
                                border: '1px solid var(--chart-grid)',
                                borderRadius: 12,
                                color: 'var(--chart-text)',
                              }}
                            />
                            <Area type="monotone" dataKey="feedback" name="Feedback" stroke="#b87950" strokeWidth={3} fill="url(#feedbackGradient)" activeDot={{ r: 6 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Panel>
                </div>

                <Panel title="Roadmap overview" subtitle="Distribution by current stage">
                  {roadmap.length === 0 ? (
                    <div className="flex h-[260px] flex-col items-center justify-center text-center">
                      <Map size={30} className="text-[#b9a18e] dark:text-slate-600" />
                      <p className="mt-3 text-sm font-medium">Your roadmap is empty</p>
                      <p className="mt-1 text-xs text-[#8b7668] dark:text-slate-400">
                        Add roadmap items to see progress here.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/roadmap')}
                        className="mt-3 text-sm font-semibold text-[#7c452a] hover:underline dark:text-[#e5f55b]"
                      >
                        Open roadmap
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="h-[190px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={roadmapChartData.filter((item) => item.value > 0)}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={52}
                              outerRadius={78}
                              paddingAngle={4}
                              stroke="none"
                            >
                              {roadmapChartData.filter((item) => item.value > 0).map((entry, index) => (
                                <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: 'var(--chart-tooltip)',
                                border: '1px solid var(--chart-grid)',
                                borderRadius: 12,
                                color: 'var(--chart-text)',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {roadmapChartData.map((item, index) => (
                          <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex items-center gap-2 text-[#755a49] dark:text-slate-300">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[index] }} />
                              {item.name}
                            </span>
                            <span className="font-semibold">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Panel>
              </section>

              <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
                <Panel
                  title="Feedback by category"
                  subtitle="How requests are distributed across categories"
                  action={
                    <button
                      type="button"
                      onClick={() => navigate('/categories')}
                      className="text-xs font-semibold text-[#7c452a] hover:underline dark:text-[#e5f55b]"
                    >
                      Manage categories
                    </button>
                  }
                >
                  {categoryChartData.length === 0 ? (
                    <div className="flex h-[230px] flex-col items-center justify-center text-center">
                      <Tags size={28} className="text-[#b9a18e] dark:text-slate-600" />
                      <p className="mt-3 text-sm font-medium">No categories available</p>
                      <p className="mt-1 text-xs text-[#8b7668] dark:text-slate-400">
                        Create categories to organize customer feedback.
                      </p>
                    </div>
                  ) : (
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: 'var(--chart-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fill: 'var(--chart-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--chart-tooltip)',
                              border: '1px solid var(--chart-grid)',
                              borderRadius: 12,
                              color: 'var(--chart-text)',
                            }}
                          />
                          <Bar dataKey="total" name="Feedback" fill="#b87950" radius={[6, 6, 0, 0]} maxBarSize={42} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Panel>

                <Panel
                  title="Recent activity"
                  subtitle="Latest workspace activity records"
                  action={
                    <Activity size={18} className="text-[#8b7668] dark:text-slate-400" />
                  }
                >
                  {recentActivities.length === 0 ? (
                    <div className="flex h-[230px] flex-col items-center justify-center text-center">
                      <Activity size={28} className="text-[#b9a18e] dark:text-slate-600" />
                      <p className="mt-3 text-sm font-medium">No activity recorded yet</p>
                      <p className="mt-1 text-xs text-[#8b7668] dark:text-slate-400">
                        Activity will appear here as your team works.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivities.map((item, index) => (
                        <div key={item.id} className="flex gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5eee8] text-[#7c452a] dark:bg-white/5 dark:text-[#e5f55b]">
                            {index === 0 ? <CheckCircle2 size={17} /> : <Activity size={17} />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-medium">
                              {item.description || item.action || 'Workspace updated'}
                            </p>
                            <p className="mt-1 text-xs text-[#8b7668] dark:text-slate-400">
                              {formatDate(item.createdAt || item.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </section>

              <Panel
                title="Recent feedback"
                subtitle="Latest requests from your customers"
                action={
                  <button
                    type="button"
                    onClick={() => navigate('/feedback')}
                    className="text-sm font-semibold text-[#7c452a] transition hover:underline dark:text-[#e5f55b]"
                  >
                    View all feedback →
                  </button>
                }
              >
                {recentFeedback.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <MessageSquare size={32} className="text-[#b9a18e] dark:text-slate-600" />
                    <p className="mt-3 font-semibold">No feedback found</p>
                    <p className="mt-1 max-w-sm text-sm text-[#8b7668] dark:text-slate-400">
                      {search
                        ? 'Try a different search term.'
                        : 'Create your first feedback request to start collecting ideas.'}
                    </p>
                    <button
                      type="button"
                      onClick={goToFeedback}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#7c452a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#65371f] dark:bg-[#e5f55b] dark:text-[#171a10]"
                    >
                      <Plus size={16} /> Create feedback
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#eadfd5] text-xs uppercase tracking-wide text-[#8b7668] dark:border-white/10 dark:text-slate-400">
                          <th className="pb-3 pr-4 font-medium">Feedback</th>
                          <th className="pb-3 pr-4 font-medium">Category</th>
                          <th className="pb-3 pr-4 font-medium">Status</th>
                          <th className="pb-3 pr-4 font-medium">Votes</th>
                          <th className="pb-3 font-medium">Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentFeedback.map((item) => {
                          const voteCount = votes.length
                            ? votes.filter((vote) => String(vote.feedbackId) === String(item.id)).length
                            : Number(item.votes) || 0;
                          const status = item.status || 'Under Review';
                          return (
                            <tr
                              key={item.id}
                              onClick={() => navigate(`/feedback/${item.id}`)}
                              className="cursor-pointer border-b border-[#eadfd5]/70 transition hover:bg-[#faf7f3] dark:border-white/5 dark:hover:bg-white/[0.03]"
                            >
                              <td className="max-w-[280px] py-4 pr-4">
                                <p className="truncate font-semibold text-[#542f1e] dark:text-slate-100">
                                  {item.title}
                                </p>
                                <p className="mt-1 truncate text-xs text-[#8b7668] dark:text-slate-400">
                                  {item.description || 'No description provided'}
                                </p>
                              </td>
                              <td className="py-4 pr-4 text-[#755a49] dark:text-slate-300">
                                {item.category || categories.find((category) => String(category.id) === String(item.categoryId))?.name || 'Uncategorized'}
                              </td>
                              <td className="py-4 pr-4">
                                <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[normalize(status)] || 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300'}`}>
                                  {status}
                                </span>
                              </td>
                              <td className="py-4 pr-4">
                                <span className="inline-flex items-center gap-1.5 font-semibold">
                                  <ThumbsUp size={14} className="text-[#b87950]" />
                                  {voteCount}
                                </span>
                              </td>
                              <td className="whitespace-nowrap py-4 text-xs text-[#8b7668] dark:text-slate-400">
                                {formatDate(item.createdAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>

              <Panel
                title="Roadmap progress"
                subtitle="Recently updated roadmap items"
                action={
                  <button
                    type="button"
                    onClick={() => navigate('/roadmap')}
                    className="text-sm font-semibold text-[#7c452a] hover:underline dark:text-[#e5f55b]"
                  >
                    Open roadmap →
                  </button>
                }
              >
                {recentRoadmap.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Map size={30} className="text-[#b9a18e] dark:text-slate-600" />
                    <p className="mt-3 font-medium">No roadmap items yet</p>
                    <p className="mt-1 text-sm text-[#8b7668] dark:text-slate-400">
                      Add planned features to track product progress.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {recentRoadmap.map((item) => {
                      const status = getStatus(item);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => navigate('/roadmap')}
                          className="rounded-xl border border-[#eadfd5] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#c99a78] hover:shadow-md dark:border-white/10 dark:hover:border-[#e5f55b]/40"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-semibold">{item.title}</span>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[normalize(status)] || 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300'}`}>
                              {status}
                            </span>
                          </div>
                          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#f0e7df] dark:bg-white/10">
                            <div
                              className="h-full rounded-full bg-[#b87950] transition-all dark:bg-[#e5f55b]"
                              style={{
                                width: normalize(status) === 'completed'
                                  ? '100%'
                                  : normalize(status) === 'in progress'
                                    ? '60%'
                                    : normalize(status) === 'planned'
                                      ? '30%'
                                      : '10%',
                              }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Panel>

              <footer className="flex flex-col gap-2 border-t border-[#eadfd5] py-4 text-xs text-[#8b7668] dark:border-white/10 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>ProductPulse · Customer Feedback & Product Roadmap</span>
                <span>{workspace?.name || 'Your workspace'}</span>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
