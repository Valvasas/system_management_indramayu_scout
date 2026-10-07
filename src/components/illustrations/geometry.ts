/**
 * Generator bentuk lanskap untuk ilustrasi SVG. Deterministik (seed tetap) sehingga
 * markup server dan klien identik dan ilustrasi tidak "berubah" antar-render.
 */

/** PRNG kecil (mulberry32). */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r = (n: number) => Math.round(n * 10) / 10;

/** Satu pohon pinus bertingkat tiga, alas di (x, base), tinggi h. */
export function pinePath(x: number, base: number, h: number): string {
  const w = h * 0.52;
  const tiers = [
    { y: base, half: w / 2, top: base - h * 0.5 },
    { y: base - h * 0.32, half: w * 0.4, top: base - h * 0.78 },
    { y: base - h * 0.6, half: w * 0.28, top: base - h },
  ];
  return tiers.map((t) => `M${r(x - t.half)} ${r(t.y)}L${r(x)} ${r(t.top)}L${r(x + t.half)} ${r(t.y)}Z`).join('');
}

/** Barisan pinus dari kiri ke kanan, tingginya acak dalam rentang. */
export function forestRow(opts: { width: number; base: number; minH: number; maxH: number; gap: number; seed: number; jitter?: number }) {
  const rand = seeded(opts.seed);
  let d = '';
  for (let x = -opts.gap; x < opts.width + opts.gap; x += opts.gap * (0.7 + rand() * 0.6)) {
    const h = opts.minH + rand() * (opts.maxH - opts.minH);
    const y = opts.base + (rand() - 0.5) * (opts.jitter ?? 6);
    d += pinePath(x, y, h);
  }
  return d;
}

/** Bukit bergelombang: area tertutup dari garis y≈base dengan amplitudo amp hingga dasar kanvas. */
export function hillsPath(opts: { width: number; height: number; base: number; amp: number; waves: number; phase?: number }) {
  const { width, height, base, amp, waves } = opts;
  const phase = opts.phase ?? 0;
  const steps = 48;
  let d = `M0 ${height}L0 ${r(base + Math.sin(phase) * amp)}`;
  for (let i = 1; i <= steps; i++) {
    const x = (i / steps) * width;
    const y =
      base +
      Math.sin((i / steps) * Math.PI * 2 * waves + phase) * amp +
      Math.sin((i / steps) * Math.PI * 5 * waves + phase * 2) * amp * 0.25;
    d += `L${r(x)} ${r(y)}`;
  }
  return `${d}L${width} ${height}Z`;
}

/** Pegunungan bergerigi: puncak-puncak dengan lembah acak. */
export function mountainsPath(opts: { width: number; height: number; base: number; peak: number; count: number; seed: number }) {
  const rand = seeded(opts.seed);
  const seg = opts.width / opts.count;
  let d = `M0 ${opts.height}L0 ${r(opts.base)}`;
  for (let i = 0; i < opts.count; i++) {
    const x0 = i * seg;
    const px = x0 + seg * (0.35 + rand() * 0.3);
    const py = opts.base - opts.peak * (0.55 + rand() * 0.45);
    const vx = x0 + seg;
    const vy = opts.base - opts.peak * rand() * 0.25;
    d += `L${r(px)} ${r(py)}L${r(vx)} ${r(vy)}`;
  }
  return `${d}L${opts.width} ${opts.height}Z`;
}
