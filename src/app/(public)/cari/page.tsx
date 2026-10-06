import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, Compass, FileText, Images, Map, Newspaper, Search, SearchX, type LucideIcon } from 'lucide-react';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHero } from '@/components/ui/Section';
import { golongan } from '@/lib/golongan';
import { formatDate } from '@/lib/format';
import { getAgenda, getDocuments, getGalleryAlbums, getKwarranDirectory, getNews } from '@/lib/repositories';
import { highlight, scoreText, snippet, tokenize } from '@/lib/search';

export const metadata: Metadata = {
  title: 'Cari',
  description: 'Cari berita, agenda, dokumen, album, golongan, dan wilayah di situs Kwarcab Indramayu.',
  // Halaman hasil pencarian tidak perlu diindeks mesin pencari.
  robots: { index: false, follow: true },
};

/** Halaman statis yang ikut dicari, dengan kata kunci yang biasa dipakai orang. */
const staticPages = [
  { title: 'Cara bergabung', href: '/bergabung', body: 'daftar anak anggota baru pembina gudep baru membentuk gugus depan biaya iuran' },
  { title: 'Tentang Kwarcab Indramayu', href: '/tentang', body: 'sejarah visi misi dasa darma tri satya profil' },
  { title: 'Struktur organisasi', href: '/struktur-organisasi', body: 'pengurus ketua kwarcab bidang masa bakti' },
  { title: 'Kontak & layanan aspirasi', href: '/kontak', body: 'alamat telepon email sekretariat jam kantor pesan' },
  { title: 'Kebijakan privasi', href: '/kebijakan-privasi', body: 'data pribadi anak wali persetujuan hapus koreksi' },
  { title: 'Pernyataan aksesibilitas', href: '/aksesibilitas', body: 'pembaca layar keyboard kontras' },
  { title: 'Masuk portal', href: '/masuk', body: 'login akun kata sandi lupa kode akses' },
];

interface Hit {
  title: string;
  href: string;
  meta?: string;
  text: string;
  score: number;
}

const Mark: React.FC<{ text: string; tokens: string[] }> = ({ text, tokens }) => (
  <>
    {highlight(text, tokens).map((p, i) =>
      p.match ? (
        <mark key={i} className="rounded-sm bg-surface-ember px-0.5 text-text-primary">
          {p.text}
        </mark>
      ) : (
        <span key={i}>{p.text}</span>
      ),
    )}
  </>
);

