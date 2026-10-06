/**
 * Isi data awal.
 *
 *   npm run db:seed            → produksi: 31 Kwarran + akun Super Admin.
 *                                Wajib env ADMIN_USERNAME, ADMIN_NAME, ADMIN_PASSWORD.
 *   npm run db:seed -- --demo  → + data contoh FIKTIF (gudep, anggota, konten, akun demo).
 *                                Ditolak bila DATABASE_URL terisi, kecuali --force-demo.
 *
 * Aman dijalankan ulang: data yang sudah ada tidak diduplikasi.
 */
import { eq, sql } from 'drizzle-orm';
import { getDb, schema } from '../src/db';
import { hashPassword, passwordProblem } from '../src/lib/auth/password';

const args = new Set(process.argv.slice(2));
const DEMO = args.has('--demo');

/** 31 kecamatan Kabupaten Indramayu = 31 Kwartir Ranting. Kode & ketua diisi pengurus lewat portal. */
const KECAMATAN = [
  'Anjatan',
  'Arahan',
  'Balongan',
  'Bangodua',
  'Bongas',
  'Cantigi',
  'Cikedung',
  'Gabuswetan',
  'Gantar',
  'Haurgeulis',
  'Indramayu',
  'Jatibarang',
  'Juntinyuat',
  'Kandanghaur',
  'Karangampel',
  'Kedokan Bunder',
  'Kertasemaya',
  'Krangkeng',
  'Kroya',
  'Lelea',
  'Lohbener',
  'Losarang',
  'Pasekan',
  'Patrol',
  'Sindang',
  'Sliyeg',
  'Sukagumiwang',
  'Sukra',
  'Terisi',
  'Tukdana',
  'Widasari',
];

async function main() {
  const db = await getDb();

  // --- Kwarran ---
  await db
    .insert(schema.kwarran)
    .values(KECAMATAN.map((name) => ({ name })))
    .onConflictDoNothing({ target: schema.kwarran.name });
  console.log(`Kwarran: ${KECAMATAN.length} kecamatan dipastikan ada.`);

  // --- Super Admin ---
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (username && name && password) {
    const problem = passwordProblem(password);
    if (problem) throw new Error(`ADMIN_PASSWORD tidak memenuhi syarat: ${problem}`);
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    if (existing) {
      console.log(`Akun ${username} sudah ada — dilewati.`);
    } else {
      await db.insert(schema.users).values({
        username,
        name,
        role: 'SUPER_ADMIN',
        passwordHash: await hashPassword(password),
        mustChangePassword: true,
      });
      console.log(`Super Admin "${username}" dibuat. Wajib ganti sandi saat login pertama.`);
    }
  } else if (!DEMO) {
    console.log('Lewati Super Admin: isi ADMIN_USERNAME, ADMIN_NAME, ADMIN_PASSWORD untuk membuatnya.');
  }

  if (DEMO) {
    if (process.env.DATABASE_URL && !args.has('--force-demo')) {
      throw new Error('Menolak memasukkan data demo ke DATABASE_URL. Tambahkan --force-demo bila memang disengaja.');
    }
    await seedDemo();
  }
}

/* ------------------------------------------------------------------ */
/* Data demo — SEMUA FIKTIF                                             */
/* ------------------------------------------------------------------ */

const DEMO_PASSWORD = 'demo-pramuka-2026';

const daysFromNow = (d: number, hour = 8) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  t.setHours(hour, 0, 0, 0);
  return t;
};
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

