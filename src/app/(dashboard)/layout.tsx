import type { Metadata } from 'next';

/*
 * Dasbor internal. Saat ini PRATINJAU DESAIN berisi data fiktif.
 * Sebelum memuat data nyata, wajib ada autentikasi + pemeriksaan peran & cakupan
 * di server (middleware dan repository) — menyembunyikan menu bukan kontrol akses.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
