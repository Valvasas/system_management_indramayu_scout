/**
 * Demo presensi (2.2) — FIKTIF. Jambore yang sudah lewat diberi pendaftar dari beberapa gudep
 * (termasuk peserta.dimas, agar "Riwayat kehadiran" di portal peserta berisi), lalu sebagian dicatat
 * Hadir/Izin/Alpa. Satu anggota gudep.smp1 sengaja "belum dicatat" untuk dicoba di portal / e2e.
 */
import { schema } from '../../src/db';
import type { AttendanceStatus } from '../../src/db/schema';
import type { SeedContext } from './index';

/** Gudep pembina demo: Hadir, Izin, … (anggota terakhir belum dicatat). Gudep lain: campuran ketiganya. */
const OWN_STATUSES: AttendanceStatus[] = ['PRESENT', 'EXCUSED'];
const OTHER_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'PRESENT', 'EXCUSED', 'PRESENT'];

export async function seed(ctx: SeedContext): Promise<void> {
  const { db, users, members, events } = ctx;
  const jambore = events.find((e) => e.slug === 'jambore-ranting-serentak');
  if (!jambore) return;

  const staffGudep = users['gudep.smp1'];
  const kwarcab = users['kwarcab'];
  const dimasId = users['peserta.dimas']?.memberId ?? null;

  // Gudep pembina demo lebih dulu (urut nama), lalu anggota aktif gudep lain; total ≤ 9 orang.
  const active = members.filter((m) => m.status === 'ACTIVE');
  const own = active.filter((m) => m.gudepId === staffGudep?.gudepId).sort((a, b) => a.fullName.localeCompare(b.fullName));
  const others = active.filter((m) => m.gudepId !== staffGudep?.gudepId).slice(0, 5);
  const dimas = dimasId ? members.find((m) => m.id === dimasId) : undefined;
  const chosen = [...new Map([...own, ...others, ...(dimas ? [dimas] : [])].map((m) => [m.id, m])).values()];
  if (!chosen.length) return;

  await db
    .insert(schema.eventRegistrations)
    .values(
      chosen.map((m) => ({ eventId: jambore.id, memberId: m.id, createdAt: new Date(jambore.dateStart.getTime() - 10 * 86_400_000) })),
    )
    .onConflictDoNothing();

  // Anggota terakhir gudep pembina dibiarkan belum dicatat; Dimas tercatat Hadir.
  const statusOf = (m: (typeof chosen)[number]): AttendanceStatus | null => {
    if (m.id === dimasId) return 'PRESENT';
    const j = own.indexOf(m);
    if (j >= 0) return j === own.length - 1 ? null : OWN_STATUSES[j % OWN_STATUSES.length];
    return OTHER_STATUSES[others.indexOf(m) % OTHER_STATUSES.length];
  };
  const rows = chosen.flatMap((m, i) => {
    const status = statusOf(m);
    if (!status) return [];
    const recorder = m.gudepId === staffGudep?.gudepId ? staffGudep : kwarcab;
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
