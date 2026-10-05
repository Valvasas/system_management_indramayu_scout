import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge perlu tahu ukuran font kustom (tailwind.config → fontSize). Tanpa ini,
 * `text-display-md` dikira kelas WARNA dan dibuang saat bertemu `text-text-primary`,
 * sehingga judul diam-diam kembali ke ukuran bawaan.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display-xl', 'display-lg', 'display-md'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
