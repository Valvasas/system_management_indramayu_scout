import { describe, expect, it } from 'vitest';
import nextConfig from '../../next.config.mjs';
import { buildCsp, STATIC_CSP_SOURCE, usesNonceCsp } from '@/lib/security/csp.mjs';
import { jsonLdHtml } from '@/lib/json-ld';

const directive = (csp: string, name: string) =>
  csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.split(' ')[0] === name) ?? '';

describe('Content-Security-Policy (P1-1)', () => {
  it('kebijakan statis produksi: tanpa unsafe-eval, framing & plugin dilarang', () => {
    const csp = buildCsp({ dev: false });
    expect(directive(csp, 'script-src')).not.toContain('unsafe-eval');
    expect(directive(csp, 'frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(directive(csp, 'object-src')).toBe("object-src 'none'");
    expect(directive(csp, 'base-uri')).toBe("base-uri 'self'");
    expect(directive(csp, 'connect-src')).toBe("connect-src 'self'");
  });

  it("kebijakan portal ber-nonce: tanpa 'unsafe-inline' untuk skrip & elemen style", () => {
    const csp = buildCsp({ dev: false, nonce: 'AbCdEfGhIjKlMnOp1234==' });
    const script = directive(csp, 'script-src');
    expect(script).toContain("'nonce-AbCdEfGhIjKlMnOp1234=='");
    expect(script).toContain("'strict-dynamic'");
    expect(script).not.toContain('unsafe-inline');
    expect(script).not.toContain('unsafe-eval');
    expect(directive(csp, 'style-src')).not.toContain('unsafe-inline');
  });

  it('nonce yang bisa menyisipkan direktif ditolak', () => {
    expect(() => buildCsp({ dev: false, nonce: "abc'; script-src *" })).toThrow();
    expect(() => buildCsp({ dev: false, nonce: 'pendek' })).toThrow();
  });

  it('nonce hanya untuk rute yang selalu dinamis', () => {
    for (const p of ['/dashboard', '/dashboard/anggota', '/masuk']) expect(usesNonceCsp(p)).toBe(true);
    for (const p of ['/', '/berita', '/masuk/kode', '/masuk/lupa-sandi', '/dashboards']) expect(usesNonceCsp(p)).toBe(false);
  });

  it('pola rute CSP statis mengecualikan tepat rute ber-nonce (tidak ada header ganda)', () => {
    const inner = STATIC_CSP_SOURCE.match(/^\/:path\((.*)\)$/)?.[1];
    expect(inner).toBeTruthy();
    const matches = (p: string) => new RegExp(`^${inner}$`).test(p.replace(/^\//, ''));
    for (const p of ['/', '/berita', '/masuk/kode', '/masuk/lupa-sandi', '/dashboards', '/media/foto/a.webp'])
      expect(matches(p), p).toBe(true);
    for (const p of ['/dashboard', '/dashboard/anggota', '/masuk']) {
      expect(matches(p), p).toBe(false);
      expect(usesNonceCsp(p)).toBe(true);
    }
  });

  it('next.config memasang header keamanan di semua rute + CSP di rute statis', async () => {
    const rules = await nextConfig.headers!();
    const all = rules.find((r) => r.source === '/:path*');
    const keys = all?.headers.map((h) => h.key) ?? [];
    for (const key of [
      'Strict-Transport-Security',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Cross-Origin-Opener-Policy',
    ])
      expect(keys).toContain(key);
    expect(keys).not.toContain('Content-Security-Policy');
    const csp = rules.find((r) => r.source === STATIC_CSP_SOURCE)?.headers.find((h) => h.key === 'Content-Security-Policy');
    expect(csp?.value).toContain("default-src 'self'");
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});

describe('JSON-LD aman di dalam <script>', () => {
  it('judul CMS berisi </script> tidak bisa menutup blok', () => {
    const data = { headline: '</script><script>alert(1)</script> & <!-- x -->', note: 'baris baru' };
    const html = jsonLdHtml(data);
    expect(html).not.toMatch(/<|>|&/);
    expect(html).not.toContain(' ');
    expect(JSON.parse(html)).toEqual(data);
  });
});
