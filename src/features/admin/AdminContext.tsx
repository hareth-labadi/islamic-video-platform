"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api/client";
import { invalidate } from "./api/hooks";
import type { AdminSheikh, Member, Session } from "./api/types";
import { getAdminDictionary, type AdminDictionary, type AdminLocale } from "./i18n";
import { can, type Action } from "./permissions";
import { adminRoutes, type AdminRoutes } from "./routes";

const SHEIKH_KEY = "admin-current-sheikh";

interface AdminContextValue {
  locale: AdminLocale;
  t: AdminDictionary;
  routes: AdminRoutes;
  /** undefined while the session loads, null when signed out. */
  session: Session | null | undefined;
  member?: Member;
  sheikh?: AdminSheikh;
  sheikhs: AdminSheikh[];
  setSheikh(id: string): void;
  setSession(session: Session | null): void;
  refreshSession(): Promise<void>;
  signOut(): Promise<void>;
  /** Permission check for the signed-in member. */
  can(action: Action): boolean;
}

const AdminContext = createContext<AdminContextValue | null>(null);

function readSheikhId(): string | null {
  try {
    return localStorage.getItem(SHEIKH_KEY);
  } catch {
    return null;
  }
}

export function AdminProvider({ locale, children }: { locale: AdminLocale; children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null | undefined>(undefined);
  const [sheikhId, setSheikhId] = useState<string | null>(null);

  const setSession = useCallback((next: Session | null) => {
    setSessionState(next);
    if (next) {
      const saved = readSheikhId();
      setSheikhId(next.sheikhs.some((s) => s.id === saved) ? saved : (next.sheikhs[0]?.id ?? null));
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      setSession(await api.auth.session());
    } catch {
      setSession(null);
    }
  }, [setSession]);

  useEffect(() => {
    let alive = true;
    api.auth.session().then(
      (s) => alive && setSession(s),
      () => alive && setSession(null),
    );
    return () => {
      alive = false;
    };
  }, [setSession]);

  const value = useMemo<AdminContextValue>(() => {
    const sheikhs = session?.sheikhs ?? [];
    const sheikh = sheikhs.find((s) => s.id === sheikhId) ?? sheikhs[0];
    return {
      locale,
      t: getAdminDictionary(locale),
      routes: adminRoutes(locale),
      session,
      member: session?.member,
      sheikh,
      sheikhs,
      setSheikh(id) {
        setSheikhId(id);
        try {
          localStorage.setItem(SHEIKH_KEY, id);
        } catch {
          /* ignore */
        }
        invalidate();
      },
      setSession,
      refreshSession,
      async signOut() {
        await api.auth.signOut().catch(() => undefined);
        setSessionState(null);
      },
      can: (action) => can(session?.member.role, action),
    };
  }, [locale, session, sheikhId, setSession, refreshSession]);

  return <AdminContext value={value}>{children}</AdminContext>;
}

export function useAdmin(): AdminContextValue {
  const value = useContext(AdminContext);
  if (!value) throw new Error("useAdmin must be used inside <AdminProvider>");
  return value;
}

/** For screens inside the signed-in shell: the member and current sheikh are always there. */
export function usePanel() {
  const ctx = useAdmin();
  if (!ctx.member || !ctx.sheikh) throw new Error("usePanel used outside the signed-in shell");
  return { ...ctx, member: ctx.member, sheikh: ctx.sheikh };
}
