'use client';

import React, { useState } from 'react';
import { mockDocuments } from '@/lib/data/mock-data';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DokumenPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const categories = [
    'Semua',
    'Jukran & Juklak',
    'Surat Keputusan',
    'Formulir',
    'Panduan Teknis',
    'Template Administrasi',
  ];

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesCat = selectedCategory === 'Semua' || doc.category === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const getFormatBadgeVariant = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return 'danger';
      case 'DOCX':
        return 'info';
      case 'XLSX':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <div className="civic-container py-12">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
          {t('nav.document') || 'Pusat Unduhan Dokumen'}
        </h1>
        <p className="text-neutral-600 max-w-2xl text-base sm:text-lg">
          Kumpulan berkas resmi, petunjuk penyelenggaraan (Juklak/Juknis), Surat Keputusan, dan formulir administrasi kepramukaan Indramayu.
        </p>
      </header>

      {/* Search & Filter Bar */}
      <div className="mb-8 space-y-4">
        <div className="max-w-md">
          <label htmlFor="search-doc" className="sr-only">
            Cari dokumen
          </label>
          <input
            id="search-doc"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul dokumen atau kata kunci..."
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm bg-white"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter kategori dokumen">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-600 ${
                  isActive
                    ? 'bg-green-700 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Grid */}
      {filteredDocuments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-neutral-500">Tidak ada dokumen yang sesuai dengan pencarian Anda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} hoverable className="h-full flex flex-col justify-between">
              <CardContent className="p-6 flex-grow flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Badge variant={getFormatBadgeVariant(doc.type)}>
                    {doc.type}
                  </Badge>
                  <span className="text-xs text-neutral-400 font-mono">
                    {doc.size}
                  </span>
                </div>

                <h2 className="font-bold text-base sm:text-lg text-neutral-900 leading-snug mb-2">
                  {doc.title}
                </h2>

                <p className="text-xs text-neutral-600 flex-grow mb-4 leading-relaxed">
                  {doc.description || 'Dokumen resmi terverifikasi Kwartir Cabang Indramayu.'}
                </p>

                <div className="pt-4 border-t border-neutral-100 mt-auto flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">
                    Rilis: {doc.date}
                  </span>
                  <a
                    href={doc.url}
                    download
                    className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 rounded px-2 py-1 min-h-[44px]"
                    aria-label={`Unduh ${doc.title} format ${doc.type}`}
                  >
                    Unduh Berkas <span aria-hidden="true">&darr;</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
