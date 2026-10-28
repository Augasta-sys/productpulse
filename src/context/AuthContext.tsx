import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import api from '../services/api';

export type UserRole =
  | 'owner'
  | 'admin'
  | 'product_manager'
  | 'customer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  status: string;
  role: UserRole;
  workspaceId?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  lock: () => void;
  unlock: (password: string) => Promise<void>;
  logout: () => void;
}

const SESSION_KEY = 'productpulse-user';
const LOCK_KEY = 'productpulse-locked';

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

function getSavedUser(): AuthUser | null {
  try {
    const savedUser = localStorage.getItem(SESSION_KEY);

    return savedUser
      ? (JSON.parse(savedUser) as AuthUser)
      : null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function getSavedLockState(): boolean {
  return localStorage.getItem(LOCK_KEY) === 'true';
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(getSavedUser);
  const [isLocked, setIsLocked] = useState<boolean>(
    getSavedLockState,
  );

  const login = async ({
    email,
    password,
  }: LoginCredentials): Promise<void> => {
    const normalizedEmail = email.trim().toLowerCase();

    const response = await api.get('/users', {
      params: {
        email: normalizedEmail,
        password,
      },
    });

    const matchedUsers = response.data as Array<{
      id: string | number;
      name: string;
      email: string;
      status: string;
    }>;

    const matchedUser = matchedUsers.find(
      (item) =>
        item.email.toLowerCase() === normalizedEmail,
    );

    if (!matchedUser) {
      throw new Error('Invalid email or password.');
    }

    if (matchedUser.status !== 'active') {
      throw new Error(
        'This account is inactive. Contact your workspace owner.',
      );
    }

    const memberResponse = await api.get('/workspaceMembers', {
      params: {
        userId: String(matchedUser.id),
        status: 'active',
      },
    });

    const memberships = memberResponse.data as Array<{
      workspaceId: string;
      userId: string;
      role: UserRole;
      status: string;
    }>;

    const validRoles: UserRole[] = [
  'owner',
  'admin',
  'product_manager',
  'customer',
];

const membership = memberships.find(
  (item) => validRoles.includes(item.role),
);

if (!membership) {
  throw new Error(
    'No active workspace membership found for this account.',
  );
}

    const authenticatedUser: AuthUser = {
      id: String(matchedUser.id),
      name: matchedUser.name,
      email: matchedUser.email,
      status: matchedUser.status,
      role: membership.role,
      workspaceId: membership.workspaceId,
    };

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(authenticatedUser),
    );
    localStorage.removeItem(LOCK_KEY);

    setUser(authenticatedUser);
    setIsLocked(false);
  };

  const lock = () => {
    if (!user) return;

    localStorage.setItem(LOCK_KEY, 'true');
    setIsLocked(true);
  };

  const unlock = async (password: string): Promise<void> => {
    if (!user) {
      throw new Error('Please sign in again to continue.');
    }

    const response = await api.get('/users', {
      params: {
        email: user.email.trim().toLowerCase(),
        password,
      },
    });

    const matchedUser = (
      response.data as Array<{
        id: string | number;
        status: string;
      }>
    ).find(
      (item) =>
        String(item.id) === user.id &&
        item.status === 'active',
    );

    if (!matchedUser) {
      throw new Error('Incorrect password. Please try again.');
    }

    localStorage.removeItem(LOCK_KEY);
    setIsLocked(false);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LOCK_KEY);

    setUser(null);
    setIsLocked(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLocked,
        login,
        lock,
        unlock,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    );
  }

  return context;
}
