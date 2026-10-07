/**
 * Content-Security-Policy — satu sumber untuk next.config.mjs (halaman statis) dan
 * src/middleware.ts (halaman dinamis ber-nonce). File .mjs agar bisa diimpor keduanya.
 *
 * Dua kebijakan, karena Next 14 menyisipkan skrip inline (bootstrap + payload RSC):
 *
 * - STATIS (situs publik pra-render/ISR): nonce mustahil (HTML dibuat sekali, bukan per
 *   permintaan) dan hash tidak stabil (payload berubah tiap revalidasi), jadi skrip inline
 *   masih 'unsafe-inline'. Mitigasi: tidak ada HTML dari pengguna yang dirender mentah;
 *   JSON-LD di-escape (`src/lib/json-ld.ts`).
 * - NONCE (portal /dashboard + /masuk, selalu dinamis): skrip hanya dengan nonce per
 *   permintaan + 'strict-dynamic' (chunk yang dimuat skrip ber-nonce ikut diizinkan).
 *   Tanpa 'unsafe-inline' untuk skrip maupun elemen <style>. Atribut style= tetap boleh
 *   (dipakai bilah progres; tidak bisa diberi nonce).
 *
 * img-src: ubin OpenStreetMap satu-satunya host luar (peta Leaflet).
 */

const shared = (dev) => [
  "default-src 'self'",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
  "font-src 'self' data:",
  `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
];

/**
 * @param {{ dev: boolean, nonce?: string }} options
 * @returns {string}
 */
export function buildCsp({ dev, nonce }) {
  const evalSrc = dev ? " 'unsafe-eval'" : '';
  if (!nonce) {
    return [`script-src 'self' 'unsafe-inline'${evalSrc}`, "style-src 'self' 'unsafe-inline'", ...shared(dev)].join('; ');
  }
  if (!/^[A-Za-z0-9+/=_-]{16,}$/.test(nonce)) throw new Error('Nonce CSP tidak valid.');
  return [
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${evalSrc}`,
    // Dev: style-loader menyisipkan <style> tanpa nonce → izinkan hanya saat pengembangan.
    dev ? "style-src 'self' 'unsafe-inline'" : `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    ...shared(dev),
  ].join('; ');
}

/**
 * Rute yang mendapat CSP ber-nonce dari middleware. Semuanya WAJIB dirender dinamis
 * (layout dasbor & /masuk memakai `dynamic = 'force-dynamic'`): halaman statis tidak
 * membawa nonce sehingga skripnya akan diblokir.
 * @param {string} pathname
 */
export function usesNonceCsp(pathname) {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/') || pathname === '/masuk' || pathname === '/masuk/verifikasi';
}

/** Pola `source` next.config untuk semua rute SELAIN yang ditangani middleware. */
export const STATIC_CSP_SOURCE = '/:path((?!dashboard(?:/|$)|masuk$|masuk/verifikasi$).*)';
