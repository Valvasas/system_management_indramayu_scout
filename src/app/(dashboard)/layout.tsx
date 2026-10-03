import type { Metadata } from 'next';

/*
 * Portal internal (pengurus, staf, peserta). Tidak diindeks mesin pencari.
 * Kontrol akses: sesi divalidasi di dashboard/layout.tsx, dan SETIAP halaman/aksi
 * memeriksa izin + cakupan di server (src/lib/auth). Menu yang disembunyikan bukan kontrol akses.
 */
export const metadata: Metadata = {
  title: { template: '%s | Portal Kwarcab Indramayu', default: 'Portal Kwarcab Indramayu' },
  robots: { index: false, follow: false },
};

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
