'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/session';
import { fail, ok, type FormState } from '@/lib/forms';
import { clientIp } from '@/lib/security/request';
import { recordAttendanceForm, type RecordFailure } from './attendance';
import { ATTENDANCE_LABELS } from './labels';

const FAILURES: Record<RecordFailure, string> = {
  'tidak-diizinkan': 'Anda tidak memiliki izin mencatat presensi.',
  'tidak-valid': 'Periksa kembali isian presensi.',
  'tidak-ditemukan': 'Pendaftar tidak ditemukan atau di luar wilayah Anda.',
  dibatalkan: 'Kegiatan ini dibatalkan, sehingga presensi tidak dapat dicatat.',
  'belum-dimulai': 'Presensi baru dapat dicatat mulai hari pelaksanaan kegiatan.',
};

/**
 * Catat presensi satu pendaftar. Formulir biasa (berfungsi tanpa JavaScript); tombol yang ditekan
 * mengirim `status`. Validasi Zod, izin, cakupan, dan status pendaftaran ditegakkan di `recordAttendanceForm`.
 */
export async function recordAttendanceAction(eventId: string, memberId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission('attendance.record');
  const result = await recordAttendanceForm(user, eventId, memberId, formData, { ip: clientIp() });
  if (!result.ok) return fail(FAILURES[result.reason], result.errors);
  revalidatePath(`/dashboard/pendaftaran/${eventId}`);
  return ok(
    result.changed
      ? `Presensi ${result.memberName}: ${ATTENDANCE_LABELS[result.status]} tersimpan.`
      : `Presensi ${result.memberName} sudah ${ATTENDANCE_LABELS[result.status]}.`,
  );
}
