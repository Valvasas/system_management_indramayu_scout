'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema } from '@/db';
import type { SessionUser } from '@/lib/auth/session';
import { audit } from '@/lib/auth/audit';
import { canAccessGudep } from '@/lib/auth/scope';
import { can, requirePermission } from '@/lib/auth/session';
import { fail, optionalText, parseForm, requiredText, type FormState } from '@/lib/forms';
import { getMember } from './queries';
import { openTransferForMember } from './transfers';

const RequestSchema = z.object({
  toGudepId: z.string().uuid('Pilih gudep tujuan.'),
  reason: requiredText('Alasan mutasi', 500),
});

type TransferRow = typeof schema.memberTransfers.$inferSelect;

/** Terapkan mutasi: pindahkan anggota (dan akun portalnya) ke gudep tujuan. */
async function applyTransfer(actor: SessionUser, t: TransferRow, memberName: string, note: string | null) {
  const db = await getDb();
  await db.update(schema.members).set({ gudepId: t.toGudepId }).where(eq(schema.members.id, t.memberId));
  // Akun peserta ikut pindah cakupan, kalau tidak ia masih "melihat" gudep lama.
  await db.update(schema.users).set({ gudepId: t.toGudepId }).where(eq(schema.users.memberId, t.memberId));
  await db
    .update(schema.memberTransfers)
    .set({ status: 'APPROVED', decidedById: actor.id, decidedByName: actor.name, decidedAt: new Date(), decisionNote: note })
    .where(eq(schema.memberTransfers.id, t.id));
  await audit(actor, {
    action: 'member.transfer',
    summary: `Menyetujui mutasi ${memberName} ke gudep baru`,
    entityType: 'member',
    entityId: t.memberId,
  });
}

/** Diajukan oleh staf yang berwenang atas gudep ASAL. */
export async function requestTransferAction(memberId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission('members.update');
  const parsed = parseForm(RequestSchema, formData);
  if (parsed.error) return parsed.error;
  const { toGudepId, reason } = parsed.data;

  const row = await getMember(actor, memberId); // sudah dibatasi cakupan
  if (!row) return fail('Anggota tidak ditemukan atau di luar wilayah Anda.');
  if (row.m.status === 'ARCHIVED') return fail('Anggota diarsipkan tidak dapat dimutasi.');
  if (row.m.gudepId === toGudepId) return fail('Gudep tujuan sama dengan gudep saat ini.', { toGudepId: 'Pilih gudep lain.' });
  if (await openTransferForMember(memberId)) return fail('Masih ada pengajuan mutasi yang belum diputuskan untuk anggota ini.');

  const db = await getDb();
  const [dest] = await db
    .select({ id: schema.gudep.id, name: schema.gudep.name, active: schema.gudep.active })
    .from(schema.gudep)
    .where(eq(schema.gudep.id, toGudepId))
    .limit(1);
  if (!dest?.active) return fail('Gudep tujuan tidak ditemukan atau tidak aktif.', { toGudepId: 'Pilih gudep aktif.' });

  const [created] = await db
    .insert(schema.memberTransfers)
    .values({ memberId, fromGudepId: row.m.gudepId, toGudepId, reason, requestedById: actor.id, requestedByName: actor.name })
    .returning();
  await audit(actor, {
    action: 'member.transfer_request',
    summary: `Mengajukan mutasi ${row.m.fullName}: ${row.gudep.name} → ${dest.name}`,
    entityType: 'member',
    entityId: memberId,
  });

  // Bila pengaju juga berwenang memverifikasi di gudep tujuan (mis. staf kwarran untuk mutasi dalam
  // satu kecamatan), tidak perlu menunggu diri sendiri: langsung diterapkan & tercatat.
  if (can(actor, 'members.verify') && (await canAccessGudep(actor, toGudepId))) {
    await applyTransfer(actor, created, row.m.fullName, 'Disetujui langsung oleh pengaju yang berwenang atas kedua gudep.');
    revalidatePath(`/dashboard/anggota/${memberId}`);
    redirect(`/dashboard/anggota/${memberId}?tersimpan=mutasi`);
  }
  revalidatePath(`/dashboard/anggota/${memberId}`);
  revalidatePath('/dashboard/mutasi');
  redirect(`/dashboard/anggota/${memberId}?tersimpan=mutasi-diajukan`);
}