async function seedDemo() {
  const db = await getDb();
  const [marker] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, 'demo_seeded'));
  if (marker) {
    console.log('Data demo sudah ada — dilewati.');
    return;
  }

  const kw = Object.fromEntries((await db.select().from(schema.kwarran)).map((k) => [k.name, k.id]));

  await db
    .update(schema.kwarran)
    .set({ code: '10.12.11', address: 'Jl. Contoh No. 1, Indramayu', leaderName: 'Kak Contoh Ketua', lat: -6.3275, lng: 108.3215 })
    .where(eq(schema.kwarran.id, kw['Indramayu']));

  const gudepSeed = [
    {
      kwarranId: kw['Indramayu'],
      number: '11.001-11.002',
      name: 'Gudep SMP Negeri Contoh 1',
      pangkalan: 'SMP Negeri Contoh 1 Indramayu',
      jenjang: 'SMP/MTs',
      address: 'Jl. Contoh Raya No. 5, Indramayu',
      lat: -6.3301,
      lng: 108.3253,
      contactName: 'Kak Rina Kartika',
      contactPhone: '0812-0000-0001',
    },
    {
      kwarranId: kw['Indramayu'],
      number: '11.003-11.004',
      name: 'Gudep SD Negeri Contoh 2',
      pangkalan: 'SD Negeri Contoh 2 Indramayu',
      jenjang: 'SD/MI',
      address: 'Jl. Contoh Tengah No. 12, Indramayu',
      lat: -6.3222,
      lng: 108.3301,
      contactName: 'Kak Budi Santoso',
      contactPhone: '0812-0000-0002',
    },
    {
      kwarranId: kw['Indramayu'],
      number: '11.005-11.006',
      name: 'Gudep SMA Negeri Contoh 1',
      pangkalan: 'SMA Negeri Contoh 1 Indramayu',
      jenjang: 'SMA/SMK/MA',
      address: 'Jl. Contoh Barat No. 3, Indramayu',
      lat: -6.3359,
      lng: 108.3178,
      contactName: 'Kak Andi Wijaya',
      contactPhone: '0812-0000-0003',
    },
    {
      kwarranId: kw['Sindang'],
      number: '12.001-12.002',
      name: 'Gudep SMK Contoh Sindang',
      pangkalan: 'SMK Contoh Sindang',
      jenjang: 'SMA/SMK/MA',
      address: 'Jl. Contoh Sindang No. 8',
      lat: -6.3149,
      lng: 108.2988,
      contactName: 'Kak Wulan Sari',
      contactPhone: '0812-0000-0004',
    },
    {
      kwarranId: kw['Jatibarang'],
      number: '13.001-13.002',
      name: 'Gudep MTs Contoh Jatibarang',
      pangkalan: 'MTs Contoh Jatibarang',
      jenjang: 'SMP/MTs',
      address: 'Jl. Contoh Jatibarang No. 20',
      lat: -6.4745,
      lng: 108.3118,
      contactName: 'Kak Hasan Basri',
      contactPhone: '0812-0000-0005',
    },
    {
      kwarranId: kw['Haurgeulis'],
      number: null,
      name: 'Gudep SD Contoh Haurgeulis',
      pangkalan: 'SD Negeri Contoh Haurgeulis',
      jenjang: 'SD/MI',
      address: 'Jl. Contoh Haurgeulis',
      lat: null,
      lng: null,
      contactName: null,
      contactPhone: null,
    },
  ];
  const gudepRows = await db.insert(schema.gudep).values(gudepSeed).returning();
  const gd = gudepRows.map((g) => g.id);

  const first = [
    'Aulia',
    'Bagas',
    'Citra',
    'Dimas',
    'Eka',
    'Fajar',
    'Gita',
    'Hana',
    'Irfan',
    'Jihan',
    'Kevin',
    'Laras',
    'Maulana',
    'Nadia',
    'Oki',
    'Putri',
    'Raka',
    'Salsa',
    'Tegar',
    'Umi',
    'Vina',
    'Wahyu',
    'Yusuf',
    'Zahra',
  ];
  const last = ['Saputra', 'Rahmawati', 'Lestari', 'Pratama', 'Anggraini', 'Nugroho', 'Permata', 'Wicaksono', 'Kusuma', 'Hidayat'];
  const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'PENDING', 'ACTIVE', 'NEEDS_FIX'] as const;
  const golonganByGudep = ['PENGGALANG', 'SIAGA', 'PENEGAK', 'PENEGAK', 'PENGGALANG', 'SIAGA'] as const;
  const birthYearByGolongan = { SIAGA: 2017, PENGGALANG: 2013, PENEGAK: 2009, PANDEGA: 2004, DEWASA: 1985 };

  const memberSeed = first.map((f, i) => {
    const g = i % 5;
    const golongan = golonganByGudep[g];
    const status = statuses[i % statuses.length];
    return {
      fullName: `${f} ${last[i % last.length]}`,
      gender: (i % 2 === 0 ? 'P' : 'L') as 'L' | 'P',
      birthDate: `${birthYearByGolongan[golongan] - (i % 2)}-0${(i % 9) + 1}-1${i % 9}`,
      golongan,
      gudepId: gd[g],
      status,
      kta: status === 'ACTIVE' ? `10.12.11.${String(1000 + i)}` : null,
      guardianName: `Orang Tua ${f}`,
      guardianPhone: `0813-0000-${String(1000 + i)}`,
      joinedAt: isoDate(daysFromNow(-200 + i)),
      reviewNote: status === 'NEEDS_FIX' ? 'Tanggal lahir tidak sesuai akta. Mohon periksa kembali.' : null,
    };
  });
  const memberRows = await db.insert(schema.members).values(memberSeed).returning();
  const dimas = memberRows.find((m) => m.fullName.startsWith('Dimas'))!;

  // Persetujuan wali FIKTIF: anggota aktif → disetujui wali lewat kode (sebagian menolak foto),
  // satu anggota hanya punya tanggal manual lama, anggota menunggu verifikasi → belum ada.
  const minors = memberRows.filter((m) => m.golongan !== 'DEWASA' && m.golongan !== 'PANDEGA');
  const decidedAt = daysFromNow(-45);
  const consentRows: (typeof schema.guardianConsents.$inferInsert)[] = [];
  for (const [i, m] of minors.entries()) {
    if (m.status !== 'ACTIVE') continue;
    if (i === 0) {
      consentRows.push({
        memberId: m.id,
        scope: 'DATA',
        granted: true,
        textVersion: 'manual-sebelum-2026-10',
        method: 'LEGACY_MANUAL',
        note: 'Tanggal persetujuan diketik staf sebelum alur kode wali (belum terverifikasi).',
        decidedAt,
      });
      continue;
    }
    const [req] = await db
      .insert(schema.guardianConsentRequests)
      .values({
        memberId: m.id,
        codeHash: `demo-${m.id}`,
        expiresAt: decidedAt,
        usedAt: decidedAt,
        requestedByName: 'Pembina Gudep (demo)',
      })
      .returning();
    for (const scope of ['DATA', 'PHOTO', 'ACTIVITY'] as const) {
      consentRows.push({
        memberId: m.id,
        requestId: req.id,
        scope,
        granted: !(scope === 'PHOTO' && i % 3 === 0),
        textVersion: '2026-10-v1',
        method: 'GUARDIAN_CODE',
        guardianName: `Orang Tua ${m.fullName.split(' ')[0]}`,
        decidedAt,
      });
    }
  }
  if (consentRows.length) await db.insert(schema.guardianConsents).values(consentRows);

  const pwd = await hashPassword(DEMO_PASSWORD);
  const demoUsers = [
    { username: 'admin', name: 'Admin Demo', role: 'SUPER_ADMIN' as const },
    { username: 'kwarcab', name: 'Hendra Gunawan', role: 'ADMIN_KWARCAB' as const },
    { username: 'humas', name: 'Humas Kwarcab', role: 'ADMIN_WEBSITE' as const },
    { username: 'kwarran.indramayu', name: 'Sri Wahyuni', role: 'STAFF_KWARRAN' as const, kwarranId: kw['Indramayu'] },
    { username: 'gudep.smp1', name: 'Rina Kartika', role: 'STAFF_GUDEP' as const, gudepId: gd[0] },
    { username: 'peserta.dimas', name: dimas.fullName, role: 'PESERTA' as const, memberId: dimas.id },
  ];
  await db
    .insert(schema.users)
    .values(demoUsers.map((u) => ({ ...u, passwordHash: pwd, mustChangePassword: false })))
    .onConflictDoNothing({ target: schema.users.username });

  const eventRows = await db
    .insert(schema.events)
    .values([
      {
        slug: 'perkemahan-bakti-penggalang',
        title: 'Perkemahan Bakti Penggalang',
        dateStart: daysFromNow(14),
        dateEnd: daysFromNow(16, 15),
        location: 'Bumi Perkemahan Contoh',
        organizer: 'Kwarcab Indramayu',
        description: 'Perkemahan tiga hari untuk Pramuka Penggalang se-Kabupaten Indramayu: pionering, penjelajahan, dan bakti lingkungan.',
        contactPerson: 'Sekretariat Kwarcab',
        published: true,
        registrationOpen: true,
      },
      {
        slug: 'latihan-gabungan-kwarran-indramayu',
        title: 'Latihan Gabungan Kwarran Indramayu',
        dateStart: daysFromNow(22, 7),
        dateEnd: daysFromNow(22, 12),
        location: 'Lapangan Kecamatan Indramayu',
        organizer: 'Kwarran Indramayu',
        description: 'Latihan bersama antargudep di wilayah Kwarran Indramayu.',
        contactPerson: 'Staf Kwarran Indramayu',
        published: true,
        registrationOpen: true,
      },
      {
        slug: 'kursus-mahir-dasar',
        title: 'Kursus Pembina Mahir Dasar (KMD)',
        dateStart: daysFromNow(35),
        dateEnd: daysFromNow(41, 15),
        location: 'Pusdiklatcab Indramayu',
        organizer: 'Pusdiklatcab',
        description: 'Kursus wajib bagi calon pembina gugus depan.',
        contactPerson: 'Pusdiklatcab',
        published: true,
      },
      {
        slug: 'jambore-ranting-serentak',
        title: 'Jambore Ranting Serentak',
        dateStart: daysFromNow(-50),
        dateEnd: daysFromNow(-48, 15),
        location: 'Seluruh Kwartir Ranting',
        organizer: 'Kwarran',
        description: 'Jambore Pramuka Penggalang serentak di Hari Pramuka.',
        published: true,
      },
    ])
    .returning();
  await db.insert(schema.eventRegistrations).values({ eventId: eventRows[1].id, memberId: dimas.id });

  await db.insert(schema.news).values([
    {
      slug: 'pelantikan-dewan-kerja-cabang',
      title: 'Pelantikan Dewan Kerja Cabang Kwarcab Indramayu',
      category: 'Organisasi',
      excerpt: 'Kepengurusan baru DKC resmi dilantik untuk masa bakti lima tahun.',
      content:
        'Pelantikan Dewan Kerja Cabang (DKC) Gerakan Pramuka Indramayu berlangsung khidmat di aula Kwarcab.\n\nDKC baru akan memimpin program Pramuka Penegak dan Pandega se-kabupaten.',
      author: 'Humas Kwarcab',
      status: 'PUBLISHED' as const,
      publishedAt: daysFromNow(-3),
    },
    {
      slug: 'lomba-tingkat-regu-penggalang',
      title: 'Lomba Tingkat Regu Penggalang Sukses Digelar',
      category: 'Prestasi',
      excerpt: 'Regu terbaik siap mewakili Indramayu di tingkat provinsi.',
      content: 'Lomba Tingkat yang diikuti utusan dari seluruh Kwarran berjalan kompetitif dan tertib.',
      author: 'Binamuda Kwarcab',
      status: 'PUBLISHED' as const,
      publishedAt: daysFromNow(-9),
    },
    {
      slug: 'pelatihan-kmd',
      title: 'Pendaftaran Kursus Mahir Dasar Dibuka',
      category: 'Pendidikan',
      excerpt: 'Pusdiklatcab membuka pendaftaran KMD bagi calon pembina.',
      content: 'Pusdiklatcab Indramayu kembali menyelenggarakan Kursus Pembina Pramuka Mahir Tingkat Dasar.',
      author: 'Pusdiklatcab',
      status: 'PUBLISHED' as const,
      publishedAt: daysFromNow(-15),
    },
    {
      slug: 'draf-rapat-kerja',
      title: 'Rapat Kerja Cabang Rumuskan Program Tahunan',
      category: 'Organisasi',
      excerpt: 'Draf berita menunggu terbit.',
      content: 'Isi draf.',
      author: 'Humas Kwarcab',
      status: 'DRAFT' as const,
    },
  ]);

  await db.insert(schema.albums).values([
    {
      slug: 'hari-pramuka',
      title: 'Peringatan Hari Pramuka',
      date: isoDate(daysFromNow(-50)),
      location: 'Alun-alun Indramayu',
      organizer: 'Kwarcab Indramayu',
      category: 'Perayaan',
      description: 'Upacara dan apel besar Hari Pramuka di pusat kabupaten.',
      published: true,
    },
    {
      slug: 'bakti-sosial-donor-darah',
      title: 'Bakti Sosial Donor Darah',
      date: isoDate(daysFromNow(-110)),
      location: 'Gedung Kwarcab',
      organizer: 'DKC & PMI',
      category: 'Sosial',
      description: 'Pramuka Peduli menggelar donor darah bersama PMI.',
      published: true,
    },
  ]);

  await db.insert(schema.documents).values([
    {
      title: 'Petunjuk Penyelenggaraan Perkemahan Bakti Penggalang',
      category: 'Petunjuk Teknis',
      description: 'Pedoman teknis pelaksanaan bagi pangkalan peserta.',
      date: isoDate(daysFromNow(-20)),
      fileType: 'PDF',
      published: true,
    },
    {
      title: 'Formulir Pendaftaran Ulang Gugus Depan',
      category: 'Formulir',
      description: 'Formulir pemutakhiran data gudep.',
      date: isoDate(daysFromNow(-40)),
      fileType: 'DOCX',
      published: true,
    },
  ]);

  await db.insert(schema.boardMembers).values([
    { name: 'Kak Contoh Ketua', position: 'Ketua Kwartir Cabang', department: 'Pimpinan', period: '2026–2031', sortOrder: 1 },
    { name: 'Kak Contoh Sekretaris', position: 'Sekretaris', department: 'Pimpinan', period: '2026–2031', sortOrder: 2 },
    {
      name: 'Kak Contoh Ketua DKC',
      position: 'Ketua Dewan Kerja Cabang',
      department: 'Dewan Kerja Cabang',
      period: '2026–2031',
      sortOrder: 10,
    },
  ]);

  await db.insert(schema.achievements).values([
    {
      title: 'Juara Umum Lomba Tingkat IV Jawa Barat',
      level: 'Provinsi',
      year: 2026,
      recipient: 'Regu Penggalang Kwarcab Indramayu',
      description: 'Juara umum pada ajang Lomba Tingkat IV Provinsi Jawa Barat.',
    },
  ]);

  await db.insert(schema.announcements).values([
    {
      title: 'Pemutakhiran data anggota paling lambat akhir bulan',
      body: 'Setiap gudep diminta memeriksa dan melengkapi data anggota di portal.',
      audience: 'STAFF' as const,
      authorName: 'Sekretariat Kwarcab',
    },
    {
      title: 'Latihan rutin pindah ke Sabtu pukul 14.00',
      body: 'Mulai pekan ini latihan rutin dilaksanakan Sabtu sore di lapangan sekolah.',
      audience: 'PESERTA' as const,
      gudepId: gd[0],
      authorName: 'Rina Kartika',
    },
    {
      title: 'Pendaftaran Perkemahan Bakti dibuka',
      body: 'Daftar lewat menu Kegiatan. Siapkan surat izin orang tua.',
      audience: 'ALL' as const,
      authorName: 'Sekretariat Kwarcab',
    },
  ]);

  await db.insert(schema.contactMessages).values({
    name: 'Contoh Pengunjung',
    email: 'pengunjung@example.com',
    organization: 'Orang tua anggota',
    message: 'Bagaimana cara mendaftarkan anak saya ke gugus depan terdekat?',
  });

  await db.insert(schema.siteSettings).values({ key: 'demo_seeded', value: sql`'true'::jsonb` });

  console.log('\nData demo FIKTIF dibuat. Akun demo (sandi semuanya: %s):', DEMO_PASSWORD);
  for (const u of demoUsers) console.log(`  - ${u.username.padEnd(20)} ${u.role}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
