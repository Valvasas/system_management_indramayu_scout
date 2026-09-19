/** Sumber kebenaran tunggal identitas situs: dipakai metadata, sitemap, robots, JSON-LD. */

export const site = {
  name: 'Rumah Pramuka Indramayu',
  shortName: 'Kwarcab Indramayu',
  organization: 'Kwartir Cabang Gerakan Pramuka Indramayu',
  description:
    'Portal informasi resmi Kwartir Cabang Gerakan Pramuka Indramayu: berita, agenda kegiatan, galeri, prestasi, dan dokumen resmi.',
  locale: 'id_ID',
  lang: 'id',
  // Domain publik. Override lewat NEXT_PUBLIC_SITE_URL saat pratinjau/staging.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pramukaindramayu.or.id').replace(/\/$/, ''),
  logo: '/brand/logo.svg',
  contact: {
    email: 'info@pramukaindramayu.or.id',
    accessibilityEmail: 'aksesibilitas@pramukaindramayu.or.id',
    privacyEmail: 'privasi@pramukaindramayu.or.id',
    phone: '(0234) 123456',
    whatsapp: '+62 812-3456-7890',
    address: {
      street: 'Jl. Pramuka, Kawasan Simpang Lima',
      locality: 'Indramayu',
      region: 'Jawa Barat',
      postalCode: '45211',
      country: 'ID',
    },
  },
} as const;

export const absoluteUrl = (path: string) =>
  `${site.url}${path.startsWith('/') ? path : `/${path}`}`;
