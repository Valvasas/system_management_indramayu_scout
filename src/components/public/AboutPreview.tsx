import React from 'react';
import { Check } from 'lucide-react';
import { ButtonLink } from '../ui/Button';
import { MediaFrame } from '../ui/MediaFrame';

const pillars = [
  'Pendidikan kepramukaan berjenjang dari Siaga hingga Pandega',
  'Pembinaan pembina dan pelatih melalui Pusdiklatcab',
  'Kegiatan bakti masyarakat dan kepedulian lingkungan',
];

export const AboutPreview: React.FC = () => (
  <section aria-labelledby="about-title" className="bg-surface-subtle civic-section">
    <div className="civic-container">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2
            id="about-title"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary"
          >
            Membangun karakter generasi muda Indramayu
          </h2>
          <p className="mt-4 civic-prose">
            Kwartir Cabang Gerakan Pramuka Indramayu menyelenggarakan pendidikan kepramukaan bagi
            gugus depan di seluruh kecamatan — membina mental, keterampilan, dan kepedulian sosial
            kaum muda agar tumbuh menjadi warga negara yang mandiri dan bertanggung jawab.
          </p>

          <ul className="mt-6 space-y-3">
            {pillars.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-text-secondary">
                <Check className="h-5 w-5 shrink-0 text-text-accent" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <ButtonLink href="/tentang" variant="outline" className="mt-8">
            Pelajari profil kwarcab
          </ButtonLink>
        </div>

        <MediaFrame
          src="/images/about/sekretariat.jpg"
          alt="Gedung sekretariat Kwartir Cabang Gerakan Pramuka Indramayu"
          aspect="4/3"
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="rounded-lg border border-border-subtle"
          fallbackLabel="Foto sekretariat menyusul — dokumentasi resmi sedang disiapkan"
        />
      </div>
    </div>
  </section>
);
