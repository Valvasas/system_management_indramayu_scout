/**
 * Skema database tunggal Rumah Pramuka Indramayu (PostgreSQL).
 * Semua data — wilayah, gudep, anggota, akun, konten publik — tersentral di sini.
 *
 * Mengubah skema: edit file ini → `npm run db:generate` → commit folder `drizzle/`
 * → `npm run db:migrate` di server. Jangan ubah tabel langsung di database.
 */
import { sql } from 'drizzle-orm';
import {
  bigserial,
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/* ------------------------------------------------------------------ */
/* Enum                                                                 */
/* ------------------------------------------------------------------ */

export const roleEnum = pgEnum('role', ['SUPER_ADMIN', 'ADMIN_KWARCAB', 'ADMIN_WEBSITE', 'STAFF_KWARRAN', 'STAFF_GUDEP', 'PESERTA']);

export const golonganEnum = pgEnum('golongan', ['SIAGA', 'PENGGALANG', 'PENEGAK', 'PANDEGA', 'DEWASA']);

export const genderEnum = pgEnum('gender', ['L', 'P']);

/** PENDING = menunggu verifikasi · NEEDS_FIX = dikembalikan untuk diperbaiki. */
export const memberStatusEnum = pgEnum('member_status', ['PENDING', 'ACTIVE', 'NEEDS_FIX', 'ARCHIVED']);

/** REVIEW = dikirim kontributor (staf gudep/kwarran) dan menunggu persetujuan editor Kwarcab. */
export const publishStatusEnum = pgEnum('publish_status', ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']);

/** ACTIVATION = akun baru; RESET = lupa kata sandi. Keduanya sekali pakai & kedaluwarsa. */
export const accessCodePurposeEnum = pgEnum('access_code_purpose', ['ACTIVATION', 'RESET']);

export const resetRequestStatusEnum = pgEnum('reset_request_status', ['OPEN', 'RESOLVED', 'DISMISSED']);

export const transferStatusEnum = pgEnum('transfer_status', ['REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED']);

export const audienceEnum = pgEnum('audience', ['ALL', 'PESERTA', 'STAFF']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ------------------------------------------------------------------ */
/* Organisasi                                                           */
/* ------------------------------------------------------------------ */

export const kwarran = pgTable('kwarran', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  code: text('code'),
  address: text('address'),
  leaderName: text('leader_name'),
  phone: text('phone'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  ...timestamps,
});

export const gudep = pgTable(
  'gudep',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kwarranId: uuid('kwarran_id')
      .notNull()
      .references(() => kwarran.id, { onDelete: 'restrict' }),
    /** Nomor gudep resmi, mis. "03.045-03.046". Boleh kosong saat baru didata. */
    number: text('number'),
    name: text('name').notNull(),
    /** Satuan pendidikan / komunitas pangkalan. */
    pangkalan: text('pangkalan'),
    /** SD/MI, SMP/MTs, SMA/SMK/MA, Perguruan Tinggi, Komunitas. */
    jenjang: text('jenjang'),
    address: text('address'),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    contactName: text('contact_name'),
    contactPhone: text('contact_phone'),
    active: boolean('active').notNull().default(true),
    ...timestamps,
  },
  (t) => [index('gudep_kwarran_idx').on(t.kwarranId), uniqueIndex('gudep_number_uq').on(t.number)],
);

/* ------------------------------------------------------------------ */
/* Anggota                                                              */
/* ------------------------------------------------------------------ */

export const members = pgTable(
  'members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Nomor Kartu Tanda Anggota. Diisi setelah terbit. */
    kta: text('kta'),
    fullName: text('full_name').notNull(),
    gender: genderEnum('gender').notNull(),
    birthDate: date('birth_date', { mode: 'string' }).notNull(),
    golongan: golonganEnum('golongan').notNull(),
    gudepId: uuid('gudep_id')
      .notNull()
      .references(() => gudep.id, { onDelete: 'restrict' }),
    status: memberStatusEnum('status').notNull().default('PENDING'),
    /* --- Sensitif / sangat sensitif: hanya peran berwenang (members.view_sensitive) --- */
    phone: text('phone'),
    address: text('address'),
    guardianName: text('guardian_name'),
    guardianPhone: text('guardian_phone'),
    /** Tanggal persetujuan orang tua/wali (wajib untuk anggota di bawah 18 tahun). */
    guardianConsentAt: date('guardian_consent_at', { mode: 'string' }),
    joinedAt: date('joined_at', { mode: 'string' }),
    notes: text('notes'),
    /** Alasan pengembalian saat status NEEDS_FIX. */
    reviewNote: text('review_note'),
    verifiedById: uuid('verified_by_id'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdById: uuid('created_by_id'),
    ...timestamps,
  },
  (t) => [
    index('members_gudep_idx').on(t.gudepId),
    index('members_status_idx').on(t.status),
    index('members_name_idx').on(t.fullName),
    uniqueIndex('members_kta_uq').on(t.kta),
  ],
);

/**
 * Mutasi anggota antar-gudep. Baris tidak pernah dihapus: sekaligus menjadi riwayat gudep anggota.
 * Diajukan staf gudep asal, disetujui pengurus yang berwenang atas gudep tujuan (V5 §9).
 */
export const memberTransfers = pgTable(
  'member_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    fromGudepId: uuid('from_gudep_id')
      .notNull()
      .references(() => gudep.id, { onDelete: 'restrict' }),
    toGudepId: uuid('to_gudep_id')
      .notNull()
      .references(() => gudep.id, { onDelete: 'restrict' }),
    reason: text('reason').notNull(),
    status: transferStatusEnum('status').notNull().default('REQUESTED'),
    requestedById: uuid('requested_by_id'),
    requestedByName: text('requested_by_name').notNull(),
    decidedById: uuid('decided_by_id'),
    decidedByName: text('decided_by_name'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    decisionNote: text('decision_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('transfers_member_idx').on(t.memberId), index('transfers_status_idx').on(t.status)],
);

/* ------------------------------------------------------------------ */
/* Akun, sesi, audit                                                    */
/* ------------------------------------------------------------------ */

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  email: text('email'),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  /** Cakupan: wajib untuk STAFF_KWARRAN. */
  kwarranId: uuid('kwarran_id').references(() => kwarran.id, { onDelete: 'set null' }),
  /** Cakupan: wajib untuk STAFF_GUDEP. */
  gudepId: uuid('gudep_id').references(() => gudep.id, { onDelete: 'set null' }),
  /** Profil anggota milik akun PESERTA. */
  memberId: uuid('member_id')
    .unique()
    .references(() => members.id, { onDelete: 'set null' }),
  active: boolean('active').notNull().default(true),
  mustChangePassword: boolean('must_change_password').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ...timestamps,
});

export const sessions = pgTable(
  'sessions',
  {
    /** SHA-256 dari token cookie. Token asli tidak pernah disimpan. */
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

/**
 * Kode akses sekali pakai untuk aktivasi akun & reset sandi. Yang disimpan hanya hash-nya;
 * pembina menyerahkan kode, pemilik akun sendiri yang membuat kata sandinya (V5 §10).
 */
export const accessCodes = pgTable(
  'access_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    codeHash: text('code_hash').notNull(),
    purpose: accessCodePurposeEnum('purpose').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdById: uuid('created_by_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('access_codes_user_idx').on(t.userId)],
);

/** Permintaan "lupa kata sandi" dari halaman masuk, diteruskan ke pembina/pengurus yang berwenang. */
export const passwordResetRequests = pgTable(
  'password_reset_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: resetRequestStatusEnum('status').notNull().default('OPEN'),
    /** Keterangan singkat dari peminta (mis. nama gudep). Tidak wajib. */
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedById: uuid('resolved_by_id'),
  },
  (t) => [index('reset_requests_status_idx').on(t.status, t.createdAt)],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
    userId: uuid('user_id'),
    /** Nama pelaku saat kejadian — tetap terbaca walau akun kemudian dihapus. */
    actorName: text('actor_name').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    summary: text('summary').notNull(),
    ip: text('ip'),
  },
  (t) => [index('audit_at_idx').on(t.at), index('audit_entity_idx').on(t.entityType, t.entityId)],
);

/* ------------------------------------------------------------------ */
/* Konten publik                                                        */
/* ------------------------------------------------------------------ */

export const news = pgTable(
  'news',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    category: text('category').notNull(),
    excerpt: text('excerpt').notNull().default(''),
    content: text('content').notNull().default(''),
    coverImage: text('cover_image'),
    author: text('author').notNull(),
    tags: text('tags')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    status: publishStatusEnum('status').notNull().default('DRAFT'),
    /** Catatan editor saat berita dikembalikan ke kontributor. */
    reviewNote: text('review_note'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdById: uuid('created_by_id'),
    ...timestamps,
  },
  (t) => [index('news_status_idx').on(t.status, t.publishedAt)],
);

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    dateStart: timestamp('date_start', { withTimezone: true }).notNull(),
    dateEnd: timestamp('date_end', { withTimezone: true }),
    location: text('location').notNull(),
    organizer: text('organizer').notNull(),
    description: text('description').notNull().default(''),
    contactPerson: text('contact_person'),
    published: boolean('published').notNull().default(false),
    cancelled: boolean('cancelled').notNull().default(false),
    /** Peserta dapat mendaftar lewat portal. */
    registrationOpen: boolean('registration_open').notNull().default(false),
    createdById: uuid('created_by_id'),
    ...timestamps,
  },
  (t) => [index('events_start_idx').on(t.dateStart)],
);

export const eventRegistrations = pgTable(
  'event_registrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('event_member_uq').on(t.eventId, t.memberId)],
);

export const albums = pgTable('albums', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  date: date('date', { mode: 'string' }).notNull(),
  location: text('location').notNull().default(''),
  organizer: text('organizer').notNull().default(''),
  category: text('category').notNull().default('Kegiatan'),
  description: text('description').notNull().default(''),
  published: boolean('published').notNull().default(false),
  ...timestamps,
});

