import { createServerFn } from "@tanstack/react-start";

export const getPublicStats = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const [buku, peminjam, peminjaman] = await Promise.all([
        supabaseAdmin
          .from("buku")
          .select("*", { count: "exact", head: true }),
        supabaseAdmin
          .from("peminjam")
          .select("*", { count: "exact", head: true }),
        supabaseAdmin
          .from("peminjaman")
          .select("*", { count: "exact", head: true }),
      ]);
      return {
        totalBuku: buku.count ?? 0,
        totalPeminjam: peminjam.count ?? 0,
        totalPeminjaman: peminjaman.count ?? 0,
      };
    } catch {
      return { totalBuku: 0, totalPeminjam: 0, totalPeminjaman: 0 };
    }
  },
);
