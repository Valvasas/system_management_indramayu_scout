/**
 * Pustaka ilustrasi lanskap "Hutan & Lapangan". Semua murni dekoratif (aria-hidden),
 * tanpa gambar bitmap, warna dari token --ill-* sehingga ikut berubah bila palet diganti.
 * Animasi kecil (awan bergeser, bendera berkibar, api berkedip) otomatis mati saat
 * pengguna memilih "kurangi gerakan" (globals.css).
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { forestRow, hillsPath, mountainsPath, pinePath } from './geometry';

const originLeft: React.CSSProperties = { transformBox: 'fill-box', transformOrigin: 'left center' };
const originBottom: React.CSSProperties = { transformBox: 'fill-box', transformOrigin: 'center bottom' };

/* ------------------------------------------------------------------ */
/* Elemen kecil                                                         */
/* ------------------------------------------------------------------ */

const Cloud: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} className="fill-ill-cloud">
    <ellipse cx="0" cy="0" rx="46" ry="16" />
    <ellipse cx="-22" cy="-8" rx="24" ry="16" />
    <ellipse cx="16" cy="-14" rx="28" ry="20" />
  </g>
);

const Tent: React.FC<{ x: number; y: number; s?: number; tone?: 'ember' | 'sand' }> = ({ x, y, s = 1, tone = 'ember' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-60 0L0 -78L60 0Z" className={tone === 'ember' ? 'fill-ill-tent' : 'fill-ill-tent-alt'} />
    <path d="M0 -78L60 0L22 0Z" className="fill-ill-tent-shade" opacity={tone === 'ember' ? 1 : 0.55} />
    <path d="M-14 0L0 -34L14 0Z" className="fill-ill-forest-deep" opacity="0.75" />
    <path d="M0 -78L0 -92" className="stroke-ill-wood" strokeWidth="3" strokeLinecap="round" />
  </g>
);

const Campfire: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-26 0L22 -10M-22 -10L26 0" className="stroke-ill-wood" strokeWidth="7" strokeLinecap="round" />
    <g className="animate-flicker" style={originBottom}>
      <path d="M0 -8C-14 -20 -10 -36 -2 -52C2 -40 14 -34 12 -20C11 -14 6 -10 0 -8Z" className="fill-ill-fire" />
      <path d="M1 -10C-6 -18 -4 -28 1 -36C4 -28 9 -24 7 -16C6 -13 4 -11 1 -10Z" className="fill-ill-fire-core" />
    </g>
  </g>
);

const Flag: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0L0 -120" className="stroke-ill-wood" strokeWidth="4" strokeLinecap="round" />
    <path d="M2 -118C20 -124 34 -110 54 -114L54 -88C34 -84 20 -98 2 -92Z" className="fill-ill-flag animate-sway" style={originLeft} />
  </g>
);

const Birds: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g
    transform={`translate(${x} ${y})`}
    className="stroke-ill-forest-near"
    fill="none"
    strokeWidth="2.2"
    strokeLinecap="round"
    opacity="0.55"
  >
    <path d="M0 0q8 -8 16 0q8 -8 16 0" />
    <path d="M44 -18q6 -6 12 0q6 -6 12 0" />
    <path d="M22 -34q5 -5 10 0q5 -5 10 0" />
  </g>
);

/* ------------------------------------------------------------------ */
/* Lanskap hero beranda                                                 */
/* ------------------------------------------------------------------ */

