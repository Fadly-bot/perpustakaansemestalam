import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, ShieldAlert, ShieldCheck, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import {
  createPetugas,
  fetchPetugasList,
  fetchAdminList,
  removePetugasRole,
} from "@/lib/petugas.functions";
import {
  promoteAdminByEmail,
  promoteUserIdToAdmin,
  revokeAdmin,
} from "@/lib/admin-roles.functions";
 
export const Route = createFileRoute("/app/pengaturan")({
  ssr: false,
  component: PengaturanPage,
});
 
interface PetugasUser {
  user_id: string;
  email: string | null;
  username: string | null;
  nama_lengkap: string | null;
  role?: string | null;
  status?: string | null;
}
 
interface FormState {
  email: string;
  username: string;
  nama_lengkap: string;
  password: string;
}
 
interface FormErrors {
  email?: string;
  username?: string;
  nama_lengkap?: string;
  password?: string;
}
 
function PengaturanPage() {
  const auth = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    email: "",
    username: "",
    nama_lengkap: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [profil, setProfil] = useState({
    nama: localStorage.getItem("profil_nama") ?? "Perpustakaan Literasi KKN",
    alamat: localStorage.getItem("profil_alamat") ?? "",
  });
 
  const isAdmin = auth.roles.includes("admin");
 
  const fetchPetugasFn = useServerFn(fetchPetugasList);
  const fetchAdminFn = useServerFn(fetchAdminList);
  const createPetugasFn = useServerFn(createPetugas);
  const removePetugasRoleFn = useServerFn(removePetugasRole);
  const promoteByEmailFn = useServerFn(promoteAdminByEmail);
  const promoteByIdFn = useServerFn(promoteUserIdToAdmin);
  const revokeAdminFn = useServerFn(revokeAdmin);
 
  const { data: petugas = [], isLoading: petugasLoading } = useQuery({
    queryKey: ["petugas-list"],
    enabled: isAdmin,
    queryFn: async () => {
      const result = await fetchPetugasFn();
      return result as PetugasUser[];
    },
  });
 
  const { data: admins = [] } = useQuery({
    queryKey: ["admin-list"],
    enabled: isAdmin,
    queryFn: async () => {
      const result = await fetchAdminFn();
      return result as PetugasUser[];
    },
  });
 
  const invalidateRoles = () => {
    qc.invalidateQueries({ queryKey: ["petugas-list"] });
    qc.invalidateQueries({ queryKey: ["admin-list"] });
  };
 
  // Validasi form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
 
    if (!form.nama_lengkap.trim()) {
      errors.nama_lengkap = "Nama lengkap wajib diisi";
    } else if (form.nama_lengkap.trim().length < 2) {
      errors.nama_lengkap = "Nama minimal 2 karakter";
    }
 
    if (!form.username.trim()) {
      errors.username = "Username wajib diisi";
    } else if (form.username.trim().length < 3) {
      errors.username = "Username minimal 3 karakter";
    }
 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      errors.email = "Email wajib diisi";
    } else if (!emailRegex.test(form.email.trim())) {
      errors.email = "Email tidak valid";
    }
 
    if (!form.password) {
      errors.password = "Password wajib diisi";
    } else if (form.password.length < 8) {
      errors.password = "Password minimal 8 karakter";
    }
 
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
 
  const onPromoteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoting(true);
    try {
      await promoteByEmailFn({ data: { email: promoteEmail } });
      toast.success("Berhasil dijadikan admin");
      setPromoteEmail("");
      invalidateRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal promote admin");
    } finally {
      setPromoting(false);
    }
  };
 
  const onPromotePetugas = async (user_id: string) => {
    try {
      await promoteByIdFn({ data: { user_id } });
      toast.success("Petugas dijadikan admin");
      invalidateRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    }
  };
 
  const onRevokeAdmin = async (user_id: string) => {
    if (!confirm("Cabut role admin dari user ini?")) return;
    try {
      await revokeAdminFn({ data: { user_id } });
      toast.success("Role admin dicabut");
      invalidateRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    }
  };
 
  const onAddPetugas = async (e: React.FormEvent) => {
    e.preventDefault();
 
    if (!validateForm()) {
      return;
    }
 
    setSaving(true);
    try {
      const created = (await createPetugasFn({
        data: {
          email: form.email,
          password: form.password,
          username: form.username,
          nama_lengkap: form.nama_lengkap,
        },
      })) as PetugasUser;
 
      qc.setQueryData<PetugasUser[]>(["petugas-list"], (current = []) => {
        const filtered = current.filter((item) => item.user_id !== created.user_id);
        return [created, ...filtered];
      });
 
      toast.success("Akun petugas berhasil dibuat");
      setOpen(false);
      setForm({ email: "", username: "", nama_lengkap: "", password: "" });
      setFormErrors({});
      await qc.invalidateQueries({ queryKey: ["petugas-list"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal membuat akun";
      if (msg.includes("Email sudah digunakan")) {
        setFormErrors((prev) => ({ ...prev, email: "Email sudah digunakan" }));
      }
      if (msg.includes("Username sudah digunakan")) {
        setFormErrors((prev) => ({ ...prev, username: "Username sudah digunakan" }));
      }
      if (msg.includes("Password")) {
        setFormErrors((prev) => ({ ...prev, password: "Password minimal 8 karakter" }));
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };
 
  const removeRole = async (user_id: string) => {
    if (!confirm("Cabut role petugas dari user ini?")) return;
    try {
      await removePetugasRoleFn({ data: { user_id } });
      toast.success("Role petugas dicabut");
      await qc.invalidateQueries({ queryKey: ["petugas-list"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus role");
    }
  };
 
  const saveProfil = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("profil_nama", profil.nama);
    localStorage.setItem("profil_alamat", profil.alamat);
    toast.success("Profil perpustakaan disimpan");
  };
 
  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Pengaturan" />
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Halaman ini hanya untuk admin.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
 
  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Kelola akun petugas dan profil perpustakaan." />
 
      {/* Akun Petugas Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Akun Petugas</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Tambah Petugas
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {petugasLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !petugas || petugas.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">Belum ada petugas.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Nama Lengkap</th>
                  <th className="text-left px-4 py-3">Username</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {petugas.map((p) => (
                  <tr key={p.user_id} className="border-t">
                    <td className="px-4 py-3 font-medium">{p.nama_lengkap ?? "-"}</td>
                    <td className="px-4 py-3">{p.username ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.email ?? "-"}</td>
                    <td className="px-4 py-3 capitalize">{p.role ?? "-"}</td>
                    <td className="px-4 py-3">{p.status ?? "-"}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPromotePetugas(p.user_id)}
                        title="Jadikan admin"
                      >
                        <ArrowUp className="h-4 w-4" /> Admin
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRole(p.user_id)}
                        title="Cabut role petugas"
                      >
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
 
      {/* Admin Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Admin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={onPromoteByEmail}
            className="flex flex-col sm:flex-row gap-2 sm:items-end"
          >
            <div className="flex-1 space-y-2">
              <Label>Promote user menjadi admin (berdasarkan email)</Label>
              <Input
                type="email"
                required
                placeholder="email@contoh.com"
                value={promoteEmail}
                onChange={(e) => setPromoteEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={promoting}>
              {promoting && <Loader2 className="h-4 w-4 animate-spin" />} Jadikan Admin
            </Button>
          </form>
 
          <div className="overflow-x-auto">
            {!admins || admins.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">Belum ada admin.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Nama</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-right px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.user_id} className="border-t">
                      <td className="px-4 py-3 font-medium">
                        {a.nama_lengkap ?? a.username ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{a.email ?? "-"}</td>
                      <td className="px-4 py-3 text-right">
                        {a.user_id === auth.user?.id ? (
                          <span className="text-xs text-muted-foreground">Anda</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRevokeAdmin(a.user_id)}
                            title="Cabut admin"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
 
      {/* Profil Perpustakaan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil Perpustakaan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfil} className="space-y-3 max-w-xl">
            <div className="space-y-2">
              <Label>Nama Perpustakaan</Label>
              <Input
                value={profil.nama}
                onChange={(e) => setProfil({ ...profil, nama: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Input
                value={profil.alamat}
                onChange={(e) => setProfil({ ...profil, alamat: e.target.value })}
              />
            </div>
            <Button type="submit">Simpan</Button>
          </form>
        </CardContent>
      </Card>
 
      {/* Dialog Tambah Petugas */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Akun Petugas</DialogTitle>
          </DialogHeader>
          <form onSubmit={onAddPetugas} className="space-y-3">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={form.nama_lengkap}
                onChange={(e) => {
                  setForm({ ...form, nama_lengkap: e.target.value });
                  if (formErrors.nama_lengkap)
                    setFormErrors({ ...formErrors, nama_lengkap: undefined });
                }}
                placeholder="Cth: Budi Santoso"
                aria-invalid={!!formErrors.nama_lengkap}
29 lines hidden
                placeholder="budi@perpustakaan.com"
                aria-invalid={!!formErrors.email}
              />
              {formErrors.nama_lengkap && (
                <p className="text-xs text-destructive">{formErrors.nama_lengkap}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={form.username}
                onChange={(e) => {
                  setForm({ ...form, username: e.target.value });
                  if (formErrors.username)
                    setFormErrors({ ...formErrors, username: undefined });
                }}
                placeholder="Cth: budi_petugas"
                aria-invalid={!!formErrors.username}
              />
              {formErrors.username && (
                <p className="text-xs text-destructive">{formErrors.username}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (formErrors.email)
                    setFormErrors({ ...formErrors, email: undefined });
                }}
                placeholder="budi@perpustakaan.com"
                aria-invalid={!!formErrors.email}
              />
              {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Password (min 8 karakter)</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (formErrors.password)
                    setFormErrors({ ...formErrors, password: undefined });
                }}
                placeholder="Minimal 8 karakter"
                aria-invalid={!!formErrors.password}
              />
              {formErrors.password && (
                <p className="text-xs text-destructive">{formErrors.password}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setFormErrors({});
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {saving ? "Membuat..." : "Buat Akun"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
