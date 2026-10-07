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
