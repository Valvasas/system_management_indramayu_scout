/**
 * Demo notifikasi portal (2.1). Semua FIKTIF dan selaras dengan data demo inti (seed.ts):
 * pengumuman, pendaftar kegiatan, dan kabar sistem. Tanpa data pribadi anggota.
 */
import { schema } from '../../src/db';
import type { SeedContext } from './index';

type NewNotification = typeof schema.notifications.$inferInsert;

const wibDay = (d: Date) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);

export async function seed(ctx: SeedContext): Promise<void> {
  const { users, events, daysFromNow } = ctx;
  const rows: NewNotification[] = [];
  const add = (username: string, n: Omit<NewNotification, 'userId'>) => {
    const u = users[username];
    if (u) rows.push({ ...n, userId: u.id });
  };

  const staff = ['admin', 'kwarcab', 'humas', 'kwarran.indramayu', 'gudep.smp1'];
  for (const [i, username] of staff.entries()) {
    add(username, {
      kind: 'SYSTEM',
      title: 'Notifikasi portal kini tersedia',
      body: 'Kabar tugas Anda (review berita, mutasi, permintaan akses) muncul di sini. Atur jenis yang ingin diterima di bagian Preferensi.',
      href: '/dashboard/notifikasi#preferensi',
      createdAt: daysFromNow(-3, 8),
      readAt: i % 2 === 0 ? daysFromNow(-2, 9) : null,
    });
    add(username, {
      kind: 'ANNOUNCEMENT',
      title: 'Pengumuman: Pemutakhiran data anggota paling lambat akhir bulan',
      body: 'Baca selengkapnya di ringkasan portal.',
      href: '/dashboard',
      createdAt: daysFromNow(-1, 10),
    });
  }

  // Pendaftar demo (Dimas) pada Latihan Gabungan: satu kabar per hari per kegiatan.
  const latihan = events.find((e) => e.slug === 'latihan-gabungan-kwarran-indramayu');
  if (latihan) {
    const when = daysFromNow(-1, 11);
    for (const username of ['admin', 'kwarcab', 'humas']) {
      add(username, {
        kind: 'EVENT_REGISTRATION',
        priority: 'LOW',
        title: `Pendaftar baru: ${latihan.title}`,
        body: 'Ada peserta yang mendaftar kegiatan ini hari ini. Kabar ini dikirim paling banyak sekali sehari per kegiatan.',
        // Admin website tidak punya members.read: diarahkan ke editor agenda.
        href: username === 'humas' ? `/dashboard/konten/agenda/${latihan.id}` : `/dashboard/pendaftaran/${latihan.id}`,
        dedupeKey: `event-registration:${latihan.id}:${wibDay(when)}`,
        createdAt: when,
      });
    }
  }

  add('peserta.dimas', {
    kind: 'ANNOUNCEMENT',
    title: 'Pengumuman: Pendaftaran Perkemahan Bakti dibuka',
    body: 'Baca selengkapnya di ringkasan portal.',
    href: '/dashboard',
    createdAt: daysFromNow(-1, 9),
  });
  add('peserta.dimas', {
    kind: 'SYSTEM',
    title: 'Selamat datang di Portal Peserta',
    body: 'Di sini Anda menerima pengumuman gudep dan kabar kegiatan.',
    href: '/dashboard/kegiatan',
    createdAt: daysFromNow(-4, 8),
    readAt: daysFromNow(-4, 9),
  });

  if (rows.length) await ctx.db.insert(schema.notifications).values(rows).onConflictDoNothing();
}
