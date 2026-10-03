import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { AppearanceForm } from '@/components/dashboard/AppearanceForm';
import { Panel, PortalHeader } from '@/components/dashboard/ui';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { saveAppearanceAction } from '@/features/site/actions';
import { requirePermission } from '@/lib/auth/session';
import { getSiteAppearance } from '@/lib/repositories';

export const metadata: Metadata = { title: 'Tampilan beranda' };

export default async function PengaturanPage() {
  await requirePermission('settings.manage');
  const appearance = await getSiteAppearance();

  return (
    <>
      <PortalHeader
        title="Tampilan beranda"
        description="Foto header adalah kesan pertama pengunjung. Gunakan foto kegiatan resmi terbaik Kwarcab."
        actions={
          <Link href="/" target="_blank" className="inline-flex min-h-touch items-center gap-2 rounded-lg px-3 font-semibold text-text-accent hover:underline">
            Lihat beranda
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">(tab baru)</span>
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Foto header saat ini" bodyClassName="p-0 sm:p-0">
          <MediaFrame
            src={appearance.heroImage}
            alt={appearance.heroImageAlt}
            aspect="video"
            keepAspect
            sizes="(max-width: 1024px) 100vw, 50vw"
            fallbackLabel="Belum ada foto — beranda memakai latar warna cokelat"
            className="rounded-b-lg"
          />
        </Panel>
        <Panel title="Ubah foto header">
          <AppearanceForm action={saveAppearanceAction} defaults={appearance} />
        </Panel>
      </div>
    </>
  );
}
