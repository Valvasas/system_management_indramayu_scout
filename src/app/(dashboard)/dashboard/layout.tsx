import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, count, eq, isNull } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { buildNav, type BadgeKey } from '@/components/dashboard/nav';
import { countOpenResetRequests } from '@/features/auth/access-codes';
import { countNewsInReview } from '@/features/content/queries';
import { transfersAwaitingDecision } from '@/features/members/transfers';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import { memberScope } from '@/lib/auth/scope';
import { can, requireUser, type SessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

async function scopeLabel(user: SessionUser): Promise<string | null> {
  const db = await getDb();
  if (user.role === 'STAFF_KWARRAN' && user.kwarranId) {
    const [k] = await db.select({ name: schema.kwarran.name }).from(schema.kwarran).where(eq(schema.kwarran.id, user.kwarranId));
    return k ? `Kwarran ${k.name}` : null;
  }
  if ((user.role === 'STAFF_GUDEP' || user.role === 'PESERTA') && user.gudepId) {
    const [g] = await db.select({ name: schema.gudep.name }).from(schema.gudep).where(eq(schema.gudep.id, user.gudepId));
    return g?.name ?? null;
  }
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN_KWARCAB') return 'Seluruh Kabupaten';
  return null;
}

async function badges(user: SessionUser) {
  const db = await getDb();
  const out: Partial<Record<BadgeKey, number>> = {};
  if (can(user, 'members.read')) {
    // Verifikator melihat antrean verifikasi; pengisi melihat data yang dikembalikan untuk diperbaiki.
    const status = can(user, 'members.verify') ? 'PENDING' : 'NEEDS_FIX';
    const [r] = await db
      .select({ n: count() })
      .from(schema.members)
      .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
      .where(and(memberScope(user), eq(schema.members.status, status)));
    out.pendingMembers = r.n;
  }
  if (can(user, 'messages.read')) {
    const [r] = await db.select({ n: count() }).from(schema.contactMessages).where(isNull(schema.contactMessages.readAt));
    out.unreadMessages = r.n;
  }
  if (can(user, 'members.verify')) out.pendingTransfers = (await transfersAwaitingDecision(user)).length;
  if (can(user, 'users.manage') || can(user, 'users.create_peserta')) out.resetRequests = await countOpenResetRequests(user);
  if (can(user, 'content.manage')) out.reviewNews = await countNewsInReview();
  return out;
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // Sandi sementara wajib diganti sebelum memakai fitur lain.
  if (user.mustChangePassword && headers().get('x-pathname') !== '/dashboard/akun') redirect('/dashboard/akun');

  const [label, counts] = await Promise.all([scopeLabel(user), badges(user)]);
  const nav = buildNav(user.role === 'PESERTA', (p) => can(user, p), counts);

  return (
    <DashboardShell
      user={{ name: user.name, roleLabel: ROLE_LABELS[user.role], scopeLabel: label }}
      portalLabel={user.role === 'PESERTA' ? 'Portal Peserta' : 'Portal Pengurus'}
      nav={nav}
    >
      {children}
    </DashboardShell>
  );
}
