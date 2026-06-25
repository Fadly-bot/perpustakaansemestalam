CREATE TYPE public.app_role AS ENUM ('admin', 'petugas');
CREATE TYPE public.peminjaman_status AS ENUM ('dipinjam', 'dikembalikan', 'terlambat');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  nama_lengkap TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.current_user_roles()
RETURNS SETOF public.app_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = auth.uid() $$;

CREATE POLICY "users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "admins manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "only admin insert user_roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "only admin update user_roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "only admin delete user_roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, nama_lengkap, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.kategori_buku (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kategori TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kategori_buku TO authenticated;
GRANT ALL ON public.kategori_buku TO service_role;
ALTER TABLE public.kategori_buku ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read kategori" ON public.kategori_buku FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage kategori" ON public.kategori_buku FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE SEQUENCE IF NOT EXISTS public.buku_kode_seq START 1;
CREATE TABLE public.buku (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_buku TEXT UNIQUE NOT NULL,
  judul TEXT NOT NULL,
  penulis TEXT,
  penerbit TEXT,
  tahun_terbit INT,
  kategori_id UUID REFERENCES public.kategori_buku(id) ON DELETE SET NULL,
  jumlah_total INT NOT NULL DEFAULT 1 CHECK (jumlah_total >= 0),
  jumlah_tersedia INT NOT NULL DEFAULT 1 CHECK (jumlah_tersedia >= 0),
  lokasi_rak TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_buku_judul ON public.buku USING gin (to_tsvector('simple', judul));
CREATE INDEX idx_buku_kategori ON public.buku(kategori_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buku TO authenticated;
GRANT ALL ON public.buku TO service_role;
ALTER TABLE public.buku ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read buku" ON public.buku FOR SELECT TO authenticated USING (true);
CREATE POLICY "petugas manage buku" ON public.buku FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'petugas') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'petugas') OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_kode_buku()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.kode_buku IS NULL OR NEW.kode_buku = '' THEN
    NEW.kode_buku := 'BK-' || LPAD(nextval('public.buku_kode_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_set_kode_buku BEFORE INSERT ON public.buku
  FOR EACH ROW EXECUTE FUNCTION public.set_kode_buku();

CREATE SEQUENCE IF NOT EXISTS public.peminjam_kode_seq START 1;
CREATE TABLE public.peminjam (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_peminjam TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  no_identitas TEXT,
  no_hp TEXT,
  alamat TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'aktif',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peminjam TO authenticated;
GRANT INSERT ON public.peminjam TO anon;
GRANT ALL ON public.peminjam TO service_role;
ALTER TABLE public.peminjam ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_kode_peminjam()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.kode_peminjam IS NULL OR NEW.kode_peminjam = '' THEN
    NEW.kode_peminjam := 'PM-' || LPAD(nextval('public.peminjam_kode_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_set_kode_peminjam BEFORE INSERT ON public.peminjam
  FOR EACH ROW EXECUTE FUNCTION public.set_kode_peminjam();

CREATE TABLE public.peminjaman (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peminjam_id UUID NOT NULL REFERENCES public.peminjam(id) ON DELETE RESTRICT,
  petugas_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tanggal_pinjam DATE NOT NULL DEFAULT CURRENT_DATE,
  tanggal_kembali DATE NOT NULL,
  tanggal_dikembalikan DATE,
  status public.peminjaman_status NOT NULL DEFAULT 'dipinjam',
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_peminjaman_peminjam ON public.peminjaman(peminjam_id);
CREATE INDEX idx_peminjaman_status ON public.peminjaman(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peminjaman TO authenticated;
GRANT ALL ON public.peminjaman TO service_role;
ALTER TABLE public.peminjaman ENABLE ROW LEVEL SECURITY;
CREATE POLICY "petugas manage peminjaman" ON public.peminjaman FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'petugas') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'petugas') OR public.has_role(auth.uid(), 'admin'));

-- Peminjam policies (after peminjaman exists so EXISTS subquery references it)
CREATE POLICY "anon register peminjam" ON public.peminjam
  FOR INSERT TO anon
  WITH CHECK (
    nama IS NOT NULL AND length(btrim(nama)) BETWEEN 2 AND 120
    AND no_identitas IS NOT NULL AND length(btrim(no_identitas)) BETWEEN 3 AND 60
    AND no_hp IS NOT NULL AND length(btrim(no_hp)) BETWEEN 6 AND 20
    AND alamat IS NOT NULL AND length(btrim(alamat)) BETWEEN 3 AND 500
    AND (email IS NULL OR email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
  );
CREATE POLICY "admin full access peminjam" ON public.peminjam FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "petugas insert peminjam" ON public.peminjam FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'petugas'::app_role));
CREATE POLICY "petugas select own peminjam" ON public.peminjam FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'petugas'::app_role)
    AND EXISTS (SELECT 1 FROM public.peminjaman p WHERE p.peminjam_id = peminjam.id AND p.petugas_id = auth.uid())
  );
CREATE POLICY "petugas update own peminjam" ON public.peminjam FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'petugas'::app_role)
    AND EXISTS (SELECT 1 FROM public.peminjaman p WHERE p.peminjam_id = peminjam.id AND p.petugas_id = auth.uid())
  );

