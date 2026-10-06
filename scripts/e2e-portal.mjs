/**
 * Uji end-to-end alur portal (butuh server jalan + data demo SEGAR: `npm run db:seed -- --demo`).
 *
 *   npm run e2e                     → http://localhost:3000
 *   BASE_URL=https://staging… npm run e2e
 *
 * Mengubah data (membuat berita, mutasi, kode akses), jadi jalankan pada basis data demo saja.
 * Keluar dengan kode 1 bila ada langkah gagal.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const DEMO = process.env.DEMO_PASSWORD ?? 'demo-pramuka-2026';
const results = [];

async function step(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ok   ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message.split('\n')[0] });
    console.log(`  FAIL ${name}: ${e.message.split('\n')[0]}`);
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const text = async (page) => (await page.locator('main').textContent()) ?? '';

async function session(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  return { ctx, page: await ctx.newPage() };
}

async function login(page, username, password = DEMO) {
  await page.goto(`${BASE}/masuk`);
  await page.locator('#f-username').fill(username);
  await page.locator('#f-password').fill(password);
  await Promise.all([page.waitForURL('**/dashboard**'), page.getByRole('button', { name: /^masuk$/i }).click()]);
}

const browser = await chromium.launch();

/* ---------- 1. Lupa sandi → kode akses dari pengurus → sandi buatan sendiri ---------- */
let code = '';
const newPassword = 'tenda-pagi-2026';
await step('lupa sandi: permintaan diterima tanpa membocorkan akun', async () => {
  const { ctx, page } = await session(browser);
  await page.goto(`${BASE}/masuk/lupa-sandi`);
  await page.locator('#f-username').fill('peserta.dimas');
  await page.locator('#f-note').fill('Gudep sekolah');
  await page.getByRole('button', { name: /kirim permintaan/i }).click();
  await page.getByText(/permintaan diterima/i).waitFor();
  // Akun yang tidak ada mendapat jawaban yang sama persis.
  await page.locator('#f-username').fill('akun.tidak.ada');
  await page.getByRole('button', { name: /kirim permintaan/i }).click();
  await page.getByText(/permintaan diterima/i).waitFor();
  await ctx.close();
});

await step('pengurus: permintaan muncul & kode akses diterbitkan', async () => {
  const { ctx, page } = await session(browser);
  await login(page, 'admin');
  await page.goto(`${BASE}/dashboard/akses`);
  assert((await text(page)).includes('peserta.dimas'), 'permintaan peserta.dimas tidak tampil');
  assert(!(await text(page)).includes('akun.tidak.ada'), 'akun fiktif tidak boleh membuat permintaan');
  await page
    .getByRole('button', { name: /buat kode akses/i })
    .first()
    .click();
  const msg = await page.getByText(/Kode akses:/).textContent({ timeout: 15000 });
  code = (msg.match(/Kode akses: ([A-Z0-9]{4}-[A-Z0-9]{4})/) ?? [])[1] ?? '';
  assert(code, 'kode akses tidak ditemukan di pesan');
  await ctx.close();
});

await step('peserta: tukar kode → masuk dengan sandi baru', async () => {
  const { ctx, page } = await session(browser);
  await page.goto(`${BASE}/masuk/kode`);
  await page.locator('#f-username').fill('peserta.dimas');
  await page.locator('#f-code').fill(code.toLowerCase().replace('-', ' '));
  await page.locator('#f-next').fill(newPassword);
  await page.locator('#f-confirm').fill(newPassword);
  await Promise.all([page.waitForURL('**/dashboard?sambutan=1'), page.getByRole('button', { name: /simpan & masuk/i }).click()]);
  assert((await text(page)).includes('Selamat datang'), 'sambutan tidak tampil');
  await ctx.close();
});

await step('kode akses hanya sekali pakai', async () => {
  const { ctx, page } = await session(browser);
  await page.goto(`${BASE}/masuk/kode`);
  await page.locator('#f-username').fill('peserta.dimas');
  await page.locator('#f-code').fill(code);
  await page.locator('#f-next').fill('sandi-lain-2026');
  await page.locator('#f-confirm').fill('sandi-lain-2026');
  await page.getByRole('button', { name: /simpan & masuk/i }).click();
  await page
    .getByText(/tidak cocok|kedaluwarsa/i)
    .first()
    .waitFor();
  await login(page, 'peserta.dimas', newPassword); // sandi baru tetap berlaku
  await ctx.close();
});

