import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  username: z.string().trim().min(1).max(60),
  nama_lengkap: z.string().trim().min(1).max(120),
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

    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username, nama_lengkap: data.nama_lengkap },
    });
    if (cErr || !created.user) throw new Error(cErr?.message ?? "Gagal membuat akun");

    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "petugas" });
    if (rErr) {
      // best-effort cleanup so we don't leave an orphaned auth user without a role
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(rErr.message);
    }

    return { ok: true, user_id: created.user.id };
  });
