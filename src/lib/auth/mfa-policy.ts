/**
 * Kebijakan MFA (murni, tanpa I/O — diuji di tests/unit/mfa.test.ts).
 * Wajib untuk Super Admin dan setiap peran yang memegang izin pengelolaan akun, konten,
 * atau log audit. Peran lain (termasuk peserta) boleh mendaftar sukarela, tidak diwajibkan.
 */
import type { Role } from '@/db/schema';
import { roleCan, type Permission } from './permissions';

const MFA_PERMISSIONS: readonly Permission[] = ['users.manage', 'content.manage', 'audit.view'];

export function requiresMfa(role: Role): boolean {
  return role === 'SUPER_ADMIN' || MFA_PERMISSIONS.some((p) => roleCan(role, p));
}

export type MfaState =
  | { kind: 'not-required' }
  | { kind: 'enrolled' }
  | { kind: 'grace'; daysLeft: number; endsAt: Date }
  /** Masa tenggang habis: portal terkunci sampai TOTP didaftarkan. */
  | { kind: 'expired' };

export function mfaState(input: { role: Role; enrolled: boolean; graceStartedAt: Date | null; graceDays: number; now: Date }): MfaState {
  if (input.enrolled) return { kind: 'enrolled' };
  if (!requiresMfa(input.role)) return { kind: 'not-required' };
  const start = input.graceStartedAt ?? input.now;
  const endsAt = new Date(start.getTime() + input.graceDays * 86_400_000);
  if (input.now >= endsAt) return { kind: 'expired' };
  return { kind: 'grace', daysLeft: Math.ceil((endsAt.getTime() - input.now.getTime()) / 86_400_000), endsAt };
}

/** Reset MFA akun lain: hanya pemegang `users.reset_mfa` (Super Admin), tidak untuk diri sendiri. */
export function canResetMfa(actor: { id: string; role: Role }, target: { id: string }): boolean {
  return roleCan(actor.role, 'users.reset_mfa') && actor.id !== target.id;
}

/** Jumlah kode pemulihan per pendaftaran. */
export const RECOVERY_CODE_COUNT = 10;
/** Masa berlaku sesi "sandi benar, menunggu kode MFA". */
export const MFA_PENDING_MINUTES = 10;
