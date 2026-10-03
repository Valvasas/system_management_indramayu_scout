import { NextResponse, type NextRequest } from 'next/server';

/**
 * Penyaring awal rute portal: tanpa cookie sesi → langsung ke halaman masuk.
 * INI BUKAN kontrol akses. Validasi sesi, peran, dan cakupan tetap dilakukan
 * di server pada setiap halaman & aksi (src/lib/auth/session.ts).
 */
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has('__Host-rp_session') || req.cookies.has('rp_session');
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/masuk';
    url.search = '';
    return NextResponse.redirect(url);
  }
  const headers = new Headers(req.headers);
  headers.set('x-pathname', req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ['/dashboard', '/dashboard/:path*'] };
