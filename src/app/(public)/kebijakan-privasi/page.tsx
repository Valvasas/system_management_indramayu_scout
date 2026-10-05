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
  'Data wali (tergolong sensitif): nama dan nomor telepon wali, serta tanggal persetujuan wali untuk anggota di bawah 18 tahun.',
  'Status verifikasi, catatan pembinaan, dan tanggal bergabung.',
];

const accessRules = [
  'Pengurus hanya melihat data di cakupannya: staf gudep untuk gudepnya, staf kwarran untuk wilayahnya, pengurus kwarcab untuk seluruh kabupaten.',
  'Peserta hanya melihat data dirinya sendiri, dan tidak melihat alamat, telepon, maupun data wali.',
  'Pengecekan izin dilakukan di server pada setiap halaman dan aksi, bukan sekadar menyembunyikan tombol.',
  'Melihat data sensitif lengkap, mengekspor CSV, mengubah data, memverifikasi, mengelola akun, dan menerbitkan konten dicatat di log aktivitas beserta nama pelaku, waktu, dan alamat IP.',
];

const notYetInEffect = [
  'Persetujuan elektronik terverifikasi dari orang tua/wali. Saat ini yang tercatat hanya tanggal persetujuan yang diisikan pengurus; sistem belum memverifikasi dokumen atau identitas wali.',
  'Pengunci log aktivitas di tingkat basis data. Aplikasi hanya menambah dan membaca log, dan tidak menyediakan fitur ubah atau hapus, tetapi pengelola basis data secara teknis masih dapat mengubahnya.',
  'Enkripsi tingkat kolom untuk data sensitif. Data dilindungi oleh kontrol akses dan koneksi terenkripsi, belum dienkripsi per kolom di basis data.',
  'Klasifikasi data empat tingkat. Yang berlaku sekarang dua lapis: data umum dan data sensitif yang dibatasi izin khusus.',
  'Retensi dan penghapusan otomatis. Belum ada jadwal penghapusan data otomatis; penghapusan atas permintaan dilakukan manual oleh pengurus kwarcab.',
  'Pencadangan dan uji pemulihan basis data yang terjadwal dan terdokumentasi dalam sistem ini; hal itu bergantung pada penyedia hosting dan belum kami verifikasi.',
];

export default function KebijakanPrivasiPage() {
  return (
    <>
      <PageHero
        eyebrow="Kebijakan"
        scene="lake"
        top={<Breadcrumbs items={[{ label: 'Kebijakan Privasi' }]} />}
        title="Kebijakan privasi"
        description="Berlaku untuk situs publik dan portal Rumah Pramuka Indramayu. Diperbarui 5 Oktober 2026."
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
            formulir kontak dan dari pendataan anggota oleh pengurus gugus depan. Data anggota hanya dapat dibuka oleh pengurus
            yang berwenang, dan akses terhadapnya tercatat.
          </p>
        </section>

        <section aria-labelledby="dasar-title">
          <h2 id="dasar-title" className="font-display text-2xl font-bold text-text-primary">
            1. Dasar hukum dan ruang lingkup
          </h2>
          <p className="mt-3 civic-prose">
            Kebijakan ini mengacu pada Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi serta AD/ART Gerakan Pramuka.
            Ruang lingkupnya mencakup situs publik {site.url.replace('https://', '')} dan portal pengurus, pembina, serta peserta
            di alamat yang sama. Pengelola data adalah Kwartir Cabang Gerakan Pramuka Indramayu.
          </p>
        </section>

        <section aria-labelledby="publik-title">
          <h2 id="publik-title" className="font-display text-2xl font-bold text-text-primary">
            2. Data dari pengunjung situs publik
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-text-secondary">
            <li>
              <strong className="text-text-primary">Isian formulir kontak:</strong> nama, pos-el, nama gugus depan atau kwarran
              (opsional), dan isi pesan. Pesan disimpan di basis data dan dibaca pengurus kwarcab untuk menanggapinya. Bila sekretariat
              mengaktifkan penerusan, salinan pesan juga dikirim ke saluran internal sekretariat.
            </li>
            <li>
              <strong className="text-text-primary">Alamat IP pengirim formulir:</strong> hanya ditahan sementara di memori server untuk
              membatasi pengiriman berulang (tiga kali per sepuluh menit), tidak ditulis ke basis data, dan hilang saat server dimulai
              ulang.
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
          <h2 id="portal-title" className="font-display text-2xl font-bold text-text-primary">
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
          <h3 className="mt-6 font-display text-lg font-bold text-text-primary">Siapa yang dapat mengakses</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-text-secondary">
            {accessRules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3 className="mt-6 font-display text-lg font-bold text-text-primary">Cookie</h3>
          <p className="mt-2 civic-prose">
            Hanya satu cookie, yaitu cookie sesi masuk portal. Cookie ini bersifat httpOnly, hanya dikirim lewat koneksi aman, dan
            kedaluwarsa dalam 12 jam. Ia tidak dipakai untuk pelacakan.
          </p>
        </section>

        <section aria-labelledby="anak-title">
          <h2 id="anak-title" className="font-display text-2xl font-bold text-text-primary">
            4. Perlindungan anggota anak
          </h2>
          <p className="mt-3 civic-prose">
            Halaman publik tidak menampilkan foto wajah jarak dekat anggota di bawah 18 tahun tanpa persetujuan rilis media dari orang
            tua atau wali. Setiap unggahan foto galeri mensyaratkan pengurus menyatakan foto tersebut aman dipublikasikan, dan metadata
            lokasi (GPS) pada foto otomatis dibuang saat diunggah. Peta publik hanya menampilkan lokasi sekretariat Kwarcab, tidak pernah
            alamat rumah anggota. Anggota di bawah 18 tahun disarankan mengirim pesan melalui orang tua, wali, atau pembina.
          </p>
        </section>

        <section aria-labelledby="hak-title">
          <h2 id="hak-title" className="font-display text-2xl font-bold text-text-primary">
            5. Hak Anda dan cara menggunakannya
          </h2>
          <p className="mt-3 civic-prose">
            Anda berhak meminta akses, koreksi, atau penghapusan data pribadi Anda, baik yang dikirim lewat formulir kontak maupun yang
            tercatat sebagai data keanggotaan. Ajukan melalui pos-el di bawah dengan menyebut nama dan gugus depan; kami menanggapi paling
            lambat 14 hari kerja. Untuk koreksi data anggota, Anda juga dapat meminta pembina gudep melakukannya langsung di portal.
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
          <h2 id="belum-title" className="flex items-center gap-2 font-display text-xl font-bold text-text-primary">
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
