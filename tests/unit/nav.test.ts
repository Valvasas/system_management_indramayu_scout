import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNav } from '@/components/dashboard/nav';

const pageFor = (href: string) => path.join(process.cwd(), 'src/app/(dashboard)', href.split('?')[0], 'page.tsx');

describe('menu portal', () => {
  it('setiap href menu (semua izin, staf & peserta) punya page.tsx', () => {
    const hrefs = [true, false].flatMap((peserta) => buildNav(peserta, () => true, {}).flatMap((g) => g.items.map((i) => i.href)));
    expect(hrefs.length).toBeGreaterThan(10);
    const missing = [...new Set(hrefs)].filter((h) => !fs.existsSync(pageFor(h)));
    expect(missing).toEqual([]);
  });
});
