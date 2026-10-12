/**
 * Demo masa jabatan (2.4) — FIKTIF. Pengurus demo inti (seed.ts) diberi masa jabatan: Sekretaris
 * berakhir dalam 21 hari (panel "Jabatan hampir berakhir" + pengingat), sisanya berjalan. Satu
 * pengurus periode lalu ditambahkan agar "Riwayat periode" berisi (tidak tampil di situs publik).
 * Akun staf demo diberi riwayat penugasan; penugasan Staf Kwarran berakhir dalam 25 hari.
 * Penugasan tidak mengubah wilayah/akses akun. Pengingat dijalankan sekali di akhir dengan kunci
 * dedupe yang sama seperti `scripts/term-reminders.ts`, jadi menjalankan skrip itu tidak menggandakan.
 */
import { eq } from 'drizzle-orm';
import { schema } from '../../src/db';
import { addDaysIso, wibToday } from '../../src/features/terms/dates';
import { sendTermReminders } from '../../src/features/terms/reminders';
import type { SeedContext } from './index';

type BoardTerm = { termStart: string; termEnd: string | null };

export async function seed(ctx: SeedContext): Promise<void> {
  const { db, users, gudep } = ctx;
  const now = new Date();
  const today = wibToday(now);
  const day = (n: number) => addDaysIso(today, n);

  const terms: Record<string, BoardTerm> = {
    'Kak Contoh Ketua': { termStart: day(-280), termEnd: day(1545) },
    'Kak Contoh Sekretaris': { termStart: day(-700), termEnd: day(21) },
    'Kak Contoh Ketua DKC': { termStart: day(-280), termEnd: day(800) },
  };
  for (const [name, term] of Object.entries(terms)) {
    await db
      .update(schema.boardMembers)
      .set({ ...term, isActive: true })
      .where(eq(schema.boardMembers.name, name));
  }
  await db.insert(schema.boardMembers).values({
    name: 'Kak Contoh Sekretaris Periode Lalu',
    position: 'Sekretaris',
    department: 'Pimpinan',
    period: '2021–2026',
    sortOrder: 2,
    termStart: day(-1900),
    termEnd: day(-60),
    isActive: true,
  });

  const createdById = users['admin']?.id ?? null;
  const kwarranStaff = users['kwarran.indramayu'];
  const pembina = users['gudep.smp1'];
  const pembinaGudep = gudep.find((g) => g.id === pembina?.gudepId);
  const formerGudep = gudep.find((g) => g.kwarranId === kwarranStaff?.kwarranId && g.id !== pembina?.gudepId);

  const rows: (typeof schema.staffAssignments.$inferInsert)[] = [];
  if (users['kwarcab']) {
    rows.push({
      userId: users['kwarcab'].id,
      role: 'ADMIN_KWARCAB',
      position: 'Wakil Ketua Bidang Organisasi',
      termStart: day(-280),
      termEnd: day(1545),
    });
  }
  if (users['humas']) {
    rows.push({
      userId: users['humas'].id,
      role: 'ADMIN_WEBSITE',
      position: 'Pengelola Situs Kwarcab',
      termStart: day(-200),
      termEnd: null,
    });
  }
  if (kwarranStaff) {
    rows.push({
      userId: kwarranStaff.id,
      role: 'STAFF_KWARRAN',
      position: 'Andalan Kwarran Urusan Data',
      kwarranId: kwarranStaff.kwarranId,
      termStart: day(-330),
      termEnd: day(25),
    });
    if (formerGudep) {
      rows.push({
        userId: kwarranStaff.id,
        role: 'STAFF_GUDEP',
        position: 'Pembina Gudep',
        kwarranId: formerGudep.kwarranId,
        gudepId: formerGudep.id,
        termStart: day(-1500),
        termEnd: day(-331),
        isActive: false,
      });
    }
  }
  if (pembina && pembinaGudep) {
    rows.push({
      userId: pembina.id,
      role: 'STAFF_GUDEP',
      position: 'Pembina Gudep',
      kwarranId: pembinaGudep.kwarranId,
      gudepId: pembinaGudep.id,
      termStart: day(-400),
      termEnd: day(700),
    });
  }
  if (rows.length) await db.insert(schema.staffAssignments).values(rows.map((r) => ({ ...r, createdById })));

  await sendTermReminders(now, db);
}
