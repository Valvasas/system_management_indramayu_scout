import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { checkbox, optionalCoordinate, optionalIsoDate, optionalText, parseForm, phone, requiredText } from '@/lib/forms';

const form = (entries: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};

describe('parseForm', () => {
  const schema = z.object({ name: requiredText('Nama', 10), note: optionalText(5), agree: checkbox });

  it('memangkas spasi dan menerima isian valid', () => {
    const r = parseForm(schema, form({ name: '  Dimas  ', note: '', agree: 'on' }));
    expect(r.error).toBeUndefined();
    expect(r.data).toEqual({ name: 'Dimas', note: null, agree: true });
  });

  it('galat per kolom berbahasa Indonesia', () => {
    const r = parseForm(schema, form({ name: '   ', note: 'terlalu panjang' }));
    expect(r.error?.status).toBe('error');
    expect(r.error?.errors?.name).toBe('Nama wajib diisi.');
    expect(r.error?.errors?.note).toContain('Maksimal 5');
  });

  it('mengabaikan kunci internal $ACTION', () => {
    const r = parseForm(z.object({ name: requiredText('Nama') }).strict(), form({ name: 'A', $ACTION_ID: 'x' }));
    expect(r.error).toBeUndefined();
  });
});

describe('potongan skema', () => {
  it('tanggal opsional menolak format salah', () => {
    expect(optionalIsoDate.safeParse('2026-10-05').success).toBe(true);
    expect(optionalIsoDate.safeParse('').data).toBeNull();
    expect(optionalIsoDate.safeParse('05/10/2026').success).toBe(false);
  });

  it('telepon menolak huruf', () => {
    expect(phone.safeParse('0234 271 234').success).toBe(true);
    expect(phone.safeParse('abc-def').success).toBe(false);
  });

  it('koordinat menerima koma desimal dan menolak sampah', () => {
    expect(optionalCoordinate.safeParse('-6,40').data).toBe(-6.4);
    expect(optionalCoordinate.safeParse('x').success).toBe(false);
  });
});