await step('peserta tidak bisa membuka menu staf (dicek di server)', async () => {
  const { ctx, page } = await session(browser);
  await login(page, 'peserta.dimas', newPassword);
  for (const p of ['/dashboard/akses', '/dashboard/mutasi', '/dashboard/kontribusi', '/dashboard/pendaftaran', '/dashboard/konten']) {
    const r = await page.goto(`${BASE}${p}`);
    assert(r.status() === 404, `${p} seharusnya 404 untuk peserta, dapat ${r.status()}`);
  }
  await ctx.close();
});

/* ---------- 2. Mutasi anggota antar-gudep ---------- */
let movedName = '';
let fromGudep = '';
await step('staf gudep mengajukan mutasi', async () => {
  const { ctx, page } = await session(browser);
  await login(page, 'gudep.smp1');
  await page.goto(`${BASE}/dashboard/anggota`);
  await page.locator('main table a').first().click();
  await page.waitForURL(/\/dashboard\/anggota\/[0-9a-f-]{36}/);
  movedName = ((await page.locator('h1').first().textContent()) ?? '').trim();
  fromGudep = ((await page.getByText(/^Saat ini:/).textContent()) ?? '').replace('Saat ini:', '').trim();
  await page.getByText('Ajukan mutasi ke gudep lain').click();
  await page.locator('#f-toGudepId').selectOption({ index: 1 });
  await page.locator('#f-reason').fill('Pindah sekolah mengikuti orang tua.');
  await Promise.all([page.waitForURL('**tersimpan=mutasi-diajukan'), page.getByRole('button', { name: /ajukan mutasi/i }).click()]);
  assert((await text(page)).includes('Mutasi menunggu persetujuan'), 'status menunggu tidak tampil');
  await ctx.close();
});

await step('pengurus menyetujui; anggota berpindah & keluar dari cakupan gudep asal', async () => {
  const { ctx, page } = await session(browser);
  await login(page, 'admin');
  await page.goto(`${BASE}/dashboard/mutasi`);
  assert((await text(page)).includes(movedName), 'pengajuan tidak tampil di antrean');
  await Promise.all([
    page.waitForURL('**keputusan=setuju'),
    page
      .getByRole('button', { name: /setujui mutasi/i })
      .first()
      .click(),
  ]);
  await ctx.close();

  const s2 = await session(browser);
  await login(s2.page, 'gudep.smp1');
  await s2.page.goto(`${BASE}/dashboard/anggota?q=${encodeURIComponent(movedName)}`);
  assert(!(await text(s2.page)).includes(movedName), 'anggota masih terlihat oleh gudep asal');
  await s2.ctx.close();
});

/* ---------- 3. Alur review berita ---------- */
const title = `Bakti Lingkungan Regu Elang ${Date.now() % 100000}`;
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
await step('kontributor mengirim berita untuk direview (tidak tayang)', async () => {
  const { ctx, page } = await session(browser);
  await login(page, 'gudep.smp1');
  await page.goto(`${BASE}/dashboard/kontribusi/baru`);
  await page.locator('#f-title').fill(title);
  await page.locator('#f-excerpt').fill('Regu Elang membersihkan saluran air di sekitar sekolah.');
  await page.locator('#f-content').fill('Kegiatan dimulai pukul tujuh pagi.\n\nPembina mendampingi dan mencatat hasilnya.');
  await page.locator('#f-status').selectOption('REVIEW');
  await Promise.all([page.waitForURL('**terkirim=1'), page.getByRole('button', { name: /^simpan$/i }).click()]);
  const r = await page.goto(`${BASE}/berita/${slug}`);
  assert(r.status() === 404, `berita belum direview tidak boleh tayang (status ${r.status()})`);
  await ctx.close();
});

await step('editor mengembalikan dengan catatan; kontributor melihatnya', async () => {
  const { ctx, page } = await session(browser);
  await login(page, 'admin');
  await page.goto(`${BASE}/dashboard/konten/berita`);
  assert((await text(page)).includes('menunggu review'), 'notifikasi antrean review tidak tampil');
  await page.getByRole('link', { name: title }).click();
  await page.locator('#f-reviewNote').fill('Tambahkan tanggal kegiatan di paragraf pertama.');
  await Promise.all([page.waitForURL('**dikembalikan=1'), page.getByRole('button', { name: /kembalikan ke penulis/i }).click()]);
  await ctx.close();

  const s2 = await session(browser);
  await login(s2.page, 'gudep.smp1');
  await s2.page.goto(`${BASE}/dashboard/kontribusi`);
  assert((await text(s2.page)).includes('Perlu perbaikan'), 'status dikembalikan tidak tampil');
  assert((await text(s2.page)).includes('Tambahkan tanggal kegiatan'), 'catatan editor tidak tampil');
  await s2.page.getByRole('link', { name: title }).click();
  await s2.page.locator('#f-status').selectOption('REVIEW');
  await Promise.all([s2.page.waitForURL('**terkirim=1'), s2.page.getByRole('button', { name: /^simpan$/i }).click()]);
  await s2.ctx.close();
});