/** Lanskap perkemahan berlapis: langit, pegunungan, hutan, lapangan, tenda, api unggun. */
export const HeroLandscape: React.FC<{ className?: string }> = ({ className }) => {
  const W = 1440;
  const H = 720;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      className={cn('h-full w-full', className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width={W} height={H} className="fill-ill-sky" />
      <rect y={H * 0.42} width={W} height={H * 0.3} className="fill-ill-sky-warm" opacity="0.6" />
      <circle cx="1080" cy="210" r="74" className="fill-ill-sun" />
      <circle cx="1080" cy="210" r="110" className="fill-ill-sun" opacity="0.18" />
      <g className="animate-drift">
        <Cloud x={260} y={150} s={1.1} />
        <Cloud x={760} y={110} s={0.8} />
        <Cloud x={1300} y={170} s={0.9} />
      </g>
      <Birds x={560} y={230} />
      <path d={mountainsPath({ width: W, height: H, base: 470, peak: 210, count: 6, seed: 7 })} className="fill-ill-mountain-far" />
      <path d={mountainsPath({ width: W, height: H, base: 500, peak: 150, count: 9, seed: 21 })} className="fill-ill-mountain" />
      <path d={forestRow({ width: W, base: 540, minH: 70, maxH: 120, gap: 26, seed: 3 })} className="fill-ill-forest-far" />
      <rect y="536" width={W} height={H - 536} className="fill-ill-forest-far" />
      <path d={forestRow({ width: W, base: 575, minH: 90, maxH: 150, gap: 34, seed: 11 })} className="fill-ill-forest" />
      <path d={hillsPath({ width: W, height: H, base: 590, amp: 16, waves: 1.4, phase: 0.6 })} className="fill-ill-meadow" />
      <path
        d={hillsPath({ width: W, height: H, base: 640, amp: 12, waves: 1.1, phase: 2.1 })}
        className="fill-ill-meadow-light"
        opacity="0.7"
      />
      <path
        d="M560 720C600 680 690 660 760 640C820 624 880 612 940 604"
        className="stroke-ill-path"
        strokeWidth="26"
        fill="none"
        strokeLinecap="round"
      />
      <Tent x={860} y={640} s={1} />
      <Tent x={1010} y={626} s={0.72} tone="sand" />
      <Campfire x={940} y={668} s={0.9} />
      <Flag x={700} y={636} s={0.9} />
      <path d={forestRow({ width: 260, base: 735, minH: 160, maxH: 250, gap: 54, seed: 5 })} className="fill-ill-forest-near" />
      <g transform="translate(1210 0)">
        <path d={forestRow({ width: 260, base: 735, minH: 170, maxH: 260, gap: 58, seed: 9 })} className="fill-ill-forest-near" />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Pemisah section                                                      */
/* ------------------------------------------------------------------ */

/**
 * Siluet barisan pinus sebagai tepi section. Warna = currentColor, jadi beri kelas
 * `text-surface-…` yang SAMA dengan latar section berikutnya agar menyambung.
 */
export const TreeLine: React.FC<{ className?: string; seed?: number; flip?: boolean }> = ({ className, seed = 4, flip }) => {
  const W = 1440;
  const H = 120;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn('block h-16 w-full sm:h-24', flip && 'rotate-180', className)}
      aria-hidden="true"
      focusable="false"
    >
      <path d={forestRow({ width: W, base: 112, minH: 40, maxH: 96, gap: 22, seed })} fill="currentColor" opacity="0.55" />
      <path d={forestRow({ width: W, base: 124, minH: 30, maxH: 70, gap: 30, seed: seed + 13 })} fill="currentColor" />
      <rect y="110" width={W} height="10" fill="currentColor" />
    </svg>
  );
};

/** Tepi bukit bergelombang lembut. Sama seperti TreeLine: warna = currentColor. */
export const Hills: React.FC<{ className?: string; flip?: boolean; phase?: number }> = ({ className, flip, phase = 0.4 }) => (
  <svg
    viewBox="0 0 1440 90"
    preserveAspectRatio="none"
    className={cn('block h-10 w-full sm:h-16', flip && 'rotate-180', className)}
    aria-hidden="true"
    focusable="false"
  >
    <path
      d={hillsPath({ width: 1440, height: 90, base: 46, amp: 18, waves: 1.3, phase: phase + 1.2 })}
      fill="currentColor"
      opacity="0.45"
    />
    <path d={hillsPath({ width: 1440, height: 90, base: 58, amp: 16, waves: 1.1, phase })} fill="currentColor" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Pita lanskap untuk kepala halaman                                    */
/* ------------------------------------------------------------------ */

export type SceneVariant = 'forest' | 'mountain' | 'camp' | 'meadow' | 'lake' | 'dusk';

/** Pita lanskap rendah (dipakai PageHero). Tiap halaman bisa memilih suasana berbeda. */
export const SceneStrip: React.FC<{ variant?: SceneVariant; className?: string }> = ({ variant = 'forest', className }) => {
  const W = 1440;
  const H = 260;
  const seed = { forest: 2, mountain: 17, camp: 29, meadow: 41, lake: 53, dusk: 67 }[variant];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      className={cn('h-full w-full', className)}
      aria-hidden="true"
      focusable="false"
    >
      {(variant === 'mountain' || variant === 'lake' || variant === 'dusk') && (
        <>
          <path d={mountainsPath({ width: W, height: H, base: 170, peak: 140, count: 5, seed })} className="fill-ill-mountain-far" />
          <path d={mountainsPath({ width: W, height: H, base: 190, peak: 90, count: 8, seed: seed + 3 })} className="fill-ill-mountain" />
        </>
      )}
      {variant === 'meadow' && (
        <path d={hillsPath({ width: W, height: H, base: 170, amp: 22, waves: 1.2, phase: 1 })} className="fill-ill-mountain" />
      )}
      <path
        d={forestRow({ width: W, base: 214, minH: 50, maxH: variant === 'forest' ? 130 : 90, gap: 24, seed: seed + 5 })}
        className="fill-ill-forest-far"
      />
      {variant === 'lake' ? (
        <>
          <rect y="210" width={W} height="50" className="fill-ill-water" />
          <path
            d="M240 228h120M520 240h180M900 226h90M1100 244h160"
            className="stroke-ill-cloud"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
        </>
      ) : (
        <path
          d={hillsPath({ width: W, height: H, base: 222, amp: 10, waves: 1.6, phase: seed })}
          className={variant === 'meadow' || variant === 'camp' ? 'fill-ill-meadow' : 'fill-ill-forest'}
        />
      )}
      {variant === 'camp' && (
        <>
          <Tent x={1020} y={236} s={0.62} />
          <Tent x={1120} y={240} s={0.46} tone="sand" />
          <Campfire x={1080} y={250} s={0.55} />
        </>
      )}
      {variant === 'mountain' && <Flag x={1010} y={150} s={0.55} />}
      <path d={forestRow({ width: 220, base: 270, minH: 90, maxH: 170, gap: 44, seed: seed + 9 })} className="fill-ill-forest-near" />
      <g transform="translate(1250 0)">
        <path d={forestRow({ width: 200, base: 270, minH: 100, maxH: 180, gap: 46, seed: seed + 11 })} className="fill-ill-forest-near" />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Ilustrasi golongan                                                   */
/* ------------------------------------------------------------------ */

export type GolonganArtId = 'siaga' | 'penggalang' | 'penegak' | 'pandega' | 'pembina';

/** Ilustrasi persegi per golongan: tunas, tenda, puncak, kompas, api unggun. */
export const GolonganArt: React.FC<{ id: GolonganArtId; className?: string }> = ({ id, className }) => (
  <svg
    viewBox="0 0 200 160"
    preserveAspectRatio="xMidYMid slice"
    className={cn('h-full w-full', className)}
    aria-hidden="true"
    focusable="false"
  >
    <rect width="200" height="160" className="fill-ill-sky" />
    {id === 'siaga' && (
      <>
        <circle cx="150" cy="44" r="20" className="fill-ill-sun" />
        <path d={hillsPath({ width: 200, height: 160, base: 118, amp: 8, waves: 1, phase: 1 })} className="fill-ill-meadow" />
        <path d="M100 120C100 100 100 88 100 76" className="stroke-ill-forest" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M100 92C82 92 70 80 70 66C88 66 100 76 100 92Z" className="fill-ill-forest-far" />
        <path d="M100 82C116 82 128 70 128 56C110 56 100 66 100 82Z" className="fill-ill-forest" />
      </>
    )}
    {id === 'penggalang' && (
      <>
        <path d={forestRow({ width: 200, base: 104, minH: 40, maxH: 66, gap: 18, seed: 12 })} className="fill-ill-forest-far" />
        <path d={hillsPath({ width: 200, height: 160, base: 112, amp: 6, waves: 1, phase: 2 })} className="fill-ill-meadow" />
        <Tent x={100} y={132} s={0.7} />
        <Campfire x={156} y={138} s={0.5} />
      </>
    )}
    {id === 'penegak' && (
      <>
        <path d={mountainsPath({ width: 200, height: 160, base: 130, peak: 96, count: 2, seed: 5 })} className="fill-ill-mountain" />
        <path d="M64 130L112 40L160 130Z" className="fill-ill-forest" />
        <path d="M112 40L128 70L116 64L104 74L98 66Z" className="fill-ill-cloud" />
        <Flag x={112} y={42} s={0.32} />
        <path d={hillsPath({ width: 200, height: 160, base: 132, amp: 5, waves: 1, phase: 0.5 })} className="fill-ill-forest-near" />
      </>
    )}
    {id === 'pandega' && (
      <>
        <path d={hillsPath({ width: 200, height: 160, base: 116, amp: 10, waves: 1.3, phase: 0.2 })} className="fill-ill-meadow" />
        <path
          d="M20 150C60 130 70 110 110 104S170 90 186 70"
          className="stroke-ill-path"
          strokeWidth="7"
          strokeDasharray="2 12"
          strokeLinecap="round"
          fill="none"
        />
        <g transform="translate(70 62)">
          <circle r="30" className="fill-ill-cloud" />
          <circle r="30" className="stroke-ill-wood" strokeWidth="4" fill="none" />
          <path d="M0 -22L7 0L0 22L-7 0Z" className="fill-ill-flag" />
          <path d="M0 0L7 0L0 22L-7 0Z" className="fill-ill-forest-near" />
        </g>
      </>
    )}
    {id === 'pembina' && (
      <>
        <rect width="200" height="160" className="fill-ill-forest-deep" />
        <circle cx="40" cy="36" r="2" className="fill-ill-cloud" />
        <circle cx="160" cy="26" r="2.5" className="fill-ill-cloud" />
        <circle cx="120" cy="50" r="1.6" className="fill-ill-cloud" />
        <circle cx="150" cy="40" r="14" className="fill-ill-sun" opacity="0.9" />
        <path d={forestRow({ width: 200, base: 118, minH: 40, maxH: 74, gap: 20, seed: 33 })} className="fill-ill-forest-near" />
        <rect y="116" width="200" height="44" className="fill-ill-forest-near" />
        <Campfire x={100} y={140} s={0.9} />
      </>
    )}
  </svg>
);

/* ------------------------------------------------------------------ */
/* Empty state                                                          */
/* ------------------------------------------------------------------ */

/** Tenda sendirian di bawah bulan: dipakai saat daftar kosong. */
export const EmptyCamp: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 220 140" className={cn('h-full w-full', className)} aria-hidden="true" focusable="false">
    <circle cx="170" cy="34" r="16" className="fill-ill-sun" opacity="0.85" />
    <path d={mountainsPath({ width: 220, height: 140, base: 104, peak: 50, count: 3, seed: 8 })} className="fill-ill-mountain-far" />
    <path d={forestRow({ width: 220, base: 108, minH: 24, maxH: 44, gap: 16, seed: 18 })} className="fill-ill-forest-far" />
    <path d={hillsPath({ width: 220, height: 140, base: 110, amp: 5, waves: 1, phase: 1 })} className="fill-ill-meadow" />
    <Tent x={110} y={126} s={0.5} tone="sand" />
  </svg>
);

/** Pinus tunggal (mis. hiasan kecil di samping judul). */
export const PineMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 48" className={cn('h-6 w-5', className)} aria-hidden="true" focusable="false">
    <path d={pinePath(20, 44, 42)} fill="currentColor" />
    <rect x="18" y="42" width="4" height="6" fill="currentColor" />
  </svg>
);

/** Mawar angin / kompas dekoratif. */
export const CompassRose: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 120" className={cn('h-full w-full', className)} aria-hidden="true" focusable="false">
    <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 6" opacity="0.6" />
    <path d="M60 6L68 60L60 114L52 60Z" fill="currentColor" opacity="0.85" />
    <path d="M6 60L60 52L114 60L60 68Z" fill="currentColor" opacity="0.45" />
    <text x="60" y="22" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
      U
    </text>
  </svg>
);
