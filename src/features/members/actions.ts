'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, like } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import type { MemberRow } from '@/db/schema';
import { audit } from '@/lib/auth/audit';
import { generateTemporaryPassword, hashPassword } from '@/lib/auth/password';
import { canAccessGudep } from '@/lib/auth/scope';
import { can, destroyUserSessions, requirePermission } from '@/lib/auth/session';
import { fail, ok, optionalText, parseForm, type FormState } from '@/lib/forms';
import { findDuplicates, getMember } from './queries';
import { MemberSchema, type MemberInput } from './validation';

const LABELS: Partial<Record<keyof MemberRow, string>> = {
  fullName: 'nama',
  gender: 'jenis kelamin',
  birthDate: 'tanggal lahir',
  golongan: 'golongan',
  gudepId: 'gudep',
  kta: 'KTA',
  phone: 'telepon',
  address: 'alamat',
  guardianName: 'nama wali',
  guardianPhone: 'telepon wali',
  guardianConsentAt: 'persetujuan wali',
  joinedAt: 'tanggal bergabung',
  notes: 'catatan',
};

function toRow(input: MemberInput) {
  const { confirmDuplicate: _c, ...row } = input;
  return row;
}

async function ktaTaken(kta: string | null, excludeId?: string) {
  if (!kta) return false;
  const db = await getDb();
  const [row] = await db.select({ id: schema.members.id }).from(schema.members).where(eq(schema.members.kta, kta)).limit(1);
  return !!row && row.id !== excludeId;
}

async function duplicateError(user: Awaited<ReturnType<typeof requirePermission>>, input: MemberInput, excludeId?: string) {
  if (input.confirmDuplicate) return null;
  const { visible, hiddenCount } = await findDuplicates(user, input.fullName, input.birthDate, excludeId);
  if (visible.length === 0 && hiddenCount === 0) return null;
  const where = [
    ...visible.map((d) => d.gudepName),
    ...(hiddenCount ? [`${hiddenCount} data di luar wilayah Anda`] : []),
  ].join(', ');
  return fail(
    `Kemungkinan data ganda: anggota dengan nama dan tanggal lahir yang sama sudah ada (${where}).\nBila memang orang yang berbeda, centang "Saya sudah memeriksa" lalu simpan lagi.`,
    { confirmDuplicate: 'Centang bila Anda yakin ini anggota yang berbeda.' },
  );
}

export async function createMemberAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('members.create');
  const parsed = parseForm(MemberSchema, formData);
  if (parsed.error) return parsed.error;
  const input = parsed.data;

  if (!(await canAccessGudep(user, input.gudepId))) return fail('Gudep di luar wilayah Anda.', { gudepId: 'Pilih gudep dalam wilayah Anda.' });
  if (await ktaTaken(input.kta)) return fail('Nomor KTA sudah dipakai anggota lain.', { kta: 'Nomor KTA sudah terdaftar.' });
  const dup = await duplicateError(user, input);
  if (dup) return dup;

  // Pengisi yang berwenang memverifikasi langsung mengaktifkan; selainnya menunggu verifikasi kwarran.
  const verifyNow = can(user, 'members.verify');
  const db = await getDb();
  const [created] = await db
    .insert(schema.members)
    .values({
      ...toRow(input),
      status: verifyNow ? 'ACTIVE' : 'PENDING',
      verifiedById: verifyNow ? user.id : null,
      verifiedAt: verifyNow ? new Date() : null,
      createdById: user.id,
    })
    .returning({ id: schema.members.id });

  await audit(user, {
    action: 'member.create',
    summary: `Menambah anggota ${input.fullName}${verifyNow ? ' (langsung aktif)' : ' (menunggu verifikasi)'}`,
    entityType: 'member',
    entityId: created.id,
  });
  revalidatePath('/dashboard/anggota');
  redirect(`/dashboard/anggota/${created.id}?tersimpan=baru`);
}