export const photos = pgTable(
  'photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    albumId: uuid('album_id')
      .notNull()
      .references(() => albums.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    caption: text('caption').notNull().default(''),
    altText: text('alt_text').notNull().default(''),
    width: integer('width'),
    height: integer('height'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('photos_album_idx').on(t.albumId, t.sortOrder)],
);

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  fileUrl: text('file_url'),
  fileType: text('file_type').notNull().default('PDF'),
  fileSize: integer('file_size'),
  date: date('date', { mode: 'string' }).notNull(),
  published: boolean('published').notNull().default(false),
  ...timestamps,
});

export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  level: text('level').notNull(),
  year: integer('year').notNull(),
  recipient: text('recipient').notNull(),
  description: text('description').notNull().default(''),
  published: boolean('published').notNull().default(true),
  ...timestamps,
});

/** Pengurus Kwarcab yang tampil di halaman Struktur Organisasi. */
export const boardMembers = pgTable('board_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  position: text('position').notNull(),
  department: text('department').notNull(),
  period: text('period').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Komunikasi & pengaturan                                              */
/* ------------------------------------------------------------------ */

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  audience: audienceEnum('audience').notNull().default('ALL'),
  /** Kosong = untuk seluruh Kwarcab. Terisi = hanya anggota/staf gudep tersebut. */
  gudepId: uuid('gudep_id').references(() => gudep.id, { onDelete: 'cascade' }),
  createdById: uuid('created_by_id'),
  authorName: text('author_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  organization: text('organization'),
  message: text('message').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/* ------------------------------------------------------------------ */
/* Tipe turunan                                                         */
/* ------------------------------------------------------------------ */

export type Role = (typeof roleEnum.enumValues)[number];
export type Golongan = (typeof golonganEnum.enumValues)[number];
export type MemberStatus = (typeof memberStatusEnum.enumValues)[number];
export type PublishStatus = (typeof publishStatusEnum.enumValues)[number];
export type TransferStatus = (typeof transferStatusEnum.enumValues)[number];
export type Audience = (typeof audienceEnum.enumValues)[number];

export type KwarranRow = typeof kwarran.$inferSelect;
export type GudepRow = typeof gudep.$inferSelect;
export type MemberRow = typeof members.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type NewsRow = typeof news.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type AlbumRow = typeof albums.$inferSelect;
export type PhotoRow = typeof photos.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type AnnouncementRow = typeof announcements.$inferSelect;
