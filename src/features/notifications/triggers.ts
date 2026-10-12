/**
 * SERVER-ONLY. Pemicu notifikasi (2.1): siapa menerima kabar apa setelah aksi utama BERHASIL.
 *
 * - Dipanggil Server Action setelah penulisan utama + audit. Tidak pernah melempar: gagal
 *   mengirim notifikasi tidak boleh menggagalkan aksi (semua dibungkus `guarded`).
 * - Teks sengaja generik: TANPA nama anggota/anak, alasan mutasi, catatan pemohon, nama wali,
 *   atau pilihan persetujuan. Notifikasi tidak ikut dianonimkan (features/members/anonymize.ts),
 *   jadi tidak boleh memuat data pribadi sama sekali. Penerima membuka tautan internal, dan
 *   halaman itu menegakkan izin + cakupannya sendiri.
 * - Penerima ditentukan di server (izin + cakupan) lewat resolveRecipients() di notify.ts.
 */
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import { getDb, schema, type Database } from '@/db';
import type { Audience, Role, UserRow } from '@/db/schema';
import { roleCan } from '@/lib/auth/permissions';
import { formatDate } from '@/lib/format';
import { reportError } from '@/lib/monitoring';
import { notify, resolveRecipients } from './notify';

async function guarded(area: string, db: Database | undefined, fn: (d: Database) => Promise<number>): Promise<number> {
  try {
    return await fn(db ?? (await getDb()));
  } catch (err) {
    await reportError(err, { area: `notify.${area}` });
    return 0;
  }
}

async function rolesOf(d: Database, ids: string[]): Promise<{ id: string; role: Role }[]> {
  if (ids.length === 0) return [];
  return d.select({ id: schema.users.id, role: schema.users.role }).from(schema.users).where(inArray(schema.users.id, ids));
}

async function gudepNames(d: Database, ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await d.select({ id: schema.gudep.id, name: schema.gudep.name }).from(schema.gudep).where(inArray(schema.gudep.id, ids));
  return new Map(rows.map((r) => [r.id, r.name]));
}

