'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { consentScopeEnum } from '@/db/schema';
import { audit } from '@/lib/auth/audit';
import { requirePermission } from '@/lib/auth/session';
import { fail, ok, parseForm, type FormState } from '@/lib/forms';
import { formatDate } from '@/lib/format';
import { blindIndex } from '@/lib/security/crypto';
import { clientIp } from '@/lib/security/request';
import { createRateLimiter } from '@/lib/security/rate-limit';
import { absoluteUrl } from '@/lib/site';
import { issueConsentRequest, lookupConsentCode, recordStaffRevocation, submitGuardianDecision } from './consent';
import { CONSENT_SCOPE_LABELS } from './texts';

/* ------------------------------------------------------------------ */
/* Staf                                                                 */
/* ------------------------------------------------------------------ */

/** Buat kode persetujuan untuk wali. Kode tampil sekali di tempat (tidak di URL/log). */
export async function requestConsentAction(memberId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  const user = await requirePermission('members.update');
  const result = await issueConsentRequest(user, memberId);
  if (!result.ok) {
    return fail(
      result.reason === 'dewasa'
        ? 'Anggota berusia 18 tahun ke atas memberi persetujuan sendiri.'
        : 'Data anggota tidak ditemukan atau di luar wilayah Anda.',
    );
  }
  await audit(user, { action: 'consent.requested', summary: 'Membuat kode persetujuan wali', entityType: 'member', entityId: memberId });
  revalidatePath(`/dashboard/anggota/${memberId}`);
  return ok(
    `Kode persetujuan: ${result.code}\nBerikan kode ini kepada orang tua/wali bersama alamat ${absoluteUrl('/persetujuan-wali')}.\nBerlaku sampai ${formatDate(result.expiresAt.toISOString())}, sekali pakai. Kode lama (bila ada) tidak berlaku lagi.`,
  );
}

const RevokeSchema = z.object({
  scope: z.enum(consentScopeEnum.enumValues, { errorMap: () => ({ message: 'Pilih cakupan persetujuan.' }) }),
  note: z.string().trim().min(5, 'Tuliskan bagaimana wali meminta pencabutan (minimal 5 huruf).').max(300),
});

/** Catat pencabutan yang diminta wali lewat pembina. Tidak ada jalur untuk mencatat "setuju". */
export async function recordRevocationAction(memberId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('members.update');
  const parsed = parseForm(RevokeSchema, formData);
  if (parsed.error) return parsed.error;
  const member = await recordStaffRevocation(user, memberId, parsed.data.scope, parsed.data.note);
  if (!member) return fail('Data anggota tidak ditemukan atau di luar wilayah Anda.');
  await audit(user, {
    action: 'consent.revoked_by_staff',
    summary: `Mencatat pencabutan persetujuan wali (${CONSENT_SCOPE_LABELS[parsed.data.scope]})`,
    entityType: 'member',
    entityId: memberId,
  });
  revalidatePath(`/dashboard/anggota/${memberId}`);
  revalidatePath('/dashboard/persetujuan');
  return ok(`Pencabutan persetujuan ${CONSENT_SCOPE_LABELS[parsed.data.scope].toLowerCase()} tercatat.`);
}

/* ------------------------------------------------------------------ */
/* Publik: wali                                                         */
/* ------------------------------------------------------------------ */

// Fail-closed: kode adalah kredensial.
const codePerIp = createRateLimiter(10, 15 * 60_000, { scope: 'persetujuan-ip', failClosed: true });

export type GuardianState = FormState & { stage?: 'decide' | 'done'; code?: string; childFirstName?: string; gudepName?: string };

const GENERIC = 'Kode tidak dikenal, sudah dipakai, atau kedaluwarsa. Minta kode baru kepada pembina.';
const LookupSchema = z.object({ code: z.string().trim().min(1, 'Masukkan kode dari pembina.').max(20) });

export async function lookupConsentAction(_prev: GuardianState, formData: FormData): Promise<GuardianState> {
  const parsed = parseForm(LookupSchema, formData);
  if (parsed.error) return parsed.error;
  if (await codePerIp.limited(clientIp())) return fail('Terlalu banyak percobaan. Tunggu 15 menit, lalu coba lagi.');
  const found = await lookupConsentCode(parsed.data.code);
  if (!found) return fail(GENERIC, { code: 'Kode tidak cocok.' });
  return { status: 'idle', stage: 'decide', code: parsed.data.code, ...found };
}

const choice = z.enum(['ya', 'tidak'], { errorMap: () => ({ message: 'Pilih setuju atau tidak setuju.' }) });
const DecisionSchema = z.object({
  code: z.string().trim().min(1).max(20),
  guardianName: z.string().trim().min(3, 'Tulis nama lengkap Anda (minimal 3 huruf).').max(120),
  DATA: choice,
  PHOTO: choice,
  ACTIVITY: choice,
  confirm: z.literal('on', { errorMap: () => ({ message: 'Centang pernyataan ini untuk melanjutkan.' }) }),
});

export async function submitConsentAction(prev: GuardianState, formData: FormData): Promise<GuardianState> {
  const parsed = parseForm(DecisionSchema, formData);
  if (parsed.error) return { ...prev, ...parsed.error, stage: 'decide' };
  if (await codePerIp.limited(clientIp())) return { ...prev, ...fail('Terlalu banyak percobaan. Tunggu 15 menit, lalu coba lagi.') };
  const { code, guardianName, DATA, PHOTO, ACTIVITY } = parsed.data;
  const saved = await submitGuardianDecision({
    code,
    guardianName,
    decisions: { DATA: DATA === 'ya', PHOTO: PHOTO === 'ya', ACTIVITY: ACTIVITY === 'ya' },
    ipHash: blindIndex(clientIp(), 'persetujuan-ip'),
  });
  if (!saved) return fail(GENERIC);
  await audit(null, {
    action: 'consent.decided',
    summary: `Wali mencatat persetujuan (data: ${DATA}, foto: ${PHOTO}, kegiatan: ${ACTIVITY})`,
    entityType: 'member',
    entityId: saved.memberId,
  });
  revalidatePath('/dashboard/persetujuan');
  return {
    status: 'success',
    stage: 'done',
    message: `Terima kasih. Pilihan Anda untuk ${saved.childFirstName} sudah tercatat. Anda bisa mengubahnya kapan saja dengan meminta kode baru kepada pembina.`,
  };
}
