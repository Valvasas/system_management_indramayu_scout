import type { Metadata } from 'next';
import Link from 'next/link';
import { CircleDashed, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/Section';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description:
    'Data apa saja yang dikumpulkan situs Kwarcab Indramayu saat ini, dasar hukumnya, dan apa yang belum berlaku.',
  alternates: { canonical: '/kebijakan-privasi' },
};

/**
 * Halaman ini sengaja dibatasi pada apa yang BENAR-BENAR berlaku hari ini
 * (TASKS.md P1-8). Klaim yang mekanismenya belum ada dipindahkan ke bagian
 * "Yang belum berlaku" — menerbitkan janji tanpa implementasi adalah eksposur
 * hukum, bukan sekadar utang teknis.
 */
const notYetInEffect = [
  'Persetujuan elektronik terverifikasi dari orang tua/wali untuk anggota di bawah 18 tahun — mekanismenya baru dibangun pada Fase 2 bersama sistem keanggotaan.',
  'Pencatatan jejak audit append-only atas akses data anggota — belum ada basis data anggota di situs publik ini.',
  'Klasifikasi data empat tingkat beserta enkripsi kolom untuk NIK dan data kesehatan — menyusul bersama skema basis data.',
  'Retensi lima tahun dan penghapusan otomatis data keanggotaan — belum berlaku karena data keanggotaan belum disimpan.',
];

export default function KebijakanPrivasiPage() {
  return (
    <div className="civic-container py-12">
      <PageHeader
        title="Kebijakan privasi"
        description="Berlaku untuk situs publik Rumah Pramuka Indramayu. Diperbarui 19 September 2026."
      />

      <div className="max-w-3xl space-y-10">
        <section
          aria-labelledby="ringkas-title"
          className="rounded-lg border border-status-success-border bg-status-success-surface p-5"
        >
          <h2
            id="ringkas-title"
            className="flex items-center gap-2 font-semibold text-status-success-text"
          >
            <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
            Ringkasnya
          </h2>
          <p className="mt-2 text-sm text-status-success-text">
            Situs ini adalah portal informasi publik. Kami tidak meminta akun, tidak memasang
            pelacak pihak ketiga, dan satu-satunya data pribadi yang kami terima adalah yang Anda
            isi sendiri pada formulir kontak.
          </p>
        </section>

        <section aria-labelledby="dasar-title">
          <h2 id="dasar-title" className="font-display text-2xl font-bold text-text-primary">
            1. Dasar hukum dan ruang lingkup
          </h2>
          <p className="mt-3 civic-prose">
            Kebijakan ini mengacu pada Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data
            Pribadi serta AD/ART Gerakan Pramuka. Ruang lingkupnya terbatas pada situs publik{' '}
            {site.url.replace('https://', '')}. Sistem pengelolaan keanggotaan belum aktif dan akan
            memiliki kebijakan tersendiri saat diluncurkan.
          </p>
        </section>

        <section aria-labelledby="dikumpulkan-title">
          <h2 id="dikumpulkan-title" className="font-display text-2xl font-bold text-text-primary">
            2. Data yang benar-benar dikumpulkan saat ini
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-text-secondary">
            <li>
              <strong className="text-text-primary">Isian formulir kontak:</strong> nama, alamat
              pos-el, nama gugus depan/kwartir ranting (opsional), dan isi pesan. Dipakai hanya
              untuk menanggapi pesan tersebut.
            </li>
            <li>
              <strong className="text-text-primary">Alamat IP pengirim formulir:</strong> disimpan
              sementara di memori server untuk membatasi pengiriman berulang (maksimal tiga kali per
              sepuluh menit). Tidak ditulis ke basis data dan hilang saat server dimulai ulang.
            </li>
            <li>
              <strong className="text-text-primary">Log server standar</strong> yang dibuat penyedia
              hosting untuk keperluan keamanan dan pemeliharaan.
            </li>
          </ul>
          <p className="mt-3 civic-prose">
            Situs ini tidak memasang cookie analitik, piksel pelacak, maupun skrip iklan.
          </p>
        </section>

        <section aria-labelledby="anak-title">
          <h2 id="anak-title" className="font-display text-2xl font-bold text-text-primary">
            3. Perlindungan anggota anak
          </h2>
          <p className="mt-3 civic-prose">
            Halaman publik tidak menampilkan foto wajah jarak dekat anggota di bawah 18 tahun tanpa
            persetujuan rilis media dari orang tua atau wali. Dokumentasi yang ditayangkan berupa
            foto suasana kegiatan atau tokoh dewasa. Aturan ini menjadi daftar periksa yang wajib
            dilalui sebelum setiap unggahan galeri.
          </p>
          <p className="mt-3 civic-prose">
            Anggota di bawah 18 tahun disarankan mengirim pesan melalui orang tua/wali atau pembina.
          </p>
        </section>

        <section aria-labelledby="hak-title">
          <h2 id="hak-title" className="font-display text-2xl font-bold text-text-primary">
            4. Hak Anda dan cara menggunakannya
          </h2>
          <p className="mt-3 civic-prose">
            Anda berhak meminta akses, koreksi, atau penghapusan data yang pernah Anda kirimkan
            melalui formulir kontak. Ajukan melalui pos-el di bawah; kami menanggapi paling lambat
            14 hari kerja.
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

        <section
          aria-labelledby="belum-title"
          className="rounded-lg border border-border-subtle bg-surface-subtle p-6"
        >
          <h2
            id="belum-title"
            className="flex items-center gap-2 font-display text-xl font-bold text-text-primary"
          >
            <CircleDashed className="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
            Yang belum berlaku
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Bagian berikut adalah rencana, bukan keadaan sekarang. Kami mencantumkannya supaya tidak
            ada janji yang tidak didukung sistem:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            {notYetInEffect.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <p className="text-sm">
          <Link
            href="/aksesibilitas"
            className="inline-flex min-h-touch items-center rounded-md text-text-accent hover:underline"
          >
            Lihat juga pernyataan aksesibilitas
          </Link>
        </p>
      </div>
    </div>
  );
}
