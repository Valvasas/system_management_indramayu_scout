import bcrypt from 'bcryptjs';

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
