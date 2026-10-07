import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { permissionMatrixMarkdown } from '@/lib/auth/permission-matrix';

describe('dokumen otorisasi sinkron dengan kode', () => {
  it('matriks izin di docs/security/authorization-model.md sama dengan permissions.ts (npm run docs:matrix)', () => {
    const doc = fs.readFileSync(path.join(process.cwd(), 'docs/security/authorization-model.md'), 'utf8');
    const block = doc.split('<!-- matriks:mulai -->')[1]?.split('<!-- matriks:selesai -->')[0]?.trim();
    expect(block).toBe(permissionMatrixMarkdown());
  });
});
