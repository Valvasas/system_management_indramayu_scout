import type { Metadata } from 'next';
import { MapPinned } from 'lucide-react';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { KwarranFinder } from '@/components/public/KwarranFinder';
import { GudepMapCanvas } from '@/components/maps/GudepMapCanvas';
import { PageHero } from '@/components/ui/Section';
import { getKwarranDirectory, getPublicGudepPoints } from '@/lib/repositories';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Wilayah & Gugus Depan',
  description: 'Direktori 31 Kwartir Ranting dan peta gugus depan Gerakan Pramuka di Kabupaten Indramayu.',
  alternates: { canonical: '/wilayah' },
};

export default async function WilayahPage() {
  const [directory, points] = await Promise.all([getKwarranDirectory(), getPublicGudepPoints()]);
  const totalGudep = directory.reduce((n, k) => n + k.gudepCount, 0);

  return (
    <>
      <PageHero
        eyebrow="Wilayah"
        title="Temukan Pramuka di sekitarmu"
        description="31 Kwartir Ranting, satu di setiap kecamatan. Pilih kecamatan untuk melihat gugus depan yang bisa Anda datangi."
        scene="meadow"
        top={<Breadcrumbs items={[{ label: 'Wilayah' }]} />}
      />

      <div className="civic-container pb-16 pt-6 sm:pb-24">
        <section aria-labelledby="peta-title" className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <MapPinned className="h-7 w-7 text-text-accent" aria-hidden="true" />
            <h2 id="peta-title" className="mt-3 font-display text-display-md font-semibold text-text-primary">
              Peta gugus depan
            </h2>
            <p className="mt-3 text-text-secondary">
              {points.length} dari {totalGudep} gugus depan aktif sudah ditandai lokasi pangkalannya. Klik penanda untuk membuka daftar
              gudep di kecamatan tersebut.
            </p>
            <p className="mt-3 text-sm text-text-muted">
              Peta hanya memuat lokasi sekolah/komunitas pangkalan. Alamat dan kontak anggota tidak pernah ditampilkan.
            </p>
          </div>
          <div className="h-[22rem] overflow-hidden rounded-3xl border border-border-subtle bg-surface-base shadow-md sm:h-[28rem] lg:col-span-8">
            <GudepMapCanvas
              label={`Peta ${points.length} gugus depan di Kabupaten Indramayu`}
              points={points.map((p) => ({
                id: p.id,
                name: p.name,
                number: p.number,
                lat: p.lat,
                lng: p.lng,
                kwarranName: p.kwarranName,
                activeMembers: 0,
                href: `/wilayah/${p.kwarranSlug}#gudep-${p.id}`,
                meta: `${p.pangkalan ?? 'Pangkalan belum diisi'} · Kwarran ${p.kwarranName}`,
              }))}
            />
          </div>
        </section>

        <section aria-labelledby="direktori-title" className="mt-16">
          <h2 id="direktori-title" className="font-display text-display-md font-semibold text-text-primary">
            Direktori Kwartir Ranting
          </h2>
          <div className="mt-6">
            <KwarranFinder
              items={directory.map(({ slug, name, gudepCount, activeMembers }) => ({ slug, name, gudepCount, activeMembers }))}
            />
          </div>
        </section>
      </div>
    </>
  );
}
