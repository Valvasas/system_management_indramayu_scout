import QRCode from 'qrcode';

/**
 * Kode QR sebagai SVG dari matriks modul (server, tanpa innerHTML/data URL).
 * Zona tenang 4 modul sesuai spesifikasi; kontras gelap di atas terang agar mudah dipindai.
 */
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
  const quiet = 4;
  const dim = modules.size + quiet * 2;
  let d = '';
  for (let y = 0; y < modules.size; y++) {
    for (let x = 0; x < modules.size; x++) {
      if (modules.data[y * modules.size + x]) d += `M${x + quiet} ${y + quiet}h1v1h-1z`;
    }
  }
  return (
    <svg viewBox={`0 0 ${dim} ${dim}`} role="img" aria-label={label} shapeRendering="crispEdges" className={className}>
      <rect width={dim} height={dim} className="fill-surface-base" />
      <path d={d} className="fill-text-primary" />
    </svg>
  );
}
