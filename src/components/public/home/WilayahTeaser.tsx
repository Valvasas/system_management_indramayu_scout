import React from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { CompassRose } from '@/components/illustrations/Scenes';
import { Section } from '@/components/ui/Section';
import { getKwarranDirectory } from '@/lib/repositories';

/** 31 Kwarran sebagai "peta tautan": cepat dipindai, langsung menuju daftar gudep tiap kecamatan. */
export async function WilayahTeaser() {
  const kwarran = await getKwarranDirectory();

  return (
    <Section
      id="wilayah"
      eyebrow="Wilayah"
      title="Temukan Kwarran di kecamatanmu"
      description="Setiap kecamatan di Indramayu punya Kwartir Ranting. Pilih satu untuk melihat gugus depan di wilayah tersebut."
      action={{ label: 'Peta & direktori', href: '/wilayah' }}
      topo
    >
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-28 text-text-accent">
            <CompassRose className="h-48 w-48 animate-[sway_12s_ease-in-out_infinite]" />
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:col-span-9 lg:grid-cols-4">
          {kwarran.map((k) => (
            <li key={k.id}>
              <Link
                href={`/wilayah/${k.slug}`}
                className="group flex min-h-touch items-center justify-between gap-2 rounded-xl border border-border-subtle bg-surface-base px-3 py-2.5 transition-colors hover:border-border-brand hover:bg-surface-meadow"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <MapPin className="hidden h-4 w-4 shrink-0 text-text-muted group-hover:text-text-accent sm:block" aria-hidden="true" />
                  <span className="break-words text-sm font-medium leading-tight text-text-primary sm:text-base">{k.name}</span>
                </span>
                <span className="shrink-0 rounded-pill bg-surface-subtle px-2 py-0.5 text-xs font-semibold tabular-nums text-text-secondary">
                  {k.gudepCount}
                  <span className="sr-only"> gudep</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
