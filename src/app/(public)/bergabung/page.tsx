import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronDown, GraduationCap, Map, MessageCircle, Phone, School, Sprout, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { PageHero } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Cara Bergabung',
  description:
    'Panduan bergabung dengan Gerakan Pramuka di Kabupaten Indramayu: untuk orang tua, remaja, calon pembina, dan sekolah yang ingin membentuk gugus depan.',
  alternates: { canonical: '/bergabung' },
};

/**
 * Halaman layanan berbasis peran pengunjung ("Saya adalah…"), bukan struktur organisasi.
 * Isinya alur umum; rincian (jadwal latihan, perlengkapan, iuran) ditentukan gugus depan
 * masing-masing, jadi halaman ini selalu mengarahkan ke gudep/kwarran, tidak mengarang angka.
 */
const paths = [
  {
    id: 'orang-tua',
    icon: Users,
    who: 'Orang tua / wali',
    title: 'Mendaftarkan anak',
    lede: 'Anak usia 7 tahun ke atas bisa mulai sebagai Siaga. Prosesnya sederhana dan didampingi pembina.',
    steps: [
      'Cari gugus depan di sekolah anak atau yang terdekat dari rumah lewat halaman Wilayah.',
      'Datang saat latihan rutin dan temui pembina. Tanyakan jadwal, perlengkapan, dan iuran gudep.',
      'Pembina mencatat data anak beserta data dan persetujuan Anda sebagai orang tua/wali.',
      'Setelah diverifikasi kwarran, anak mendapat akun portal untuk melihat kegiatan dan pengumuman.',
    ],
  },
  {
    id: 'remaja',
    icon: Sprout,
    who: 'Pelajar & mahasiswa',
    title: 'Bergabung sebagai Penegak atau Pandega',
    lede: 'Usia 16–25 tahun bisa bergabung di ambalan sekolah, racana kampus, atau satuan karya (Saka).',
    steps: [
      'Hubungi Dewan Ambalan di sekolah atau Dewan Racana di kampus Anda.',
      'Ikuti latihan dan kegiatan perkenalan sesuai jadwal satuan.',
      'Pembina mendata Anda; setelah diverifikasi, akun portal aktif.',
      'Tertarik bidang khusus? Tanyakan Saka yang tersedia ke sekretariat Kwarcab.',
    ],
  },
  {
    id: 'pembina',
    icon: GraduationCap,
    who: 'Guru & orang dewasa',
    title: 'Menjadi pembina',
    lede: 'Pembina mendampingi peserta didik. Bekal utamanya Kursus Mahir Dasar (KMD) dari Pusdiklatcab.',
    steps: [
      'Lihat jadwal KMD di halaman Agenda atau tanyakan ke sekretariat Kwarcab.',
      'Daftar dan ikuti kursus hingga selesai.',
      'Bertugas di gugus depan pangkalan Anda bersama pembina lain.',
      'Lanjutkan ke Kursus Mahir Lanjutan (KML) untuk pendalaman.',
    ],
  },
  {
    id: 'gudep-baru',
    icon: School,
    who: 'Sekolah & komunitas',
    title: 'Membentuk gugus depan baru',
    lede: 'Sekolah atau komunitas yang belum memiliki gugus depan dapat mengajukan pembentukan melalui Kwarran setempat.',
    steps: [
      'Siapkan calon pembina, idealnya yang sudah atau akan mengikuti KMD.',
      'Hubungi Kwartir Ranting di kecamatan Anda untuk konsultasi dan berkas yang diperlukan.',
      'Kwarran memproses pengajuan dan nomor gugus depan bersama Kwarcab.',
      'Gudep didata di portal, lalu pembina dapat mendaftarkan peserta didik.',
    ],
  },
];

const faqs = [
  {
    q: 'Usia berapa anak bisa mulai ikut Pramuka?',
    a: 'Mulai 7 tahun sebagai Siaga. Golongan berikutnya mengikuti usia: Penggalang (11–15), Penegak (16–20), dan Pandega (21–25).',
  },
  {
    q: 'Apakah harus lewat sekolah?',
    a: 'Tidak selalu. Gugus depan berpangkalan di sekolah atau komunitas. Anak boleh bergabung di gudep sekolahnya atau gudep lain yang paling dekat dan nyaman.',
  },
  {
    q: 'Berapa biayanya dan apa saja yang perlu disiapkan?',
    a: 'Iuran, seragam, dan perlengkapan ditentukan masing-masing gugus depan dan umumnya bertahap. Tanyakan langsung kepada pembina saat latihan pertama.',
  },
  {
    q: 'Bagaimana data anak saya dilindungi?',
    a: 'Data anak diisi pembina dan wajib disertai data serta tanggal persetujuan orang tua/wali. Alamat dan nomor telepon hanya bisa dibuka pengurus yang berwenang, dan setiap aksesnya tercatat. Rinciannya ada di Kebijakan Privasi.',
  },
  {
    q: 'Apakah anak mendapat akun? Bagaimana jika lupa kata sandi?',
    a: 'Ya, setelah datanya diverifikasi. Akun tidak memerlukan email. Jika lupa kata sandi, anak mengajukan permintaan di halaman Masuk, lalu pembina memberikan kode akses sekali pakai. Pembina tidak pernah mengetahui kata sandi anak.',
  },
  {
    q: 'Bagaimana jika anak pindah sekolah atau pindah gugus depan?',
    a: 'Pembina gudep asal mengajukan mutasi lewat portal. Setelah disetujui pengurus wilayah, data anak berpindah ke gudep tujuan dan riwayatnya tetap tersimpan.',
  },
];

