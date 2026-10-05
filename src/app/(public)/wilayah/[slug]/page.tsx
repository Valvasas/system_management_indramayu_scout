import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Building2, GraduationCap, MapPin, Phone, School, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { GudepMapCanvas } from '@/components/maps/GudepMapCanvas';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHero } from '@/components/ui/Section';
import { getKwarranBySlug, getKwarranSlugs } from '@/lib/repositories';
import { site } from '@/lib/site';

interface Params {
  params: { slug: string };
}

export const revalidate = 3600;
/**
 * `true` walau daftarnya tetap: di Next 14, rute `dynamicParams = false` menjawab 404 untuk SEMUA
 * path-nya begitu `revalidatePublicSite()` menandai layout basi (terbukti setelah berita diterbitkan).
 * Id asing tetap 404 lewat `notFound()`.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getKwarranSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const k = await getKwarranBySlug(params.slug);
  if (!k) return { title: 'Kwarran tidak ditemukan', robots: { index: false } };
  return {
    title: `Kwarran ${k.name}`,
    description: `Gugus depan Gerakan Pramuka di Kecamatan ${k.name}, Kabupaten Indramayu.`,
    alternates: { canonical: `/wilayah/${k.slug}` },
  };
}

export default async function KwarranPage({ params }: Params) {
  const k = await getKwarranBySlug(params.slug);
  if (!k) notFound();
  const mapped = k.gudep.filter((g) => g.lat !== null && g.lng !== null);

  return (
    <>
      <PageHero
        eyebrow="Kwartir Ranting"
        title={`Kwarran ${k.name}`}
        description={`Gugus depan Gerakan Pramuka di Kecamatan ${k.name}. Datangi saat latihan rutin untuk bertanya langsung kepada pembina.`}
        scene="forest"
        top={<Breadcrumbs items={[{ label: 'Wilayah', href: '/wilayah' }, { label: k.name }]} />}
      >
        <dl className="flex flex-wrap gap-3">
          {[
            { label: 'Gugus depan aktif', value: k.gudepCount },
            { label: 'Anggota terverifikasi', value: k.activeMembers },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-surface-base px-5 py-3 shadow-sm">
              <dt className="text-xs font-semibold text-text-secondary">{s.label}</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums text-text-primary">{s.value}</dd>
            </div>
          ))}
        </dl>
      </PageHero>

      <div className="civic-container pb-16 pt-6 sm:pb-24">
        <div className="grid gap-10 lg:grid-cols-12">
          <section aria-labelledby="gudep-title" className="lg:col-span-7">
            <h2 id="gudep-title" className="font-display text-display-md font-semibold text-text-primary">
              Daftar gugus depan
            </h2>
            {k.gudep.length === 0 ? (
              <EmptyState
                className="mt-6"
                icon={School}
                title="Belum ada gudep terdata"
                description="Data gugus depan di kecamatan ini sedang dilengkapi. Hubungi sekretariat Kwarcab untuk informasi."
                action={{ label: 'Hubungi sekretariat', href: '/kontak' }}
              />
            ) : (
              <ul className="mt-6 space-y-3">
                {k.gudep.map((g) => (
                  <li key={g.id} id={`gudep-${g.id}`} className="scroll-mt-28 rounded-2xl border border-border-subtle bg-surface-base p-5 target:ring-2 target:ring-focus-ring">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-display text-xl font-semibold text-text-primary">{g.name}</h3>
                      {g.number && <span className="rounded-pill bg-surface-sand px-3 py-1 text-xs font-semibold text-tag-text">No. {g.number}</span>}
                    </div>
                    <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-text-secondary sm:grid-cols-2">
                      {g.pangkalan && (
                        <li className="flex items-start gap-2">
                          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-text-accent" aria-hidden="true" />
                          {g.pangkalan}
                        </li>
                      )}
                      {g.jenjang && (
                        <li className="flex items-start gap-2">
                          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-text-accent" aria-hidden="true" />
                          Jenjang {g.jenjang}
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-text-accent" aria-hidden="true" />
                        {g.activeMembers} anggota terverifikasi
                      </li>
                      <li className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text-accent" aria-hidden="true" />
                        {g.lat !== null ? 'Lokasi pangkalan tercantum di peta' : 'Lokasi belum ditandai'}
                      </li>
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="space-y-5 lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            {mapped.length > 0 && (
              <div className="h-80 overflow-hidden rounded-3xl border border-border-subtle bg-surface-base shadow-md">
                <GudepMapCanvas
                  label={`Peta gugus depan di Kecamatan ${k.name}`}
                  points={mapped.map((g) => ({
                    id: g.id,
                    name: g.name,
                    number: g.number,
                    lat: g.lat as number,
                    lng: g.lng as number,
                    kwarranName: k.name,
                    activeMembers: g.activeMembers,
                    href: `#gudep-${g.id}`,
                    meta: g.pangkalan ?? '',
                  }))}
                />
              </div>
            )}
            <div className="rounded-3xl bg-surface-sand p-6">
              <h2 className="font-semibold text-text-primary">Ingin bergabung atau bertanya?</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                Datang saat latihan rutin di pangkalan gudep, atau hubungi sekretariat Kwarcab untuk diarahkan ke pembina yang tepat.
                {k.leader && ` Ketua Kwarran ${k.name}: ${k.leader}.`}
              </p>
              <div className="mt-4 grid gap-2">
                <ButtonLink href="/bergabung#orang-tua" variant="primary">
                  Cara bergabung
                </ButtonLink>
                <ButtonLink href={`tel:${site.contact.phone.replace(/[^\d+]/g, '')}`} variant="outline">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Telepon sekretariat
                </ButtonLink>
              </div>
            </div>
          </aside>
        </div>

        <Link href="/wilayah" className="mt-12 inline-flex min-h-touch items-center gap-2 rounded-md text-sm font-semibold text-text-accent hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Semua Kwarran
        </Link>
      </div>
    </>
  );
}