/** Tanggal kalender WIB (UTC+7, tanpa DST) sebagai 'YYYY-MM-DD'. */
export function wibDay(d: Date): string {
  return new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Pengumuman                                                           */
/* ------------------------------------------------------------------ */

export function notifyAnnouncementCreated(
  input: { announcementId: string; title: string; audience: Audience; gudepId: string | null; actorId: string },
  db?: Database,
): Promise<number> {
  return guarded('announcement', db, (d) =>
    notify(
      {
        kind: 'ANNOUNCEMENT',
        title: `Pengumuman: ${input.title}`,
        body: 'Baca selengkapnya di ringkasan portal.',
        href: '/dashboard',
        // Aturan penerima sama dengan announcementsFor(): gudep lain tidak menerima.
        recipients: { announcement: { audience: input.audience, gudepId: input.gudepId } },
        excludeUserId: input.actorId,
        dedupeKey: `announcement:${input.announcementId}`,
      },
      d,
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Berita: review, dikembalikan, terbit                                 */
/* ------------------------------------------------------------------ */

export function notifyNewsSubmitted(input: { newsId: string; title: string; actorId: string }, db?: Database): Promise<number> {
  return guarded('news-review', db, (d) =>
    notify(
      {
        kind: 'NEWS_REVIEW',
        title: `Berita menunggu review: ${input.title}`,
        body: 'Kontributor mengirim berita ini untuk diperiksa. Terbitkan, atau kembalikan ke penulis dengan catatan.',
        href: `/dashboard/konten/berita/${input.newsId}`,
        recipients: { permission: 'content.manage' },
        excludeUserId: input.actorId,
      },
      d,
    ),
  );
}

/** Halaman tempat penulis menyunting beritanya: editor di CMS, kontributor di "Tulis berita". */
async function authorEditHref(d: Database, authorId: string, newsId: string): Promise<string> {
  const [author] = await rolesOf(d, [authorId]);
  return author && roleCan(author.role, 'content.manage') ? `/dashboard/konten/berita/${newsId}` : `/dashboard/kontribusi/${newsId}`;
}

export function notifyNewsReturned(
  input: { newsId: string; title: string; authorId: string | null; actorId: string },
  db?: Database,
): Promise<number> {
  return guarded('news-returned', db, async (d) => {
    if (!input.authorId) return 0;
    return notify(
      {
        kind: 'NEWS_RETURNED',
        title: `Berita perlu diperbaiki: ${input.title}`,
        body: 'Editor mengembalikan berita Anda beserta catatan. Perbaiki, lalu kirim ulang untuk review.',
        href: await authorEditHref(d, input.authorId, input.newsId),
        recipients: { userIds: [input.authorId] },
        excludeUserId: input.actorId,
      },
      d,
    );
  });
}

export function notifyNewsPublished(
  input: { newsId: string; title: string; slug: string; authorId: string | null; publishedAt: Date | null; actorId: string },
  db?: Database,
  now: Date = new Date(),
): Promise<number> {
  return guarded('news-published', db, async (d) => {
    if (!input.authorId) return 0;
    const live = !!input.publishedAt && input.publishedAt <= now;
    const [author] = await rolesOf(d, [input.authorId]);
    const href = live
      ? `/berita/${input.slug}`
      : author && roleCan(author.role, 'content.manage')
        ? `/dashboard/konten/berita/${input.newsId}`
        : '/dashboard/kontribusi';
    return notify(
      {
        kind: 'NEWS_PUBLISHED',
        title: `Berita Anda terbit: ${input.title}`,
        body: live
          ? 'Berita sudah tayang di situs publik. Terima kasih atas kontribusinya.'
          : `Berita dijadwalkan tayang ${formatDate(input.publishedAt!.toISOString())}.`,
        href,
        recipients: { userIds: [input.authorId] },
        excludeUserId: input.actorId,
        dedupeKey: `news-published:${input.newsId}`,
      },
      d,
    );
  });
}

/* ------------------------------------------------------------------ */
/* Mutasi anggota                                                       */
/* ------------------------------------------------------------------ */

/** Ke verifikator yang berwenang atas gudep TUJUAN. Alasan mutasi tidak pernah disertakan. */
export function notifyTransferRequested(
  input: { transferId: string; fromGudepId: string; toGudepId: string; actorId: string },
  db?: Database,
): Promise<number> {
  return guarded('transfer-requested', db, async (d) => {
    const names = await gudepNames(d, [input.fromGudepId, input.toGudepId]);
    return notify(
      {
        kind: 'TRANSFER_REQUESTED',
        title: `Pengajuan mutasi ke ${names.get(input.toGudepId) ?? 'gudep di wilayah Anda'}`,
        body: `Anggota dari ${names.get(input.fromGudepId) ?? 'gudep lain'} menunggu keputusan Anda.`,
        href: '/dashboard/mutasi',
        recipients: { permission: 'members.verify', gudepId: input.toGudepId },
        excludeUserId: input.actorId,
        dedupeKey: `transfer:${input.transferId}:requested`,
      },
      d,
    );
  });
}

/** Ke pengaju. Catatan keputusan (mis. alasan penolakan) tidak disertakan. */
export function notifyTransferDecided(
  input: {
    transferId: string;
    requestedById: string | null;
    approved: boolean;
    fromGudepId: string;
    toGudepId: string;
    actorId: string;
  },
  db?: Database,
): Promise<number> {
  return guarded('transfer-decided', db, async (d) => {
    if (!input.requestedById) return 0;
    const names = await gudepNames(d, [input.fromGudepId, input.toGudepId]);
    const route = `${names.get(input.fromGudepId) ?? 'Gudep asal'} → ${names.get(input.toGudepId) ?? 'gudep tujuan'}`;
    return notify(
      {
        kind: 'TRANSFER_DECIDED',
        title: input.approved ? 'Pengajuan mutasi disetujui' : 'Pengajuan mutasi ditolak',
        body: input.approved
          ? `${route}. Anggota kini tercatat di gudep tujuan.`
          : `${route}. Lihat keterangan keputusan di halaman mutasi.`,
        href: '/dashboard/mutasi',
        recipients: { userIds: [input.requestedById] },
        excludeUserId: input.actorId,
        dedupeKey: `transfer:${input.transferId}:decided`,
      },
      d,
    );
  });
}

/* ------------------------------------------------------------------ */
/* Permintaan atur ulang sandi (publik)                                 */
/* ------------------------------------------------------------------ */

/**
 * Pengguna yang berwenang menangani permintaan reset akun `target`, selaras canManageAccess():
 * - PESERTA → pemegang users.create_peserta yang cakupannya meliputi gudep anggotanya
 *   (tanpa gudep → pemegang users.manage);
 * - staf/admin → pemegang users.manage; akun Super Admin hanya oleh Super Admin lain.
 * Pemilik akun itu sendiri tidak pernah termasuk.
 */
export async function resetRequestRecipients(
  target: Pick<UserRow, 'id' | 'role' | 'memberId' | 'gudepId'>,
  db?: Database,
): Promise<string[]> {
  const d = db ?? (await getDb());
  let ids: string[];
  if (target.role === 'PESERTA') {
    let gudepId = target.gudepId;
    if (target.memberId) {
      const [m] = await d
        .select({ gudepId: schema.members.gudepId })
        .from(schema.members)
        .where(eq(schema.members.id, target.memberId))
        .limit(1);
      gudepId = m?.gudepId ?? gudepId;
    }
    ids = await resolveRecipients(gudepId ? { permission: 'users.create_peserta', gudepId } : { permission: 'users.manage' }, d);
  } else {
    ids = await resolveRecipients({ permission: 'users.manage' }, d);
    if (target.role === 'SUPER_ADMIN') {
      const roles = await rolesOf(d, ids);
      ids = roles.filter((r) => r.role === 'SUPER_ADMIN').map((r) => r.id);
    }
  }
  return ids.filter((id) => id !== target.id);
}

/**
 * Prioritas TINGGI (selalu terkirim). Catatan pemohon dari formulir publik dan nama pengguna
 * sengaja tidak disertakan: isinya tidak tepercaya, dan daftarnya bisa dilihat di /dashboard/akses.
 */
export function notifyAccessRequested(
  input: { requestId: string; target: Pick<UserRow, 'id' | 'role' | 'memberId' | 'gudepId'> },
  db?: Database,
): Promise<number> {
  return guarded('access-request', db, async (d) =>
    notify(
      {
        kind: 'ACCESS_REQUEST',
        priority: 'HIGH',
        title: 'Permintaan atur ulang kata sandi',
        body:
          input.target.role === 'PESERTA'
            ? 'Seorang peserta dalam kewenangan Anda meminta kode akses baru. Pastikan permintaannya benar sebelum menerbitkan kode.'
            : 'Seorang pengurus meminta kode akses baru. Pastikan permintaannya benar sebelum menerbitkan kode.',
        href: '/dashboard/akses',
        recipients: { userIds: await resetRequestRecipients(input.target, d) },
        dedupeKey: `access-request:${input.requestId}`,
      },
      d,
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Persetujuan wali                                                     */
/* ------------------------------------------------------------------ */

/**
 * Ke staf yang meminta kode + pemegang members.update dalam cakupan gudep anggota.
 * Nama wali, nama anak, dan pilihan persetujuan tidak disertakan.
 *
 * Peminta yang KINI di luar cakupan (mis. anggota sudah dimutasi, atau penugasannya berubah)
 * hanya menerima tanda terima umum: tanpa nama gudep dan tanpa tautan ke data anggota, supaya
 * notifikasi tidak membocorkan ke mana anak itu pindah.
 */
export function notifyConsentDecided(input: { memberId: string; requestId?: string }, db?: Database): Promise<number> {
  return guarded('consent', db, async (d) => {
    const [member] = await d
      .select({ gudepId: schema.members.gudepId, gudepName: schema.gudep.name })
      .from(schema.members)
      .innerJoin(schema.gudep, eq(schema.gudep.id, schema.members.gudepId))
      .where(eq(schema.members.id, input.memberId))
      .limit(1);
    if (!member) return 0;
    const r = schema.guardianConsentRequests;
    const [req] = await d
      .select({ id: r.id, requestedById: r.requestedById })
      .from(r)
      // requestId dari submitGuardianDecision = permintaan yang benar-benar diklaim. Tanpa itu
      // (pemanggil lama) jatuh ke kode terakhir yang terpakai — bisa salah bila dua kode terpakai serentak.
      .where(and(eq(r.memberId, input.memberId), isNotNull(r.usedAt), input.requestId ? eq(r.id, input.requestId) : undefined))
      .orderBy(desc(r.usedAt))
      .limit(1);
    const staff = await resolveRecipients({ permission: 'members.update', gudepId: member.gudepId }, d);
    const base = {
      kind: 'CONSENT_DECIDED' as const,
      title: 'Wali telah memberi keputusan persetujuan',
      dedupeKey: req ? `consent:${req.id}` : undefined,
    };
    const inScope = await notify(
      {
        ...base,
        body: `Untuk seorang anggota ${member.gudepName}. Lihat status terbarunya di data anggota.`,
        href: `/dashboard/anggota/${input.memberId}`,
        recipients: { userIds: staff },
      },
      d,
    );
    const requester = req?.requestedById && !staff.includes(req.requestedById) ? req.requestedById : null;
    if (!requester) return inScope;
    const receipt = await notify(
      {
        ...base,
        body: 'Kode persetujuan yang Anda buat sudah dipakai orang tua/wali. Rinciannya dapat dilihat pembina yang berwenang atas anggota tersebut.',
        href: '/dashboard/persetujuan',
        recipients: { userIds: [requester] },
      },
      d,
    );
    return inScope + receipt;
  });
}

/* ------------------------------------------------------------------ */
/* Pendaftaran kegiatan oleh peserta                                    */
/* ------------------------------------------------------------------ */

/**
 * Ke pengelola konten (penyelenggara agenda), prioritas RENDAH, paling banyak satu per kegiatan
 * per hari WIB (dedupe). Yang juga boleh membaca data anggota diarahkan ke daftar pendaftar;
 * admin website (tanpa members.read) ke editor agenda.
 */
export function notifyEventRegistration(
  input: { eventId: string; eventTitle: string },
  db?: Database,
  now: Date = new Date(),
): Promise<number> {
  return guarded('event-registration', db, async (d) => {
    const ids = await resolveRecipients({ permission: 'content.manage' }, d);
    const roles = await rolesOf(d, ids);
    const withList = roles.filter((r) => roleCan(r.role, 'members.read')).map((r) => r.id);
    const editorsOnly = roles.filter((r) => !roleCan(r.role, 'members.read')).map((r) => r.id);
    const base = {
      kind: 'EVENT_REGISTRATION' as const,
      priority: 'LOW' as const,
      title: `Pendaftar baru: ${input.eventTitle}`,
      body: 'Ada peserta yang mendaftar kegiatan ini hari ini. Kabar ini dikirim paling banyak sekali sehari per kegiatan.',
      dedupeKey: `event-registration:${input.eventId}:${wibDay(now)}`,
    };
    const a = await notify({ ...base, href: `/dashboard/pendaftaran/${input.eventId}`, recipients: { userIds: withList } }, d);
    const b = await notify({ ...base, href: `/dashboard/konten/agenda/${input.eventId}`, recipients: { userIds: editorsOnly } }, d);
    return a + b;
  });
}
