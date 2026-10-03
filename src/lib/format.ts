/** Pemformatan tanggal tunggal untuk seluruh situs — locale id-ID, zona WIB. */

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Jakarta',
});

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dateFormatter.format(d);
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${timeFormatter.format(d)} WIB`;
}

/** "15 Oktober 2026" bila sehari, "15 – 20 Oktober 2026" bila rentang. */
export function formatDateRange(startIso: string, endIso?: string): string {
  const start = formatDate(startIso);
  if (!endIso) return start;
  const end = formatDate(endIso);
  return start === end ? start : `${start} – ${end}`;
}

const hourFormatter = new Intl.DateTimeFormat('id-ID', {
  hour: 'numeric',
  hourCycle: 'h23',
  timeZone: 'Asia/Jakarta',
});

/** Sapaan sesuai jam WIB: pagi / siang / sore / malam. */
export function greeting(now: Date = new Date()): string {
  const h = Number(hourFormatter.format(now));
  if (h >= 4 && h < 11) return 'Selamat pagi';
  if (h >= 11 && h < 15) return 'Selamat siang';
  if (h >= 15 && h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/** "Sab, 17 Okt" — ringkas untuk blok tanggal di daftar. */
export function formatDayMonth(iso: string): { day: string; month: string; weekday: string } {
  const d = new Date(iso);
  const part = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('id-ID', { ...opts, timeZone: 'Asia/Jakarta' }).format(d);
  return { day: part({ day: 'numeric' }), month: part({ month: 'short' }), weekday: part({ weekday: 'long' }) };
}
