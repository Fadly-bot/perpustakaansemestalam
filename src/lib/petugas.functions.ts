import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255),
  password: z.string().min(8, "Password minimal 8 karakter").max(72),
  username: z.string().trim().min(3, "Username minimal 3 karakter").max(60),
  nama_lengkap: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
});

export const createPetugas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    // Server-side admin role check (does not trust the client UI gate).
    const { data: roleRow, error: roleErr } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) throw new Error(roleErr.message);
    if (!roleRow) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Create user in Supabase Auth with role in user_metadata
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { 
        username: data.username, 
        nama_lengkap: data.nama_lengkap,
        role: "petugas"
      },
    });
    
    if (cErr || !created.user) {
      // Provide user-friendly error messages
      if (cErr?.message?.includes("already exists")) {
        throw new Error("Email sudah digunakan. Gunakan email lain.");
      }
      if (cErr?.message?.includes("password")) {
        throw new Error("Password tidak memenuhi syarat keamanan.");
      }
      throw new Error(cErr?.message ?? "Gagal membuat akun petugas.");
    }

    // Insert role into user_roles table
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "petugas" });
    
    if (rErr) {
      // best-effort cleanup so we don't leave an orphaned auth user without a role
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(`Gagal menambahkan role. ${rErr.message}`);
    }

    return { 
      ok: true, 
      user_id: created.user.id,
      email: created.user.email,
      username: data.username,
      nama_lengkap: data.nama_lengkap,
    };
  });

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
      perPage: 1000,
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
      perPage: 1000,
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
