'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { mockNews } from '@/lib/data/mock-data';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DetailBeritaPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const news = mockNews.find((n) => n.slug === slug);
  const [copied, setCopied] = useState(false);

  if (!news) {
    return (
      <div className="civic-container py-20 text-center">
        <h1 className="text-2xl font-bold text-neutral-800 mb-4">Berita Tidak Ditemukan</h1>
        <p className="text-neutral-600 mb-6">
          Warta yang Anda cari mungkin telah diarsipkan atau tautannya keliru.
        </p>
        <Link href="/berita">
          <Button variant="primary">Kembali ke Daftar Berita</Button>
        </Link>
      </div>
    );
  }

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="civic-container py-12 max-w-3xl">
      <nav className="mb-6" aria-label="Breadcrumb">
        <Link
          href="/berita"
          className="text-green-700 font-medium inline-flex items-center gap-1.5 hover:underline focus:outline-none focus:ring-2 focus:ring-green-600 rounded"
        >
          <span aria-hidden="true">&larr;</span> Kembali ke Warta Terkini
        </Link>
      </nav>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="brand">{news.category}</Badge>
          <span className="text-xs text-neutral-500">
            {formatDate(news.publishedAt)}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight mb-4">
          {news.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-neutral-600 pb-6 border-b border-neutral-200">
          <span>Oleh: <strong className="text-neutral-800">{news.author}</strong></span>
          <span aria-hidden="true">•</span>
          <span>Kwarcab Gerakan Pramuka Indramayu</span>
        </div>
      </header>

      {/* Featured Image Placeholder / Cover */}
      <div className="aspect-video bg-neutral-200 rounded-lg overflow-hidden mb-8 border border-neutral-300 relative flex items-center justify-center">
        <div className="text-center p-6 text-neutral-500">
          <span className="text-4xl block mb-2" aria-hidden="true">📸</span>
          <span className="text-sm font-medium">Dokumentasi: {news.title}</span>
        </div>
      </div>

      {/* Article Body */}
      <div className="prose prose-neutral max-w-none text-neutral-800 leading-relaxed space-y-5 text-base sm:text-lg">
        <p className="lead font-medium text-lg sm:text-xl text-neutral-900">
          {news.excerpt}
        </p>
        <p>{news.content}</p>
        <p>
          Gerakan Pramuka Kwartir Cabang Indramayu senantiasa berkomitmen untuk memberikan pembinaan
          karakter terbaik bagi peserta didik dari jenjang Siaga, Penggalang, Penegak, hingga Pandega.
          Dukungan seluruh jajaran pimpinan kwartir ranting dan gugus depan pangkalan sekolah menjadi
          kunci terlaksananya kegiatan positif ini secara berkesinambungan.
        </p>
        <p>
          Melalui kegiatan ini diharapkan para kader pramuka di wilayah Kabupaten Indramayu dapat semakin
          tangguh, mandiri, peduli terhadap sesama dan lingkungan, serta siap menjadi teladan bagi masyarakat sekitar.
        </p>
      </div>

      {/* Tags */}
      {news.tags && news.tags.length > 0 && (
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <span className="text-xs uppercase font-semibold text-neutral-500 block mb-2">Topik Terkait:</span>
          <div className="flex flex-wrap gap-2">
            {news.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Social Share */}
      <footer className="mt-8 p-4 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm font-semibold text-neutral-700">Bagikan Warta Ini:</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            aria-label="Salin tautan berita"
          >
            {copied ? 'Tersalin! ✓' : 'Salin Tautan'}
          </Button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(news.title + ' - ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded min-h-[44px] inline-flex items-center"
          >
            WhatsApp
          </a>
        </div>
      </footer>
    </article>
  );
}
