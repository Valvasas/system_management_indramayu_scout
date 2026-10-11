import { NextResponse, type NextRequest } from 'next/server';
import { isDevBuild } from '@/lib/env';
import { buildCsp, usesNonceCsp } from '@/lib/security/csp.mjs';

/**
 * 1. Penyaring awal rute portal: tanpa cookie sesi → langsung ke halaman masuk.
 *    INI BUKAN kontrol akses. Validasi sesi, peran, dan cakupan tetap dilakukan
 *    di server pada setiap halaman & aksi (src/lib/auth/session.ts).
 * 2. CSP ber-nonce untuk portal & /masuk (rute dinamis). Next membaca nonce dari header
 *    permintaan `Content-Security-Policy` dan memasangnya di skrip inline-nya sendiri.
 * 3. Header `Content-Security-Policy(-Report-Only)` KIRIMAN KLIEN dibuang di SEMUA rute.
 *    Next 14 memasang nonce dari header itu dengan `JSON.stringify` (bukan escape HTML), jadi
 *    tanda kutip di nonce palsu menyisipkan atribut ke `<script>` inline (GHSA-ffhc-5mcf-pf4q).
 *    Halaman ISR yang dibangun ulang oleh permintaan seperti itu tersimpan di cache dan disajikan
 *    ke semua pengunjung = XSS tersimpan (terbukti lokal, lihat docs/operations/keputusan-next-16.md).
 */
/** Header yang hanya boleh diisi server sendiri; nilai kiriman klien tidak pernah dipercaya. */
const UNTRUSTED_REQUEST_HEADERS = ['content-security-policy', 'content-security-policy-report-only'];

function nonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPortal = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const hasSession = req.cookies.has('__Host-rp_session') || req.cookies.has('rp_session');
  if (isPortal && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/masuk';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const headers = new Headers(req.headers);
  for (const name of UNTRUSTED_REQUEST_HEADERS) headers.delete(name);
  headers.set('x-pathname', pathname);
  if (!usesNonceCsp(pathname)) return NextResponse.next({ request: { headers } });

  const csp = buildCsp({ dev: isDevBuild, nonce: nonce() });
  headers.set('Content-Security-Policy', csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

/**
 * Semua rute halaman (lihat poin 3), kecuali aset build, optimizer gambar, dan berkas unggahan
 * (route handler tanpa HTML). Jangan dipersempit lagi ke /dashboard + /masuk.
 */
export const config = { matcher: ['/((?!_next/static|_next/image|media/|favicon\\.ico).*)'] };
