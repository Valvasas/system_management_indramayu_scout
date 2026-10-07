/**
 * SERVER-ONLY. Anonimisasi anggota nonaktif (hak subjek data, UU PDP Pasal 8 & 16).
 *
 * Yang DIHAPUS: nama, KTA, tanggal & bulan lahir (tahun disimpan untuk statistik golongan),
 * telepon, alamat, data wali, catatan, nama wali di riwayat persetujuan, dan akun portal
 * (dinonaktifkan, nama pengguna diganti, sesi/kode akses/MFA dihapus).
 * Yang DIPERTAHANKAN: baris anggota (golongan, gudep, status, tanggal bergabung), riwayat
 * mutasi, pendaftaran kegiatan, dan keputusan persetujuan (tanpa identitas wali) — sehingga
 * statistik dan integritas riwayat tetap utuh. Log audit tidak diubah (append-only); entri
 * lama yang menyebut nama terhapus oleh retensi log.
 */
import { randomBytes } from 'node:crypto';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { getDb, schema, type Database } from '@/db';
import { hashPassword } from '@/lib/auth/password';
import { memberScope } from '@/lib/auth/scope';
import type { SessionUser } from '@/lib/auth/session';

export type AnonymizeResult = { ok: true; label: string } | { ok: false; reason: 'tidak-ditemukan' | 'belum-nonaktif' | 'sudah' };

export const anonymousLabel = (memberId: string) => `Anggota dianonimkan #${memberId.slice(0, 8)}`;

export async function anonymizeMember(actor: SessionUser, memberId: string, now = new Date(), db?: Database): Promise<AnonymizeResult> {
  const d = db ?? (await getDb());
  if (!/^[0-9a-f-]{36}$/i.test(memberId)) return { ok: false, reason: 'tidak-ditemukan' };
  const [m] = await d
    .select({
      id: schema.members.id,
      status: schema.members.status,
      birthDate: schema.members.birthDate,
      anonymizedAt: schema.members.anonymizedAt,
    })
    .from(schema.members)
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .where(and(eq(schema.members.id, memberId), memberScope(actor)))
    .limit(1);
  if (!m) return { ok: false, reason: 'tidak-ditemukan' };
  if (m.anonymizedAt) return { ok: false, reason: 'sudah' };
  if (m.status !== 'ARCHIVED') return { ok: false, reason: 'belum-nonaktif' };

  const label = anonymousLabel(m.id);
  // Sandi acak yang tidak pernah diketahui siapa pun: akun tidak bisa dipakai masuk lagi.
  const unusable = await hashPassword(randomBytes(32).toString('base64url'));
  await d.transaction(async (tx) => {
    await tx
      .update(schema.members)
      .set({
        fullName: label,
        kta: null,
        birthDate: `${m.birthDate.slice(0, 4)}-01-01`,
        phone: null,
        address: null,
        guardianName: null,
        guardianPhone: null,
        guardianConsentAt: null,
        notes: null,
        reviewNote: null,
        anonymizedAt: now,
      })
      .where(eq(schema.members.id, m.id));
    await tx.update(schema.guardianConsents).set({ guardianName: null, ipHash: null }).where(eq(schema.guardianConsents.memberId, m.id));
    await tx
      .update(schema.guardianConsentRequests)
      .set({ cancelledAt: now })
      .where(
        and(
          eq(schema.guardianConsentRequests.memberId, m.id),
          isNull(schema.guardianConsentRequests.usedAt),
          isNull(schema.guardianConsentRequests.cancelledAt),
        ),
      );

    const accounts = await tx.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.memberId, m.id));
    const ids = accounts.map((a) => a.id);
    if (ids.length) {
      await tx.delete(schema.sessions).where(inArray(schema.sessions.userId, ids));
      await tx.delete(schema.accessCodes).where(inArray(schema.accessCodes.userId, ids));
      await tx.delete(schema.passwordResetRequests).where(inArray(schema.passwordResetRequests.userId, ids));
      await tx.delete(schema.mfaRecoveryCodes).where(inArray(schema.mfaRecoveryCodes.userId, ids));
      await tx.delete(schema.userMfa).where(inArray(schema.userMfa.userId, ids));
      for (const id of ids) {
        await tx
          .update(schema.users)
          .set({ username: `anon-${id.slice(0, 12)}`, name: 'Akun dianonimkan', email: null, passwordHash: unusable, active: false })
          .where(eq(schema.users.id, id));
      }
    }
  });
  return { ok: true, label };
}
