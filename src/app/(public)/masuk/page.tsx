import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Clock, LucideIcon, ShieldCheck, Tent, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Portal Internal',
  description: 'Portal internal Kwarcab Indramayu belum aktif dan dijadwalkan pada Fase 2.',
  robots: { index: false, follow: false },
};

const previews: { href: string; title: string; description: string; icon: LucideIcon }[] = [
  {
    href: '/dashboard/peserta',
    title: 'Peserta',
    description: 'Kegiatan, progres SKU, dan pengumuman gudep.',
    icon: Tent,
  },
  {
    href: '/dashboard/pegawai',
    title: 'Pegawai',
    description: 'Verifikasi data anggota dan status gudep wilayah.',
    icon: Users,
  },
  {
    href: '/dashboard/admin',
    title: 'Admin',
    description: 'Tinjauan konten, akses akun, dan keamanan sistem.',
    icon: ShieldCheck,
  },
];

export default function MasukPage() {
  return (
    <div className="civic-container py-16">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <Clock className="mx-auto h-10 w-10 text-text-muted" aria-hidden="true" />
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-text-primary">
            Portal internal belum aktif
          </h1>
          <p className="mx-auto mt-3 max-w-prose leading-relaxed text-text-secondary">
            Layanan masuk untuk peserta, pegawai, dan admin dijadwalkan pada Fase 2. Belum ada akun
            atau kata sandi yang perlu Anda masukkan di mana pun.
          </p>
        </div>

        <section aria-labelledby="pratinjau-title" className="mt-12">
          <h2 id="pratinjau-title" className="font-display text-lg font-bold text-text-primary">
            Pratinjau tampilan portal
          </h2>
          <p className="mt-1 text-sm text-text-secondary">Berisi data contoh untuk keperluan uji desain.</p>
          <ul className="mt-4 space-y-3">
            {previews.map((p) => (
              <li
                key={p.href}
                className="group relative flex items-center gap-4 rounded-lg border border-border-subtle bg-surface-base p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-tag-surface text-tag-text">
                  <p.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-base font-bold text-text-primary">
                    <Link href={p.href} className="stretched-link rounded-lg group-hover:text-text-accent">
                      Dasbor {p.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-text-secondary">{p.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
