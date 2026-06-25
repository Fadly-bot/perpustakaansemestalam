import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app-shell";
import { Library, ArrowLeftRight, Users, AlertTriangle, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";

export const Route = createFileRoute("/app/dashboard")({
  ssr: false,
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [bukuRes, dipinjamRes, peminjamRes, terlambatRes, peminjamanRes] = await Promise.all([
        supabase.from("buku").select("jumlah_total", { count: "exact", head: false }),
        supabase.from("peminjaman").select("id", { count: "exact", head: true }).eq("status", "dipinjam"),
        supabase.from("peminjam").select("id", { count: "exact", head: true }),
        supabase
          .from("peminjaman")
          .select("id", { count: "exact", head: true })
          .neq("status", "dikembalikan")
          .lt("tanggal_kembali", today),
        supabase
          .from("peminjaman")
          .select("tanggal_pinjam")
          .gte("tanggal_pinjam", subDays(new Date(), 13).toISOString().slice(0, 10)),
      ]);

      const totalBuku = (bukuRes.data ?? []).reduce(
        (acc: number, row: { jumlah_total: number | null }) => acc + (row.jumlah_total ?? 0),
        0,
      );

      const chartMap = new Map<string, number>();
      for (let i = 13; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        chartMap.set(d, 0);
      }
      (peminjamanRes.data ?? []).forEach((p) => {
        const k = p.tanggal_pinjam as string;
        if (chartMap.has(k)) chartMap.set(k, (chartMap.get(k) ?? 0) + 1);
      });
      const chartData = Array.from(chartMap.entries()).map(([date, total]) => ({
        date: format(new Date(date), "dd/MM"),
        total,
      }));

      return {
        totalBuku,
        dipinjam: dipinjamRes.count ?? 0,
        peminjam: peminjamRes.count ?? 0,
        terlambat: terlambatRes.count ?? 0,
        chartData,
      };
    },
  });

  const stats = [
    { label: "Total Buku", value: data?.totalBuku ?? 0, icon: Library },
    { label: "Sedang Dipinjam", value: data?.dipinjam ?? 0, icon: ArrowLeftRight },
    { label: "Total Peminjam", value: data?.peminjam ?? 0, icon: Users },
    { label: "Buku Terlambat", value: data?.terlambat ?? 0, icon: AlertTriangle },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Ringkasan kondisi perpustakaan saat ini." />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-semibold mt-1">{s.value}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary">
                      <s.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Aktivitas Peminjaman 14 Hari Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.chartData ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}