'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Animasi "muncul saat digulir" yang aman:
 * - Tanpa JS (atau sebelum hidrasi) konten tampil normal.
 * - Elemen yang SUDAH terlihat saat dimuat tidak disembunyikan, jadi tidak ada kedipan.
 * - "Kurangi gerakan" di OS → tidak ada animasi sama sekali (globals.css + cek di sini).
 */
export const Reveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** Jeda (ms) untuk efek bertahap pada daftar. */
  delay?: number;
  as?: 'div' | 'li' | 'section' | 'article';
}> = ({ children, className, delay = 0, as = 'div' }) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return; // sudah terlihat: biarkan

    el.dataset.reveal = 'pending';
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.reveal = 'shown';
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref} className={cn(className)} style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}>
      {children}
    </Tag>
  );
};
