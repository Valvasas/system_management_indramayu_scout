'use client';

import React, { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/** Tombol salin tautan. Satu-satunya bagian klien di halaman detail berita. */
export const ShareLink: React.FC<{ title: string }> = ({ title }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={copy} aria-label={`Salin tautan: ${title}`}>
        {copied ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Link2 className="h-4 w-4" aria-hidden="true" />
        )}
        {copied ? 'Tautan tersalin' : 'Salin tautan'}
      </Button>
      <span aria-live="polite" className="sr-only">
        {copied ? 'Tautan berita tersalin ke papan klip' : ''}
      </span>
    </div>
  );
};
