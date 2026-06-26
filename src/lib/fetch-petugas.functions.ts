import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Fetch daftar petugas dari user_roles table + user_metadata dari auth.users
 * Tidak tergantung pada profiles table yang mungkin belum terbuat.
 */
export const fetchPetugasList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Server-side admin role check
    const { data: roleRow, error: roleErr } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) throw new Error(roleErr.message);
    if (!roleRow) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get all petugas users from user_roles
    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "petugas");
    
    if (rolesErr) throw new Error(rolesErr.message);
    
    const userIds = (roles ?? []).map((r) => r.user_id);
    if (userIds.length === 0) return [];

    // Get user metadata from auth.users for all petugas
    const { data: authUsers, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000, // Adjust if needed
    });
    
    if (authErr) throw new Error(authErr.message);

    // Filter and map users
    return (authUsers?.users ?? [])
      .filter((user) => userIds.includes(user.id))
      .map((user) => {
        const meta = user.user_metadata ?? {};
        return {
          user_id: user.id,
          email: user.email ?? null,
          username: meta.username ?? null,
          nama_lengkap: meta.nama_lengkap ?? null,
        };
      });
  });

/**
 * Fetch daftar admin dari user_roles table + user_metadata dari auth.users
 */
export const fetchAdminList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Server-side admin role check
    const { data: roleRow, error: roleErr } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) throw new Error(roleErr.message);
    if (!roleRow) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get all admin users from user_roles
    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    
    if (rolesErr) throw new Error(rolesErr.message);
    
    const userIds = (roles ?? []).map((r) => r.user_id);
    if (userIds.length === 0) return [];

    // Get user metadata from auth.users for all admins
    const { data: authUsers, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000, // Adjust if needed
    });
    
    if (authErr) throw new Error(authErr.message);

    // Filter and map users
    return (authUsers?.users ?? [])
      .filter((user) => userIds.includes(user.id))
      .map((user) => {
        const meta = user.user_metadata ?? {};
        return {
          user_id: user.id,
          email: user.email ?? null,
          username: meta.username ?? null,
          nama_lengkap: meta.nama_lengkap ?? null,
        };
      });
  });
