'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import { roleEnum, type Role } from '@/db/schema';
import { audit } from '@/lib/auth/audit';
import { accessCodeMessage, canManageAccess, issueAccessCode, unusablePasswordHash } from '@/features/auth/access-codes';
import { ROLE_LABELS, assignableRoles } from '@/lib/auth/permissions';
import { destroyUserSessions, requirePermission, type SessionUser } from '@/lib/auth/session';
import { checkbox, fail, ok, optionalText, parseForm, requiredText, type FormState } from '@/lib/forms';
import { getUser } from './queries';

const optionalUuid = z.union([z.string(), z.undefined()]).transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null));

const UserSchema = z
  .object({
    name: requiredText('Nama', 120),
    username: z
      .string()
      .transform((s) => s.trim().toLowerCase())
      .pipe(z.string().regex(/^[a-z0-9._-]{3,40}$/, '3–40 karakter: huruf kecil, angka, titik, garis bawah, atau tanda hubung.')),
    email: optionalText(254).pipe(z.union([z.null(), z.string().email('Format pos-el tidak valid.')])),
    role: z.enum(roleEnum.enumValues, { errorMap: () => ({ message: 'Peran wajib dipilih.' }) }),
    kwarranId: optionalUuid,
    gudepId: optionalUuid,
    active: checkbox,
  })
  .superRefine((v, ctx) => {
    if (v.role === 'STAFF_KWARRAN' && !v.kwarranId)
      ctx.addIssue({ code: 'custom', path: ['kwarranId'], message: 'Pilih kwarran yang dikelola.' });
    if (v.role === 'STAFF_GUDEP' && !v.gudepId) ctx.addIssue({ code: 'custom', path: ['gudepId'], message: 'Pilih gudep yang dikelola.' });
    if (v.role === 'PESERTA') ctx.addIssue({ code: 'custom', path: ['role'], message: 'Akun peserta dibuat dari halaman detail anggota.' });
  });

/** Bersihkan penugasan yang tidak relevan dengan peran (mis. staf kwarran tidak butuh gudepId). */
function scopeFor(role: Role, kwarranId: string | null, gudepId: string | null) {
  return {
    kwarranId: role === 'STAFF_KWARRAN' ? kwarranId : null,
    gudepId: role === 'STAFF_GUDEP' ? gudepId : null,
  };
}

function guardRole(actor: SessionUser, role: Role): string | null {
  return assignableRoles(actor.role).includes(role) ? null : `Anda tidak berwenang memberikan peran ${ROLE_LABELS[role]}.`;
}

async function usernameTaken(username: string, excludeId?: string) {
  const db = await getDb();
  const [row] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.username, username)).limit(1);
  return !!row && row.id !== excludeId;
}

export async function createUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission('users.manage');
  const parsed = parseForm(UserSchema, formData);
  if (parsed.error) return parsed.error;
  const v = parsed.data;
  const roleProblem = guardRole(actor, v.role);
  if (roleProblem) return fail(roleProblem, { role: roleProblem });
  if (await usernameTaken(v.username)) return fail('Nama pengguna sudah dipakai.', { username: 'Pilih nama pengguna lain.' });

  const db = await getDb();
  const [created] = await db
    .insert(schema.users)
    .values({
      name: v.name,
      username: v.username,
      email: v.email,
      role: v.role,
      ...scopeFor(v.role, v.kwarranId, v.gudepId),
      // Sandi acak yang tidak diketahui siapa pun: pemilik membuat sandinya sendiri dengan kode aktivasi.
      passwordHash: await unusablePasswordHash(),
      mustChangePassword: false,
      active: true,
    })
    .returning({ id: schema.users.id });

  await audit(actor, {
    action: 'user.create',
    summary: `Membuat akun ${v.username} (${ROLE_LABELS[v.role]})`,
    entityType: 'user',
    entityId: created.id,
  });
  const { code, expiresAt } = await issueAccessCode(actor, { id: created.id, username: v.username }, 'ACTIVATION');
  revalidatePath('/dashboard/pengguna');
  return ok(accessCodeMessage(v.username, code, expiresAt, 'ACTIVATION'));
}