export async function updateMemberAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('members.update');
  const current = await getMember(user, id);
  if (!current) return fail('Data anggota tidak ditemukan atau di luar wilayah Anda.');
  if (current.m.status === 'ARCHIVED') return fail('Anggota yang diarsipkan tidak dapat diubah. Pulihkan dulu.');

  const parsed = parseForm(MemberSchema, formData);
  if (parsed.error) return parsed.error;
  const input = parsed.data;

  if (!(await canAccessGudep(user, input.gudepId))) return fail('Gudep di luar wilayah Anda.', { gudepId: 'Pilih gudep dalam wilayah Anda.' });
  if (await ktaTaken(input.kta, id)) return fail('Nomor KTA sudah dipakai anggota lain.', { kta: 'Nomor KTA sudah terdaftar.' });
  const identityChanged = input.fullName !== current.m.fullName || input.birthDate !== current.m.birthDate;
  if (identityChanged) {
    const dup = await duplicateError(user, input, id);
    if (dup) return dup;
  }

  const row = toRow(input);
  // Kolom yang tidak boleh dilihat pengubah tidak ikut terkirim di formulir: pertahankan nilai lama.
  if (!can(user, 'members.view_sensitive')) {
    row.phone = current.m.phone;
    row.address = current.m.address;
  }
  const changed = (Object.keys(LABELS) as (keyof typeof row)[]).filter(
    (k) => k in row && (row[k] ?? null) !== ((current.m as Record<string, unknown>)[k] ?? null),
  );
  if (changed.length === 0) return ok('Tidak ada perubahan.');

  // Perubahan oleh pengisi tanpa hak verifikasi dikirim ulang ke antrean verifikasi.
  const verifier = can(user, 'members.verify');
  const db = await getDb();
  await db
    .update(schema.members)
    .set({
      ...row,
      ...(verifier ? {} : { status: 'PENDING' as const, reviewNote: null }),
    })
    .where(eq(schema.members.id, id));
  // Akun portal peserta mengikuti gudep anggotanya (menentukan pengumuman yang ia terima).
  if (current.portalUserId && input.gudepId !== current.m.gudepId) {
    await db.update(schema.users).set({ gudepId: input.gudepId }).where(eq(schema.users.id, current.portalUserId));
  }

  await audit(user, {
    action: 'member.update',
    summary: `Mengubah ${changed.map((k) => LABELS[k]).join(', ')} — ${input.fullName}`,
    entityType: 'member',
    entityId: id,
  });
  revalidatePath('/dashboard/anggota');
  redirect(`/dashboard/anggota/${id}?tersimpan=ubah`);
}

const VerifySchema = z
  .object({
    decision: z.enum(['approve', 'return']),
    kta: optionalText(40),
    reviewNote: optionalText(500),
  })
  .superRefine((v, ctx) => {
    if (v.decision === 'return' && !v.reviewNote) {
      ctx.addIssue({ code: 'custom', path: ['reviewNote'], message: 'Tuliskan apa yang perlu diperbaiki.' });
    }
  });

export async function verifyMemberAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('members.verify');
  const current = await getMember(user, id);
  if (!current) return fail('Data anggota tidak ditemukan atau di luar wilayah Anda.');
  if (current.m.status !== 'PENDING' && current.m.status !== 'NEEDS_FIX') return fail('Data ini tidak sedang menunggu verifikasi.');

  const parsed = parseForm(VerifySchema, formData);
  if (parsed.error) return parsed.error;
  const { decision, kta, reviewNote } = parsed.data;
  const db = await getDb();

  if (decision === 'approve') {
    const newKta = kta ?? current.m.kta;
    if (await ktaTaken(newKta, id)) return fail('Nomor KTA sudah dipakai anggota lain.', { kta: 'Nomor KTA sudah terdaftar.' });
    await db
      .update(schema.members)
      .set({ status: 'ACTIVE', kta: newKta, reviewNote: null, verifiedById: user.id, verifiedAt: new Date() })
      .where(eq(schema.members.id, id));
    await audit(user, { action: 'member.verify', summary: `Menyetujui data ${current.m.fullName}`, entityType: 'member', entityId: id });
  } else {
    await db.update(schema.members).set({ status: 'NEEDS_FIX', reviewNote }).where(eq(schema.members.id, id));
    await audit(user, { action: 'member.return', summary: `Mengembalikan data ${current.m.fullName}: ${reviewNote}`, entityType: 'member', entityId: id });
  }
  revalidatePath('/dashboard/anggota');
  redirect(`/dashboard/anggota/${id}?tersimpan=${decision === 'approve' ? 'setuju' : 'kembali'}`);
}

