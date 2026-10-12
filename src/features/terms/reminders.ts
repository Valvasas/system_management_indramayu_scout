/**
 * SERVER-ONLY. Pengingat masa jabatan berakhir (2.4), dijalankan harian oleh
 * `scripts/term-reminders.ts`.
 *
 * - Pengurus Kwarcab yang berakhir dalam ≤ 30 hari → pemegang `content.manage`.
 * - Penugasan staf yang berakhir dalam ≤ 30 hari → pemegang `users.manage`.
 * Kunci dedupe `term:<tabel>:<id>:<tanggal berakhir>` membuat tiap pengingat terkirim sekali per
 * penerima; bila tanggal berakhir diubah, pengingat untuk tanggal baru dikirim lagi.
 * Isi hanya nama, jabatan, dan tanggal — tanpa data kontak atau catatan.
 */
import { and, asc, eq } from 'drizzle-orm';
import { getDb, schema, type Database } from '@/db';
import { notify } from '@/features/notifications/notify';
import { formatDate } from '@/lib/format';
import { endingBetweenWhere } from './conditions';
import { TERM_REMINDER_DAYS, addDaysIso, daysBetween, wibToday } from './dates';

export interface TermReminderReport {
  /** Jabatan/penugasan yang masuk jendela pengingat. */
  boardDue: number;
  staffDue: number;
  /** Notifikasi yang benar-benar tersimpan (0 bila semuanya sudah pernah dikirim). */
  sent: number;
}

const leftLabel = (today: string, termEnd: string) => {
  const n = daysBetween(today, termEnd);
  return n === 0 ? 'hari ini hari terakhir' : `${n} hari lagi`;
};

export async function sendTermReminders(now: Date = new Date(), db?: Database): Promise<TermReminderReport> {
  const d = db ?? (await getDb());
  const today = wibToday(now);
  const until = addDaysIso(today, TERM_REMINDER_DAYS);
  let sent = 0;

  const b = schema.boardMembers;
  const board = await d
    .select({ id: b.id, name: b.name, position: b.position, termEnd: b.termEnd })
    .from(b)
    .where(endingBetweenWhere(b, today, until))
    .orderBy(asc(b.termEnd));
  for (const m of board) {
    const termEnd = m.termEnd!;
    sent += await notify(
      {
        kind: 'TERM_ENDING',
        title: `Masa jabatan ${m.name} berakhir ${formatDate(termEnd)}`,
        body: `${m.position} · ${leftLabel(today, termEnd)}. Perbarui data pengurus bila ada pergantian.`,
        href: `/dashboard/konten/pengurus/${m.id}`,
        recipients: { permission: 'content.manage' },
        dedupeKey: `term:board_members:${m.id}:${termEnd}`,
      },
      d,
    );
  }

  const a = schema.staffAssignments;
  const staff = await d
    .select({ id: a.id, userId: a.userId, position: a.position, termEnd: a.termEnd, name: schema.users.name })
    .from(a)
    .innerJoin(schema.users, eq(schema.users.id, a.userId))
    // Akun yang sudah dinonaktifkan tidak perlu diingatkan.
    .where(and(endingBetweenWhere(a, today, until), eq(schema.users.active, true)))
    .orderBy(asc(a.termEnd));
  for (const s of staff) {
    const termEnd = s.termEnd!;
    sent += await notify(
      {
        kind: 'TERM_ENDING',
        title: `Penugasan ${s.name} berakhir ${formatDate(termEnd)}`,
        body: `${s.position} · ${leftLabel(today, termEnd)}. Penugasan tidak mengubah akses akun.`,
        href: `/dashboard/pengguna/${s.userId}`,
        recipients: { permission: 'users.manage' },
        dedupeKey: `term:staff_assignments:${s.id}:${termEnd}`,
      },
      d,
    );
  }

  return { boardDue: board.length, staffDue: staff.length, sent };
}
