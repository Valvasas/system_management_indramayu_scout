/**
 * Pembuat berkas iCalendar (RFC 5545) untuk agenda: bisa dibuka Kalender Google, Apple, dan Outlook.
 * Teks di-escape (\ ; , baris baru) dan baris dilipat ≤75 oktet sesuai standar.
 */

export interface IcsEvent {
  uid: string;
  title: string;
  start: Date;
  end?: Date | null;
  location?: string;
  description?: string;
  url?: string;
}

export function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** 2026-10-17T01:00:00.000Z → 20261017T010000Z */
export function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Lipat baris panjang: lanjutan diawali satu spasi, dihitung per byte UTF-8. */
export function foldIcsLine(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  for (const ch of line) {
    const limit = parts.length === 0 ? 75 : 74;
    if (enc.encode(current + ch).length > limit) {
      parts.push(current);
      current = ch;
    } else current += ch;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

export function buildIcs(events: IcsEvent[], calendarName = 'Agenda Pramuka Indramayu', now = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kwarcab Gerakan Pramuka Indramayu//Rumah Pramuka//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    'X-WR-TIMEZONE:Asia/Jakarta',
  ];
  for (const e of events) {
    // Tanpa waktu selesai: anggap dua jam, supaya kalender tidak menampilkan acara 0 menit.
    const end = e.end && e.end > e.start ? e.end : new Date(e.start.getTime() + 2 * 3600_000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${icsDate(now)}`,
      `DTSTART:${icsDate(e.start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${escapeIcsText(e.title)}`,
    );
    if (e.location) lines.push(`LOCATION:${escapeIcsText(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${escapeIcsText(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}