export default function BergabungPage() {
  return (
    <>
      <PageHero
        eyebrow="Layanan"
        title="Cara bergabung"
        description="Pilih yang paling menggambarkan Anda. Setiap jalur berisi langkah sederhana dan siapa yang perlu dihubungi."
        scene="camp"
        top={<Breadcrumbs items={[{ label: 'Cara Bergabung' }]} />}
      >
        <nav aria-label="Pilih jalur">
          <ul className="flex flex-wrap gap-2">
            {paths.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.id}>
                  <a
                    href={`#${p.id}`}
                    className="inline-flex min-h-touch items-center gap-2 rounded-pill bg-surface-base px-4 text-sm font-semibold text-text-primary shadow-sm hover:text-text-accent"
                  >
                    <Icon className="h-4 w-4 text-text-accent" aria-hidden="true" />
                    {p.who}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </PageHero>

      <div className="civic-container pb-16 pt-6 sm:pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          {paths.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.id} delay={(i % 2) * 90}>
                <section id={p.id} aria-labelledby={`${p.id}-title`} className="h-full scroll-mt-28 rounded-3xl border border-border-subtle bg-surface-base p-6 sm:p-8">
                  <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-surface-meadow text-text-accent">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className="eyebrow mt-5">{p.who}</p>
                  <h2 id={`${p.id}-title`} className="mt-2 font-display text-2xl font-semibold text-text-primary sm:text-3xl">
                    {p.title}
                  </h2>
                  <p className="mt-3 text-text-secondary">{p.lede}</p>
                  <ol className="mt-6 space-y-4">
                    {p.steps.map((step, n) => (
                      <li key={step} className="flex gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-action-primary text-sm font-semibold text-text-on-brand">
                          {n + 1}
                        </span>
                        <p className="pt-1 text-text-primary">{step}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              </Reveal>
            );
          })}
        </div>

        <section aria-labelledby="faq-title" className="mx-auto mt-20 max-w-3xl">
          <p className="eyebrow">Pertanyaan yang sering diajukan</p>
          <h2 id="faq-title" className="mt-2 font-display text-display-md font-semibold text-text-primary">
            Masih ragu? Ini jawabannya
          </h2>
          <div className="mt-8 divide-y divide-border-subtle overflow-hidden rounded-3xl border border-border-subtle bg-surface-base">
            {faqs.map((f) => (
              /* <details> bawaan: bisa dibuka dengan keyboard & dibacakan pembaca layar tanpa JS tambahan. */
              <details key={f.q} className="group">
                <summary className="flex min-h-[3.5rem] cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-semibold text-text-primary hover:bg-surface-subtle [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-text-accent transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="px-6 pb-5 leading-relaxed text-text-secondary">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-4 text-sm text-text-secondary">
            Tentang data pribadi, baca{' '}
            <Link href="/kebijakan-privasi" className="font-semibold text-text-accent underline underline-offset-2">
              Kebijakan Privasi
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="bantuan-title" className="mt-20 overflow-hidden rounded-3xl bg-surface-forest text-text-inverse on-inverse topo-inverse">
          <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 id="bantuan-title" className="font-display text-display-md font-semibold">
                Butuh bantuan memilih gudep?
              </h2>
              <p className="mt-3 text-text-inverse-muted">Sekretariat Kwarcab siap membantu pada jam kerja: {site.contact.officeHours}.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <ButtonLink href="/wilayah" variant="inverse" size="lg">
                <Map className="h-5 w-5" aria-hidden="true" />
                Cari gudep
              </ButtonLink>
              <ButtonLink href={`tel:${site.contact.phone.replace(/[^\d+]/g, '')}`} variant="inverse" size="lg">
                <Phone className="h-5 w-5" aria-hidden="true" />
                Telepon
              </ButtonLink>
              <ButtonLink href="/kontak" variant="inverse" size="lg">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Kirim pesan
              </ButtonLink>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
