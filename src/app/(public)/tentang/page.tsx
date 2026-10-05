import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { PageHero } from '@/components/ui/Section';
import { GolonganIcon } from '@/components/public/GolonganIcon';
import { golongan, golonganAnchor } from '@/lib/golongan';

export const metadata: Metadata = {
  title: 'Tentang Kwarcab Indramayu',
  description:
    'Profil, visi dan misi, serta nilai Gerakan Pramuka Kwartir Cabang Indramayu.',
  alternates: { canonical: '/tentang' },
};

const misi = [
  'Menyelenggarakan pendidikan kepramukaan yang berkualitas dan inklusif di seluruh gugus depan.',
  'Meningkatkan kompetensi pembina dan pelatih melalui kursus berjenjang di Pusdiklatcab.',
  'Memperkuat tata kelola organisasi kwartir ranting dan gugus depan.',
  'Mendorong peran serta pramuka dalam bakti masyarakat dan pelestarian lingkungan.',
];

const dasaDarma = [
  'Takwa kepada Tuhan Yang Maha Esa',
  'Cinta alam dan kasih sayang sesama manusia',
  'Patriot yang sopan dan kesatria',
  'Patuh dan suka bermusyawarah',
  'Rela menolong dan tabah',
  'Rajin, terampil, dan gembira',
  'Hemat, cermat, dan bersahaja',
  'Disiplin, berani, dan setia',
  'Bertanggung jawab dan dapat dipercaya',
  'Suci dalam pikiran, perkataan, dan perbuatan',
];

export default function TentangPage() {
  return (
    <>
      <PageHero
        eyebrow="Profil"
        scene="mountain"
        top={<Breadcrumbs items={[{ label: 'Tentang' }]} />}
        title="Tentang Kwarcab Indramayu"
        description="Kwartir Cabang Gerakan Pramuka Indramayu mengoordinasikan pendidikan kepramukaan di seluruh kecamatan Kabupaten Indramayu."
      />
      <div className="civic-container pb-16 pt-6 sm:pb-24">

      <div className="max-w-3xl space-y-12">
        <section aria-labelledby="sejarah-title">
          <h2 id="sejarah-title" className="font-display text-2xl font-semibold text-text-primary">
            Sejarah singkat
          </h2>
          <div className="mt-3 space-y-4 civic-prose">
            <p>
              Gerakan Pramuka di Kabupaten Indramayu tumbuh bersama berdirinya gugus depan di
              pangkalan sekolah sejak kwartir cabang dibentuk mengikuti Keputusan Presiden Nomor 238
              Tahun 1961 tentang Gerakan Pramuka.
            </p>
            <p>
              Hingga kini kwartir cabang membina gugus depan pada jenjang SD, SMP, hingga SMA/SMK
              yang tersebar di seluruh kwartir ranting, dengan dukungan Pusat Pendidikan dan
              Pelatihan Cabang (Pusdiklatcab) untuk pembinaan anggota dewasa.
            </p>
          </div>
        </section>

        <section aria-labelledby="visi-title">
          <h2 id="visi-title" className="font-display text-2xl font-semibold text-text-primary">
            Visi & misi
          </h2>
          <Card className="mt-4">
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-text-primary">Visi</h3>
                <p className="mt-1 civic-prose">
                  Mewujudkan kaum muda Indramayu yang berkarakter, berkecakapan hidup, dan peduli
                  terhadap masyarakat serta lingkungan melalui pendidikan kepramukaan.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Misi</h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-text-secondary">
                  {misi.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="nilai-title">
          <h2 id="nilai-title" className="font-display text-2xl font-semibold text-text-primary">
            Nilai yang dipegang
          </h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent>
                <h3 className="font-semibold text-text-primary">Tri Satya</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Janji pramuka untuk menjalankan kewajiban terhadap Tuhan Yang Maha Esa dan Negara
                  Kesatuan Republik Indonesia, menolong sesama hidup dan ikut serta membangun
                  masyarakat, serta menepati Dasa Darma.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h3 className="font-semibold text-text-primary">Dasa Darma</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-text-secondary">
                  {dasaDarma.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </section>

        <section aria-labelledby="golongan-title">
          <h2 id="golongan-title" className="font-display text-2xl font-semibold text-text-primary">
            Golongan &amp; pembina
          </h2>
          <ul className="mt-4 space-y-3">
            {golongan.map((g) => (
              <li
                key={g.id}
                id={golonganAnchor(g.id)}
                className="flex scroll-mt-24 gap-4 rounded-lg border border-border-subtle bg-surface-base p-5 target:border-border-brand target:bg-surface-brand-tint"
              >
                <GolonganIcon id={g.id} />
                <div>
                  <h3 className="font-display text-lg font-semibold text-text-primary">
                    {g.name} <span className="text-base font-normal text-text-secondary">· {g.age}</span>
                  </h3>
                  <p className="mt-1 text-text-secondary">{g.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="lanjut-title"
          className="rounded-lg border border-border-subtle bg-surface-subtle p-6"
        >
          <h2 id="lanjut-title" className="font-display text-xl font-semibold text-text-primary">
            Ingin mengenal pengurusnya?
          </h2>
          <p className="mt-2 text-text-secondary">
            Susunan pengurus kwartir cabang dan daftar kwartir ranting tersedia di halaman struktur
            organisasi.
          </p>
          <ButtonLink href="/struktur-organisasi" variant="outline" className="mt-4">
            Lihat struktur organisasi
          </ButtonLink>
        </section>
      </div>
    </div>
    </>
  );
}
