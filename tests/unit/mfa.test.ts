import { describe, expect, it } from 'vitest';
import type { Role } from '@/db/schema';
import { canResetMfa, mfaState, requiresMfa } from '@/lib/auth/mfa-policy';
import { PERMISSIONS, roleCan, SUPER_ADMIN_ONLY } from '@/lib/auth/permissions';
import { MFA_LIMITS } from '@/features/auth/mfa';

const ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN_KWARCAB', 'ADMIN_WEBSITE', 'STAFF_KWARRAN', 'STAFF_GUDEP', 'PESERTA'];
const day = 86_400_000;

describe('kebijakan MFA (1.2)', () => {
  it('wajib untuk Super Admin dan pemegang users.manage / content.manage / audit.view; peserta tidak', () => {
    expect(ROLES.filter(requiresMfa)).toEqual(['SUPER_ADMIN', 'ADMIN_KWARCAB', 'ADMIN_WEBSITE']);
    for (const role of ROLES) {
      const holdsSensitive = ['users.manage', 'content.manage', 'audit.view'].some((p) => roleCan(role, p as never));
      expect(requiresMfa(role)).toBe(role === 'SUPER_ADMIN' || holdsSensitive);
    }
  });

  it('masa tenggang: dihitung dari awal tenggang, lalu terkunci', () => {
    const start = new Date('2026-10-01T00:00:00Z');
    const at = (d: number) => new Date(start.getTime() + d * day);
    const base = { role: 'ADMIN_WEBSITE' as Role, enrolled: false, graceStartedAt: start, graceDays: 7 };
    expect(mfaState({ ...base, now: at(1) })).toMatchObject({ kind: 'grace', daysLeft: 6 });
    expect(mfaState({ ...base, now: at(7) })).toEqual({ kind: 'expired' });
    expect(mfaState({ ...base, graceDays: 0, now: start })).toEqual({ kind: 'expired' });
    expect(mfaState({ ...base, enrolled: true, now: at(30) })).toEqual({ kind: 'enrolled' });
    expect(mfaState({ ...base, role: 'PESERTA', now: at(30) })).toEqual({ kind: 'not-required' });
    // Belum pernah masuk sejak diwajibkan: tenggang penuh dimulai sekarang.
    expect(mfaState({ ...base, graceStartedAt: null, now: at(100) })).toMatchObject({ kind: 'grace', daysLeft: 7 });
  });

  it('reset MFA: hanya Super Admin, tidak untuk diri sendiri (cegah eskalasi)', () => {
    const target = { id: 'target' };
    expect(canResetMfa({ id: 'sa', role: 'SUPER_ADMIN' }, target)).toBe(true);
    expect(canResetMfa({ id: 'target', role: 'SUPER_ADMIN' }, target)).toBe(false);
    for (const role of ROLES.filter((r) => r !== 'SUPER_ADMIN')) expect(canResetMfa({ id: 'x', role }, target)).toBe(false);
  });

  it('izin khusus Super Admin tidak dimiliki peran lain mana pun', () => {
    for (const p of SUPER_ADMIN_ONLY) {
      expect(PERMISSIONS).toContain(p);
      expect(ROLES.filter((r) => roleCan(r, p))).toEqual(['SUPER_ADMIN']);
    }
  });

  it('batas percobaan kode per akun tetap ketat (≤ 5 per 15 menit)', () => {
    expect(MFA_LIMITS.perAccount.max).toBeLessThanOrEqual(5);
    expect(MFA_LIMITS.perAccount.windowMs).toBeGreaterThanOrEqual(15 * 60_000);
  });
});
