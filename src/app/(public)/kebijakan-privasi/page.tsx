import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import Link from 'next/link';
import { CircleDashed, ShieldCheck } from 'lucide-react';
import { PageHero } from '@/components/ui/Section';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description:
    'Data apa saja yang dikumpulkan situs dan portal Kwarcab Indramayu, siapa yang dapat mengaksesnya, dan batasan yang masih berlaku.',
  alternates: { canonical: '/kebijakan-privasi' },
};

/**
 * Setiap klaim di halaman ini harus bisa ditunjuk implementasinya di kode.
 * Yang belum ada mekanismenya HARUS tetap di bagian "Yang belum berlaku" —
 * menerbitkan janji tanpa dukungan sistem adalah eksposur hukum (TASKS.md P1-8).
 * Perbarui halaman ini setiap kali skema data atau kontrol akses berubah.
 */
const memberData = [
  'Identitas: nama lengkap, jenis kelamin, tanggal lahir, golongan, gugus depan, dan nomor KTA bila sudah terbit.',
  'Kontak (tergolong sensitif): nomor telepon dan alamat.',
  'Data wali (tergolong sensitif): nama dan nomor telepon orang tua/wali untuk anggota di bawah 18 tahun.',
  'Persetujuan orang tua/wali: pilihan per bagian (data pribadi, foto, kegiatan), waktu, versi teks persetujuan yang dibaca, nama yang diketik wali, dan sidik HMAC alamat IP pengirim (bukan IP-nya).',
  'Status verifikasi, catatan pembinaan, dan tanggal bergabung.',
  'Riwayat gugus depan: setiap mutasi antar-gudep (gudep asal dan tujuan, alasan, serta siapa yang mengajukan dan memutuskan).',
  'Pendaftaran kegiatan yang diikuti lewat portal.',
];

const protections = [
  'Telepon, alamat, dan data wali anggota, nama wali pada catatan persetujuan, serta rahasia verifikasi dua langkah disimpan terenkripsi (AES-256-GCM) di basis data. Kuncinya berada di server aplikasi, terpisah dari basis data dan dari berkas cadangan. Data yang tercatat sebelum enkripsi berlaku ikut dienkripsi setiap kali migrasi basis data dijalankan.',
  'Log aktivitas hanya bisa ditambah: basis data menolak pengubahan dan penghapusan, dan setiap entri terkunci dengan hash entri sebelumnya sehingga perubahan dapat dideteksi lewat pemeriksaan integritas.',
  'Akun Super Admin, pengurus kwarcab, dan admin website wajib memakai verifikasi dua langkah (kode dari aplikasi autentikator) setelah masa tenggang. Akun lain boleh mengaktifkannya sukarela.',
  'Percobaan masuk, kode akses, kode verifikasi, dan formulir publik dibatasi jumlahnya. Penghitungnya menyimpan sidik HMAC alamat IP atau nama pengguna, bukan nilai aslinya, dan dihapus oleh pembersihan otomatis setelah jangka pembatasan lewat.',
];

const accessRules = [
  'Pengurus hanya melihat data di cakupannya: staf gudep untuk gudepnya, staf kwarran untuk wilayahnya, pengurus kwarcab untuk seluruh kabupaten.',
  'Peserta hanya melihat data dirinya sendiri, dan tidak melihat alamat, telepon, maupun data wali.',
  'Pengecekan izin dilakukan di server pada setiap halaman dan aksi, bukan sekadar menyembunyikan tombol.',
  'Melihat data sensitif lengkap, mengekspor CSV, mengubah data, memverifikasi, memutasi, mengelola akun, meminta atau mencatat pencabutan persetujuan, dan menerbitkan konten dicatat di log aktivitas beserta nama pelaku, waktu, dan alamat IP.',
  'Daftar pendaftar kegiatan yang dapat dibuka pengurus hanya memuat nama, KTA, golongan, dan gugus depan, tanpa kontak maupun data wali.',
];