export async function updateUserAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission('users.manage');
  const target = await getUser(id);
  if (!target) return fail('Akun tidak ditemukan.');
  if (target.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') return fail('Hanya Super Admin yang dapat mengubah akun Super Admin.');
  if (target.role === 'PESERTA') return fail('Akun peserta dikelola dari halaman detail anggota.');

  const parsed = parseForm(UserSchema, formData);
  if (parsed.error) return parsed.error;
  const v = parsed.data;
  if (v.role !== target.role) {
    const roleProblem = guardRole(actor, v.role);
    if (roleProblem) return fail(roleProblem, { role: roleProblem });
  }
  if (target.id === actor.id && (!v.active || v.role !== target.role)) {
    return fail('Anda tidak dapat menonaktifkan atau mengubah peran akun Anda sendiri.');
  }
  if (await usernameTaken(v.username, id)) return fail('Nama pengguna sudah dipakai.', { username: 'Pilih nama pengguna lain.' });

  const db = await getDb();
  await db
    .update(schema.users)
    .set({
      name: v.name,
      username: v.username,
      email: v.email,
      role: v.role,
      active: v.active,
      ...scopeFor(v.role, v.kwarranId, v.gudepId),
    })
    .where(eq(schema.users.id, id));
  // Perubahan peran/penugasan/nonaktif berlaku segera: paksa masuk ulang.
  if (!v.active || v.role !== target.role || v.kwarranId !== target.kwarranId || v.gudepId !== target.gudepId) {
    await destroyUserSessions(id);
  }

  const changes = [
    v.role !== target.role && `peran ${ROLE_LABELS[target.role]} → ${ROLE_LABELS[v.role]}`,
    v.active !== target.active && (v.active ? 'mengaktifkan' : 'menonaktifkan'),
  ].filter(Boolean);
  await audit(actor, {
    action: 'user.update',
    summary: `Mengubah akun ${v.username}${changes.length ? `: ${changes.join(', ')}` : ''}`,
    entityType: 'user',
    entityId: id,
  });
  revalidatePath('/dashboard/pengguna');
  redirect('/dashboard/pengguna?tersimpan=1');
}

/**
 * "Reset" akun staf = menerbitkan kode reset sekali pakai. Pengelola tidak pernah melihat
 * atau menentukan kata sandi orang lain (V5 §10); sandi lama tetap berlaku sampai kode dipakai.
 */
export async function resetPasswordAction(id: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  const actor = await requirePermission('users.manage');
  const target = await getUser(id);
  if (!target) return fail('Akun tidak ditemukan.');
  if (target.id === actor.id) return fail('Untuk akun Anda sendiri, gunakan menu Akun Saya → Ganti kata sandi.');
  if (!(await canManageAccess(actor, target))) return fail('Hanya Super Admin yang dapat mengelola akses akun Super Admin.');
  const { code, expiresAt } = await issueAccessCode(actor, target, 'RESET');
  return ok(accessCodeMessage(target.username, code, expiresAt, 'RESET'));
}

/** Kode reset untuk akun peserta, oleh staf yang berwenang atas anggotanya. */
export async function resetPesertaPasswordAction(memberId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  const actor = await requirePermission('users.create_peserta');
  const { getMember } = await import('@/features/members/queries');
  const member = await getMember(actor, memberId);
  if (!member?.portalUserId) return fail('Akun portal anggota tidak ditemukan.');
  if (member.m.status === 'ARCHIVED') return fail('Anggota diarsipkan; akunnya tidak dapat diaktifkan kembali.');
  const target = await getUser(member.portalUserId);
  if (!target) return fail('Akun portal anggota tidak ditemukan.');
  if (!target.active) {
    const db = await getDb();
    await db.update(schema.users).set({ active: true }).where(eq(schema.users.id, target.id));
  }
  const { code, expiresAt } = await issueAccessCode(actor, target, 'RESET');
  return ok(accessCodeMessage(target.username, code, expiresAt, 'RESET'));
}
