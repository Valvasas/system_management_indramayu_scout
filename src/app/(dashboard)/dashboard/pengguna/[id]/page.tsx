import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { Role } from '@/db/schema';
import { ResetPasswordForm, UserForm } from '@/components/dashboard/users/UserForm';
import { Panel, PortalHeader } from '@/components/dashboard/ui';
import { createUserAction, resetPasswordAction, updateUserAction } from '@/features/users/actions';
import { getUser } from '@/features/users/queries';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, assignableRoles } from '@/lib/auth/permissions';
import { requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Akun pengguna' };

/** `/dashboard/pengguna/baru` → buat akun; `/dashboard/pengguna/<id>` → ubah akun. */
export default async function AkunPenggunaPage({ params }: { params: { id: string } }) {
  const actor = await requirePermission('users.manage');
  const isNew = params.id === 'baru';
  const target = isNew ? null : await getUser(params.id);
  if (!isNew && (!target || target.role === 'PESERTA')) notFound();

  const db = await getDb();
  const [kwarrans, gudeps] = await Promise.all([
    db.select({ id: schema.kwarran.id, name: schema.kwarran.name }).from(schema.kwarran).orderBy(asc(schema.kwarran.name)),
    db
      .select({ id: schema.gudep.id, name: schema.gudep.name, kwarran: schema.kwarran.name })
      .from(schema.gudep)
      .innerJoin(schema.kwarran, eq(schema.kwarran.id, schema.gudep.kwarranId))
      .where(eq(schema.gudep.active, true))
      .orderBy(asc(schema.kwarran.name), asc(schema.gudep.name)),
  ]);

  const editable = assignableRoles(actor.role).filter((r) => r !== 'PESERTA');
  // Peran target saat ini tetap tampil walau tidak bisa diberikan aktor (mis. admin melihat akun admin lain).
  const roleList: Role[] = target && !(editable as Role[]).includes(target.role) ? [target.role, ...editable] : editable;
  const locked = !!target && target.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN';

  return (
    <>
      <PortalHeader
        title={isNew ? 'Buat akun staf' : target!.name}
        description={
          isNew
            ? 'Untuk pengurus Kwarcab, admin website, staf Kwarran, atau pembina/staf gudep.'
            : `${ROLE_LABELS[target!.role]} · ${target!.username}`
        }
        back={{ href: '/dashboard/pengguna', label: 'Kembali ke daftar akun' }}
      />
      {locked ? (
        <Panel>
          <p className="text-text-secondary">Akun Super Admin hanya dapat diubah oleh Super Admin.</p>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UserForm
              action={isNew ? createUserAction : updateUserAction.bind(null, target!.id)}
              roles={roleList.map((r) => ({ value: r, label: ROLE_LABELS[r], description: ROLE_DESCRIPTIONS[r] }))}
              kwarranOptions={kwarrans.map((k) => ({ value: k.id, label: k.name }))}
              gudepOptions={gudeps.map((g) => ({ value: g.id, label: `${g.name} — ${g.kwarran}` }))}
              defaults={target ?? undefined}
              isNew={isNew}
              isSelf={target?.id === actor.id}
            />
          </div>
          {!isNew && target!.id !== actor.id && (
            <Panel title="Kata sandi">
              <ResetPasswordForm action={resetPasswordAction.bind(null, target!.id)} />
            </Panel>
          )}
        </div>
      )}
    </>
  );
}
