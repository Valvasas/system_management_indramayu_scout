/**
 * SERVER-ONLY. Presensi kegiatan (2.2).
 *
 * Mencatat Hadir / Izin / Alpa untuk anggota yang TERDAFTAR di sebuah kegiatan. Tiga syarat, semuanya
 * ditegakkan di sini (bukan hanya di UI) agar tidak bisa dilewati lewat Server Action/route lain:
 *   1. peran memegang izin `attendance.record`;
 *   2. anggota berada dalam `memberScope` pencatat (staf gudep = gudepnya, staf kwarran = kecamatannya);
 *   3. anggota memang terdaftar di kegiatan itu.
 * Gagal syarat 2 atau 3 → "tidak-ditemukan" (tidak dibedakan dari id yang tidak ada: tanpa kebocoran IDOR).
 *
 * Satu baris per (kegiatan, anggota) — dicatat ulang = diperbarui (upsert) + pencatat & waktunya.
 * Catatan presensi tidak pernah masuk log audit, ringkasan, notifikasi, maupun CSV.
 */
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, schema, type Database } from '@/db';
import type { AttendanceStatus } from '@/db/schema';
import { appendAuditEntry } from '@/lib/auth/audit-chain';
import { roleCan } from '@/lib/auth/permissions';
import { memberScope } from '@/lib/auth/scope';
import type { SessionUser } from '@/lib/auth/session';
import { toCsv } from '@/lib/csv';
import { golonganLabel } from '@/lib/domain';
import { optionalText, parseForm } from '@/lib/forms';
import { ATTENDANCE_LABELS, ATTENDANCE_NOTE_MAX, ATTENDANCE_STATUSES, attendanceLabel, recapOf } from './labels';

export interface AttendanceOptions {
  db?: Database;
  now?: Date;
  /** IP pencatat untuk log audit (diisi pembungkus Server Action/route). */
  ip?: string | null;
}

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/**
 * Isian formulir presensi (Zod, di server). `note` menerima null/undefined (kolom kosong / tidak dikirim):
 * nilai yang sudah dinormalisasi `parseForm` (catatan kosong → null) divalidasi ulang di `recordAttendance`
 * dan tidak boleh ditolak di sana.
 */
const FormSchema = z.object({
  status: z.enum(ATTENDANCE_STATUSES, { errorMap: () => ({ message: 'Pilih status kehadiran: Hadir, Izin, atau Alpa.' }) }),
  note: z.preprocess((v) => (v === null ? undefined : v), optionalText(ATTENDANCE_NOTE_MAX)),
});

const RecordSchema = FormSchema.extend({
  eventId: z.string().uuid('Kegiatan tidak valid.'),
  memberId: z.string().uuid('Anggota tidak valid.'),
});

export type RecordInput = { eventId: string; memberId: string; status: unknown; note?: unknown };

export type RecordFailure = 'tidak-diizinkan' | 'tidak-valid' | 'tidak-ditemukan' | 'dibatalkan' | 'belum-dimulai';

export type RecordResult =
  | { ok: true; changed: boolean; status: AttendanceStatus; previous: AttendanceStatus | null; memberName: string }
  | { ok: false; reason: RecordFailure; errors?: Record<string, string> };

const DAY_MS = 86_400_000;
const WIB_OFFSET_MS = 7 * 3_600_000;

/** Presensi dibuka mulai pukul 00.00 WIB pada hari kegiatan dimulai (sebelum itu belum ada yang bisa dicatat). */
export function attendanceOpensAt(dateStart: Date): Date {
  return new Date(Math.floor((dateStart.getTime() + WIB_OFFSET_MS) / DAY_MS) * DAY_MS - WIB_OFFSET_MS);
}

/** "YYYY-MM-DD HH:MM" dalam WIB — deterministik untuk CSV. */
export function wibDateTime(d: Date): string {
  return new Date(d.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 16).replace('T', ' ');
}

type EventState = { published: boolean; cancelled: boolean; dateStart: Date };

function recordingBlock(event: EventState, now: Date): 'dibatalkan' | 'belum-dimulai' | null {
  if (event.cancelled) return 'dibatalkan';
  if (now < attendanceOpensAt(event.dateStart)) return 'belum-dimulai';
  return null;
}

async function writeAudit(
  d: Database,
  actor: SessionUser,
  ip: string | null,
  entry: { action: string; summary: string; entityType: string; entityId: string },
) {
  try {
    await appendAuditEntry(d, { userId: actor.id, actorName: actor.name, ip, ...entry, summary: entry.summary.slice(0, 500) });
  } catch (err) {
    // Sama dengan audit(): kegagalan mencatat tidak membatalkan aksi utama.
    console.error('[audit] gagal mencatat', entry.action, err);
  }
}

/* ------------------------------------------------------------------ */
/* Mencatat                                                             */
/* ------------------------------------------------------------------ */