await step('editor menerbitkan; berita langsung tayang publik', async () => {
  const { ctx, page } = await session(browser);
  await login(page, 'admin');
  await page.goto(`${BASE}/dashboard/konten/berita`);
  await page.getByRole('link', { name: title }).click();
  await page.locator('#f-status').selectOption('PUBLISHED');
  await Promise.all([page.waitForURL('**tersimpan=1'), page.getByRole('button', { name: /^simpan$/i }).click()]);
  const r = await page.goto(`${BASE}/berita/${slug}`);
  assert(r.status() === 200, `berita terbit harus tayang (status ${r.status()})`);
  assert(((await page.locator('h1').textContent()) ?? '').includes('Bakti Lingkungan'), 'judul tidak tampil');
  await ctx.close();
});

await step('setelah terbit: halaman statis lain tetap 200, slug asing tetap 404', async () => {
  // Regresi: revalidatePublicSite() + dynamicParams=false membuat seluruh /golongan/* & /wilayah/* jadi 404.
  const { ctx, page } = await session(browser);
  for (const [p, want] of [
    ['/golongan/siaga', 200],
    ['/wilayah/anjatan', 200],
    ['/golongan/bukan-golongan', 404],
    ['/wilayah/bukan-kwarran', 404],
    ['/berita/bukan-berita', 404],
  ]) {
    const r = await page.goto(`${BASE}${p}`);
    assert(r.status() === want, `${p} seharusnya ${want}, dapat ${r.status()}`);
  }
  await ctx.close();
});

/* ---------- 4. Pendaftar kegiatan ---------- */
await step('pengurus melihat pendaftar & mengunduh CSV', async () => {
  const { ctx, page } = await session(browser);
  await login(page, 'admin');
  await page.goto(`${BASE}/dashboard/pendaftaran`);
  await Promise.all([
    page.waitForURL(/\/dashboard\/pendaftaran\/[0-9a-f-]{36}$/),
    page.getByRole('link', { name: /latihan gabungan kwarran/i }).click(),
  ]);
  assert((await text(page)).includes('Dimas Pratama'), 'pendaftar tidak tampil');
  const csvHref = await page.getByRole('link', { name: /unduh csv/i }).getAttribute('href');
  const res = await page.request.get(`${BASE}${csvHref}`);
  assert(res.status() === 200, `CSV status ${res.status()}`);
  assert((res.headers()['content-type'] ?? '').includes('text/csv'), 'bukan CSV');
  assert((await res.text()).includes('Dimas Pratama'), 'CSV tidak memuat pendaftar');
  await ctx.close();
});

/* ---------- 5. CSP ber-nonce di portal (P1-1) ---------- */
await step('CSP portal: nonce baru tiap permintaan, peta & formulir jalan tanpa pelanggaran', async () => {
  const { ctx, page } = await session(browser);
  await ctx.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
  await login(page, 'admin');
  const nonces = [];
  for (const p of ['/dashboard/gudep', '/dashboard/gudep/baru']) {
    const r = await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle' });
    const csp = r.headers()['content-security-policy'] ?? '';
    const script = csp.split(';').find((d) => d.trim().startsWith('script-src')) ?? '';
    assert(!script.includes('unsafe-inline'), `${p}: script-src masih unsafe-inline`);
    const nonce = script.match(/'nonce-([^']+)'/)?.[1];
    assert(nonce, `${p}: CSP tanpa nonce`);
    nonces.push(nonce);
    // Leaflet (dimuat dinamis lewat strict-dynamic) harus benar-benar tampil.
    await page.locator('.leaflet-container').first().waitFor({ timeout: 15_000 });
    const violations = await page.evaluate(() => window.__csp);
    assert(violations.length === 0, `${p}: pelanggaran CSP ${violations.join(', ')}`);
  }
  assert(nonces[0] !== nonces[1], 'nonce dipakai ulang antar-permintaan');
  await ctx.close();
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} langkah lulus.`);
if (failed.length) process.exit(1);
