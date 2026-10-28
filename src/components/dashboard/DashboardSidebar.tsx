import {
  Building2,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Route,
  Settings,
  Tags,
  Users,
  X,
} from 'lucide-react';

import { useAuth, type UserRole } from '../../context/AuthContext';

interface DashboardSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  activeSection: string;
  onSelectSection: (section: string) => void;
}

interface NavigationItem {
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const ALL_ROLES: UserRole[] = [
  'owner',
  'admin',
  'product_manager',
  'customer',
];

// ProductPulse role-based sidebar permissions.
const navigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
  {
    label: 'Feedback',
    icon: MessageSquare,
    roles: ALL_ROLES,
  },
  {
    label: 'Roadmap',
    icon: Route,
    roles: ALL_ROLES,
  },
  {
    label: 'Categories & Tags',
    icon: Tags,
    roles: ['owner', 'admin', 'product_manager'],
  },
  {
    label: 'Team Management',
    icon: Users,
    roles: ['owner', 'admin'],
  },
  {
    label: 'Release Notes',
    icon: FileText,
    roles: ALL_ROLES,
  },
  {
    label: 'Subscription & Usage',
    icon: CreditCard,
    roles: ['owner'],
  },
  {
    label: 'Workspace Settings',
    icon: Settings,
    roles: ['owner'],
  },
  {
    label: 'Workspaces',
    icon: Building2,
    roles: ALL_ROLES,
  },
  {
    label: 'Help & Support',
    icon: CircleHelp,
    roles: ALL_ROLES,
  },
];

export default function DashboardSidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  activeSection,
  onSelectSection,
}: DashboardSidebarProps) {
  const { user } = useAuth();

  // Only display menus allowed for the current user's role.
  const visibleNavigation = navigation.filter(
    (item) => Boolean(user && item.roles.includes(user.role)),
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col',
          'border-r transition-all duration-300',
          'border-[#eadfd5] bg-white text-[#63351f]',
          'dark:border-white/10 dark:bg-[#090d10] dark:text-slate-100',
          'md:sticky md:top-0 md:z-20 md:h-screen md:translate-x-0',
          collapsed ? 'md:w-[76px]' : 'md:w-[250px]',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        {/* Branding */}
        <div className="flex min-h-[76px] shrink-0 items-center justify-between gap-3 border-b border-[#eadfd5] px-4 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-yellow-400/10 dark:text-yellow-300">
              <ClipboardList size={26} />
            </div>

            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <p className="text-sm font-black tracking-wide">
                  PRODUCTPULSE
                </p>
                <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-[0.16em] opacity-70">
                  Feedback workspace
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="rounded-lg p-2 hover:bg-orange-50 dark:hover:bg-white/10 md:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4">
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] opacity-60">
              Workspace
            </p>
          )}

          {visibleNavigation.map(({ label, icon: Icon }) => {
            const active = activeSection === label;

            return (
              <button
                key={label}
                type="button"
                title={collapsed ? label : undefined}
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  onSelectSection(label);
                  onCloseMobile();
                }}
                className={[
                  'flex min-h-12 w-full items-center gap-3 rounded-xl px-3',
                  'text-left text-sm font-semibold transition-all',
                  active
                    ? 'bg-[#b95620] text-white shadow-md shadow-orange-900/10 dark:bg-yellow-400/15 dark:text-yellow-300 dark:ring-1 dark:ring-yellow-400/60 dark:shadow-yellow-400/10'
                    : 'hover:bg-orange-50 dark:hover:bg-white/5',
                  collapsed ? 'md:justify-center md:px-0' : '',
                ].join(' ')}
              >
                <Icon size={20} className="shrink-0" />

                {!collapsed && (
                  <span className="truncate">{label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="shrink-0 border-t border-[#eadfd5] px-5 py-4 text-[10px] opacity-55 dark:border-white/10">
            ProductPulse · 2026
          </div>
        )}
      </aside>
    </>
  );
}
