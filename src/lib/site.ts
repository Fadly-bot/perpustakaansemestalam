// Centralized site metadata. Override SITE_URL via VITE_SITE_URL when deploying
// to a different domain (e.g. https://perpustakaansemestalam.vercel.app).
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://perpustakaansemestalam.lovable.app";

export const SITE_NAME = "Perpustakaan Semesta Alam";
export const SITE_DESCRIPTION =
  "Sistem digital perpustakaan untuk pengelolaan buku, peminjaman, dan pengembalian berbasis web.";
export const SITE_KEYWORDS =
  "perpustakaan, sistem perpustakaan, peminjaman buku, katalog buku, literasi, perpustakaan digital, perpustakaan semesta alam";

export function absUrl(path: string) {
  if (!path.startsWith("/")) path = "/" + path;
  return SITE_URL + path;
}
