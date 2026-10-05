import { describe, expect, it } from 'vitest';
import { buildIcs, escapeIcsText, foldIcsLine, icsDate } from '@/lib/ics';

describe('iCalendar', () => {
  it('meng-escape karakter khusus', () => {
    expect(escapeIcsText('Rapat; Kwarran, Indramayu\nbaris 2 \\ x')).toBe('Rapat\; Kwarran\\, Indramayu\\nbaris 2 \\\\ x');
  });

  it('format tanggal UTC dasar', () => {
    expect(icsDate(new Date('2026-10-17T01:00:00.000Z'))).toBe('20261017T010000Z');
  });

  it('melipat baris > 75 oktet tanpa memotong karakter multibyte', () => {
    const long = 'DESCRIPTION:' + 'é'.repeat(80);
    const folded = foldIcsLine(long);
    for (const part of folded.split('\r\n')) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    expect(folded.split('\r\n').map((p, i) => (i ? p.slice(1) : p)).join('')).toBe(long);
  });

  it('membangun VEVENT lengkap dengan durasi bawaan 2 jam', () => {
    const ics = buildIcs([{ uid: 'a@x', title: 'Kemah', start: new Date('2026-10-17T01:00:00Z') }], 'Tes', new Date('2026-10-01T00:00:00Z'));
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20261017T010000Z');
    expect(ics).toContain('DTEND:20261017T030000Z');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.split('\r\n').every((l) => !l.includes('\n'))).toBe(true);
  });
});
