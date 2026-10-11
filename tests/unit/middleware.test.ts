import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import nextConfig from '../../next.config.mjs';
import { config, middleware } from '@/middleware';

/**
 * GHSA-ffhc-5mcf-pf4q (Next 14): nonce dari header permintaan `Content-Security-Policy` ditulis ke
 * `<script nonce=...>` dengan JSON.stringify → kutip menyisipkan atribut. Terbukti lokal menjadi XSS
 * tersimpan lewat cache ISR. Middleware wajib membuang header itu di SEMUA rute halaman.
 */
const EVIL = `script-src 'nonce-x"src='x'/onerror='alert(1)'/a='`;

/** Header permintaan yang diteruskan middleware ke rute (mekanisme override Next 14). */
function forwarded(res: Response) {
  const names = (res.headers.get('x-middleware-override-headers') ?? '').split(',').filter(Boolean);
  return new Map(names.map((n) => [n, res.headers.get(`x-middleware-request-${n}`)]));
}

const request = (path: string, headers: Record<string, string> = {}) => new NextRequest(new URL(path, 'https://pramuka.test'), { headers });

/** Sama seperti Next: matcher dikompilasi jadi regex atas pathname. */
function matcherHits(pathname: string) {
  const inner = config.matcher[0].match(/^\/\((.*)\)$/)?.[1];
  return new RegExp(`^/${inner}$`).test(pathname);
}

describe('middleware: header CSP kiriman klien', () => {
  it('dibuang di rute publik (ISR) dan tidak diganti apa pun', () => {
    for (const path of ['/', '/wilayah', '/berita/slug-baru', '/cari?q=x', '/persetujuan-wali']) {
      const fwd = forwarded(middleware(request(path, { 'content-security-policy': EVIL, 'content-security-policy-report-only': EVIL })));
      expect(fwd.has('content-security-policy'), path).toBe(false);
      expect(fwd.has('content-security-policy-report-only'), path).toBe(false);
    }
  });

  it('di rute ber-nonce diganti dengan nonce buatan server (base64, tanpa kutip)', () => {
    const res = middleware(request('/masuk', { 'content-security-policy': EVIL }));
    const csp = forwarded(res).get('content-security-policy') ?? '';
    expect(csp).not.toContain('onerror');
    expect(csp).toMatch(/'nonce-[A-Za-z0-9+/]+=*'/);
    expect(res.headers.get('content-security-policy')).toBe(csp);
  });

  it('header lain tetap diteruskan; x-pathname selalu dari server', () => {
    const fwd = forwarded(middleware(request('/kontak', { 'accept-language': 'id', 'x-pathname': '/dashboard/akun/mfa' })));
    expect(fwd.get('accept-language')).toBe('id');
    expect(fwd.get('x-pathname')).toBe('/kontak');
  });

  it('matcher mencakup semua rute halaman, bukan hanya /dashboard dan /masuk', () => {
    for (const p of ['/', '/wilayah', '/berita/a', '/golongan/siaga', '/cari', '/dashboard', '/dashboard/anggota', '/masuk'])
      expect(matcherHits(p), p).toBe(true);
    for (const p of ['/_next/static/chunks/a.js', '/_next/image', '/media/foto/a.webp', '/favicon.ico'])
      expect(matcherHits(p), p).toBe(false);
  });
});

describe('optimizer gambar', () => {
  it('tidak menghasilkan AVIF (GHSA-2xp9-vwfh-vxw4, libheif) selama masih di Next 14', () => {
    expect(nextConfig.images?.formats).toEqual(['image/webp']);
    expect(nextConfig.images?.remotePatterns).toEqual([]);
  });

  it('hanya mengoptimalkan folder foto (bukan dokumen/berkas privat), tanpa query string', async () => {
    const { hasLocalMatch } = await import('next/dist/shared/lib/match-local-pattern');
    const allowed = (src: string) => hasLocalMatch(nextConfig.images?.localPatterns, src);
    for (const src of ['/media/foto/a.webp', '/media/berita/b.webp', '/media/situs/c.webp', '/images/d.jpg'])
      expect(allowed(src), src).toBe(true);
    for (const src of ['/media/dokumen/sk.pdf', '/media/internal/x.pdf', '/media/foto/a.webp?v=2', '/api/health', '/'])
      expect(allowed(src), src).toBe(false);
  });
});
