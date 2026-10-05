'use client';

import React, { useState } from 'react';
import { Check, Link2, MessageCircle } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';

/**
 * Bagikan berita: WhatsApp (kanal utama warga & pembina di Indramayu) + salin tautan.
 * Tidak ada skrip berbagi pihak ketiga; WhatsApp dibuka lewat tautan biasa di tab baru.
 */
export const ShareLink: React.FC<{ title: string; url: string }> = ({ title, url }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonStyles('secondary', 'sm')}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        WhatsApp
        <span className="sr-only">(tab baru)</span>
      </a>
      <Button variant="outline" size="sm" onClick={copy} aria-label={`Salin tautan: ${title}`}>
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
        {copied ? 'Tautan tersalin' : 'Salin tautan'}
      </Button>
      <span role="status" className="sr-only">
        {copied ? 'Tautan tersalin ke papan klip' : ''}
      </span>
    </div>
  );
};
