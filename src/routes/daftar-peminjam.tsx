import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  nama: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  no_identitas: z.string().trim().min(3, "Wajib diisi").max(50),
  no_hp: z.string().trim().min(8, "Nomor HP tidak valid").max(20),
  alamat: z.string().trim().min(3, "Alamat wajib diisi").max(300),
  email: z.string().trim().email("Email tidak valid").max(200).optional().or(z.literal("")),
});

export const Route = createFileRoute("/daftar-peminjam")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Daftar Peminjam Baru - Perpustakaan Literasi KKN" },
      { name: "description", content: "Formulir pendaftaran peminjam baru perpustakaan literasi KKN. Daftar gratis untuk meminjam buku di perpustakaan desa atau sekolah." },
      { property: "og:title", content: "Daftar Peminjam Baru - Perpustakaan Literasi KKN" },
      { property: "og:description", content: "Daftar sebagai peminjam perpustakaan literasi KKN untuk masyarakat dan siswa." },
      { property: "og:url", content: "https://perpustakaansemestaalam.lovable.app/daftar-peminjam" },
    ],
    links: [{ rel: "canonical", href: "https://perpustakaansemestaalam.lovable.app/daftar-peminjam" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Pendaftaran Peminjam Baru",
          description: "Formulir pendaftaran peminjam perpustakaan literasi KKN.",
          url: "https://perpustakaansemestaalam.lovable.app/daftar-peminjam",
        }),
      },
    ],
  }),
  component: DaftarPeminjamPage,
});

function DaftarPeminjamPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: "", no_identitas: "", no_hp: "", alamat: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const payload = { ...parsed.data, email: parsed.data.email || null };
    const { data, error } = await supabase
      .from("peminjam")
      .insert(payload as never)
      .select("kode_peminjam")
      .single();
    setLoading(false);
    if (error) {
      toast.error("Gagal mendaftar: " + error.message);
      return;
    }
    setSuccess(data.kode_peminjam);
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-secondary/40 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
            <h1 className="text-xl font-semibold">Pendaftaran Berhasil</h1>
            <p className="text-sm text-muted-foreground">
              Kode peminjam Anda:
            </p>
            <div className="text-2xl font-bold text-primary tracking-wide">{success}</div>
            <p className="text-xs text-muted-foreground">
              Simpan kode ini dan tunjukkan kepada petugas saat meminjam buku.
            </p>
            <Button asChild className="w-full mt-4"><Link to="/login">Kembali ke Halaman Login</Link></Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-secondary/40 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Login
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mb-4">Pendaftaran Peminjam Baru</h1>
        <Card>
          <CardHeader>
            <CardTitle>Formulir Pendaftaran</CardTitle>
            <CardDescription>Lengkapi data berikut untuk terdaftar sebagai peminjam perpustakaan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input id="nama" required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nik">Nomor Identitas / NIS</Label>
                  <Input id="nik" required value={form.no_identitas} onChange={(e) => setForm({ ...form, no_identitas: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hp">Nomor HP</Label>
                  <Input id="hp" required value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat</Label>
                <Textarea id="alamat" required rows={3} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (opsional)</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}