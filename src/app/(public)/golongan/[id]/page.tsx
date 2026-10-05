import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Map, ScrollText, Sprout, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { GolonganArt } from '@/components/illustrations/Scenes';
import { ButtonLink } from '@/components/ui/Button';
import { PageHero } from '@/components/ui/Section';
import { golongan, golonganById } from '@/lib/golongan';
import { getActiveByGolongan } from '@/lib/repositories';

interface Params {
  params: { id: string };
}

/** Angka agregat anggota ikut diperbarui tiap jam (verifikasi anggota tidak memicu revalidasi konten). */
export const revalidate = 3600;

/**
 * `true` walau daftarnya tetap: di Next 14, rute `dynamicParams = false` menjawab 404 untuk SEMUA
 * path-nya begitu `revalidatePublicSite()` menandai layout basi (terbukti setelah berita diterbitkan).
 * Id asing tetap 404 lewat `notFound()`.
 */
export const dynamicParams = true;

export function generateStaticParams() {
  return golongan.map((g) => ({ id: g.id }));
}

export function generateMetadata({ params }: Params): Metadata {
  const g = golonganById(params.id);
  if (!g) return { title: 'Golongan tidak ditemukan', robots: { index: false } };
  return {
    title: `Golongan ${g.name}`,
    description: `${g.name} (${g.age}): ${g.summary}`,
    alternates: { canonical: `/golongan/${g.id}` },
  };
}

export default async function GolonganPage({ params }: Params) {
  const g = golonganById(params.id);
  if (!g) notFound();
  const idx = golongan.indexOf(g);
  const prev = golongan[idx - 1];
  const next = golongan[idx + 1];
  const active = (await getActiveByGolongan()).find((c) => c.golongan === g.dbKey)?.count ?? 0;

  return (
    <>
      <PageHero
        eyebrow={`Golongan · ${g.age}`}
        title={g.name}
        description={g.tagline}
        scene={g.id === 'penegak' || g.id === 'pandega' ? 'mountain' : g.id === 'pembina' ? 'dusk' : 'meadow'}
        top={<Breadcrumbs items={[{ label: 'Golongan', href: '/golongan' }, { label: g.name }]} />}
      />

      <div className="civic-container pb-16 pt-6 sm:pb-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <article className="lg:col-span-7">
            <div className="overflow-hidden rounded-3xl shadow-md">
              <div className="aspect-[5/3]">
                <GolonganArt id={g.id} />
              </div>
            </div>
            <div className="mt-10 max-w-prose space-y-5 text-[1.075rem] leading-[1.8] text-text-secondary">
              {g.about.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>

            <section aria-labelledby="satuan-title" className="mt-12">
              <h2 id="satuan-title" className="font-display text-display-md font-semibold text-text-primary">
                Satuan
              </h2>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {g.units.map((u) => (
                  <li key={u.name} className="rounded-2xl border border-border-subtle bg-surface-base p-5">
                    <Users className="h-5 w-5 text-text-accent" aria-hidden="true" />
                    <h3 className="mt-3 font-display text-xl font-semibold text-text-primary">{u.name}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{u.description}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="jenjang-title" className="mt-12">
              <h2 id="jenjang-title" className="font-display text-display-md font-semibold text-text-primary">
                {g.levels.label}
              </h2>
              {/* Jalur bertahap: urutan dibacakan sebagai daftar bernomor. */}
              <ol className="relative mt-6 space-y-4 border-l-2 border-dashed border-border-brand pl-8">
                {g.levels.items.map((lvl, i) => (
                  <li key={lvl} className="relative">
                    <span className="absolute -left-[2.85rem] flex h-9 w-9 items-center justify-center rounded-pill bg-action-primary font-display text-sm font-semibold text-text-on-brand ring-4 ring-surface-canvas">
                      {i + 1}
                    </span>
                    <p className="rounded-2xl bg-surface-base px-5 py-3.5 font-semibold text-text-primary shadow-sm">{lvl}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-sm text-text-muted">Rincian syarat tiap jenjang mengikuti petunjuk penyelenggaraan Kwartir Nasional yang berlaku.</p>
            </section>
          </article>

          <aside className="space-y-5 lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl bg-surface-forest p-6 text-text-inverse on-inverse">
              <p className="text-sm text-text-inverse-muted">Anggota {g.name} terverifikasi di Indramayu</p>
              <p className="mt-1 font-display text-display-lg font-semibold tabular-nums">{new Intl.NumberFormat('id-ID').format(active)}</p>
              <p className="mt-1 text-xs text-text-inverse-muted">Angka agregat dari data portal, tanpa data pribadi.</p>
            </div>

            <div className="rounded-3xl border border-border-subtle bg-surface-base p-6">
              <ScrollText className="h-5 w-5 text-text-accent" aria-hidden="true" />
              <h2 className="mt-3 font-semibold text-text-primary">Kode kehormatan</h2>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                Golongan {g.name} berpegang pada <strong className="text-text-primary">{g.honorCode}</strong>. Teks resminya diucapkan dalam upacara
                dan dapat dibaca di dokumen resmi Gerakan Pramuka.
              </p>
            </div>

            <div className="rounded-3xl border border-border-subtle bg-surface-base p-6">
              <h2 className="font-semibold text-text-primary">Kegiatan khas</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {g.activities.map((a) => (
                  <li key={a} className="rounded-pill bg-surface-meadow px-3 py-1.5 text-sm font-medium text-action-secondary-text">
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-2">
              <ButtonLink href="/wilayah" variant="primary" size="lg">
                <Map className="h-5 w-5" aria-hidden="true" />
                Cari gudep terdekat
              </ButtonLink>
              <ButtonLink href="/bergabung" variant="outline" size="lg">
                <Sprout className="h-5 w-5" aria-hidden="true" />
                Cara bergabung
              </ButtonLink>
            </div>
          </aside>
        </div>

        <nav aria-label="Golongan lain" className="mt-16 grid gap-4 border-t border-border-subtle pt-8 sm:grid-cols-2">
          {prev ? (
            <Link href={`/golongan/${prev.id}`} className="group flex min-h-touch flex-col rounded-2xl p-4 hover:bg-surface-base">
              <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Sebelumnya
              </span>
              <span className="font-display text-xl font-semibold text-text-primary group-hover:text-text-accent">{prev.name}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/golongan/${next.id}`} className="group flex min-h-touch flex-col items-end rounded-2xl p-4 text-right hover:bg-surface-base">
              <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                Berikutnya
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-display text-xl font-semibold text-text-primary group-hover:text-text-accent">{next.name}</span>
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}
