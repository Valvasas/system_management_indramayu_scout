/**
 * Perhitungan kemajuan SKU/SKK (2.3) — fungsi murni, tanpa basis data.
 *
 * Aturan:
 * - Hanya syarat AKTIF untuk golongan anggota yang dihitung (syarat nonaktif tidak masuk
 *   pembilang maupun penyebut).
 * - Verifikasi yang dibatalkan (`revokedAt`) tidak dihitung, tetapi tetap ditampilkan sebagai
 *   riwayat pada barisnya.
 * - Kelompok = jenis (SKU lalu SKK) + tingkatan; urutan tingkatan mengikuti angka urutan
 *   terkecil di dalamnya, sehingga pengelola menentukan urutan tingkatan lewat `sortOrder`.
 */
import type { CompetencyKind, Golongan } from '@/db/schema';

export interface RequirementLike {
  id: string;
  kind: CompetencyKind;
  golongan: Golongan;
  level: string;
  code: string;
  title: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
}

export interface VerificationLike {
  requirementId: string;
  verifiedAt: Date;
  verifiedByName: string;
  note: string | null;
  revokedAt: Date | null;
  revokedByName: string | null;
}

export interface ProgressItem {
  requirement: RequirementLike;
  /** Verifikasi yang berlaku (belum dibatalkan). */
  verified: { at: Date; byName: string; note: string | null } | null;
  /** Verifikasi terakhir yang dibatalkan (bila ada & belum diverifikasi ulang). */
  revoked: { at: Date; byName: string | null; note: string | null } | null;
}

export interface ProgressGroup {
  kind: CompetencyKind;
  level: string;
  total: number;
  verified: number;
  /** Dibulatkan ke bawah: 100 hanya bila semua syarat terverifikasi. */
  percent: number;
  lastVerifiedAt: Date | null;
  items: ProgressItem[];
}

const KIND_ORDER: Record<CompetencyKind, number> = { SKU: 0, SKK: 1 };

export function percentOf(verified: number, total: number): number {
  return total > 0 ? Math.floor((verified / total) * 100) : 0;
}

export const progressLabel = (g: Pick<ProgressGroup, 'verified' | 'total'>) => `${g.verified} dari ${g.total} terverifikasi`;

export function summarizeProgress(golongan: Golongan, requirements: RequirementLike[], verifications: VerificationLike[]): ProgressGroup[] {
  const byRequirement = new Map<string, VerificationLike>();
  for (const v of verifications) byRequirement.set(v.requirementId, v);

  const applicable = requirements
    .filter((r) => r.active && r.golongan === golongan)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));

  const groups = new Map<string, ProgressGroup & { minOrder: number }>();
  for (const r of applicable) {
    const key = `${r.kind}\u0000${r.level}`;
    let g = groups.get(key);
    if (!g) {
      g = { kind: r.kind, level: r.level, total: 0, verified: 0, percent: 0, lastVerifiedAt: null, items: [], minOrder: r.sortOrder };
      groups.set(key, g);
    }
    const v = byRequirement.get(r.id);
    const active = v && !v.revokedAt ? v : null;
    g.total += 1;
    if (active) {
      g.verified += 1;
      if (!g.lastVerifiedAt || active.verifiedAt > g.lastVerifiedAt) g.lastVerifiedAt = active.verifiedAt;
    }
    g.items.push({
      requirement: r,
      verified: active ? { at: active.verifiedAt, byName: active.verifiedByName, note: active.note } : null,
      revoked: v && v.revokedAt ? { at: v.revokedAt, byName: v.revokedByName, note: v.note } : null,
    });
  }

  return [...groups.values()]
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.minOrder - b.minOrder || a.level.localeCompare(b.level, 'id'))
    .map(({ minOrder: _m, ...g }) => ({ ...g, percent: percentOf(g.verified, g.total) }));
}
