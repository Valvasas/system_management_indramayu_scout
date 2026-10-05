import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Sprout } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { HeroLandscape, PineMark, TreeLine } from '@/components/illustrations/Scenes';
import { assetExists } from '@/lib/media';
import { getSiteAppearance } from '@/lib/repositories';

/**
 * Tugas yang paling sering dicari pengunjung, ditulis dari sudut pandang mereka
 * ("Saya ingin…"), bukan struktur organisasi. Pintu masuk tercepat untuk orang tua & pembina.
 */
const tasks = [
  { label: 'Mendaftarkan anak', href: '/bergabung#orang-tua' },
  { label: 'Mencari gudep terdekat', href: '/wilayah' },
  { label: 'Mengunduh formulir', href: '/dokumen?kategori=formulir' },
  { label: 'Melihat jadwal kegiatan', href: '/agenda' },
];

export async function HomeHero() {
  const appearance = await getSiteAppearance();
  const photo = appearance.heroImage && assetExists(appearance.heroImage) ? appearance.heroImage : null;

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-ill-sky">
      {/* Ponsel: teks di atas langit, lanskap di bawahnya. Desktop: lanskap jadi latar penuh. */}
      <div className="civic-container relative z-10 grid gap-10 pb-8 pt-10 sm:pt-16 lg:min-h-[47rem] lg:grid-cols-12 lg:pb-60 lg:pt-20">
        <div className="lg:col-span-7">
          <p className="eyebrow animate-rise">
            <PineMark className="h-4 w-3.5 text-text-accent" />
            Kwartir Cabang Gerakan Pramuka Indramayu
          </p>
          <h1 id="hero-title" className="mt-5 font-display text-display-xl font-semibold text-text-primary animate-rise [animation-delay:80ms]">
            Rumah digital Pramuka <span className="text-text-accent">Indramayu</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary text-pretty animate-rise [animation-delay:160ms] sm:text-xl">
            Kabar kegiatan, jadwal perkemahan, dokumen resmi, dan layanan kwartir untuk 31 Kwarran dan seluruh gugus depan, dalam satu tempat.
          </p>
          <div className="mt-8 flex flex-col gap-3 animate-rise [animation-delay:240ms] sm:flex-row">
            <ButtonLink href="/agenda" variant="accent" size="lg">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
              Lihat agenda
            </ButtonLink>
            <ButtonLink href="/bergabung" variant="outline" size="lg">
              <Sprout className="h-5 w-5" aria-hidden="true" />
              Cara bergabung
            </ButtonLink>
          </div>

          <nav aria-label="Pintasan tugas" className="mt-9 animate-rise [animation-delay:320ms]">
            <p className="text-sm font-semibold text-text-secondary">Saya ingin…</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {tasks.map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    className="group inline-flex min-h-touch items-center gap-1.5 rounded-pill border border-border-subtle bg-surface-base px-4 text-sm font-medium text-text-primary shadow-sm transition-colors hover:border-border-brand hover:text-text-accent"
                  >
                    {t.label}
                    <ArrowRight className="h-3.5 w-3.5 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-text-accent" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {photo && (
          <figure className="hidden self-start lg:col-span-5 lg:block">
            <div className="relative rotate-2 rounded-3xl bg-surface-base p-3 shadow-lg">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image src={photo} alt={appearance.heroImageAlt} fill priority sizes="40vw" className="object-cover" />
              </div>
              {appearance.heroCaption && (
                <figcaption className="px-2 pb-1 pt-3 text-sm font-medium text-text-secondary">{appearance.heroCaption}</figcaption>
              )}
            </div>
          </figure>
        )}
      </div>

      <div className="relative h-64 sm:h-80 lg:absolute lg:inset-0 lg:h-auto">
        <HeroLandscape />
      </div>
      <TreeLine className="absolute inset-x-0 -bottom-px z-10 text-surface-forest" seed={31} />
    </section>
  );
}
