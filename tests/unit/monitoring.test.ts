import { DrizzleQueryError } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { buildEvent, parseDsn, scrub } from '@/lib/monitoring';

describe('penyamaran data sebelum dikirim ke Sentry (1.7)', () => {
  it('membuang pos-el, telepon, IP, NIK, kode akses, kredensial DB, dan query string', () => {
    const text = scrub(
      'Gagal untuk dimas@contoh.id 0812-3456-7890 +6281234567890 dari 203.0.113.9 / 2001:db8:85a3:0:0:8a2e:370:7334 ' +
        'NIK 3212345678901234 kode ABCD-2345 password=rahasia123 postgresql://app:sandi@db:5432/x https://situs.id/a?token=xyz#f',
    );
    for (const leak of [
      'dimas@',
      '3456-7890',
      '81234567890',
      '203.0.113.9',
      '2001:db8',
      '3212345678901234',
      'ABCD-2345',
      'rahasia123',
      'sandi@db',
      'token=xyz',
    ])
      expect(text).not.toContain(leak);
    expect(text).toContain('https://situs.id/a');
  });

  it('format telepon Indonesia, IPv6 ringkas, kredensial URL, token & JWT ikut disamarkan', () => {
    const probes = [
      '+62 812-3456-7890',
      '+62-812-3456-7890',
      '(0812) 3456-7890',
      '62 812 3456 7890',
      '0812.3456.7890',
      '2001:db8::1',
      '2001:db8:85a3::8a2e:370:7334',
      'fe80::1%eth0',
      'redis://default:secretpw@redis:6379',
      'https://user:pass@10.0.0.5/x',
      'access_token=abc123',
      'SESSION_SECRET=x9y8',
      'api_key=sk_live_123',
      'Authorization: Basic dXNlcjpwYXNz',
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl',
    ];
    for (const p of probes) {
      const out = scrub(`galat ${p} akhir`);
      expect(out, p).not.toContain(p);
      expect(out, p).toMatch(/^galat .* akhir$/);
    }
    for (const leak of ['secretpw', 'user:pass', 'abc123', 'x9y8', 'sk_live', 'dXNlcjpwYXNz', '3456', 'db8'])
      expect(scrub(probes.join(' ')), leak).not.toContain(leak);
  });

  it('jam, port, dan baris stack tidak dianggap IPv6/telepon', () => {
    for (const keep of ['pukul 12:34:56', 'at f (/app/x.ts:108:12)', 'port 5432', 'node:internal/modules/cjs/loader:1234:14'])
      expect(scrub(keep)).toBe(keep);
  });

  it('galat kueri Drizzle: parameter (nama & tanggal lahir anak) TIDAK pernah ikut terkirim', () => {
    const cause = Object.assign(new Error('duplicate key value violates unique constraint "members_kta_uq"'), {
      code: '23505',
      constraint: 'members_kta_uq',
    });
    const err = new DrizzleQueryError(
      'insert into "members" ("full_name", "birth_date", "notes") values ($1, $2, $3)',
      ['Dimas Pratama', '2012-05-04', 'Alergi kacang'],
      cause,
    );
    const json = JSON.stringify(buildEvent(err));
    for (const leak of ['Dimas', 'Pratama', '2012-05-04', 'Alergi', 'params']) expect(json, leak).not.toContain(leak);
    expect(buildEvent(err).exception.values[0].value).toBe(
      'Failed query: insert into "members" ("full_name", "birth_date", "notes") values ($1, $2, $3) [pg 23505 members_kta_uq]',
    );
    // Galat lain dengan pesan multi-baris: baris lanjutan tidak masuk frame stack.
    const multi = new Error('Gagal\nDimas Pratama 2012-05-04');
    const frames = JSON.stringify(buildEvent(multi).exception.values[0].stacktrace.frames);
    expect(frames).not.toContain('Dimas');
    expect(frames).toContain('at ');
  });

  it('nomor baris stack trace tetap terbaca', () => {
    expect(scrub('at handler (/app/src/x.ts:12:34)')).toBe('at handler (/app/src/x.ts:12:34)');
  });

  it('event tanpa data pengguna/request, pesan & stack tersamar', () => {
    const event = buildEvent(new Error('Tidak bisa menyimpan 0812-1111-2222'), { area: 'anggota' }, 'staging');
    expect(event.exception.values[0].value).toBe('Tidak bisa menyimpan [telepon]');
    expect(event).not.toHaveProperty('user');
    expect(event).not.toHaveProperty('request');
    expect(event.environment).toBe('staging');
    expect(event.tags).toEqual({ area: 'anggota' });
  });

  it('DSN hanya diterima dalam bentuk https resmi', () => {
    expect(parseDsn('https://abc123@o1.ingest.sentry.io/4567')).toEqual({
      endpoint: 'https://o1.ingest.sentry.io/api/4567/envelope/',
      publicKey: 'abc123',
      raw: 'https://abc123@o1.ingest.sentry.io/4567',
    });
    expect(parseDsn('http://abc@o1.ingest.sentry.io/1')).toBeNull();
    expect(parseDsn('https://o1.ingest.sentry.io/1')).toBeNull();
    expect(parseDsn('bukan url')).toBeNull();
  });
});
