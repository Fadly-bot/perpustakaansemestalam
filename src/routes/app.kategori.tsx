import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/kategori")({
  ssr: false,
  component: KategoriPage,
});

function KategoriPage() {
  const qc = useQueryClient();
  const [nama, setNama] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["kategori_buku"],
    queryFn: async () => {
      const { data, error } = await supabase.from("kategori_buku").select("*").order("nama_kategori");
      if (error) throw error;
      return data;
    },
  });

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("kategori_buku").insert({ nama_kategori: nama.trim() });
    setSaving(false);
    if (error) return toast.error(error.message);
    setNama("");
    toast.success("Kategori ditambahkan");
    qc.invalidateQueries({ queryKey: ["kategori_buku"] });
  };

  const onDelete = async (id: string) => {
    const { error } = await supabase.from("kategori_buku").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Kategori dihapus");
      qc.invalidateQueries({ queryKey: ["kategori_buku"] });
    }
  };

  return (
    <div>
      <PageHeader title="Kategori Buku" description="Atur kategori untuk pengelompokan buku." />
      <Card className="mb-4">
        <CardContent className="pt-6">
          <form onSubmit={onAdd} className="flex gap-2">
            <Input placeholder="Nama kategori baru..." value={nama} onChange={(e) => setNama(e.target.value)} />
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : data && data.length > 0 ? (
            <ul className="divide-y">
              {data.map((k) => (
                <li key={k.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm">{k.nama_kategori}</span>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(k.id)} aria-label={`Hapus kategori ${k.nama_kategori}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center py-10 text-sm text-muted-foreground">Belum ada kategori.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}