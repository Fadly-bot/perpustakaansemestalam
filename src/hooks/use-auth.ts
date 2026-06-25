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

    const loadProfile = async (user: User | null) => {
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
      const [{ data: rolesData }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("username, nama_lengkap").eq("id", user.id).maybeSingle(),
      ]);
      if (!active) return;
      const roles = (rolesData ?? []).map((r) => r.role as AppRole);
      setState((s) => ({
        ...s,
        loading: false,
        user,
        roles,
        username: profile?.username ?? user.email ?? null,
        namaLengkap: profile?.nama_lengkap ?? null,
      }));
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState((s) => ({ ...s, session: data.session }));
      loadProfile(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setState((s) => ({ ...s, session }));
      loadProfile(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export const hasRole = (roles: AppRole[], r: AppRole) => roles.includes(r);