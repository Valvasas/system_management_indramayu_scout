import { describe, expect, it } from 'vitest';
import { base32Decode, base32Encode, generateTotpSecret, hotp, otpauthUri, totpStep, verifyTotp } from '@/lib/auth/totp';

// RFC 6238 Lampiran B (SHA1, rahasia ASCII "12345678901234567890", 8 digit).
const RFC_SECRET = Buffer.from('12345678901234567890', 'ascii');
const RFC_VECTORS: [number, string][] = [
  [59, '94287082'],
  [1111111109, '07081804'],
  [1111111111, '14050471'],
  [1234567890, '89005924'],
  [2000000000, '69279037'],
  [20000000000, '65353130'],
];

describe('TOTP RFC 6238', () => {
  it.each(RFC_VECTORS)('vektor resmi T=%i → %s', (t, expected) => {
    expect(hotp(RFC_SECRET, totpStep(t * 1000), 8)).toBe(expected);
    expect(hotp(RFC_SECRET, totpStep(t * 1000), 6)).toBe(expected.slice(-6));
  });

  it('base32 bolak-balik (RFC 4648) dan menolak karakter asing', () => {
    expect(base32Encode(Buffer.from('foobar'))).toBe('MZXW6YTBOI');
    expect(base32Decode('MZXW 6YTB-OI').toString()).toBe('foobar');
    expect(() => base32Decode('MZXW1')).toThrow();
    expect(base32Decode(generateTotpSecret())).toHaveLength(20);
  });

  const secret = base32Encode(RFC_SECRET);
  const now = 1111111111 * 1000;
  const codeAt = (ms: number) => hotp(RFC_SECRET, totpStep(ms));

  it('menerima kode langkah sekarang dan ±1 langkah, menolak yang lebih jauh', () => {
    expect(verifyTotp(secret, codeAt(now), now, null)).toBe(totpStep(now));
    expect(verifyTotp(secret, codeAt(now - 30_000), now, null)).toBe(totpStep(now) - 1);
    expect(verifyTotp(secret, codeAt(now + 30_000), now, null)).toBe(totpStep(now) + 1);
    expect(verifyTotp(secret, codeAt(now - 90_000), now, null)).toBeNull();
  });

  it('anti-replay: kode dari langkah yang sudah dipakai ditolak', () => {
    const step = verifyTotp(secret, codeAt(now), now, null)!;
    expect(verifyTotp(secret, codeAt(now), now, step)).toBeNull();
    expect(verifyTotp(secret, codeAt(now - 30_000), now, step)).toBeNull();
    expect(verifyTotp(secret, codeAt(now + 30_000), now + 30_000, step)).toBe(step + 1);
  });

  it('format kode selain 6 digit ditolak', () => {
    for (const bad of ['', '12345', '1234567', 'abcdef', '12 34 5x']) expect(verifyTotp(secret, bad, now, null)).toBeNull();
    expect(verifyTotp(secret, ` ${codeAt(now).slice(0, 3)} ${codeAt(now).slice(3)} `, now, null)).not.toBeNull();
  });

  it('URI otpauth memuat penerbit, akun, dan parameter standar', () => {
    const uri = otpauthUri({ issuer: 'Rumah Pramuka', account: 'admin', secret: 'ABC' });
    expect(uri).toBe('otpauth://totp/Rumah%20Pramuka%3Aadmin?secret=ABC&issuer=Rumah+Pramuka&algorithm=SHA1&digits=6&period=30');
  });
});
