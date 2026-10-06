import type { Role } from '@/db/schema';
import type { SessionUser } from '@/lib/auth/session';

/** Pengguna sesi tiruan untuk tes cakupan/izin (tanpa cookie). */
export function actor(role: Role, over: Partial<SessionUser> = {}): SessionUser {
  return {
    id: over.id ?? crypto.randomUUID(),
    username: `${role.toLowerCase()}.uji`,
    name: `Uji ${role}`,
    role,
    kwarranId: null,
    gudepId: null,
    memberId: null,
    mustChangePassword: false,
    mfa: { kind: 'not-required' },
    ...over,
  };
}
