import { buildCsp, STATIC_CSP_SOURCE } from './src/lib/security/csp.mjs';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * CSP di-*enforce* (P1-1). Kebijakan & alasannya: src/lib/security/csp.mjs.
 * Rute statis memakai kebijakan di bawah; /dashboard dan /masuk mendapat CSP
 * ber-nonce dari src/middleware.ts (tidak boleh dobel, jadi dikecualikan di sini).
 */
const csp = buildCsp({ dev: isDev });

const securityHeaders = [
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
    // src/instrumentation.ts: validasi env (fail-fast) saat server start.
    instrumentationHook: true,
    // Paket native/WASM dijalankan apa adanya di server, tidak dibundel webpack.
    serverComponentsExternalPackages: ['@electric-sql/pglite', 'pg', 'sharp', 'bcryptjs'],
    // Unggahan foto/dokumen lewat Server Action (batas per berkas dicek lagi di lib/storage.ts).
    serverActions: { bodySizeLimit: '32mb' },
  },
  images: {
    // Optimizer aktif (P4-1). Tanpa remotePatterns, hanya berkas dari
    // origin sendiri yang boleh dioptimalkan — host tak terdaftar ditolak (P1-7).
    // AVIF sengaja dimatikan: GHSA-2xp9-vwfh-vxw4 (RCE lewat libheif di sharp) belum punya
    // perbaikan untuk Next 14; WebP tidak melewati libheif. Lihat docs/operations/keputusan-next-16.md.
    formats: ['image/webp'],
    remotePatterns: [],
    // Hanya folder foto hasil saveImage() (lib/storage.ts) + aset publik. Tanpa ini optimizer mau
    // memuat berkas lokal APA PUN ke memori, mis. dokumen 15 MB (GHSA-h64f-5h5j-jqjh), dan jumlah
    // variannya tak terbatas (GHSA-3x4c-7xq6-9pq8). `search: ''` menolak query string.
    localPatterns: ['/media/foto/**', '/media/berita/**', '/media/situs/**', '/images/**'].map((pathname) => ({
      pathname,
      search: '',
    })),
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: STATIC_CSP_SOURCE, headers: [{ key: 'Content-Security-Policy', value: csp }] },
    ];
  },
};

export default nextConfig;
