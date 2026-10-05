import { describe, expect, it } from 'vitest';
import { ROLE_LABELS, assignableRoles, roleCan } from '@/lib/auth/permissions';

describe('matriks izin', () => {
  it('peserta hanya punya akses portal pribadi', () => {
    expect(roleCan('PESERTA', 'self.portal')).toBe(true);
    for (const p of ['members.read', 'members.export', 'content.manage', 'users.manage', 'audit.view'] as const) {
      expect(roleCan('PESERTA', p), p).toBe(false);
    }
  });

  it('data sensitif & ekspor tidak dimiliki admin website', () => {
    expect(roleCan('ADMIN_WEBSITE', 'members.read')).toBe(false);
    expect(roleCan('ADMIN_WEBSITE', 'members.view_sensitive')).toBe(false);
    expect(roleCan('ADMIN_WEBSITE', 'content.manage')).toBe(true);
  });

  it('hanya staf kwarran ke atas yang memverifikasi anggota; staf gudep tidak', () => {
    expect(roleCan('STAFF_GUDEP', 'members.verify')).toBe(false);
    expect(roleCan('STAFF_KWARRAN', 'members.verify')).toBe(true);
    expect(roleCan('ADMIN_KWARCAB', 'members.verify')).toBe(true);
  });

  it('staf tidak mengelola konten situs maupun akun', () => {
    for (const role of ['STAFF_GUDEP', 'STAFF_KWARRAN'] as const) {
      expect(roleCan(role, 'content.manage')).toBe(false);
      expect(roleCan(role, 'users.manage')).toBe(false);
    }
  });

  it('semua peran punya label', () => {
    for (const role of ['SUPER_ADMIN', 'ADMIN_KWARCAB', 'ADMIN_WEBSITE', 'STAFF_KWARRAN', 'STAFF_GUDEP', 'PESERTA'] as const) {
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
  });
});

describe('pencegahan eskalasi hak', () => {
  it('admin kwarcab tidak boleh membuat super admin atau admin kwarcab lain', () => {
    const roles = assignableRoles('ADMIN_KWARCAB');
    expect(roles).not.toContain('SUPER_ADMIN');
    expect(roles).not.toContain('ADMIN_KWARCAB');
    expect(roles).toContain('STAFF_GUDEP');
  });

  it('peran lain tidak boleh memberi peran apa pun', () => {
    for (const role of ['ADMIN_WEBSITE', 'STAFF_KWARRAN', 'STAFF_GUDEP', 'PESERTA'] as const) {
      expect(assignableRoles(role)).toEqual([]);
    }
  });
});