const accessData = [
  'Lupa kata sandi tidak memakai email. Permintaan (nama pengguna, keterangan opsional, dan waktunya) diteruskan ke pembina atau pengurus yang berwenang atas akun tersebut.',
  'Pengurus menyerahkan kode akses sekali pakai. Kode hanya disimpan dalam bentuk hash, berlaku 24 jam untuk reset dan 7 hari untuk aktivasi akun baru, lalu hangus setelah dipakai.',
  'Pemilik akun membuat kata sandinya sendiri. Pembina dan pengurus tidak pernah melihat atau menentukan kata sandi anggota.',
  'Kode akses hanya menggantikan kata sandi. Akun yang memakai verifikasi dua langkah tetap diminta kodenya setelah itu.',
];

const consentFlow = [
  'Pembina membuat kode persetujuan sekali pakai (berlaku 14 hari) dan menyerahkannya kepada orang tua/wali. Yang disimpan hanya hash kodenya.',
  'Orang tua/wali membuka halaman Persetujuan wali, memasukkan kode, lalu memilih setuju atau tidak untuk setiap bagian: pengelolaan data pribadi, foto dan dokumentasi, serta keikutsertaan kegiatan. Pemegang kode hanya melihat nama depan anak dan nama gugus depannya.',
  'Portal tidak menyediakan cara bagi pembina untuk mencatat persetujuan atas nama wali. Persetujuan hanya tercatat lewat halaman wali dengan kode sekali pakai, halaman itu menolak perangkat yang sedang masuk ke portal, dan keputusan yang dikirim dari jaringan yang sama dengan pembina peminta kode ditandai untuk diperiksa. Pembina dapat mencatat pencabutan yang diminta wali; wali juga dapat mengubah pilihan dengan kode baru kapan saja.',
  'Data anak di bawah 18 tahun baru dapat diverifikasi setelah wali menyetujui pengelolaan data pribadinya; anak yang didata pengurus berwenang verifikasi pun tetap menunggu persetujuan itu. Tanggal persetujuan yang dulu diketik pengurus tetap terlihat sebagai catatan lama yang belum terverifikasi.',
  'Pilihan wali ditegakkan: tanpa persetujuan kegiatan, anak tidak dapat mendaftar kegiatan lewat portal. Bila persetujuan data pribadi ditolak atau dicabut, anak tidak dapat diverifikasi ulang, didaftarkan ke kegiatan baru, atau dibuatkan akun portal sampai wali menyetujui kembali.',
];

const retention = [
  'Pesan formulir kontak: 365 hari.',
  'Log aktivitas: 24 bulan.',
  'Kode akses dan kode persetujuan yang tidak terpakai: 30 hari setelah kedaluwarsa. Permintaan reset kata sandi yang selesai: 90 hari.',
  'Sesi masuk dan penghitung pembatasan percobaan: dihapus setelah kedaluwarsa.',
  'Data anggota disimpan selama keanggotaan. Atas permintaan penghapusan, pengurus kwarcab menganonimkan anggota yang sudah nonaktif: identitas, kontak, data wali, dan akun portal dihapus, sedangkan statistik golongan dan riwayat gudep tetap ada tanpa nama.',
];

const notYetInEffect = [
  'Verifikasi identitas wali. Sistem memastikan persetujuan datang dari pemegang kode yang diberikan pembina, tetapi tidak memeriksa dokumen identitas orang tua/wali. Karena kode diserahkan lewat pembina, pembina secara teknis masih bisa mengisinya sendiri dari perangkat lain; sistem hanya menolak perangkat yang sedang masuk ke portal dan menandai pengiriman dari jaringan yang sama.',
  'Enkripsi nama dan tanggal lahir anggota. Kedua data ini dilindungi kontrol akses dan koneksi terenkripsi, belum dienkripsi per kolom.',
  'Deteksi pemotongan entri log terbaru. Rantai hash mendeteksi perubahan di tengah, tetapi entri paling akhir yang dihapus hanya ketahuan bila pengurus mencatat kepala rantai secara berkala di luar sistem.',
  'Penghapusan nama di log lama. Log aktivitas tidak dapat diubah, sehingga ringkasan log yang menyebut nama anggota baru hilang ketika masa simpan log (24 bulan) lewat, termasuk setelah anggota dianonimkan.',
  'Jadwal retensi dan pencadangan di server produksi. Sistem menyediakan penghapusan terjadwal, pencadangan, dan uji pemulihan, tetapi jadwal otomatisnya diatur pengelola server dan belum kami verifikasi di server produksi.',
  'Tautan foto galeri ke anak tertentu. Persetujuan foto dicatat per anak, tetapi foto galeri belum ditautkan ke anggota, sehingga pemeriksaan sebelum unggah masih dilakukan manual oleh pengurus.',
  'Klasifikasi data empat tingkat. Yang berlaku sekarang dua lapis: data umum dan data sensitif yang dibatasi izin khusus.',
];

