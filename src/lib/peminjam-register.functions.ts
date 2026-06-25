import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  nama: z.string().trim().min(2).max(100),
  no_identitas: z.string().trim().min(3).max(50),
  no_hp: z.string().trim().min(8).max(20),
  alamat: z.string().trim().min(3).max(300),
  email: z.string().trim().email().max(200).nullable().optional(),
});

export const registerPeminjam = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { ...data, email: data.email || null };
    const { data: row, error } = await supabaseAdmin
      .from("peminjam")
      .insert(payload as never)
      .select("kode_peminjam")
      .single();
    if (error) throw new Error(error.message);
    return { kode_peminjam: (row as { kode_peminjam: string }).kode_peminjam };
  });