CREATE TABLE public.detail_peminjaman (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peminjaman_id UUID NOT NULL REFERENCES public.peminjaman(id) ON DELETE CASCADE,
  buku_id UUID NOT NULL REFERENCES public.buku(id) ON DELETE RESTRICT,
  jumlah INT NOT NULL DEFAULT 1 CHECK (jumlah > 0)
);
CREATE INDEX idx_detail_peminjaman_buku ON public.detail_peminjaman(buku_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detail_peminjaman TO authenticated;
GRANT ALL ON public.detail_peminjaman TO service_role;
ALTER TABLE public.detail_peminjaman ENABLE ROW LEVEL SECURITY;
CREATE POLICY "petugas manage detail" ON public.detail_peminjaman FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'petugas') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'petugas') OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.kurangi_stok_buku()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.buku SET jumlah_tersedia = jumlah_tersedia - NEW.jumlah WHERE id = NEW.buku_id;
  IF (SELECT jumlah_tersedia FROM public.buku WHERE id = NEW.buku_id) < 0 THEN
    RAISE EXCEPTION 'Stok buku tidak mencukupi';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_kurangi_stok AFTER INSERT ON public.detail_peminjaman
  FOR EACH ROW EXECUTE FUNCTION public.kurangi_stok_buku();

CREATE OR REPLACE FUNCTION public.kembalikan_stok()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'dikembalikan' AND OLD.status <> 'dikembalikan' THEN
    UPDATE public.buku b
      SET jumlah_tersedia = jumlah_tersedia + d.jumlah
      FROM public.detail_peminjaman d
      WHERE d.peminjaman_id = NEW.id AND d.buku_id = b.id;
    NEW.tanggal_dikembalikan := COALESCE(NEW.tanggal_dikembalikan, CURRENT_DATE);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_kembalikan_stok BEFORE UPDATE ON public.peminjaman
  FOR EACH ROW EXECUTE FUNCTION public.kembalikan_stok();

CREATE TABLE public.log_aktivitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  aktivitas TEXT NOT NULL,
  waktu TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.log_aktivitas TO authenticated;
GRANT ALL ON public.log_aktivitas TO service_role;
ALTER TABLE public.log_aktivitas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth insert log" ON public.log_aktivitas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin read log" ON public.log_aktivitas FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.kategori_buku (nama_kategori) VALUES
  ('Fiksi'), ('Non-Fiksi'), ('Pelajaran'), ('Anak'), ('Referensi'), ('Agama');

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.current_user_roles() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;