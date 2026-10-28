import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import type { ReactNode } from 'react';

import { useAuth, type UserRole } from './context/AuthContext';

import AuthLayout from './layouts/AuthLayout';

import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import LockScreenPage from './pages/auth/LockScreenPage';
import ProtectedRoute from './pages/auth/ProtectedRoute';

import DashboardPage from './pages/dashboard/DashboardPage';
import FeedbackPage from './pages/feedback/FeedbackPage';
import WorkspacesPage from './pages/workspaces/WorkspacesPage';
import RoadmapPage from './pages/roadmap/RoadmapPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import TeamPage from './pages/team/TeamPage';
import ReleaseNotesPage from './pages/release-notes/ReleaseNotesPage';
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import WorkspaceSettingsPage from './pages/settings/WorkspaceSettingsPage';
import HelpSupportPage from './pages/help/HelpSupportPage';

import NotFoundPage from './pages/errors/NotFoundPage';
import ServerErrorPage from './pages/errors/ServerErrorPage';

const ALL_ROLES: UserRole[] = [
  'owner',
  'admin',
  'product_manager',
  'customer',
];

function RoleProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: ReactNode;
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication pages */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage />}
          />

          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />

          <Route
            path="/lock-screen"
            element={<LockScreenPage />}
          />
        </Route>

        {/* Protected application pages */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/feedback"
            element={<FeedbackPage />}
          />

          <Route
            path="/feedback/:feedbackId"
            element={<FeedbackPage />}
          />

          <Route
            path="/roadmap"
            element={
              <RoleProtectedRoute allowedRoles={ALL_ROLES}>
                <RoadmapPage />
              </RoleProtectedRoute>
            }
          />

          {/* All four roles can access Workspaces */}
          <Route
            path="/workspaces"
            element={
              <RoleProtectedRoute allowedRoles={ALL_ROLES}>
                <WorkspacesPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  'owner',
                  'admin',
                  'product_manager',
                ]}
              >
                <CategoriesPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/team"
            element={
              <RoleProtectedRoute
                allowedRoles={['owner', 'admin']}
              >
                <TeamPage />
              </RoleProtectedRoute>
            }
          />

          {/* All four roles can access Release Notes */}
          <Route
            path="/release-notes"
            element={
              <RoleProtectedRoute allowedRoles={ALL_ROLES}>
                <ReleaseNotesPage />
              </RoleProtectedRoute>
            }
          />

          {/* Owner only */}
          <Route
            path="/subscription"
            element={
              <RoleProtectedRoute allowedRoles={['owner']}>
                <SubscriptionPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <RoleProtectedRoute allowedRoles={['owner']}>
                <WorkspaceSettingsPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/help"
            element={
              <RoleProtectedRoute allowedRoles={ALL_ROLES}>
                <HelpSupportPage />
              </RoleProtectedRoute>
            }
          />
        </Route>

        {/* Default and error pages */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/500"
          element={<ServerErrorPage />}
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}