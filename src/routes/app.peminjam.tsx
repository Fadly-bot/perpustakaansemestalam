import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, Users, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/app/peminjam")({
  ssr: false,
  component: PeminjamPage,
});

function PeminjamPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: "", no_identitas: "", no_hp: "", alamat: "", email: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["peminjam", search],
    queryFn: async () => {
      let q = supabase.from("peminjam").select("*").order("created_at", { ascending: false });
      if (search.trim()) q = q.ilike("nama", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: history } = useQuery({
    queryKey: ["peminjam-history", detailId],
    enabled: !!detailId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("peminjaman")
        .select("*, detail_peminjaman(jumlah, buku(judul, kode_buku))")
        .eq("peminjam_id", detailId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) return toast.error("Nama wajib diisi");
    const { error } = await supabase.from("peminjam").insert({
      nama: form.nama.trim(),
      no_identitas: form.no_identitas || null,
      no_hp: form.no_hp || null,
      alamat: form.alamat || null,
      email: form.email || null,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Peminjam ditambahkan");
    setOpen(false);
    setForm({ nama: "", no_identitas: "", no_hp: "", alamat: "", email: "" });
    qc.invalidateQueries({ queryKey: ["peminjam"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  return (
    <div>
      <PageHeader
        title="Data Peminjam"
        description="Daftar masyarakat/siswa yang terdaftar sebagai peminjam."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Tambah Peminjam
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari nama..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Belum ada peminjam.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Kode</th>
                  <th className="text-left px-4 py-3">Nama</th>
                  <th className="text-left px-4 py-3">No. Identitas</th>
                  <th className="text-left px-4 py-3">No. HP</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-xs">{p.kode_peminjam}</td>
                    <td className="px-4 py-3 font-medium">{p.nama}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.no_identitas ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.no_hp ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setDetailId(p.id)}>
                        <Eye className="h-4 w-4" /> Histori
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Peminjam</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>No. Identitas</Label>
                <Input value={form.no_identitas} onChange={(e) => setForm({ ...form, no_identitas: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>No. HP</Label>
                <Input value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Textarea rows={2} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histori Peminjaman</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {!history || history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada histori.</p>
            ) : (
              <ul className="divide-y">
                {history.map((h) => (
                  <li key={h.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {format(new Date(h.tanggal_pinjam), "dd MMM yyyy")} → {format(new Date(h.tanggal_kembali), "dd MMM yyyy")}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary capitalize">{h.status}</span>
                    </div>
                    <ul className="mt-1 text-xs text-muted-foreground space-y-0.5">
                      {h.detail_peminjaman?.map((d: { jumlah: number; buku: { judul: string; kode_buku: string } | null }, i: number) => (
                        <li key={i}>
                          {d.buku?.judul} ({d.buku?.kode_buku}) × {d.jumlah}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}