const ArchiveSchema = z.object({ reason: z.string().trim().min(5, 'Tuliskan alasan (minimal 5 huruf).').max(300) });

export async function archiveMemberAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('members.archive');
  const current = await getMember(user, id);
  if (!current) return fail('Data anggota tidak ditemukan atau di luar wilayah Anda.');
  const parsed = parseForm(ArchiveSchema, formData);
  if (parsed.error) return parsed.error;

  const db = await getDb();
  await db
    .update(schema.members)
    .set({ status: 'ARCHIVED', notes: [current.m.notes, `Diarsipkan: ${parsed.data.reason}`].filter(Boolean).join('\n') })
    .where(eq(schema.members.id, id));
  // Akun portal milik anggota ikut dinonaktifkan.
  if (current.portalUserId) {
    await db.update(schema.users).set({ active: false }).where(eq(schema.users.id, current.portalUserId));
    await destroyUserSessions(current.portalUserId);
  }
  await audit(user, { action: 'member.archive', summary: `Mengarsipkan ${current.m.fullName}: ${parsed.data.reason}`, entityType: 'member', entityId: id });
  revalidatePath('/dashboard/anggota');
  redirect(`/dashboard/anggota/${id}?tersimpan=arsip`);
}

export async function restoreMemberAction(id: string): Promise<void> {
  const user = await requirePermission('members.archive');
  const current = await getMember(user, id);
  if (!current || current.m.status !== 'ARCHIVED') redirect(`/dashboard/anggota/${id}`);
  const db = await getDb();
  await db.update(schema.members).set({ status: 'PENDING' }).where(eq(schema.members.id, id));
  await audit(user, { action: 'member.restore', summary: `Memulihkan ${current.m.fullName} dari arsip`, entityType: 'member', entityId: id });
  revalidatePath('/dashboard/anggota');
  redirect(`/dashboard/anggota/${id}?tersimpan=pulih`);
}

/** Nama pengguna portal dari nama anggota, mis. "dimas.saputra", unik dengan akhiran angka bila perlu. */
async function uniqueUsername(fullName: string): Promise<string> {
  const base =
    fullName
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join('.') || 'peserta';
  const db = await getDb();
  const taken = new Set(
    (await db.select({ u: schema.users.username }).from(schema.users).where(like(schema.users.username, `${base}%`))).map((r) => r.u),
  );
  if (!taken.has(base)) return base;
  for (let i = 2; i < 1000; i++) if (!taken.has(`${base}${i}`)) return `${base}${i}`;
  return `${base}.${Date.now()}`;
}

export async function createPortalAccountAction(id: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  const user = await requirePermission('users.create_peserta');
  const current = await getMember(user, id);
  if (!current) return fail('Data anggota tidak ditemukan atau di luar wilayah Anda.');
  if (current.m.status !== 'ACTIVE') return fail('Akun portal hanya untuk anggota berstatus Aktif (sudah diverifikasi).');
  if (current.portalUserId) return fail('Anggota ini sudah memiliki akun portal.');

  const username = await uniqueUsername(current.m.fullName);
  const password = generateTemporaryPassword();
  const db = await getDb();
  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(and(eq(schema.users.memberId, id))).limit(1);
  if (existing) return fail('Anggota ini sudah memiliki akun portal.');

  const [created] = await db
    .insert(schema.users)
    .values({
      username,
      name: current.m.fullName,
      role: 'PESERTA',
      memberId: id,
      gudepId: current.m.gudepId,
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
    })
    .returning({ id: schema.users.id });

  await audit(user, { action: 'user.create', summary: `Membuat akun portal peserta untuk ${current.m.fullName}`, entityType: 'user', entityId: created.id });
  revalidatePath(`/dashboard/anggota/${id}`);
  return ok(
    `Akun portal dibuat. Berikan kepada anggota (atau orang tua/wali) secara langsung — sandi ini hanya tampil sekali:\nNama pengguna: ${username}\nKata sandi sementara: ${password}`,
  );
}
