"use client";
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
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === c ? 'bg-green-700 text-white' : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'}`}
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
                <Link href={`/berita/${news.slug}`} className="hover:text-green-700 transition-colors">
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
}
