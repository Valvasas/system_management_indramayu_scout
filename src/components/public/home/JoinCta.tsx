import React from 'react';
import { Map, Sprout } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SceneStrip } from '@/components/illustrations/Scenes';

const steps = [
  { title: 'Temukan gudep', text: 'Cari gugus depan di sekolah atau dekat rumah lewat halaman Wilayah.' },
  { title: 'Temui pembina', text: 'Datang saat latihan rutin dan sampaikan minat bergabung.' },
  { title: 'Mulai berpetualang', text: 'Pembina mendata Anda; setelah diverifikasi, akun portal aktif.' },
];

/** Ajakan bergabung dalam tiga langkah. Satu tombol utama, satu sekunder. */
export const JoinCta: React.FC = () => (
  <section aria-labelledby="gabung-title" className="civic-section-sm bg-surface-canvas">
    <div className="civic-container">
      <Reveal className="relative overflow-hidden rounded-3xl bg-surface-meadow">
        <div className="relative z-10 grid gap-10 p-7 pb-40 sm:p-10 sm:pb-48 lg:grid-cols-12 lg:p-14 lg:pb-52">
          <div className="lg:col-span-5">
            <p className="eyebrow">Bergabung</p>
            <h2 id="gabung-title" className="mt-3 font-display text-display-lg font-semibold text-text-primary">
              Siap mendirikan tenda pertamamu?
            </h2>
            <p className="mt-4 max-w-prose text-lg text-text-secondary">
              Gerakan Pramuka terbuka untuk anak, remaja, dan orang dewasa. Tidak perlu pengalaman, cukup rasa ingin tahu.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/bergabung" variant="primary" size="lg">
                <Sprout className="h-5 w-5" aria-hidden="true" />
                Cara bergabung
              </ButtonLink>
              <ButtonLink href="/wilayah" variant="outline" size="lg">
                <Map className="h-5 w-5" aria-hidden="true" />
                Cari gudep
              </ButtonLink>
            </div>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3 lg:col-span-7 lg:self-center">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-surface-base p-5 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-action-primary font-display text-lg font-semibold text-text-on-brand">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 sm:h-44">
          <SceneStrip variant="camp" />
        </div>
      </Reveal>
    </div>
  </section>
);
