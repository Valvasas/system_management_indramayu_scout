import { inArray } from 'drizzle-orm';
import { getDb, schema } from '@/db';

/** Pengaturan situs yang dapat diubah pengurus lewat portal (Pengaturan → Tampilan beranda). */
export interface SiteAppearance {
  /** Foto header beranda (path /media/...). Kosong = latar warna brand. */
  heroImage: string | null;
  heroImageAlt: string;
  /** Keterangan kecil di pojok foto, mis. "Apel Hari Pramuka 2026". */
  heroCaption: string;
}

export const DEFAULT_APPEARANCE: SiteAppearance = {
  heroImage: null,
  heroImageAlt: 'Kegiatan Gerakan Pramuka Kwartir Cabang Indramayu',
  heroCaption: '',
};

const KEYS = ['heroImage', 'heroImageAlt', 'heroCaption'] as const;

export async function getSiteAppearance(): Promise<SiteAppearance> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.siteSettings)
    .where(inArray(schema.siteSettings.key, [...KEYS]));
  const values = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    heroImage: typeof values.heroImage === 'string' && values.heroImage ? values.heroImage : null,
    heroImageAlt: typeof values.heroImageAlt === 'string' && values.heroImageAlt ? values.heroImageAlt : DEFAULT_APPEARANCE.heroImageAlt,
    heroCaption: typeof values.heroCaption === 'string' ? values.heroCaption : '',
  };
}
