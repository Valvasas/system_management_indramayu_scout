import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** Route handler unduhan (bukan halaman): jangan pernah lewat next/link (prefetch = ekspor diam-diam). */
const DOWNLOAD = /(\/ekspor|\/templat|kalender\.ics|\/unduh|\.csv|\.xlsx)\b/;

function tsxFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? tsxFiles(p) : p.endsWith('.tsx') ? [p] : [];
  });
}

describe('tautan unduhan', () => {
  it('tidak memakai <Link>/<ButtonLink> tanpa download (mencegah prefetch route ekspor)', () => {
    const offenders: string[] = [];
    for (const file of tsxFiles(path.join(process.cwd(), 'src'))) {
      const src = fs.readFileSync(file, 'utf8');
      for (const m of src.matchAll(/<(Link|ButtonLink)\b([\s\S]*?)>/g)) {
        const attrs = m[2];
        const href = attrs.match(/href=\{?([`'"][^`'"]*[`'"])/)?.[1] ?? '';
        if (DOWNLOAD.test(href) && (m[1] === 'Link' || !/\bdownload\b/.test(attrs)))
          offenders.push(`${path.relative(process.cwd(), file)}: <${m[1]} href=${href}>`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
