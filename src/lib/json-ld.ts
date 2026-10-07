/**
 * Serialisasi JSON-LD untuk `<script type="application/ld+json">`.
 *
 * `JSON.stringify` saja tidak aman: judul berita/agenda dari CMS yang berisi
 * `</script><script>…` akan menutup blok dan dieksekusi sebagai skrip (stored XSS).
 * Karakter yang bisa memutus konteks HTML/JS di-escape ke bentuk \uXXXX — tetap JSON
 * valid dan dibaca mesin pencari sebagai karakter yang sama.
 */
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);
const UNSAFE = new RegExp(`[<>&${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}]`, 'g');

const toUnicodeEscape = (c: string) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`;

export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(UNSAFE, toUnicodeEscape);
}