const DecisionSchema = z
  .object({
    decision: z.enum(['approve', 'reject'], { errorMap: () => ({ message: 'Pilih keputusan.' }) }),
    note: optionalText(500),
  })
  .superRefine((v, ctx) => {
    if (v.decision === 'reject' && !v.note) ctx.addIssue({ code: 'custom', path: ['note'], message: 'Tuliskan alasan penolakan.' });
  });

/** Diputuskan oleh pengurus yang berwenang memverifikasi di gudep TUJUAN. */
export async function decideTransferAction(transferId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission('members.verify');
  const parsed = parseForm(DecisionSchema, formData);
  if (parsed.error) return parsed.error;
  const db = await getDb();
  const [row] = await db
    .select({ t: schema.memberTransfers, memberName: schema.members.fullName, currentGudep: schema.members.gudepId })
    .from(schema.memberTransfers)
    .innerJoin(schema.members, eq(schema.members.id, schema.memberTransfers.memberId))
    .where(eq(schema.memberTransfers.id, transferId))
    .limit(1);
  if (!row || row.t.status !== 'REQUESTED') return fail('Pengajuan tidak ditemukan atau sudah diputuskan.');
  if (!(await canAccessGudep(actor, row.t.toGudepId))) return fail('Gudep tujuan di luar wilayah Anda.');

  if (parsed.data.decision === 'approve') {
    if (row.currentGudep !== row.t.fromGudepId)
      return fail('Data anggota sudah berubah sejak pengajuan dibuat. Tolak pengajuan ini dan minta pengajuan baru.');
    await applyTransfer(actor, row.t, row.memberName, parsed.data.note);
  } else {
    await db
      .update(schema.memberTransfers)
      .set({ status: 'REJECTED', decidedById: actor.id, decidedByName: actor.name, decidedAt: new Date(), decisionNote: parsed.data.note })
      .where(and(eq(schema.memberTransfers.id, transferId), eq(schema.memberTransfers.status, 'REQUESTED')));
    await audit(actor, {
      action: 'member.transfer_reject',
      summary: `Menolak mutasi ${row.memberName}`,
      entityType: 'member',
      entityId: row.t.memberId,
    });
  }
  revalidatePath('/dashboard/mutasi');
  redirect(`/dashboard/mutasi?keputusan=${parsed.data.decision === 'approve' ? 'setuju' : 'tolak'}`);
}

/** Dibatalkan oleh pihak gudep asal sebelum diputuskan. */
export async function cancelTransferAction(transferId: string): Promise<void> {
  const actor = await requirePermission('members.update');
  const db = await getDb();
  const [t] = await db.select().from(schema.memberTransfers).where(eq(schema.memberTransfers.id, transferId)).limit(1);
  if (t && t.status === 'REQUESTED' && (await canAccessGudep(actor, t.fromGudepId))) {
    await db
      .update(schema.memberTransfers)
      .set({ status: 'CANCELLED', decidedById: actor.id, decidedByName: actor.name, decidedAt: new Date() })
      .where(eq(schema.memberTransfers.id, transferId));
    await audit(actor, {
      action: 'member.transfer_cancel',
      summary: 'Membatalkan pengajuan mutasi',
      entityType: 'member',
      entityId: t.memberId,
    });
  }
  revalidatePath('/dashboard/mutasi');
  redirect(t ? `/dashboard/anggota/${t.memberId}?tersimpan=mutasi-batal` : '/dashboard/mutasi');
}
