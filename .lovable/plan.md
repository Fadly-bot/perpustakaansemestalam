## Tujuan
Mengimport seluruh codebase dari `https://github.com/Fadly-bot/pustaka-cinta-digital` (aplikasi perpustakaan "Pustaka Cinta Digital") ke project Lovable ini.

## Kabar baik
Repo sumber memakai stack yang **identik** dengan project ini: TanStack Start + React 19 + Tailwind v4 + shadcn/ui + Supabase. Jadi tidak perlu konversi framework — file bisa di-copy 1:1.

## Yang akan di-import

**Routes (`src/routes/`)** — menggantikan `index.tsx` placeholder saat ini:
- `index.tsx` (landing), `login.tsx`, `reset-password.tsx`, `daftar-peminjam.tsx`, `sitemap[.]xml.ts`
- Layout `app.tsx` + halaman aplikasi: `app.index.tsx`, `app.dashboard.tsx`, `app.buku.tsx`, `app.kategori.tsx`, `app.peminjam.tsx`, `app.peminjaman.tsx`, `app.pengembalian.tsx`, `app.laporan.tsx`, `app.pengaturan.tsx`
- `__root.tsx` (perlu di-merge dengan root yang ada agar reporting error tetap utuh)

**Komponen & hooks**
- `src/components/app-shell.tsx`
- `src/hooks/use-auth.ts`
- (folder `src/components/ui/` dan `src/hooks/use-mobile.tsx` sudah identik — skip)

**Integrasi Supabase**
- `src/integrations/supabase/*` (client, types, auth middleware, dll.)
- Aktifkan **Lovable Cloud** di project ini (karena repo pakai Supabase).
- Jalankan 3 file migrasi dari `supabase/migrations/` untuk membuat schema (kategori, buku, peminjam, peminjaman, dll. — beserta RLS & GRANT).

**Aset publik**
- `public/favicon.ico`, `public/llms.txt`, `public/robots.txt`

**Config**
- `package.json` deps yang belum ada (mis. `@supabase/supabase-js`) akan di-install via `bun add`.
- `components.json`, `eslint.config.js`, `.prettierrc`, `bunfig.toml` sudah ada di project ini — skip kecuali ada perbedaan signifikan.
- `vite.config.ts`, `tsconfig.json`, `start.ts`, `server.ts` — bandingkan dulu; hanya patch jika repo sumber butuh tambahan plugin/alias.

## Yang TIDAK di-import / butuh perhatian
- `.env` repo sumber **tidak akan disalin** (kredensial Supabase project ini berbeda — dikelola otomatis oleh Lovable Cloud).
- `routeTree.gen.ts` di-skip (auto-generate oleh Vite plugin).
- `.lovable/`, `bun.lock`, `AGENTS.md` di-skip (akan regenerasi sendiri).

## Urutan eksekusi (saat build mode)
1. Enable Lovable Cloud → project mendapat instance Supabase baru.
2. Jalankan 3 migrasi SQL (urut timestamp) untuk membuat schema + RLS + grants.
3. `bun add @supabase/supabase-js` (satu-satunya dep tambahan yang belum ada).
4. Copy semua file: routes, components, hooks, integrations, lib (jika berbeda), public assets.
5. Merge `__root.tsx` (gabungkan meta repo sumber dengan error reporting yang ada).
6. Verifikasi build hijau, lalu cek halaman `/`, `/login`, `/app/dashboard` via Playwright.

## Catatan penting
- Karena instance Supabase berbeda, **data isi** (buku, peminjam, dll.) dari project lama **tidak ikut** — hanya schema. Jika Anda butuh data juga, perlu export CSV dari project lama dan import manual.
- Setelah Lovable Cloud aktif, user pertama yang sign up bisa dijadikan admin lewat tabel `user_roles` (sesuai migration repo sumber).

## Konfirmasi
Setujui plan ini untuk lanjut ke build, atau beri tahu jika ada bagian yang ingin di-skip / ditambah.