export default async function CariPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = (searchParams?.q ?? '').trim().slice(0, 100);
  const tokens = tokenize(q);

  let groups: { id: string; label: string; icon: LucideIcon; hits: Hit[] }[] = [];
  if (tokens.length) {
    const [news, agenda, docs, albums, kwarran] = await Promise.all([
      getNews(),
      getAgenda(),
      getDocuments(),
      getGalleryAlbums(),
      getKwarranDirectory(),
    ]);
    const rank = (hits: Hit[]) =>
      hits
        .filter((h) => h.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    groups = [
      {
        id: 'berita',
        label: 'Berita',
        icon: Newspaper,
        hits: rank(
          news.map((n) => ({
            title: n.title,
            href: `/berita/${n.slug}`,
            meta: `${n.category} · ${formatDate(n.publishedAt)}`,
            text: snippet(`${n.excerpt} ${n.content}`, tokens),
            score: scoreText(tokens, n.title, `${n.excerpt} ${n.content} ${n.tags.join(' ')} ${n.category}`),
          })),
        ),
      },
      {
        id: 'agenda',
        label: 'Agenda',
        icon: CalendarDays,
        hits: rank(
          agenda.map((a) => ({
            title: a.title,
            href: `/agenda/${a.slug}`,
            meta: `${formatDate(a.dateStart)} · ${a.location}`,
            text: snippet(a.description, tokens),
            score: scoreText(tokens, a.title, `${a.description} ${a.location} ${a.organizer}`),
          })),
        ),
      },
      {
        id: 'dokumen',
        label: 'Dokumen',
        icon: FileText,
        hits: rank(
          docs.map((d) => ({
            title: d.title,
            href: `/dokumen?cari=${encodeURIComponent(d.title)}`,
            meta: `${d.category} · ${d.type}`,
            text: d.description ?? '',
            score: scoreText(tokens, d.title, `${d.description ?? ''} ${d.category}`),
          })),
        ),
      },
      {
        id: 'galeri',
        label: 'Album galeri',
        icon: Images,
        hits: rank(
          albums.map((al) => ({
            title: al.title,
            href: `/galeri/${al.slug}`,
            meta: `${formatDate(al.date)} · ${al.photos.length} foto`,
            text: snippet(al.description, tokens),
            score: scoreText(tokens, al.title, `${al.description} ${al.location} ${al.category}`),
          })),
        ),
      },
      {
        id: 'wilayah',
        label: 'Golongan & wilayah',
        icon: Map,
        hits: rank([
          ...golongan.map((g) => ({
            title: `Golongan ${g.name}`,
            href: `/golongan/${g.id}`,
            meta: g.age,
            text: g.summary,
            score: scoreText(
              tokens,
              `${g.name} golongan`,
              `${g.summary} ${g.about.join(' ')} ${g.activities.join(' ')} ${g.units.map((u) => u.name).join(' ')}`,
            ),
          })),
          ...kwarran.map((k) => ({
            title: `Kwarran ${k.name}`,
            href: `/wilayah/${k.slug}`,
            meta: `${k.gudepCount} gudep`,
            text: `Gugus depan di Kecamatan ${k.name}`,
            score: scoreText(tokens, `Kwarran ${k.name} kecamatan`, 'wilayah gudep gugus depan'),
          })),
        ]),
      },
      {
        id: 'halaman',
        label: 'Halaman',
        icon: Compass,
        hits: rank(staticPages.map((p) => ({ title: p.title, href: p.href, text: '', score: scoreText(tokens, p.title, p.body) }))),
      },
    ].filter((g) => g.hits.length > 0);
  }
  const total = groups.reduce((n, g) => n + g.hits.length, 0);

  return (
    <>
      <PageHero
        eyebrow="Pencarian"
        title={q ? `Hasil untuk “${q}”` : 'Cari di situs'}
        scene="forest"
        top={<Breadcrumbs items={[{ label: 'Cari' }]} />}
      >
        <form action="/cari" role="search" className="relative max-w-xl">
          <label htmlFor="cari-q" className="sr-only">
            Kata kunci
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" aria-hidden="true" />
          <input
            id="cari-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Mis. perkemahan, formulir, Jatibarang"
            className="h-14 w-full rounded-pill border border-border-strong bg-surface-base pl-12 pr-32 text-base text-text-primary shadow-md placeholder:text-text-muted"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 inline-flex min-h-touch -translate-y-1/2 items-center rounded-pill bg-action-primary px-5 font-semibold text-text-on-brand hover:bg-action-primary-hover"
          >
            Cari
          </button>
        </form>
      </PageHero>

      <div className="civic-container pb-16 pt-6 sm:pb-24">
        {!q ? (
          <p className="text-text-secondary">
            Ketik kata kunci untuk mencari di seluruh berita, agenda, dokumen, album, golongan, dan wilayah.
          </p>
        ) : total === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Tidak ada yang cocok"
            description="Coba kata yang lebih umum, periksa ejaan, atau jelajahi agenda dan pusat dokumen."
            action={{ label: 'Lihat agenda', href: '/agenda' }}
          />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
            <nav aria-label="Kelompok hasil" className="lg:sticky lg:top-28 lg:self-start">
              <p role="status" className="font-semibold text-text-primary">
                {total} hasil
              </p>
              <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                {groups.map((g) => (
                  <li key={g.id}>
                    <a
                      href={`#hasil-${g.id}`}
                      className="inline-flex min-h-touch items-center gap-2 rounded-pill px-3 text-sm font-medium text-text-secondary hover:bg-surface-base hover:text-text-primary"
                    >
                      <g.icon className="h-4 w-4" aria-hidden="true" />
                      {g.label}
                      <span className="rounded-pill bg-surface-subtle px-2 text-xs tabular-nums">{g.hits.length}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="space-y-12">
              {groups.map((g) => (
                <section key={g.id} id={`hasil-${g.id}`} aria-labelledby={`hasil-${g.id}-title`} className="scroll-mt-28">
                  <h2 id={`hasil-${g.id}-title`} className="flex items-center gap-2 font-display text-2xl font-semibold text-text-primary">
                    <g.icon className="h-5 w-5 text-text-accent" aria-hidden="true" />
                    {g.label}
                  </h2>
                  <ul className="mt-4 divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface-base">
                    {g.hits.map((h) => (
                      <li key={h.href}>
                        <Link href={h.href} className="group block px-5 py-4 hover:bg-surface-meadow">
                          <span className="block font-semibold text-text-primary group-hover:text-text-accent">
                            <Mark text={h.title} tokens={tokens} />
                          </span>
                          {h.meta && <span className="mt-0.5 block text-xs text-text-secondary">{h.meta}</span>}
                          {h.text && (
                            <span className="mt-1.5 block text-sm leading-relaxed text-text-secondary">
                              <Mark text={h.text} tokens={tokens} />
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
