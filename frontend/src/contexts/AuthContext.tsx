import { createContext, useContext, useMemo, useState } from 'react';
import type { AuthResponse, LoginRequest, Session } from '../types/api';
import { login as loginRequest } from '../api/auth';

const SESSION_KEY = 'docu.session';

type AuthContextValue = {
  session: Session | null;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function toSession(auth: AuthResponse): Session {
  return {
    token: auth.token,
    username: auth.username,
    fullName: auth.fullName || auth.username,
    roles: auth.roles || [],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [session, setSession] = useState<Session | null>(() => readSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      async login(payload) {
        const auth = await loginRequest(payload);
        const nextSession = toSession(auth);
        localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
        setSession(nextSession);
      },
      logout() {
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthContext не инициализирован');
  return value;
}
