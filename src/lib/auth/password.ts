import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

const COST = 12;
export const MIN_PASSWORD_LENGTH = 10;

export const hashPassword = (plain: string) => bcrypt.hash(plain, COST);

export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/** Hash tiruan: menyamakan waktu respons saat username tidak ada (mencegah enumerasi akun). */
let dummyHash: Promise<string> | undefined;
export const burnPasswordCheck = async (plain: string) => {
  dummyHash ??= bcrypt.hash('dummy-password-for-timing', COST);
  await bcrypt.compare(plain, await dummyHash);
  return false;
};

export function passwordProblem(plain: string): string | null {
  if (plain.length < MIN_PASSWORD_LENGTH) return `Minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  if (plain.length > 128) return 'Maksimal 128 karakter.';
  if (!/[A-Za-z]/.test(plain) || !/\d/.test(plain)) return 'Gunakan kombinasi huruf dan angka.';
  return null;
}

/** Kata sandi sementara yang mudah dibacakan: tanpa huruf/angka yang mirip (0/O, 1/l). */
export function generateTemporaryPassword(): string {
  const letters = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const pick = (set: string, n: number) => Array.from({ length: n }, () => set[randomInt(set.length)]).join('');
  return `${pick(letters, 4)}-${pick(digits, 4)}-${pick(letters, 4)}`;
}
