import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "admin" | "petugas";

export interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  username: string | null;
  namaLengkap: string | null;
}

/**
 * Ekstrak role dari JWT (Custom Access Token Hook) atau app_metadata.
 * Tidak lagi membaca tabel public.user_roles.
 */
function extractRolesFromSession(session: Session | null): AppRole[] {
  if (!session) return [];
  const out = new Set<string>();

  // 1) JWT claims dari Custom Access Token Hook
  try {
    const parts = session.access_token?.split(".");
    if (parts && parts.length >= 2) {
      const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(json) as Record<string, unknown>;
      const candidates = [
        payload.role,
        payload.user_role,
        payload.roles,
        payload.user_roles,
      ].flat();
      for (const c of candidates) {
        if (typeof c === "string") out.add(c);
      }
    }
  } catch {
    /* ignore decode errors */
  }

  // 2) Fallback: app_metadata.role / app_metadata.roles
  const meta = session.user?.app_metadata as Record<string, unknown> | undefined;
  const metaVals = [meta?.role, meta?.roles].flat();
  for (const c of metaVals) {
    if (typeof c === "string") out.add(c);
  }

  return Array.from(out).filter((r): r is AppRole => r === "admin" || r === "petugas");
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
    roles: [],
    username: null,
    namaLengkap: null,
  });

  useEffect(() => {
    let active = true;

    const loadProfile = async (session: Session | null) => {
      const user: User | null = session?.user ?? null;
      if (!user) {
        if (active)
          setState({
            loading: false,
            session: null,
            user: null,
            roles: [],
            username: null,
            namaLengkap: null,
          });
        return;
      }
      const roles = extractRolesFromSession(session);
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, nama_lengkap")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      setState({
        loading: false,
        session,
        user,
        roles,
        username: profile?.username ?? user.email ?? null,
        namaLengkap: profile?.nama_lengkap ?? null,
      });
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      loadProfile(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      loadProfile(session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export const hasRole = (roles: AppRole[], r: AppRole) => roles.includes(r);
