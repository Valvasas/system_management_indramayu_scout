import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CompetencyGroups } from '@/components/dashboard/competency/CompetencyGroups';
import { ProgressMeter } from '@/components/dashboard/competency/ProgressMeter';
import { summarizeProgress, type RequirementLike, type VerificationLike } from '@/features/competency/progress';

const req = (code: string, over: Partial<RequirementLike> = {}): RequirementLike => ({
  id: `id-${code}`,
  kind: 'SKU',
  golongan: 'PENGGALANG',
  level: 'Ramu',
  code,
  title: `Contoh syarat ${code} — ganti dengan teks resmi`,
  description: null,
  sortOrder: 0,
  active: true,
  ...over,
});
const at = new Date('2026-10-01T03:00:00Z');
const ver = (requirementId: string, over: Partial<VerificationLike> = {}): VerificationLike => ({
  requirementId,
  verifiedAt: at,
  verifiedByName: 'Kak Rina',
  note: 'Catatan internal pembina',
  revokedAt: null,
  revokedByName: null,
  ...over,
});

const groups = summarizeProgress(
  'PENGGALANG',
  [req('R1', { sortOrder: 1 }), req('R2', { sortOrder: 2 }), req('R3', { sortOrder: 3 })],
  [ver('id-R1'), ver('id-R2', { revokedAt: at, revokedByName: 'Kak Budi', note: 'Alasan internal' })],
);

describe('tampilan kemajuan SKU/SKK (2.3)', () => {
  it('kemajuan terbaca sebagai teks; bilah hanya hiasan (aria-hidden)', () => {
    const html = renderToStaticMarkup(React.createElement(ProgressMeter, { verified: 2, total: 5, percent: 40 }));
    expect(html).toContain('2 dari 5 terverifikasi');
    expect(html).toContain('40%');
    expect(html).toMatch(/aria-hidden="true"[^>]*><div[^>]*style="width:40%"/);
    expect(renderToStaticMarkup(React.createElement(ProgressMeter, { verified: 3, total: 3, percent: 100 }))).toContain('Lengkap');
  });

  it('status tiap syarat = ikon + teks; tanggal & pemverifikasi tampil; catatan hanya untuk staf', () => {
    const staff = renderToStaticMarkup(React.createElement(CompetencyGroups, { groups, showInternal: true }));
    expect(staff).toContain('1 dari 3 terverifikasi');
    for (const label of ['Terverifikasi', 'Dibatalkan', 'Belum']) expect(staff).toContain(label);
    expect(staff).toContain('1 Oktober 2026 · oleh Kak Rina');
    expect(staff).toContain('Catatan internal pembina');
    expect(staff).toContain('Alasan internal');
    expect(staff.match(/<h3 /g)).toHaveLength(1);

    const self = renderToStaticMarkup(React.createElement(CompetencyGroups, { groups, showInternal: false, idPrefix: 'sku-saya' }));
    expect(self).not.toContain('Catatan internal');
    expect(self).not.toContain('Alasan internal');
    expect(self).toContain('id="sku-saya-sku-0"');
  });

  it('kontrol verifikasi hanya dirender bila diberikan', () => {
    const control = (item: (typeof groups)[number]['items'][number]) =>
      React.createElement('span', { 'data-kontrol': item.requirement.code }, 'kontrol');
    const withControl = renderToStaticMarkup(React.createElement(CompetencyGroups, { groups, showInternal: true, control }));
    expect(withControl.match(/data-kontrol=/g)).toHaveLength(3);
    expect(renderToStaticMarkup(React.createElement(CompetencyGroups, { groups, showInternal: true }))).not.toContain('data-kontrol');
  });

  it('kelompok lengkap dilipat untuk peserta, tetap terbuka untuk staf (pesan hasil tidak tersembunyi)', () => {
    const done = summarizeProgress('PENGGALANG', [req('S1', { kind: 'SKK', level: 'Contoh SKK' })], [ver('id-S1')]);
    const openCount = (html: string) => (html.match(/<details[^>]* open=""/g) ?? []).length;
    expect(openCount(renderToStaticMarkup(React.createElement(CompetencyGroups, { groups: done, showInternal: false })))).toBe(0);
    expect(
      openCount(renderToStaticMarkup(React.createElement(CompetencyGroups, { groups: done, showInternal: true, collapseComplete: false }))),
    ).toBe(1);
    expect(openCount(renderToStaticMarkup(React.createElement(CompetencyGroups, { groups, showInternal: false })))).toBe(1);
  });
});
