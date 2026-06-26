import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
 
const schema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255),
  password: z.string().min(8, "Password minimal 8 karakter").max(72),
  username: z.string().trim().min(3, "Username minimal 3 karakter").max(60),
  nama_lengkap: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
});
 
type AdminContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
};
 
async function assertAdmin(ctx: AdminContext) {
  const { data: roleRow, error: roleErr } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
 
  if (roleErr) throw new Error(roleErr.message);
  if (!roleRow) throw new Response("Forbidden", { status: 403 });
}
 
async function listAllAuthUsers(supabaseAdmin: SupabaseClient<Database>) {
  const perPage = 200;
  const users: User[] = [];
  let page = 1;
 
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
 
    const currentUsers = data?.users ?? [];
    users.push(...currentUsers);
 
    if (currentUsers.length < perPage) break;
    page += 1;
  }
 
  return users;
}
 
function getPetugasStatus(user: {
  banned_until?: string | null;
  email_confirmed_at?: string | null;
}) {
  if (user.banned_until) return "Nonaktif";
  if (user.email_confirmed_at) return "Aktif";
  return "Menunggu Verifikasi";
}

export const createPetugas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
 
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const users = await listAllAuthUsers(supabaseAdmin);
    const normalizedEmail = data.email.trim().toLowerCase();
    const normalizedUsername = data.username.trim().toLowerCase();
    const namaLengkap = data.nama_lengkap.trim();
 
    const existingEmail = users.find(
      (user) => (user.email ?? "").toLowerCase() === normalizedEmail,
    );
    if (existingEmail) {
      throw new Error("Email sudah digunakan. Gunakan email lain.");
    }
 
    const existingUsername = users.find((user) => {
      const meta = user.user_metadata ?? {};
      return (
        typeof meta.username === "string" &&
        meta.username.trim().toLowerCase() === normalizedUsername
      );
    });
    if (existingUsername) {
      throw new Error("Username sudah digunakan. Gunakan username lain.");
    }
 
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
       email: normalizedEmail,
      password: data.password,
      email_confirm: true,
       user_metadata: {
        username: normalizedUsername,
        full_name: namaLengkap,
        nama_lengkap: namaLengkap,
        role: "petugas",
      },
    });

    if (cErr || !created.user) {
      if (cErr?.message?.includes("already exists")) {
        throw new Error("Email sudah digunakan. Gunakan email lain.");
      }
      if (cErr?.message?.includes("password")) {
        throw new Error("Password tidak memenuhi syarat keamanan.");
      }
      throw new Error(cErr?.message ?? "Gagal membuat akun petugas.");
    }

    return {
      ok: true,
      user_id: created.user.id,
      email: created.user.email,
       username: normalizedUsername,
      nama_lengkap: namaLengkap,
      role: "petugas",
      status: getPetugasStatus(created.user),
    };
  });
 
/**
 * Fetch daftar petugas dari user_roles table + user_metadata dari auth.users
 * Tidak tergantung pada profiles table yang mungkin belum terbuat.
 */
export const fetchPetugasList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
     await assertAdmin(context);
 
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const users = await listAllAuthUsers(supabaseAdmin);
    const { data: adminRoles, error: adminRolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
    .eq("role", "admin");

 if (adminRolesErr) throw new Error(adminRolesErr.message);
 const adminIds = new Set((adminRoles ?? []).map((role) => role.user_id));
 
    return users
      .filter((user) => {
        const meta = user.user_metadata ?? {};
        return meta.role === "petugas" && !adminIds.has(user.id);
      })
      .map((user) => {
        const meta = user.user_metadata ?? {};
        return {
          user_id: user.id,
          email: user.email ?? null,
          username: meta.username ?? null,
           nama_lengkap: meta.full_name ?? meta.nama_lengkap ?? null,
          role: meta.role ?? "petugas",
          status: getPetugasStatus(user),
        };
         })
      .sort((a, b) => (a.nama_lengkap ?? "").localeCompare(b.nama_lengkap ?? "", "id"));
  });
 
export const removePetugasRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: unknown) =>
      z
        .object({
          user_id: z.string().uuid("User ID tidak valid"),
        })
        .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
 
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(
      data.user_id,
    );
 
    if (getUserError) throw new Error(getUserError.message);
    if (!userData.user) throw new Error("Akun petugas tidak ditemukan.");
 
    const nextMetadata = { ...(userData.user.user_metadata ?? {}) };
    delete nextMetadata.role;
 
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      user_metadata: nextMetadata,
    });
 
    if (updateError) throw new Error(updateError.message);
 
    return { ok: true };
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
