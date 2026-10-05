/** Perkiraan waktu baca (±200 kata per menit untuk teks Bahasa Indonesia), minimal 1 menit. */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Isi teks CMS → paragraf. Baris kosong memisahkan paragraf (sesuai petunjuk di formulir CMS). */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
