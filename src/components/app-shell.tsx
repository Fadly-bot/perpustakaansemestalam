import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Tags,
  Users,
  ArrowLeftRight,
  Undo2,
  FileBarChart,
  Settings,
  LogOut,
  Loader2,
  Menu,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type NavItem = { to: string; label: string; icon: ReactNode; roles?: AppRole[] };

const NAV: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/app/buku", label: "Data Buku", icon: <Library className="h-4 w-4" /> },
  { to: "/app/kategori", label: "Kategori", icon: <Tags className="h-4 w-4" /> },
  { to: "/app/peminjam", label: "Peminjam", icon: <Users className="h-4 w-4" /> },
  { to: "/app/peminjaman", label: "Peminjaman", icon: <ArrowLeftRight className="h-4 w-4" /> },
  { to: "/app/pengembalian", label: "Pengembalian", icon: <Undo2 className="h-4 w-4" /> },
  { to: "/app/laporan", label: "Laporan", icon: <FileBarChart className="h-4 w-4" /> },
  { to: "/app/pengaturan", label: "Pengaturan", icon: <Settings className="h-4 w-4" />, roles: ["admin"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      navigate({ to: "/login" });
    }
  }, [auth.loading, auth.user, navigate]);

  if (auth.loading || !auth.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const visibleNav = NAV.filter((n) => !n.roles || n.roles.some((r) => auth.roles.includes(r)));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Anda telah keluar");
    navigate({ to: "/login" });
  };

  const SidebarContent = (
    <>
      <div className="px-5 py-5 border-b">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Perpustakaan</p>
            <p className="text-xs text-muted-foreground">Literasi KKN</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-secondary text-secondary-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium truncate">{auth.namaLengkap ?? auth.username}</p>
          <p className="text-xs text-muted-foreground capitalize">{auth.roles.join(", ") || "pengguna"}</p>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Keluar
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex w-64 flex-col border-r bg-sidebar fixed inset-y-0">
        {SidebarContent}
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-foreground/30" onClick={() => setOpen(false)}>
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="lg:hidden border-b px-4 h-14 flex items-center gap-3 bg-background sticky top-0 z-30">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Buka menu navigasi">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-sm">Perpustakaan Literasi KKN</span>
        </header>
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}