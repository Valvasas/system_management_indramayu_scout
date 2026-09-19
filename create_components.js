const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'components');

const files = {
  'magicui/blur-fade.tsx': `"use client";

import { useRef } from "react";
import { AnimatePresence, motion, useInView, Variants } from "framer-motion";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: {
    hidden: { y: number };
    visible: { y: number };
  };
  duration?: number;
  delay?: number;
  yOffset?: number;
  inView?: boolean;
  inViewMargin?: string;
  blur?: string;
}

export function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  inView = false,
  inViewMargin = "-50px",
  blur = "6px",
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin as any });
  const isInView = !inView || inViewResult;
  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: \`blur(\${blur})\` },
    visible: { y: -yOffset, opacity: 1, filter: \`blur(0px)\` },
  };
  const combinedVariants = variant || defaultVariants;
  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        exit="hidden"
        variants={combinedVariants}
        transition={{
          delay: 0.04 + delay,
          duration,
          ease: "easeOut",
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
`,
  'Header.tsx': `import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-green-700 text-xl flex items-center gap-2">
          <span className="text-2xl">⚜️</span>
          Kwarcab Indramayu
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/tentang" className="text-sm font-medium text-neutral-600 hover:text-green-700">Tentang</Link>
          <Link href="/struktur-organisasi" className="text-sm font-medium text-neutral-600 hover:text-green-700">Struktur</Link>
          <Link href="/berita" className="text-sm font-medium text-neutral-600 hover:text-green-700">Berita</Link>
          <Link href="/agenda" className="text-sm font-medium text-neutral-600 hover:text-green-700">Agenda</Link>
          <Link href="/galeri" className="text-sm font-medium text-neutral-600 hover:text-green-700">Galeri</Link>
          <Link href="/dokumen" className="text-sm font-medium text-neutral-600 hover:text-green-700">Dokumen</Link>
          <Link href="/kontak" className="text-sm font-medium text-neutral-600 hover:text-green-700">Kontak</Link>
        </nav>
        <Link href="/masuk" className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors">
          Portal Internal
        </Link>
      </div>
    </header>
  );
}
`,
  'Footer.tsx': `import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300 py-12 mt-20">
      <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Kwarcab Indramayu</h3>
          <p className="text-sm leading-relaxed mb-4">
            Gedung Kwarcab Pramuka Indramayu<br />
            Jl. Pramuka No. 1, Kabupaten Indramayu<br />
            Jawa Barat 45211
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Tautan Cepat</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/tentang" className="hover:text-green-400">Tentang Kami</Link></li>
            <li><Link href="/berita" className="hover:text-green-400">Berita & Pengumuman</Link></li>
            <li><Link href="/agenda" className="hover:text-green-400">Agenda Kegiatan</Link></li>
            <li><Link href="/dokumen" className="hover:text-green-400">Unduh Dokumen</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Informasi</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/kebijakan-privasi" className="hover:text-green-400">Kebijakan Privasi</Link></li>
            <li><Link href="/aksesibilitas" className="hover:text-green-400">Aksesibilitas</Link></li>
            <li><Link href="/kontak" className="hover:text-green-400">Hubungi Kami</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Kontak</h4>
          <p className="text-sm mb-2">Email: kwarcab.indramayu@pramuka.or.id</p>
          <p className="text-sm">Hotline: +62 812-3456-7890</p>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-neutral-800 text-sm text-center">
        &copy; {new Date().getFullYear()} Kwartir Cabang Gerakan Pramuka Indramayu. Semua Hak Dilindungi.
      </div>
    </footer>
  );
}
`,
  'SkipToContent.tsx': `export default function SkipToContent() {
  return (
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-green-700 text-white px-4 py-2 rounded-md z-50">
      Lewati ke konten utama
    </a>
  );
}
`,
  'Hero.tsx': `import { BlurFade } from "./magicui/blur-fade";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-neutral-50 py-20 lg:py-32 border-b border-neutral-200">
      <div className="container mx-auto px-4 text-center max-w-4xl">
        <BlurFade delay={0.1} inView>
          <span className="inline-block px-3 py-1 mb-6 text-sm font-semibold text-green-700 bg-green-100 rounded-full">
            Kwartir Cabang Gerakan Pramuka Indramayu
          </span>
        </BlurFade>
        
        <BlurFade delay={0.2} inView>
          <h1 className="text-4xl md:text-6xl font-extrabold text-neutral-900 tracking-tight mb-6 font-display">
            Membangun Generasi <br className="hidden md:block"/>
            <span className="text-green-600">Berkarakter & Mandiri</span>
          </h1>
        </BlurFade>
        
        <BlurFade delay={0.3} inView>
          <p className="text-lg md:text-xl text-neutral-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Portal resmi informasi, layanan administrasi, dan pusat kegiatan Pramuka di wilayah Kabupaten Indramayu.
          </p>
        </BlurFade>

        <BlurFade delay={0.4} inView>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/berita" className="px-6 py-3 w-full sm:w-auto bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors shadow-sm">
              Berita Terkini
            </Link>
            <Link href="/agenda" className="px-6 py-3 w-full sm:w-auto bg-white text-neutral-900 font-medium rounded-md border border-neutral-300 hover:bg-neutral-50 transition-colors shadow-sm">
              Lihat Agenda
            </Link>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
`,
  'StatsSection.tsx': `import { BlurFade } from "./magicui/blur-fade";

export default function StatsSection() {
  const stats = [
    { label: "Kwartir Ranting", value: "31" },
    { label: "Gugus Depan", value: "1.200+" },
    { label: "Anggota Aktif", value: "45.000+" },
    { label: "Pembina", value: "2.500+" },
  ];

  return (
    <section className="py-16 bg-white border-b border-neutral-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <BlurFade key={i} delay={0.1 * i} inView>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-green-700 mb-2 font-display">{stat.value}</div>
                <div className="text-sm font-medium text-neutral-600 uppercase tracking-wider">{stat.label}</div>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
`,
  'AboutPreview.tsx': `import { BlurFade } from "./magicui/blur-fade";
import Link from "next/link";

export default function AboutPreview() {
  return (
    <section className="py-20 bg-neutral-50 border-b border-neutral-200">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <BlurFade inView>
            <div className="aspect-square bg-neutral-200 rounded-lg border border-neutral-300 overflow-hidden flex items-center justify-center relative">
              <div className="text-neutral-400 font-medium flex flex-col items-center gap-2">
                <span className="text-4xl">📸</span>
                <span>Foto Kegiatan / Gedung</span>
              </div>
            </div>
          </BlurFade>
          
          <BlurFade delay={0.2} inView>
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-6 font-display">Tentang Kwarcab Indramayu</h2>
              <p className="text-neutral-600 leading-relaxed mb-6">
                Kwartir Cabang Gerakan Pramuka Indramayu adalah organisasi pendidikan nonformal yang menyelenggarakan pendidikan kepanduan di Kabupaten Indramayu. Kami berkomitmen untuk membentuk generasi muda yang beriman, bertakwa, berakhlak mulia, berjiwa patriotik, taat hukum, disiplin, menjunjung tinggi nilai-nilai luhur bangsa.
              </p>
              <ul className="space-y-3 mb-8">
                {["Pembinaan Karakter", "Pengabdian Masyarakat", "Pelestarian Lingkungan"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-neutral-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs">✓</div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/tentang" className="inline-flex items-center font-semibold text-green-700 hover:text-green-800 transition-colors">
                Selengkapnya &rarr;
              </Link>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
`,
  'AgendaPreview.tsx': `import { BlurFade } from "./magicui/blur-fade";
import Link from "next/link";

export default function AgendaPreview() {
  const agendas = [
    { id: 1, title: "Lomba Tingkat III Kwarcab Indramayu", date: "15 Okt 2026", status: "Akan Datang" },
    { id: 2, title: "Kursus Mahir Dasar (KMD) Gelombang 2", date: "22 Okt 2026", status: "Akan Datang" },
    { id: 3, title: "Rapat Kerja Cabang Tahunan", date: "05 Nov 2026", status: "Akan Datang" },
  ];

  return (
    <section className="py-20 bg-white border-b border-neutral-200">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900 mb-2 font-display">Agenda Mendatang</h2>
            <p className="text-neutral-600">Jadwal kegiatan Pramuka tingkat Cabang.</p>
          </div>
          <Link href="/agenda" className="hidden sm:block text-sm font-semibold text-green-700 hover:underline">
            Lihat Semua Agenda
          </Link>
        </div>

        <div className="space-y-4">
          {agendas.map((agenda, i) => (
            <BlurFade key={agenda.id} delay={i * 0.1} inView>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-neutral-200 rounded-lg hover:border-green-300 transition-colors shadow-sm">
                <div className="mb-4 sm:mb-0">
                  <h3 className="font-bold text-neutral-900 text-lg mb-1">{agenda.title}</h3>
                  <div className="text-sm text-neutral-500">📅 {agenda.date}</div>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-md">
                  {agenda.status}
                </span>
              </div>
            </BlurFade>
          ))}
        </div>
        
        <div className="mt-8 text-center sm:hidden">
          <Link href="/agenda" className="text-sm font-semibold text-green-700 hover:underline">
            Lihat Semua Agenda &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
`,
  'NewsPreview.tsx': `import { BlurFade } from "./magicui/blur-fade";
import Link from "next/link";

export default function NewsPreview() {
  const news = [
    { id: 1, title: "Pramuka Indramayu Raih Juara Umum Jambore Daerah", category: "Prestasi", date: "10 Sep 2026" },
    { id: 2, title: "Pembukaan Pendaftaran Anggota Saka Bhayangkara", category: "Pengumuman", date: "08 Sep 2026" },
    { id: 3, title: "Giat Bersih Pantai Bersama Pramuka Peduli", category: "Kegiatan", date: "05 Sep 2026" },
  ];

  return (
    <section className="py-20 bg-neutral-50 border-b border-neutral-200">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900 mb-2 font-display">Berita & Informasi</h2>
            <p className="text-neutral-600">Kabar terbaru dari Kwartir Cabang Indramayu.</p>
          </div>
          <Link href="/berita" className="hidden sm:block text-sm font-semibold text-green-700 hover:underline">
            Lihat Semua Berita
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {news.map((item, i) => (
            <BlurFade key={item.id} delay={i * 0.1} inView>
              <article className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="aspect-[16/9] bg-neutral-200 flex items-center justify-center">
                  <span className="text-neutral-400">Gambar</span>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <span className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">{item.category}</span>
                  <h3 className="font-bold text-lg text-neutral-900 mb-3 line-clamp-2 leading-tight">
                    <Link href={\`/berita/\${item.id}\`} className="hover:text-green-700 transition-colors">{item.title}</Link>
                  </h3>
                  <div className="mt-auto text-xs text-neutral-500">{item.date}</div>
                </div>
              </article>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
`,
  'GalleryPreview.tsx': `import { BlurFade } from "./magicui/blur-fade";
import Link from "next/link";

export default function GalleryPreview() {
  return (
    <section className="py-20 bg-white border-b border-neutral-200">
      <div className="container mx-auto px-4 max-w-6xl text-center">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2 font-display">Galeri Kegiatan</h2>
        <p className="text-neutral-600 mb-10">Dokumentasi kegiatan Pramuka di Kabupaten Indramayu.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[1, 2, 3, 4].map((item, i) => (
            <BlurFade key={item} delay={i * 0.1} inView>
              <div className="aspect-square bg-neutral-200 rounded-lg border border-neutral-300 overflow-hidden flex items-center justify-center hover:opacity-90 transition-opacity">
                <span className="text-neutral-400">Foto {item}</span>
              </div>
            </BlurFade>
          ))}
        </div>

        <Link href="/galeri" className="inline-flex items-center px-6 py-3 bg-neutral-100 text-neutral-900 font-medium rounded-md border border-neutral-300 hover:bg-neutral-200 transition-colors">
          Lihat Semua Galeri
        </Link>
      </div>
    </section>
  );
}
`,
  'AchievementPreview.tsx': `export default function AchievementPreview() {
  return null; // Kita sembunyikan atau tidak perlu terlalu penuh di halaman utama agar "Whitespace creates trust"
}
`,
  'MapSection.tsx': `export default function MapSection() {
  return (
    <section className="bg-neutral-100 py-12 border-b border-neutral-200">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-300">
          <div className="aspect-video md:aspect-[21/9] bg-neutral-200 flex items-center justify-center rounded border border-neutral-200">
            <div className="text-center">
              <span className="text-4xl block mb-2">🗺️</span>
              <span className="text-neutral-500 font-medium">Peta Lokasi Kwarcab Indramayu</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
`
};

for (const [relativePath, content] of Object.entries(files)) {
  const absolutePath = path.join(baseDir, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
  console.log('Created: ' + relativePath);
}
