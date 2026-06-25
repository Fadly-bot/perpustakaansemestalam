import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Users, Repeat, ArrowRight, Library } from "lucide-react";
import { getPublicStats } from "@/lib/public-stats.functions";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, absUrl } from "@/lib/site";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: `${SITE_NAME} — Sistem Informasi Perpustakaan Digital` },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "keywords", content: SITE_KEYWORDS },
      { property: "og:title", content: SITE_NAME },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absUrl("/") },
      { property: "og:site_name", content: SITE_NAME },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_NAME },
      { name: "twitter:description", content: SITE_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: absUrl("/") }],
  }),
});

function HomePage() {
  const fetchStats = useServerFn(getPublicStats);
  const { data: stats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => fetchStats(),
    staleTime: 60_000,
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Library className="h-6 w-6 text-primary" />
            <span>{SITE_NAME}</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              to="/daftar-peminjam"
              className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium text-foreground hover:text-primary"
            >
              Daftar Peminjam
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Masuk <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            Sistem Informasi Perpustakaan Digital
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            Selamat Datang di {SITE_NAME}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            {SITE_DESCRIPTION} Kelola koleksi buku, peminjaman, dan pengembalian
            dalam satu platform modern yang mudah digunakan oleh petugas
            perpustakaan.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              Masuk sebagai Petugas <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/daftar-peminjam"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-6 py-3 text-base font-medium hover:bg-accent"
            >
              Daftar sebagai Peminjam
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            label="Koleksi Buku"
            value={stats?.totalBuku}
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Peminjam Terdaftar"
            value={stats?.totalPeminjam}
          />
          <StatCard
            icon={<Repeat className="h-5 w-5" />}
            label="Transaksi Peminjaman"
            value={stats?.totalPeminjaman}
          />
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
          <FeatureCard
            title="Manajemen Buku Terpusat"
            body="Catat judul, penulis, kategori, dan stok. Pencarian cepat untuk seluruh koleksi."
          />
          <FeatureCard
            title="Peminjaman & Pengembalian"
            body="Alur peminjaman jelas dengan pelacakan tenggat dan riwayat lengkap setiap peminjam."
          />
          <FeatureCard
            title="Laporan Otomatis"
            body="Ekspor laporan PDF untuk kebutuhan administrasi tanpa rekap manual."
          />
          <FeatureCard
            title="Akses Berbasis Peran"
            body="Admin dan petugas memiliki kewenangan terpisah, data tetap aman."
          />
        </div>
      </section>

      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-6 text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 text-center">
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary mb-3">
        {icon}
      </div>
      <div className="text-3xl font-bold text-foreground">
        {value ?? <span className="inline-block h-8 w-12 bg-muted animate-pulse rounded" />}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
