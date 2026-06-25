import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, Loader2, Library } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/buku")({
  ssr: false,
  component: BukuPage,
});

type BukuRow = {
  id: string;
  kode_buku: string;
  judul: string;
  penulis: string | null;
  penerbit: string | null;
  tahun_terbit: number | null;
  kategori_id: string | null;
  jumlah_total: number;
  jumlah_tersedia: number;
  lokasi_rak: string | null;
  cover_url: string | null;
  kategori_buku?: { nama_kategori: string } | null;
};

const emptyForm = {
  judul: "",
  penulis: "",
  penerbit: "",
  tahun_terbit: "",
  kategori_id: "",
  jumlah_total: "1",
  lokasi_rak: "",
  cover_url: "",
};

function BukuPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterKat, setFilterKat] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BukuRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: kategori } = useQuery({
    queryKey: ["kategori_buku"],
    queryFn: async () => {
      const { data, error } = await supabase.from("kategori_buku").select("*").order("nama_kategori");
      if (error) throw error;
      return data;
    },
  });

  const { data: buku, isLoading } = useQuery({
    queryKey: ["buku", search, filterKat],
    queryFn: async () => {
      let q = supabase
        .from("buku")
        .select("*, kategori_buku(nama_kategori)")
        .order("created_at", { ascending: false });
      if (search.trim()) q = q.ilike("judul", `%${search.trim()}%`);
      if (filterKat !== "all") q = q.eq("kategori_id", filterKat);
      const { data, error } = await q;
      if (error) throw error;
      return data as BukuRow[];
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (b: BukuRow) => {
    setEditing(b);
    setForm({
      judul: b.judul,
      penulis: b.penulis ?? "",
      penerbit: b.penerbit ?? "",
      tahun_terbit: b.tahun_terbit?.toString() ?? "",
      kategori_id: b.kategori_id ?? "",
      jumlah_total: b.jumlah_total.toString(),
      lokasi_rak: b.lokasi_rak ?? "",
      cover_url: b.cover_url ?? "",
    });
    setOpen(true);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.judul.trim()) {
      toast.error("Judul wajib diisi");
      return;
    }
    setSaving(true);
    const total = Math.max(1, parseInt(form.jumlah_total || "1", 10));
    const payload = {
      judul: form.judul.trim(),
      penulis: form.penulis || null,
      penerbit: form.penerbit || null,
      tahun_terbit: form.tahun_terbit ? parseInt(form.tahun_terbit, 10) : null,
      kategori_id: form.kategori_id || null,
      jumlah_total: total,
      lokasi_rak: form.lokasi_rak || null,
      cover_url: form.cover_url || null,
    };
    const isEditing = Boolean(editing);

    if (editing) {
      const diff = total - editing.jumlah_total;
      const newAvail = Math.max(0, editing.jumlah_tersedia + diff);
      const { error } = await supabase
        .from("buku")
        .update({ ...payload, jumlah_tersedia: newAvail })
        .eq("id", editing.id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Buku diperbarui");
    } else {
      const { error } = await supabase
        .from("buku")
        .insert({ ...payload, jumlah_tersedia: total } as never);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Buku ditambahkan");
    }
    if (!isEditing) {
      setSearch("");
      setFilterKat("all");
    }
    setOpen(false);
    await qc.invalidateQueries({ queryKey: ["buku"] });
    await qc.refetchQueries({ queryKey: ["buku"], type: "active" });
    await qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const onDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("buku").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else toast.success("Buku dihapus");
    setDeleteId(null);
    qc.invalidateQueries({ queryKey: ["buku"] });
  };

  return (
    <div>
      <PageHeader
        title="Data Buku"
        description="Kelola koleksi buku perpustakaan."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tambah Buku
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul buku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterKat} onValueChange={setFilterKat}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {kategori?.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {k.nama_kategori}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !buku || buku.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Library className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Belum ada data buku.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Kode</th>
                  <th className="text-left px-4 py-3">Judul</th>
                  <th className="text-left px-4 py-3">Penulis</th>
                  <th className="text-left px-4 py-3">Kategori</th>
                  <th className="text-left px-4 py-3">Rak</th>
                  <th className="text-right px-4 py-3">Stok</th>
                  <th className="text-right px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {buku.map((b) => (
                  <tr key={b.id} className="border-t hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{b.kode_buku}</td>
                    <td className="px-4 py-3 font-medium">{b.judul}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.penulis ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.kategori_buku?.nama_kategori ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.lokasi_rak ?? "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium">{b.jumlah_tersedia}</span>
                      <span className="text-muted-foreground"> / {b.jumlah_total}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(b)} aria-label={`Edit buku ${b.judul}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(b.id)} aria-label={`Hapus buku ${b.judul}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Buku" : "Tambah Buku"}</DialogTitle>
            <DialogDescription>
              Kode buku dibuat otomatis oleh sistem.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input required value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Penulis</Label>
                <Input value={form.penulis} onChange={(e) => setForm({ ...form, penulis: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Penerbit</Label>
                <Input value={form.penerbit} onChange={(e) => setForm({ ...form, penerbit: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tahun Terbit</Label>
                <Input
                  type="number"
                  value={form.tahun_terbit}
                  onChange={(e) => setForm({ ...form, tahun_terbit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={form.kategori_id || undefined}
                  onValueChange={(v) => setForm({ ...form, kategori_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {kategori?.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.nama_kategori}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah Total</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.jumlah_total}
                  onChange={(e) => setForm({ ...form, jumlah_total: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Lokasi Rak</Label>
                <Input value={form.lokasi_rak} onChange={(e) => setForm({ ...form, lokasi_rak: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL Cover (opsional)</Label>
              <Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus buku ini?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}