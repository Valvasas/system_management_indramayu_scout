/**
 * Kode akses sekali pakai (aktivasi akun & reset sandi).
 *
 * - Format "ABCD-2345": 8 karakter dari alfabet tanpa huruf/angka mirip (0/O, 1/I/L),
 *   mudah dibacakan pembina lewat telepon atau ditulis di kertas.
 * - Yang disimpan hanya SHA-256 dari kode ternormalisasi; kode asli tampil sekali.
 * - Keamanan bertumpu pada: masa berlaku pendek, sekali pakai, dan rate limit percobaan
 *   per akun & per IP (features/auth/access.ts). Ruang kode 31^8 ≈ 8,5 × 10^11.
 */
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const ACCESS_CODE_TTL_HOURS = { ACTIVATION: 24 * 7, RESET: 24 } as const;

export function generateAccessCode(): string {
  const pick = () => ALPHABET[randomInt(ALPHABET.length)];
  const raw = Array.from({ length: 8 }, pick).join('');
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/** Terima masukan longgar: huruf kecil, spasi, tanpa tanda hubung. */
export function normalizeAccessCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function hashAccessCode(code: string): string {
  return createHash('sha256')
    .update(`rp-access:${normalizeAccessCode(code)}`)
    .digest('hex');
}

/** Bandingkan hash secara waktu-konstan. */
export function accessCodeMatches(input: string, storedHash: string): boolean {
  const a = Buffer.from(hashAccessCode(input), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isValidAccessCodeShape(input: string): boolean {
  const n = normalizeAccessCode(input);
  return n.length === 8 && [...n].every((c) => ALPHABET.includes(c));
}