export default function KebijakanPrivasiPage() {
  return (
    <>
      <PageHero
        eyebrow="Kebijakan"
        scene="lake"
        top={<Breadcrumbs items={[{ label: 'Kebijakan Privasi' }]} />}
        title="Kebijakan privasi"
        description="Berlaku untuk situs publik dan portal Rumah Pramuka Indramayu. Diperbarui 6 Oktober 2026."
      />
      <div className="civic-container pb-16 pt-6 sm:pb-24">
        <div className="max-w-3xl space-y-10">
          <section aria-labelledby="ringkas-title" className="rounded-lg border border-status-success-border bg-status-success-surface p-5">
            <h2 id="ringkas-title" className="flex items-center gap-2 font-semibold text-status-success-text">
              <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
              Ringkasnya
            </h2>
            <p className="mt-2 text-sm text-status-success-text">
              Pengunjung situs publik tidak perlu akun dan tidak dilacak pihak ketiga. Data pribadi yang kami simpan hanya berasal dari
              formulir kontak dan dari pendataan anggota oleh pengurus gugus depan. Data anggota hanya dapat dibuka oleh pengurus yang
              berwenang, dan akses terhadapnya tercatat.
            </p>
          </section>

          <section aria-labelledby="dasar-title">
            <h2 id="dasar-title" className="font-display text-2xl font-semibold text-text-primary">
              1. Dasar hukum dan ruang lingkup
            </h2>
            <p className="mt-3 civic-prose">
              Kebijakan ini mengacu pada Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi serta AD/ART Gerakan Pramuka.
              Ruang lingkupnya mencakup situs publik {site.url.replace('https://', '')} dan portal pengurus, pembina, serta peserta di
              alamat yang sama. Pengelola data adalah Kwartir Cabang Gerakan Pramuka Indramayu.
            </p>
          </section>

          <section aria-labelledby="publik-title">
            <h2 id="publik-title" className="font-display text-2xl font-semibold text-text-primary">
              2. Data dari pengunjung situs publik
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-text-secondary">
              <li>
                <strong className="text-text-primary">Isian formulir kontak:</strong> nama, pos-el, nama gugus depan atau kwarran
                (opsional), dan isi pesan. Pesan disimpan di basis data dan dibaca pengurus kwarcab untuk menanggapinya. Bila sekretariat
                mengaktifkan penerusan, salinan pesan juga dikirim ke saluran internal sekretariat.
              </li>
              <li>
                <strong className="text-text-primary">Alamat IP pengirim formulir:</strong> dipakai untuk membatasi pengiriman berulang
                (tiga kali per sepuluh menit). Yang disimpan di basis data hanya sidik HMAC-nya, bukan alamat IP, dan dihapus oleh
                pembersihan otomatis setelah jangka sepuluh menit itu lewat.
              </li>
              <li>
                <strong className="text-text-primary">Laporan galat (bila diaktifkan sekretariat):</strong> galat di server dapat dikirim ke
                layanan pemantauan Sentry setelah pos-el, nomor telepon, alamat IP, kode akses, dan angka panjang disamarkan. Tidak ada data
                peramban, cookie, atau isi formulir yang ikut dikirim.
              </li>
              <li>
                <strong className="text-text-primary">Log server standar</strong> milik penyedia hosting untuk keamanan dan pemeliharaan.
              </li>
            </ul>
            <p className="mt-3 civic-prose">
              Situs tidak memasang cookie analitik, piksel pelacak, maupun skrip iklan. Peta memuat petak gambar dari OpenStreetMap, yang
              dapat menerima alamat IP peramban Anda.
            </p>
          </section>

          <section aria-labelledby="portal-title">
            <h2 id="portal-title" className="font-display text-2xl font-semibold text-text-primary">
              3. Data di portal: akun dan keanggotaan
            </h2>
            <p className="mt-3 civic-prose">
              Akun portal tidak dibuat sendiri. Akun dibuat oleh pengurus, berisi nama, nama pengguna, peran, dan kata sandi yang disimpan
              dalam bentuk hash. Untuk setiap anggota, pengurus gugus depan mendata:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-text-secondary">
              {memberData.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3 className="mt-6 font-display text-lg font-semibold text-text-primary">Cara data dilindungi</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-text-secondary">
              {protections.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3 className="mt-6 font-display text-lg font-semibold text-text-primary">Siapa yang dapat mengakses</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-text-secondary">
              {accessRules.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3 className="mt-6 font-display text-lg font-semibold text-text-primary">Akses akun tanpa email</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-text-secondary">
              {accessData.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3 className="mt-6 font-display text-lg font-semibold text-text-primary">Cookie</h3>
            <p className="mt-2 civic-prose">
              Hanya satu cookie, yaitu cookie sesi masuk portal. Cookie ini bersifat httpOnly, hanya dikirim lewat koneksi aman, dan
              kedaluwarsa dalam 12 jam. Ia tidak dipakai untuk pelacakan.
            </p>
          </section>

          <section aria-labelledby="anak-title">
            <h2 id="anak-title" className="font-display text-2xl font-semibold text-text-primary">
              4. Perlindungan anggota anak
            </h2>
            <p className="mt-3 civic-prose">
              Halaman publik tidak menampilkan foto wajah jarak dekat anggota di bawah 18 tahun tanpa persetujuan rilis media dari orang tua
              atau wali. Setiap unggahan foto galeri mensyaratkan pengurus menyatakan foto tersebut aman dipublikasikan, dan metadata lokasi
              (GPS) pada foto otomatis dibuang saat diunggah. Peta publik hanya menampilkan lokasi sekretariat Kwarcab, tidak pernah alamat
              rumah anggota. Anggota di bawah 18 tahun disarankan mengirim pesan melalui orang tua, wali, atau pembina.
            </p>
            <h3 className="mt-6 font-display text-lg font-semibold text-text-primary">Persetujuan orang tua/wali</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-text-secondary">
              {consentFlow.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              <Link
                href="/persetujuan-wali"
                className="inline-flex min-h-touch items-center rounded-md font-medium text-text-accent hover:underline"
              >
                Buka halaman Persetujuan wali
              </Link>
            </p>
          </section>

          <section aria-labelledby="retensi-title">
            <h2 id="retensi-title" className="font-display text-2xl font-semibold text-text-primary">
              5. Berapa lama data disimpan
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-text-secondary">
              {retention.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-3 civic-prose">
              Sistem menyediakan pencadangan basis data beserta uji pemulihannya. Di dalam berkas cadangan, data sensitif tetap terenkripsi.
            </p>
          </section>

          <section aria-labelledby="hak-title">
            <h2 id="hak-title" className="font-display text-2xl font-semibold text-text-primary">
              6. Hak Anda dan cara menggunakannya
            </h2>
            <p className="mt-3 civic-prose">
              Anda berhak meminta akses, koreksi, atau penghapusan data pribadi Anda, baik yang dikirim lewat formulir kontak maupun yang
              tercatat sebagai data keanggotaan. Ajukan melalui pos-el di bawah dengan menyebut nama dan gugus depan; kami menanggapi paling
              lambat 14 hari kerja. Untuk koreksi data anggota, Anda juga dapat meminta pembina gudep melakukannya langsung di portal.
              Persetujuan wali dapat dicabut kapan saja melalui pembina atau dengan kode persetujuan baru.
            </p>
            <p className="mt-3 text-sm">
              <a
                href={`mailto:${site.contact.privacyEmail}`}
                className="inline-flex min-h-touch items-center rounded-md font-medium text-text-accent hover:underline"
              >
                {site.contact.privacyEmail}
              </a>
            </p>
          </section>

          <section aria-labelledby="belum-title" className="rounded-lg border border-border-subtle bg-surface-subtle p-6">
            <h2 id="belum-title" className="flex items-center gap-2 font-display text-xl font-semibold text-text-primary">
              <CircleDashed className="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
              Yang belum berlaku
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Bagian ini daftar batasan jujur sistem saat ini. Hal-hal berikut masih rencana, bukan keadaan sekarang:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
              {notYetInEffect.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <p className="text-sm">
            <Link href="/aksesibilitas" className="inline-flex min-h-touch items-center rounded-md text-text-accent hover:underline">
              Lihat juga pernyataan aksesibilitas
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
