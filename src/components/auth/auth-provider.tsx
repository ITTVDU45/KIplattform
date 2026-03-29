"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/lib/auth/auth.service";
import type { AuthSession } from "@/lib/auth/auth.types";

interface AuthContextValue extends AuthSession {
  isLoading: boolean;
  refreshSession: () => Promise<AuthSession>;
  logout: () => Promise<void>;
}

const UNAUTHENTICATED_SESSION: AuthSession = {
  authenticated: false,
  user: null,
  roles: [],
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(UNAUTHENTICATED_SESSION);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const nextSession = await authService.getSession();

      if (!nextSession.authenticated) {
        try {
          await authService.refresh();
          const refreshedSession = await authService.getSession();
          setSession(refreshedSession);
          return refreshedSession;
        } catch {
          setSession(UNAUTHENTICATED_SESSION);
          return UNAUTHENTICATED_SESSION;
        }
      }

      setSession(nextSession);
      return nextSession;
    } catch {
      setSession(UNAUTHENTICATED_SESSION);
      return UNAUTHENTICATED_SESSION;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    await authService.logout();
    setSession(UNAUTHENTICATED_SESSION);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...session,
      isLoading,
      refreshSession,
      logout,
    }),
    [session, isLoading, refreshSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
