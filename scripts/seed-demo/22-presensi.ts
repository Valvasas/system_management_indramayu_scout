/**
 * Demo presensi (2.2) — FIKTIF. "Jambore Ranting Serentak" (sudah lewat) diberi pendaftar: anggota aktif
 * gudep pembina demo (gudep.smp1), beberapa anggota aktif gudep lain, dan peserta.dimas (agar "Riwayat
 * kehadiran" di portal peserta berisi). Sebagian dicatat Hadir/Izin/Alpa; anggota terakhir gudep pembina
 * sengaja "belum dicatat" untuk dicoba di portal / e2e.
 */
import { schema } from '../../src/db';
import type { AttendanceStatus, MemberRow } from '../../src/db/schema';
import type { SeedContext } from './index';

const OWN_STATUSES: AttendanceStatus[] = ['PRESENT', 'EXCUSED', 'ABSENT'];
const OTHER_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'PRESENT', 'EXCUSED', 'PRESENT'];
const OTHERS_MAX = 5;

export async function seed(ctx: SeedContext): Promise<void> {
  const { db, users, members, events } = ctx;
  const jambore = events.find((e) => e.slug === 'jambore-ranting-serentak');
  if (!jambore) return;

  const pembina = users['gudep.smp1'];
  const kwarcab = users['kwarcab'];
  const dimasId = users['peserta.dimas']?.memberId ?? null;
  const dimas = dimasId ? members.find((m) => m.id === dimasId) : undefined;

  const active = members.filter((m) => m.status === 'ACTIVE' && !m.anonymizedAt && m.id !== dimasId);
  const own = active.filter((m) => m.gudepId === pembina?.gudepId).sort((a, b) => a.fullName.localeCompare(b.fullName));
  const others = active.filter((m) => m.gudepId !== pembina?.gudepId).slice(0, OTHERS_MAX);
  const chosen = [...own, ...others, ...(dimas ? [dimas] : [])];
  if (!chosen.length) return;

  await db
    .insert(schema.eventRegistrations)
    .values(
      chosen.map((m) => ({ eventId: jambore.id, memberId: m.id, createdAt: new Date(jambore.dateStart.getTime() - 10 * 86_400_000) })),
    )
    .onConflictDoNothing();

  const statusOf = (m: MemberRow): AttendanceStatus | null => {
    if (m.id === dimasId) return 'PRESENT';
    const j = own.indexOf(m);
    if (j >= 0) return j === own.length - 1 ? null : OWN_STATUSES[j % OWN_STATUSES.length];
    return OTHER_STATUSES[others.indexOf(m) % OTHER_STATUSES.length];
  };

  const rows = chosen.flatMap((m, i) => {
    const status = statusOf(m);
    if (!status) return [];
    const recorder = m.gudepId === pembina?.gudepId ? pembina : kwarcab;
    return [
      {
        eventId: jambore.id,
        memberId: m.id,
        status,
        note: status === 'EXCUSED' ? 'Izin mengikuti lomba tingkat sekolah (contoh).' : null,
        recordedById: recorder?.id ?? null,
        recordedByName: recorder?.name ?? 'Pembina (demo)',
        recordedAt: new Date(jambore.dateStart.getTime() + (2 + i) * 600_000),
      },
    ];
  });
  if (rows.length) await db.insert(schema.eventAttendance).values(rows).onConflictDoNothing();
}
