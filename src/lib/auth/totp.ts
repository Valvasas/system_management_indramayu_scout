/**
 * TOTP (RFC 6238) di atas HOTP (RFC 4226): HMAC-SHA1, 6 digit, periode 30 detik.
 * Parameter bawaan aplikasi autentikator umum (Google Authenticator, Aegis, 2FAS, Authy).
 * Diuji terhadap vektor resmi RFC 6238 Lampiran B (tests/unit/totp.test.ts).
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const TOTP_PERIOD_S = 30;
export const TOTP_DIGITS = 6;

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx < 0) throw new Error('Rahasia TOTP bukan base32 yang valid.');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** Rahasia baru 160 bit (panjang yang dianjurkan RFC 4226 untuk HMAC-SHA1). */
export const generateTotpSecret = () => base32Encode(randomBytes(20));

export function hotp(secret: Buffer, counter: number, digits = TOTP_DIGITS): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac('sha1', secret).update(msg).digest();
  const offset = mac[mac.length - 1] & 0x0f;
  const bin = ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

export const totpStep = (nowMs: number) => Math.floor(nowMs / 1000 / TOTP_PERIOD_S);

const sameCode = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * Cocokkan kode dengan toleransi ±`window` langkah (jam ponsel meleset ±30 detik).
 * Mengembalikan langkah yang cocok, atau null. Langkah ≤ `lastUsedStep` selalu ditolak
 * sehingga kode yang sudah pernah diterima tidak bisa dipakai ulang (anti-replay).
 */
export function verifyTotp(secretB32: string, code: string, nowMs: number, lastUsedStep: number | null, window = 1): number | null {
  const clean = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean)) return null;
  const secret = base32Decode(secretB32);
  const current = totpStep(nowMs);
  let matched: number | null = null;
  // Periksa semua langkah dalam jendela (tanpa berhenti dini) agar waktu respons seragam.
  for (let step = current - window; step <= current + window; step++) {
    if (sameCode(hotp(secret, step), clean) && (lastUsedStep === null || step > lastUsedStep)) matched ??= step;
  }
  return matched;
}

export function otpauthUri({ issuer, account, secret }: { issuer: string; account: string; secret: string }): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: String(TOTP_DIGITS), period: String(TOTP_PERIOD_S) });
  return `otpauth://totp/${label}?${params.toString()}`;
}
