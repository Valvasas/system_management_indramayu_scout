const isDev = process.env.NODE_ENV !== 'production';

/**
 * CSP kini di-*enforce* (P1-1). Seluruh aset disajikan sendiri:
 * - font: next/font mengunduh & menyajikan dari origin sendiri saat build
 * - style: Tailwind + CSS Leaflet ikut terbundel
 * - script: 'unsafe-inline' masih dibutuhkan runtime inline Next 14 (bootstrap
 *   & data flight). Hapus begitu pindah ke strategi nonce.
 * - img: ubin peta OpenStreetMap adalah satu-satunya host luar.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    // geolocation=(self): staf menandai lokasi gudep dari perangkat saat berada di lokasi.
    value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Paket native/WASM dijalankan apa adanya di server, tidak dibundel webpack.
    serverComponentsExternalPackages: ['@electric-sql/pglite', 'pg', 'sharp', 'bcryptjs'],
    // Unggahan foto/dokumen lewat Server Action (batas per berkas dicek lagi di lib/storage.ts).
    serverActions: { bodySizeLimit: '32mb' },
  },
  images: {
    // Optimizer aktif (P4-1). Tanpa remotePatterns, hanya berkas dari
    // origin sendiri yang boleh dioptimalkan — host tak terdaftar ditolak (P1-7).
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
