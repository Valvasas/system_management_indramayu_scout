/**
 * Pencarian situs sederhana di sisi server: mencocokkan setiap kata kunci (tanpa
 * membedakan huruf besar/kecil & diakritik) di judul dan isi, lalu mengurutkan
 * hasil dengan bobot judul lebih tinggi. Cukup untuk ratusan entri; ganti ke
 * full-text search PostgreSQL bila konten sudah ribuan.
 */

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');

export function tokenize(q: string): string[] {
  return normalize(q)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2)
    .slice(0, 8);
}

/** Skor 0 = tidak cocok. Semua token wajib muncul di judul ATAU isi. */
export function scoreText(tokens: string[], title: string, body = ''): number {
  if (tokens.length === 0) return 0;
  const t = normalize(title);
  const b = normalize(body);
  let score = 0;
  for (const tok of tokens) {
    const inTitle = t.includes(tok);
    const inBody = b.includes(tok);
    if (!inTitle && !inBody) return 0;
    score += inTitle ? 3 : 1;
  }
  return score;
}

/** Potongan teks di sekitar kecocokan pertama, untuk pratinjau hasil. */
export function snippet(text: string, tokens: string[], radius = 90): string {
  const n = normalize(text);
  const hit = tokens.map((t) => n.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
  if (hit === undefined) return text.slice(0, radius * 2).trim() + (text.length > radius * 2 ? '…' : '');
  const start = Math.max(0, hit - radius);
  const end = Math.min(text.length, hit + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

/** Pecah teks menjadi bagian biasa & bagian yang cocok (untuk <mark>), aman tanpa HTML mentah. */
export function highlight(text: string, tokens: string[]): { text: string; match: boolean }[] {
  if (tokens.length === 0) return [{ text, match: false }];
  const n = normalize(text);
  const marks = new Array<boolean>(text.length).fill(false);
  for (const tok of tokens) {
    let i = n.indexOf(tok);
    while (i >= 0) {
      for (let j = i; j < i + tok.length && j < marks.length; j++) marks[j] = true;
      i = n.indexOf(tok, i + tok.length);
    }
  }
  const out: { text: string; match: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = out[out.length - 1];
    if (last && last.match === marks[i]) last.text += text[i];
    else out.push({ text: text[i], match: marks[i] });
  }
  return out;
}
