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