export async function recordAttendance(actor: SessionUser, input: RecordInput, opts: AttendanceOptions = {}): Promise<RecordResult> {
  if (!roleCan(actor.role, 'attendance.record')) return { ok: false, reason: 'tidak-diizinkan' };
  const parsed = RecordSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? '_')] ??= issue.message;
    return { ok: false, reason: 'tidak-valid', errors };
  }
  const { eventId, memberId, status, note } = parsed.data;
  const d = opts.db ?? (await getDb());
  const now = opts.now ?? new Date();
  const a = schema.eventAttendance;

  // Satu kueri: pendaftaran ∩ cakupan pencatat. Tidak terdaftar / di luar cakupan → tidak ada baris.
  const [row] = await d
    .select({
      memberName: schema.members.fullName,
      eventTitle: schema.events.title,
      published: schema.events.published,
      cancelled: schema.events.cancelled,
      dateStart: schema.events.dateStart,
      prevStatus: a.status,
      prevNote: a.note,
    })
    .from(schema.eventRegistrations)
    .innerJoin(schema.events, eq(schema.events.id, schema.eventRegistrations.eventId))
    .innerJoin(schema.members, eq(schema.members.id, schema.eventRegistrations.memberId))
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .leftJoin(a, and(eq(a.eventId, schema.eventRegistrations.eventId), eq(a.memberId, schema.eventRegistrations.memberId)))
    .where(
      and(
        eq(schema.eventRegistrations.eventId, eventId),
        eq(schema.eventRegistrations.memberId, memberId),
        // Data anggota yang sudah dianonimkan tidak boleh mendapat catatan baru.
        isNull(schema.members.anonymizedAt),
        memberScope(actor),
      ),
    )
    .limit(1);
  if (!row || !row.published) return { ok: false, reason: 'tidak-ditemukan' };
  const blocked = recordingBlock(row, now);
  if (blocked) return { ok: false, reason: blocked };

  const previous = row.prevStatus ?? null;
  const changed = previous !== status || (row.prevNote ?? null) !== note;
  if (!changed) return { ok: true, changed: false, status, previous, memberName: row.memberName };

  const values = { status, note, recordedById: actor.id, recordedByName: actor.name, recordedAt: now };
  await d
    .insert(a)
    .values({ eventId, memberId, ...values })
    .onConflictDoUpdate({ target: [a.eventId, a.memberId], set: values });

  await writeAudit(d, actor, opts.ip ?? null, {
    action: previous ? 'attendance.update' : 'attendance.record',
    // Tanpa nama anggota & tanpa catatan: cukup id entitas.
    summary: `Presensi "${row.eventTitle}": ${ATTENDANCE_LABELS[status]}${previous && previous !== status ? ` (sebelumnya ${ATTENDANCE_LABELS[previous]})` : ''}`,
    entityType: 'member',
    entityId: memberId,
  });
  return { ok: true, changed: true, status, previous, memberName: row.memberName };
}

/**
 * Jalur formulir yang dipakai Server Action (bisa diuji tanpa konteks request Next): FormData divalidasi
 * `parseForm`, lalu `recordAttendance` menegakkan izin, cakupan, dan pendaftaran. `eventId`/`memberId`
 * berasal dari argumen terikat Server Action dan divalidasi ulang di sana.
 */
export async function recordAttendanceForm(
  actor: SessionUser,
  eventId: string,
  memberId: string,
  formData: FormData,
  opts: AttendanceOptions = {},
): Promise<RecordResult> {
  if (!roleCan(actor.role, 'attendance.record')) return { ok: false, reason: 'tidak-diizinkan' };
  const parsed = parseForm(FormSchema, formData);
  if (parsed.error) return { ok: false, reason: 'tidak-valid', errors: parsed.error.errors };
  return recordAttendance(actor, { eventId, memberId, ...parsed.data }, opts);
}

/* ------------------------------------------------------------------ */
/* Membaca (staf)                                                       */
/* ------------------------------------------------------------------ */

async function publishedEvent(d: Database, eventId: string) {
  if (!isUuid(eventId)) return null;
  const [event] = await d.select().from(schema.events).where(eq(schema.events.id, eventId)).limit(1);
  return event && event.published ? event : null;
}

/** Pendaftar dalam cakupan + presensinya (kiri: yang belum dicatat tetap muncul). Kolom non-sensitif saja. */
async function scopedSheetRows(d: Database, actor: SessionUser, eventId: string) {
  const a = schema.eventAttendance;
  return d
    .select({
      memberId: schema.members.id,
      fullName: schema.members.fullName,
      kta: schema.members.kta,
      golongan: schema.members.golongan,
      gudepName: schema.gudep.name,
      kwarranName: schema.kwarran.name,
      registeredAt: schema.eventRegistrations.createdAt,
      anonymizedAt: schema.members.anonymizedAt,
      status: a.status,
      note: a.note,
      recordedByName: a.recordedByName,
      recordedAt: a.recordedAt,
    })
    .from(schema.eventRegistrations)
    .innerJoin(schema.members, eq(schema.members.id, schema.eventRegistrations.memberId))
    .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
    .innerJoin(schema.kwarran, eq(schema.kwarran.id, schema.gudep.kwarranId))
    .leftJoin(a, and(eq(a.eventId, schema.eventRegistrations.eventId), eq(a.memberId, schema.eventRegistrations.memberId)))
    .where(and(eq(schema.eventRegistrations.eventId, eventId), memberScope(actor)))
    .orderBy(asc(schema.kwarran.name), asc(schema.gudep.name), asc(schema.members.fullName));
}

