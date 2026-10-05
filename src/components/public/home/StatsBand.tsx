import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { golongan } from '@/lib/golongan';
import { getActiveByGolongan, getStatSummary } from '@/lib/repositories';

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

/**
 * Angka agregat organisasi (V5 §12). Bentuknya "hero number", bukan grafik: tiap angka
 * berlabel teks dan konteks, sehingga tidak ada makna yang bergantung pada warna.
 * Semua dihitung dari basis data, tidak ada angka karangan.
 */
export async function StatsBand() {
  const [s, byGolongan] = await Promise.all([getStatSummary(), getActiveByGolongan()]);
  const year = new Date().getFullYear();
  const tiles = [
    { value: fmt(s.totalKwarran), label: 'Kwartir Ranting', note: 'satu di setiap kecamatan' },
    { value: fmt(s.totalGudep), label: 'Gugus depan aktif', note: 'di sekolah & komunitas' },
    { value: fmt(s.totalMembers), label: 'Anggota terverifikasi', note: 'data aktif di sistem' },
    { value: fmt(s.totalActivities), label: `Kegiatan ${year}`, note: 'agenda yang diumumkan' },
  ];
  const counts = new Map(byGolongan.map((g) => [g.golongan, g.count]));

  return (
    <section aria-labelledby="angka-title" className="on-inverse topo-inverse relative bg-surface-forest text-text-inverse">
      <div className="civic-container py-14 sm:py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-text-inverse-muted">Pramuka Indramayu dalam angka</p>
            <h2 id="angka-title" className="mt-3 font-display text-display-md font-semibold">
              Satu kabupaten, satu keluarga besar
            </h2>
          </div>
          <Link
            href="/wilayah"
            className="group inline-flex min-h-touch items-center gap-2 self-start rounded-pill font-semibold text-text-inverse underline-offset-4 hover:underline sm:self-auto"
          >
            Jelajahi 31 Kwarran
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {tiles.map((t, i) => (
            <Reveal key={t.label} delay={i * 90} className="border-l-2 border-border-inverse pl-5">
              <dt className="text-sm font-semibold text-text-inverse-muted">{t.label}</dt>
              <dd className="mt-1 font-display text-display-lg font-semibold tabular-nums">{t.value}</dd>
              <dd className="text-sm text-text-inverse-muted">{t.note}</dd>
            </Reveal>
          ))}
        </dl>

        <div className="mt-12 rounded-2xl border border-border-inverse-subtle p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-text-inverse-muted">Anggota terverifikasi per golongan</h3>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {golongan.map((g) => (
              <li key={g.id}>
                <Link href={`/golongan/${g.id}`} className="group block rounded-xl p-1 -m-1">
                  <span className="block font-display text-2xl font-semibold tabular-nums text-text-inverse">{fmt(counts.get(g.dbKey) ?? 0)}</span>
                  <span className="text-sm text-text-inverse-muted group-hover:text-text-inverse group-hover:underline">{g.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
