const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app');

const files = {
  'layout.tsx': `import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import SkipToContent from "@/components/SkipToContent";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "Rumah Pramuka Indramayu",
  description: "Website Resmi Kwartir Cabang Gerakan Pramuka Indramayu",
  manifest: "/manifest.json",
  openGraph: {
    title: "Rumah Pramuka Indramayu",
    description: "Website Resmi Kwartir Cabang Gerakan Pramuka Indramayu",
    type: "website",
    url: "https://pramukaindramayu.or.id",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={\`\${inter.variable} \${dmSans.variable}\`}>
      <body className="antialiased font-sans text-neutral-900 bg-neutral-50 flex flex-col min-h-screen">
        <LanguageProvider>
          <SkipToContent />
          <Header />
          <main id="main-content" className="flex-grow">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}`,
  'page.tsx': `import Hero from "@/components/Hero";
import StatsSection from "@/components/StatsSection";
import AboutPreview from "@/components/AboutPreview";
import AgendaPreview from "@/components/AgendaPreview";
import NewsPreview from "@/components/NewsPreview";
import GalleryPreview from "@/components/GalleryPreview";
import AchievementPreview from "@/components/AchievementPreview";
import MapSection from "@/components/MapSection";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsSection />
      <AboutPreview />
      <AgendaPreview />
      <NewsPreview />
      <GalleryPreview />
      <AchievementPreview />
      <MapSection />
    </>
  );
}`,
  'tentang/page.tsx': `"use client";
import { useLanguage } from "@/context/LanguageContext";

export default function TentangPage() {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-green-800 mb-8">{t("about_title") || "Tentang Kami"}</h1>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Sejarah Gerakan Pramuka Indramayu</h2>
        <p className="text-neutral-700 leading-relaxed">
          Sejarah panjang Gerakan Pramuka di Kabupaten Indramayu...
        </p>
      </section>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Visi & Misi</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
          <h3 className="font-bold mb-2">Visi</h3>
          <p className="mb-4 text-neutral-700">Mewujudkan generasi muda Indramayu yang berkarakter...</p>
          <h3 className="font-bold mb-2">Misi</h3>
          <ul className="list-disc pl-5 text-neutral-700">
            <li>Menyelenggarakan kepramukaan yang berkualitas...</li>
          </ul>
        </div>
      </section>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Nilai-nilai</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <h3 className="font-bold text-green-800 mb-2">Tri Satya</h3>
            <p className="text-sm text-neutral-700">Demi kehormatanku aku berjanji akan bersungguh-sungguh...</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <h3 className="font-bold text-green-800 mb-2">Dasa Darma</h3>
            <ol className="list-decimal pl-5 text-sm text-neutral-700">
              <li>Takwa kepada Tuhan Yang Maha Esa...</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}`,
  'struktur-organisasi/page.tsx': `"use client";
import { useLanguage } from "@/context/LanguageContext";
import { organizationStructure, kwartirRanting } from "@/lib/mock-data";

export default function StrukturOrganisasiPage() {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-green-800 mb-8">{t("structure_title") || "Struktur Organisasi"}</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Susunan Pengurus Kwarcab Indramayu</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {organizationStructure.map((dept, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
              <h3 className="font-bold text-lg mb-3 text-green-700">{dept.name}</h3>
              <ul className="space-y-2">
                {dept.members.map((member, midx) => (
                  <li key={midx} className="text-neutral-700 flex flex-col">
                    <span className="font-medium">{member.name}</span>
                    <span className="text-sm text-neutral-500">{member.role}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">31 Kwartir Ranting (Kwarran)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {kwartirRanting.map((k, idx) => (
            <div key={idx} className="bg-neutral-100 px-4 py-3 rounded-md text-center text-sm font-medium text-neutral-800 border border-neutral-200 hover:bg-green-50 hover:border-green-300 transition-colors">
              {k.name}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}`,
  'berita/page.tsx': `"use client";
import { useState } from "react";
import Link from "next/link";
import { newsData } from "@/lib/mock-data";
import { useLanguage } from "@/context/LanguageContext";

export default function BeritaPage() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState("Semua");
  const categories = ["Semua", "Kegiatan", "Pengumuman", "Prestasi", "Pelatihan"];

  const filteredNews = filter === "Semua" ? newsData : newsData.filter(n => n.category === filter);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-green-800 mb-8">{t("news_title") || "Berita & Informasi"}</h1>
      
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(c => (
          <button 
            key={c} 
            onClick={() => setFilter(c)}
            className={\`px-4 py-2 rounded-full text-sm font-medium transition-colors \${filter === c ? 'bg-green-700 text-white' : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'}\`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {filteredNews.map(news => (
          <article key={news.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
            <div className="aspect-video bg-neutral-300 relative">
              {news.image && <img src={news.image} alt={news.title} className="object-cover w-full h-full" />}
            </div>
            <div className="p-6 flex-grow flex flex-col">
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">{news.category}</span>
              <h2 className="text-xl font-bold mb-2 line-clamp-2">
                <Link href={\`/berita/\${news.slug}\`} className="hover:text-green-700 transition-colors">
                  {news.title}
                </Link>
              </h2>
              <p className="text-neutral-600 text-sm mb-4 line-clamp-3">{news.excerpt}</p>
              <div className="mt-auto text-xs text-neutral-500">
                {news.date} • {news.author}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}`,
  'berita/[slug]/page.tsx': `"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { newsData } from "@/lib/mock-data";

export default function DetailBeritaPage() {
  const params = useParams();
  const news = newsData.find(n => n.slug === params.slug);

  if (!news) {
    return <div className="container mx-auto px-4 py-20 text-center">Berita tidak ditemukan</div>;
  }

  return (
    <article className="container mx-auto px-4 py-12 max-w-3xl">
      <Link href="/berita" className="text-green-700 font-medium inline-flex items-center mb-6 hover:underline">
        &larr; Kembali ke Daftar Berita
      </Link>
      <header className="mb-8">
        <span className="text-sm font-semibold text-green-700 uppercase tracking-wider">{news.category}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mt-2 mb-4 leading-tight">{news.title}</h1>
        <div className="flex items-center text-neutral-500 text-sm">
          <span>Oleh: {news.author}</span>
          <span className="mx-2">•</span>
          <time>{news.date}</time>
        </div>
      </header>
      
      {news.image && (
        <figure className="mb-8">
          <img src={news.image} alt={news.title} className="w-full h-auto rounded-lg" />
          <figcaption className="text-sm text-neutral-500 mt-2 text-center">Dokumentasi: {news.title}</figcaption>
        </figure>
      )}

      <div className="prose prose-neutral max-w-none prose-p:leading-relaxed prose-a:text-green-700">
        <p>{news.content}</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
      </div>

      <div className="mt-12 pt-8 border-t border-neutral-200">
        <h3 className="font-semibold mb-4">Bagikan:</h3>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-md text-sm font-medium transition-colors">Facebook</button>
          <button className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-md text-sm font-medium transition-colors">Twitter</button>
          <button className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-md text-sm font-medium transition-colors">WhatsApp</button>
        </div>
      </div>
    </article>
  );
}`,
  'agenda/page.tsx': `"use client";
import { useState } from "react";
import Link from "next/link";
import { agendaData } from "@/lib/mock-data";
import { useLanguage } from "@/context/LanguageContext";

export default function AgendaPage() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState("Akan Datang");
  const statuses = ["Akan Datang", "Berlangsung", "Selesai"];

  const filteredAgenda = agendaData.filter(a => a.status === filter);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-green-800 mb-8">{t("agenda_title") || "Agenda Kegiatan"}</h1>
      
      <div className="flex flex-wrap gap-2 mb-8">
        {statuses.map(s => (
          <button 
            key={s} 
            onClick={() => setFilter(s)}
            className={\`px-4 py-2 rounded-full text-sm font-medium transition-colors \${filter === s ? 'bg-green-700 text-white' : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'}\`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredAgenda.map(agenda => (
          <Link href={\`/agenda/\${agenda.slug}\`} key={agenda.id} className="block bg-white p-6 rounded-lg shadow-sm border border-neutral-200 hover:border-green-500 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 mb-1">{agenda.title}</h2>
                <div className="text-neutral-600 text-sm flex gap-4">
                  <span>📅 {agenda.date}</span>
                  <span>📍 {agenda.location}</span>
                </div>
              </div>
              <div className="shrink-0">
                <span className={\`px-3 py-1 rounded-full text-xs font-semibold \${
                  agenda.status === 'Akan Datang' ? 'bg-blue-100 text-blue-800' :
                  agenda.status === 'Berlangsung' ? 'bg-green-100 text-green-800' :
                  'bg-neutral-100 text-neutral-800'
                }\`}>
                  {agenda.status}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}`,
  'agenda/[slug]/page.tsx': `"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { agendaData } from "@/lib/mock-data";

export default function DetailAgendaPage() {
  const params = useParams();
  const agenda = agendaData.find(a => a.slug === params.slug);

  if (!agenda) return <div className="container mx-auto py-20 text-center">Agenda tidak ditemukan</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href="/agenda" className="text-green-700 font-medium inline-flex items-center mb-6 hover:underline">
        &larr; Kembali ke Daftar Agenda
      </Link>
      
      <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200">
        <h1 className="text-3xl font-bold text-neutral-900 mb-4">{agenda.title}</h1>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-neutral-700 mb-2">Detail Pelaksanaan</h3>
            <ul className="space-y-3 text-neutral-600">
              <li><strong>Tanggal:</strong> {agenda.date}</li>
              <li><strong>Waktu:</strong> {agenda.time || "08.00 - Selesai"}</li>
              <li><strong>Lokasi:</strong> {agenda.location}</li>
              <li><strong>Status:</strong> {agenda.status}</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-700 mb-2">Informasi Tambahan</h3>
            <ul className="space-y-3 text-neutral-600">
              <li><strong>Narahubung:</strong> Kak Budi (0812-XXXX-XXXX)</li>
              <li><strong>Peserta:</strong> Pramuka Penegak se-Indramayu</li>
            </ul>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold mb-3">Deskripsi Kegiatan</h3>
          <p className="text-neutral-700 leading-relaxed">{agenda.description || "Deskripsi lengkap mengenai kegiatan ini belum tersedia."}</p>
        </div>

        <div className="border-t border-neutral-200 pt-6">
          <h3 className="font-semibold mb-3">Dokumen Pendukung</h3>
          <a href="#" className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors">
            Unduh Juklak & Juknis (PDF)
          </a>
        </div>
      </div>
    </div>
  );
}`,
  'galeri/page.tsx': `"use client";
import Link from "next/link";
import { galleryData } from "@/lib/mock-data";
import { useLanguage } from "@/context/LanguageContext";

export default function GaleriPage() {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-green-800 mb-8">{t("gallery_title") || "Galeri Kegiatan"}</h1>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryData.map(album => (
          <Link href={\`/galeri/\${album.slug}\`} key={album.id} className="group block">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="aspect-[4/3] bg-neutral-200 relative overflow-hidden">
                {album.cover && (
                  <img 
                    src={album.cover} 
                    alt={album.title} 
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {album.photoCount} Foto
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-neutral-900 group-hover:text-green-700 transition-colors line-clamp-1">{album.title}</h3>
                <p className="text-sm text-neutral-500 mt-1">{album.date}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}`,
  'galeri/[slug]/page.tsx': `"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { galleryData } from "@/lib/mock-data";

export default function DetailGaleriPage() {
  const params = useParams();
  const album = galleryData.find(a => a.slug === params.slug);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!album) return <div className="container mx-auto py-20 text-center">Album tidak ditemukan</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/galeri" className="text-green-700 font-medium inline-flex items-center mb-6 hover:underline">
        &larr; Kembali ke Galeri
      </Link>
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">{album.title}</h1>
        <p className="text-neutral-500">{album.date} • {album.photoCount} Foto</p>
        <p className="mt-4 text-neutral-700 max-w-3xl">{album.description}</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {album.photos?.map((photo, idx) => (
          <button 
            key={idx}
            onClick={() => setSelectedPhoto(photo.url)}
            className="aspect-square bg-neutral-200 rounded-md overflow-hidden relative group"
          >
            <img src={photo.url} alt={photo.caption} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-neutral-300 bg-black/50 w-10 h-10 rounded-full flex items-center justify-center"
            aria-label="Tutup"
          >
            ✕
          </button>
          <img src={selectedPhoto} alt="Zoomed in" className="max-w-full max-h-[90vh] object-contain" />
        </div>
      )}
    </div>
  );
}`,
  'prestasi/page.tsx': `"use client";
import { achievementsData } from "@/lib/mock-data";
import { useLanguage } from "@/context/LanguageContext";

export default function PrestasiPage() {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-green-800 mb-8">{t("achievement_title") || "Daftar Prestasi"}</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="p-4 font-semibold text-neutral-700">Tahun</th>
                <th className="p-4 font-semibold text-neutral-700">Penghargaan</th>
                <th className="p-4 font-semibold text-neutral-700">Tingkat</th>
                <th className="p-4 font-semibold text-neutral-700">Penerima</th>
              </tr>
            </thead>
            <tbody>
              {achievementsData.map((item, idx) => (
                <tr key={idx} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <td className="p-4 text-neutral-600 font-medium">{item.year}</td>
                  <td className="p-4 text-neutral-900 font-bold">{item.title}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                      {item.level}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-600">{item.recipient}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}`,
  'dokumen/page.tsx': `"use client";
import { documentsData } from "@/lib/mock-data";

export default function DokumenPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-green-800 mb-4">Pusat Unduhan Dokumen</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Kumpulan dokumen resmi, panduan, jukran, dan formulir terkait Gerakan Pramuka Kwartir Cabang Indramayu yang dapat diunduh oleh masyarakat dan anggota.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documentsData.map(doc => (
          <div key={doc.id} className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200 flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-xs font-medium bg-neutral-100 text-neutral-600 px-2 py-1 rounded uppercase tracking-wider">{doc.type}</span>
            </div>
            <h3 className="font-bold text-lg mb-2 text-neutral-900">{doc.title}</h3>
            <p className="text-sm text-neutral-500 mb-6 flex-grow">{doc.size} • Diperbarui: {doc.date}</p>
            <a href={doc.url} download className="w-full text-center px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-md transition-colors">
              Unduh Dokumen
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}`,
  'kontak/page.tsx': `export default function KontakPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-green-800 mb-8">Hubungi Kami</h1>
      
      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-semibold mb-6">Informasi Kontak Sekretariat</h2>
          <div className="space-y-6 text-neutral-700">
            <div>
              <strong className="block text-neutral-900">Alamat:</strong>
              <p>Gedung Kwarcab Pramuka Indramayu<br />Jl. Pramuka No. 1, Kabupaten Indramayu, Jawa Barat 45211</p>
            </div>
            <div>
              <strong className="block text-neutral-900">Jam Pelayanan:</strong>
              <p>Senin - Jumat: 08.00 - 16.00 WIB<br />Sabtu - Minggu: Tutup</p>
            </div>
            <div>
              <strong className="block text-neutral-900">Kontak:</strong>
              <p>Email: kwarcab.indramayu@pramuka.or.id<br />WhatsApp Hotline: +62 812-3456-7890</p>
            </div>
          </div>
          
          <div className="mt-8 bg-neutral-200 h-64 rounded-lg overflow-hidden flex items-center justify-center border border-neutral-300">
            <span className="text-neutral-500 font-medium">Peta Interaktif (Google Maps Embed)</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200">
          <h2 className="text-2xl font-semibold mb-6">Kirim Pesan</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">Nama Lengkap</label>
              <input type="text" id="name" className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow" placeholder="Masukkan nama Anda" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">Alamat Email</label>
              <input type="email" id="email" className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow" placeholder="email@contoh.com" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">Pesan / Pertanyaan</label>
              <textarea id="message" rows={5} className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow resize-none" placeholder="Tuliskan pesan Anda di sini..."></textarea>
            </div>
            <button type="button" className="w-full px-4 py-3 bg-green-700 hover:bg-green-800 text-white font-medium rounded-md transition-colors mt-2">
              Kirim Pesan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}`,
  'kebijakan-privasi/page.tsx': `export default function KebijakanPrivasiPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold text-green-800 mb-8">Kebijakan Privasi</h1>
      
      <div className="prose prose-neutral max-w-none prose-h2:text-2xl prose-h2:text-neutral-900 prose-h2:mt-8 prose-p:text-neutral-700">
        <p className="lead font-medium text-lg text-neutral-800">Pembaruan Terakhir: 1 September 2026</p>
        
        <p>Kwartir Cabang Gerakan Pramuka Indramayu ("kami") berkomitmen untuk melindungi privasi data Anda sesuai dengan <strong>Undang-Undang Pelindungan Data Pribadi (UU PDP) No. 27 Tahun 2022</strong>.</p>

        <h2>1. Pengumpulan Data Informasi</h2>
        <p>Kami hanya mengumpulkan informasi yang esensial untuk keperluan keanggotaan dan pendaftaran kegiatan, termasuk namun tidak terbatas pada nama, nomor induk kependudukan (NIK), alamat, dan kontak.</p>

        <h2>2. Perlindungan Data Anak</h2>
        <p>Dalam memproses data pribadi anggota pramuka yang masih di bawah umur (di bawah 18 tahun), kami mewajibkan persetujuan dari orang tua atau wali sah. Data anak diproses dengan tingkat keamanan tertinggi dan tidak pernah dibagikan kepada pihak ketiga komersial.</p>

        <h2>3. Retensi Data</h2>
        <p>Sesuai dengan kebijakan keterbukaan kami, data profil pengguna dan riwayat kegiatan akan disimpan maksimal selama <strong>5 tahun</strong> setelah pengguna tidak aktif, atau dapat dihapus lebih awal atas permintaan tertulis dari pemilik data.</p>

        <h2>4. Keamanan Data</h2>
        <p>Kami menggunakan standar keamanan teknis terkini untuk melindungi data pribadi Anda dari akses, pengungkapan, atau modifikasi yang tidak sah.</p>
      </div>
    </div>
  );
}`,
  'aksesibilitas/page.tsx': `export default function AksesibilitasPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold text-green-800 mb-8">Pernyataan Aksesibilitas</h1>
      
      <div className="bg-green-50 border-l-4 border-green-700 p-6 mb-8 rounded-r-md">
        <p className="text-neutral-800">
          Kwartir Cabang Gerakan Pramuka Indramayu berkomitmen untuk memastikan situs web ini dapat diakses oleh semua orang, termasuk individu dengan disabilitas. Kami senantiasa berupaya mematuhi standar <strong>Web Content Accessibility Guidelines (WCAG) 2.2 Level AA</strong>.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Fitur Aksesibilitas</h2>
          <ul className="list-disc pl-5 space-y-2 text-neutral-700">
            <li>Dukungan navigasi keyboard penuh (Tab, Shift+Tab, Enter, Space).</li>
            <li>Kontras warna yang memadai untuk kemudahan membaca.</li>
            <li>Struktur heading yang logis untuk pengguna pembaca layar (screen reader).</li>
            <li>Label yang jelas pada semua formulir dan elemen interaktif.</li>
            <li>Tautan lewati ke konten utama (Skip to Content) untuk bypass navigasi.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Panduan Tombol Pintas (Keyboard Shortcuts)</h2>
          <p className="text-neutral-700 mb-4">Gunakan pintasan berikut untuk navigasi cepat:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-3 bg-neutral-100 rounded border border-neutral-200">
              <span className="text-neutral-700">Lompat ke Konten Utama</span>
              <kbd className="px-2 py-1 bg-white border border-neutral-300 rounded shadow-sm text-sm font-mono text-neutral-600">Tab</kbd>
            </div>
            <div className="flex justify-between items-center p-3 bg-neutral-100 rounded border border-neutral-200">
              <span className="text-neutral-700">Kembali ke Beranda</span>
              <kbd className="px-2 py-1 bg-white border border-neutral-300 rounded shadow-sm text-sm font-mono text-neutral-600">Alt + 1</kbd>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-neutral-900">Kontak Bantuan</h2>
          <p className="text-neutral-700">
            Jika Anda mengalami kendala aksesibilitas saat menggunakan situs kami, mohon laporkan melalui email ke <strong>aksesibilitas@pramukaindramayu.or.id</strong> atau hubungi kami di <strong>+62 812-3456-7890</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}`,
  'masuk/page.tsx': `import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-neutral-200">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 text-green-700 hover:text-green-800 font-bold text-2xl">
            ⚜️ Kwarcab Indramayu
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Portal Internal</h1>
          <p className="text-sm text-neutral-500 mt-2">Silakan pilih jalur masuk sesuai peran Anda.</p>
        </div>

        <div className="space-y-4">
          <button className="w-full p-4 text-left border border-neutral-200 hover:border-green-500 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 group-hover:bg-green-200">
              👤
            </div>
            <div>
              <strong className="block text-neutral-900">Anggota / Penggalang</strong>
              <span className="text-xs text-neutral-500">Masuk menggunakan Nomor KTA dan PIN</span>
            </div>
          </button>
          
          <button className="w-full p-4 text-left border border-neutral-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 group-hover:bg-blue-200">
              🏢
            </div>
            <div>
              <strong className="block text-neutral-900">Staff & Pengurus Kwarcab</strong>
              <span className="text-xs text-neutral-500">Masuk menggunakan Email Resmi</span>
            </div>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-200 text-center">
          <p className="text-xs text-neutral-500 mb-4 bg-yellow-50 p-3 rounded text-left border border-yellow-200 text-yellow-800">
            🔒 <strong>Keamanan:</strong> Pastikan URL di browser Anda adalah <em>pramukaindramayu.or.id</em> sebelum memasukkan kredensial.
          </p>
          <Link href="/" className="text-sm text-green-700 font-medium hover:underline">
            &larr; Kembali ke Beranda Publik
          </Link>
        </div>
      </div>
    </div>
  );
}`,
  'not-found.tsx': `import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl mb-4">🧭</div>
      <h1 className="text-4xl font-bold text-green-800 mb-4">Waduh, Salah Jejak!</h1>
      <p className="text-xl text-neutral-600 mb-8 max-w-lg">
        Halaman yang Kakak cari sepertinya tidak ada atau sudah dipindahkan. Mari kita kembali ke jalur yang benar.
      </p>
      <Link 
        href="/" 
        className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-md transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}`
};

for (const [relativePath, content] of Object.entries(files)) {
  const absolutePath = path.join(baseDir, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
  console.log('Created: ' + relativePath);
}
