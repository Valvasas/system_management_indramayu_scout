/**
 * Audit aksesibilitas otomatis (axe-core, WCAG 2.2 AA) + deteksi overflow horizontal.
 * Memindai semua rute publik dan dasbor pada lebar 1280 dan 390 piksel.
 *
 *   npm run a11y                       → menyasar http://localhost:3000
 *   BASE_URL=https://staging… npm run a11y
 *
 * Butuh data demo (akun `admin` & `peserta.dimas`): `npm run db:seed -- --demo`.
 * Keluar dengan kode 1 bila ada pelanggaran, sehingga bisa jadi gerbang CI.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const PASSWORD = process.env.DEMO_PASSWORD ?? 'demo-pramuka-2026';

const PUBLIC = [
  '/',
  '/tentang',
  '/struktur-organisasi',
  '/golongan',
  '/golongan/penggalang',
  '/bergabung',
  '/wilayah',
  '/wilayah/indramayu',
  '/berita',
  '/berita/pelatihan-kmd',
  '/agenda',
  '/agenda/perkemahan-bakti-penggalang',
  '/galeri',
  '/galeri/hari-pramuka',
  '/prestasi',
  '/dokumen',
  '/kontak',
  '/cari?q=kemah',
  '/kebijakan-privasi',
  '/aksesibilitas',
  '/masuk',
  '/masuk/lupa-sandi',
  '/masuk/kode',
  '/halaman-tidak-ada',
];
const ADMIN = [
  '/dashboard',
  '/dashboard/konten',
  '/dashboard/konten/berita',
  '/dashboard/konten/berita/baru',
  '/dashboard/konten/agenda',
  '/dashboard/konten/agenda/baru',
  '/dashboard/konten/galeri',
  '/dashboard/konten/galeri/baru',
  '/dashboard/konten/dokumen',
  '/dashboard/konten/dokumen/baru',
  '/dashboard/konten/pengurus',
  '/dashboard/konten/pengurus/baru',
  '/dashboard/konten/prestasi',
  '/dashboard/konten/prestasi/baru',
  '/dashboard/anggota',
  '/dashboard/anggota/baru',
  '/dashboard/anggota/impor',
  '/dashboard/gudep',
  '/dashboard/gudep/baru',
  '/dashboard/kwarran',
  '/dashboard/pengguna',
  '/dashboard/pengumuman',
  '/dashboard/pesan',
  '/dashboard/log',
  '/dashboard/pengaturan',
  '/dashboard/akun',
  '/dashboard/mutasi',
  '/dashboard/pendaftaran',
  '/dashboard/akses',
  '/dashboard/kontribusi',
  '/dashboard/kontribusi/baru',
];
const PESERTA = ['/dashboard', '/dashboard/kegiatan', '/dashboard/profil', '/dashboard/akun'];

async function login(page, user) {
  await page.goto(`${BASE}/masuk`);
  await page.getByLabel(/nama pengguna/i).fill(user);
  await page.getByLabel(/kata sandi/i).fill(PASSWORD);
  await Promise.all([page.waitForURL('**/dashboard**'), page.getByRole('button', { name: /masuk/i }).last().click()]);
}

async function scan(page, path, width, findings) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 60_000 });
  // Picu animasi muncul-saat-gulir lalu kembali ke atas, supaya axe memeriksa keadaan akhir yang terlihat pengguna.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 800));
  });
  await page.evaluate(axeSource);
  const violations = await page.evaluate(async () => {
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      count: v.nodes.length,
      target: v.nodes[0].target.join(' '),
      html: v.nodes[0].html.slice(0, 140),
    }));
  });
  for (const v of violations) findings.push(`[${width}px] ${path} :: ${v.id} (${v.impact}) x${v.count}\n    ${v.target}\n    ${v.html}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 0) findings.push(`[${width}px] ${path} :: overflow horizontal ${overflow}px`);
}

const browser = await chromium.launch();
const findings = [];
let pages = 0;
for (const [user, paths] of [
  [null, PUBLIC],
  ['admin', ADMIN],
  ['peserta.dimas', PESERTA],
]) {
  for (const width of [1280, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 800 } });
    const page = await context.newPage();
    if (user) await login(page, user);
    for (const path of paths) {
      await scan(page, path, width, findings);
      pages++;
    }
    await context.close();
  }
}
await browser.close();

if (findings.length) {
  console.error(`\n${findings.length} temuan dari ${pages} pemindaian:\n\n${findings.join('\n')}`);
  process.exit(1);
}
console.log(`Lolos: ${pages} pemindaian (rute × lebar), nol pelanggaran axe, nol overflow horizontal.`);
