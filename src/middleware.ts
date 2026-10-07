import { NextResponse, type NextRequest } from 'next/server';
import { isDevBuild } from '@/lib/env';
import { buildCsp, usesNonceCsp } from '@/lib/security/csp.mjs';

/**
 * 1. Penyaring awal rute portal: tanpa cookie sesi → langsung ke halaman masuk.
 *    INI BUKAN kontrol akses. Validasi sesi, peran, dan cakupan tetap dilakukan
 *    di server pada setiap halaman & aksi (src/lib/auth/session.ts).
 * 2. CSP ber-nonce untuk portal & /masuk (rute dinamis). Next membaca nonce dari header
 *    permintaan `Content-Security-Policy` dan memasangnya di skrip inline-nya sendiri.
 */
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
  headers.set('x-pathname', pathname);
  if (!usesNonceCsp(pathname)) return NextResponse.next({ request: { headers } });

  const csp = buildCsp({ dev: isDevBuild, nonce: nonce() });
  headers.set('Content-Security-Policy', csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export const config = { matcher: ['/dashboard', '/dashboard/:path*', '/masuk', '/masuk/verifikasi'] };
