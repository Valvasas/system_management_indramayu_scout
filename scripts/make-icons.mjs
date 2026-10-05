/**
 * Membuat ikon PWA/favicon PNG dari bentuk logo di public/brand/logo.svg.
 * Jalankan ulang bila warna merek atau bentuk logo berubah: `node scripts/make-icons.mjs`
 * Catatan: bentuk ini placeholder; ganti dengan lambang resmi Kwarcab bila sudah ada.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const BRAND = '#6B4E31'; // --brown-600
const SAND = '#F3E3CC';
const out = path.join(process.cwd(), 'public', 'brand');

const leaves = (fill) => `
  <g fill="${fill}">
    <path d="M20,10 C15,10 10,20 15,30 C20,40 30,45 25,50 C22,53 18,52 15,50 C20,55 30,55 35,45 C40,35 35,15 20,10 Z" />
    <path d="M40,10 C45,10 50,20 45,30 C40,40 30,45 35,50 C38,53 42,52 45,50 C40,55 30,55 25,45 C20,35 25,15 40,10 Z" />
  </g>`;

/** Ikon persegi: latar cokelat + tunas. `scale` mengecil untuk zona aman maskable. */
const square = (size, scale) => {
  const s = (size * scale) / 60; // bentuk asli berukuran ±60 unit
  const offset = (size - 60 * s) / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
       <rect width="${size}" height="${size}" fill="${BRAND}"/>
       <g transform="translate(${offset} ${offset}) scale(${s})">${leaves(SAND)}</g>
     </svg>`,
  );
};

const targets = [
  ['icon-192.png', 192, 0.62],
  ['icon-512.png', 512, 0.62],
  ['icon-maskable-512.png', 512, 0.46], // zona aman 80% agar tidak terpotong
  ['apple-touch-icon.png', 180, 0.62],
];

for (const [name, size, scale] of targets) {
  await sharp(square(size, scale)).png().toFile(path.join(out, name));
  console.log('ditulis', name);
}

// Logo horizontal ikut warna merek.
const logoPath = path.join(out, 'logo.svg');
let logo = await fs.readFile(logoPath, 'utf8');
logo = logo.replace('fill="#16A34A"', `fill="${BRAND}"`).replace('fill="#1E293B"', 'fill="#1F2937"').replace('fill="#64748B"', 'fill="#4B5563"');
await fs.writeFile(logoPath, logo);
console.log('logo.svg diselaraskan dengan warna merek');