export type SheetRow = Awaited<ReturnType<typeof scopedSheetRows>>[number];

/**
 * Lembar presensi untuk halaman pendaftar: hanya pendaftar dalam cakupan pengguna.
 * null bila tanpa izin `members.read`, id tidak valid, atau kegiatan tidak tayang.
 */
export async function attendanceSheet(actor: SessionUser, eventId: string, opts: AttendanceOptions = {}) {
  if (!roleCan(actor.role, 'members.read')) return null;
  const d = opts.db ?? (await getDb());
  const event = await publishedEvent(d, eventId);
  if (!event) return null;
  const mayRecord = roleCan(actor.role, 'attendance.record');
  // Catatan presensi hanya untuk pemegang izin pencatat; baris anonim tidak bisa dicatat lagi.
  const rows = (await scopedSheetRows(d, actor, event.id)).map(({ anonymizedAt, ...r }) => ({
    ...r,
    note: mayRecord ? r.note : null,
    recordable: anonymizedAt === null,
  }));
  const blocked = recordingBlock(event, opts.now ?? new Date());
  return {
    event,
    rows,
    recap: recapOf(rows),
    /** Boleh menampilkan tombol presensi (izin + kegiatan sudah dimulai & tidak batal). */
    canRecord: mayRecord && blocked === null,
    blocked,
    opensAt: attendanceOpensAt(event.dateStart),
  };
}

/* ------------------------------------------------------------------ */
/* Ekspor CSV                                                           */
/* ------------------------------------------------------------------ */

export const ATTENDANCE_CSV_HEADER = [
  'Nama Lengkap',
  'No KTA',
  'Golongan',
  'Gudep',
  'Status Kehadiran',
  'Dicatat Oleh',
  'Waktu Dicatat (WIB)',
];

/** Baris CSV presensi — tanpa catatan dan tanpa kolom sensitif (kontak, alamat, wali). */
export function attendanceCsvRows(rows: readonly SheetRow[]): string[][] {
  return rows.map((r) => [
    r.fullName,
    r.kta ?? '',
    golonganLabel(r.golongan),
    r.gudepName,
    attendanceLabel(r.status),
    r.recordedByName ?? '',
    r.recordedAt ? wibDateTime(r.recordedAt) : '',
  ]);
}

/**
 * CSV presensi satu kegiatan, dibatasi cakupan. Syarat: `attendance.record` + `members.export`.
 * Setiap unduhan tercatat di log audit. null = tidak diizinkan / tidak ditemukan (route menjawab 404).
 */
export async function exportAttendanceCsv(actor: SessionUser, eventId: string, opts: AttendanceOptions = {}) {
  if (!roleCan(actor.role, 'attendance.record') || !roleCan(actor.role, 'members.export')) return null;
  const d = opts.db ?? (await getDb());
  const event = await publishedEvent(d, eventId);
  if (!event) return null;
  const rows = await scopedSheetRows(d, actor, event.id);
  const csv = toCsv(ATTENDANCE_CSV_HEADER, attendanceCsvRows(rows));
  await writeAudit(d, actor, opts.ip ?? null, {
    action: 'attendance.export',
    summary: `Mengekspor presensi ${rows.length} pendaftar "${event.title}"`,
    entityType: 'event',
    entityId: event.id,
  });
  return { csv, count: rows.length, filename: `presensi-${event.slug}.csv` };
}

/* ------------------------------------------------------------------ */
/* Portal peserta                                                       */
/* ------------------------------------------------------------------ */

/**
 * Riwayat kehadiran milik peserta yang sedang masuk — HANYA lewat `actor.memberId` (tidak menerima id dari
 * luar). Tanpa catatan & nama pencatat. Akun selain PESERTA → daftar kosong. Sama dengan lembar staf,
 * hanya kegiatan yang masih terdaftar atas namanya (pendaftaran yang dibatalkan tidak ikut).
 */
export async function ownAttendanceHistory(actor: SessionUser, opts: AttendanceOptions & { limit?: number } = {}) {
  if (!roleCan(actor.role, 'self.portal') || !actor.memberId) return [];
  const d = opts.db ?? (await getDb());
  const a = schema.eventAttendance;
  return d
    .select({
      eventId: schema.events.id,
      title: schema.events.title,
      dateStart: schema.events.dateStart,
      location: schema.events.location,
      status: a.status,
    })
    .from(a)
    .innerJoin(schema.events, eq(schema.events.id, a.eventId))
    .innerJoin(
      schema.eventRegistrations,
      and(eq(schema.eventRegistrations.eventId, a.eventId), eq(schema.eventRegistrations.memberId, a.memberId)),
    )
    .where(and(eq(a.memberId, actor.memberId), eq(schema.events.published, true)))
    .orderBy(desc(schema.events.dateStart))
    .limit(opts.limit ?? 50);
}
