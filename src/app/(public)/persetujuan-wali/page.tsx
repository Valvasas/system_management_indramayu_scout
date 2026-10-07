import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { GuardianConsentFlow } from '@/components/public/GuardianConsentFlow';
import { SceneStrip } from '@/components/illustrations/Scenes';

export const metadata: Metadata = {
  title: 'Persetujuan orang tua/wali',
  description: 'Berikan atau ubah persetujuan pengelolaan data, foto, dan kegiatan anak memakai kode dari pembina.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/persetujuan-wali' },
};

/** Tanpa akun dan tanpa email (V5 §10): wali cukup memakai kode sekali pakai dari pembina. */
export default function PersetujuanWaliPage() {
  return (
    <div className="topo bg-surface-canvas">
      <div className="civic-container py-8 sm:py-12">
        <Breadcrumbs items={[{ label: 'Persetujuan orang tua/wali' }]} />
        <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-3xl border border-border-subtle bg-surface-base shadow-lg">
          <div className="relative bg-ill-sky px-7 pb-24 pt-7 sm:px-10 sm:pt-10">
            <p className="eyebrow">Untuk orang tua/wali</p>
            <h1 className="mt-3 font-display text-display-md font-semibold text-text-primary">Persetujuan untuk anak Anda</h1>
            <p className="mt-3 max-w-prose text-text-secondary">
              Pembina gugus depan memberi Anda kode berbentuk ABCD-2345. Dengan kode itu Anda memilih apa yang boleh dilakukan Kwarcab atas
              data, foto, dan keikutsertaan anak dalam kegiatan. Anda bisa mengubah pilihan kapan saja.
            </p>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20">
              <SceneStrip variant="meadow" />
            </div>
          </div>
          <div className="p-7 sm:p-10">
            <GuardianConsentFlow />
          </div>
        </div>
      </div>
    </div>
  );
}
