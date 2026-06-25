import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Masuk - Sistem Informasi Perpustakaan Literasi KKN" },
      { name: "description", content: "Masuk ke Sistem Informasi Perpustakaan Literasi KKN untuk admin dan petugas perpustakaan desa/sekolah." },
      { property: "og:title", content: "Masuk - Perpustakaan Literasi KKN" },
      { property: "og:description", content: "Halaman masuk untuk admin dan petugas perpustakaan digital KKN." },
      { property: "og:url", content: "https://perpustakaansemestaalam.lovable.app/login" },
    ],
    links: [{ rel: "canonical", href: "https://perpustakaansemestaalam.lovable.app/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app/dashboard" });
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Gagal masuk: " + error.message);
      return;
    }
    toast.success("Berhasil masuk");
    navigate({ to: "/app/dashboard" });
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Tautan reset password telah dikirim ke email Anda");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-secondary/40">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Sistem Informasi Perpustakaan Literasi KKN</h1>
            <p className="text-xs text-muted-foreground">Digitalisasi perpustakaan desa & sekolah</p>
          </div>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>{resetMode ? "Lupa Password" : "Masuk ke Sistem"}</CardTitle>
            <CardDescription>
              {resetMode
                ? "Masukkan email Anda untuk menerima tautan reset password."
                : "Gunakan akun admin atau petugas Anda untuk masuk."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={resetMode ? handleReset : handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {!resetMode && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {resetMode ? "Kirim Tautan Reset" : "Masuk"}
              </Button>
              <button
                type="button"
                onClick={() => setResetMode((v) => !v)}
                className="text-xs text-primary hover:underline w-full text-center"
              >
                {resetMode ? "Kembali ke login" : "Lupa password?"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
              Peminjam baru?{" "}
              <Link to="/daftar-peminjam" className="text-primary font-medium hover:underline">
                Daftar di sini
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}