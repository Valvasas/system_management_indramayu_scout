/**
 * Demo SKU/SKK (2.3) — FIKTIF. Syarat di sini HANYA penanda tempat (kode DEMO-…, judul "Contoh
 * syarat N — ganti dengan teks resmi …"): aplikasi tidak pernah mengarang isi SKU/SKK resmi, dan
 * Tri Satya / Dasa Darma tidak ditulis ulang di mana pun. Nama tingkatan (Mula, Ramu, Rakit,
 * Bantara) dipakai sebagai label kelompok saja; nama SKK diganti "Contoh SKK".
 *
 * Verifikasi contoh: dua anggota aktif gudep pembina demo (gudep.smp1) sebagian terverifikasi,
 * satu di antaranya punya verifikasi yang dibatalkan dan satu syarat nonaktif yang tidak dihitung;
 * anggota aktif terakhir gudep itu sengaja belum diverifikasi (dicoba di portal / e2e). peserta.dimas
 * mendapat beberapa verifikasi agar "Kemajuan SKU/SKK saya" di profil berisi.
 */
import { schema } from '../../src/db';
import type { CompetencyKind, Golongan, MemberRow, UserRow } from '../../src/db/schema';
import type { SeedContext } from './index';

interface Block {
  golongan: Golongan;
  kind: CompetencyKind;
  level: string;
  prefix: string;
  count: number;
  baseOrder: number;
}

const BLOCKS: Block[] = [
  { golongan: 'SIAGA', kind: 'SKU', level: 'Mula', prefix: 'SG-MULA', count: 4, baseOrder: 1 },
  { golongan: 'PENGGALANG', kind: 'SKU', level: 'Ramu', prefix: 'PG-RAMU', count: 6, baseOrder: 1 },
  { golongan: 'PENGGALANG', kind: 'SKU', level: 'Rakit', prefix: 'PG-RAKIT', count: 4, baseOrder: 101 },
  { golongan: 'PENGGALANG', kind: 'SKK', level: 'Contoh SKK A', prefix: 'PG-SKK-A', count: 3, baseOrder: 1 },
  { golongan: 'PENEGAK', kind: 'SKU', level: 'Bantara', prefix: 'PA-BANTARA', count: 5, baseOrder: 1 },
  { golongan: 'PENEGAK', kind: 'SKK', level: 'Contoh SKK B', prefix: 'PA-SKK-B', count: 3, baseOrder: 1 },
];

export const DEMO_DESCRIPTION = 'Data contoh (fiktif) untuk mencoba portal. Bukan teks resmi; ganti atau nonaktifkan sebelum dipakai.';

export const demoRequirements = () => [
  ...BLOCKS.flatMap((b) =>
    Array.from({ length: b.count }, (_, i) => ({
      kind: b.kind,
      golongan: b.golongan,
      level: b.level,
      code: `DEMO-${b.prefix}-${String(i + 1).padStart(2, '0')}`,
      title: `Contoh syarat ${i + 1} — ganti dengan teks resmi ${b.kind} Kwarnas`,
      description: i === 0 ? DEMO_DESCRIPTION : null,
      sortOrder: b.baseOrder + i,
      active: true,
    })),
  ),
  // Syarat nonaktif: tetap ada (dan pernah diverifikasi) tetapi tidak dihitung dalam kemajuan.
  {
    kind: 'SKU' as const,
    golongan: 'PENGGALANG' as const,
    level: 'Ramu',
    code: 'DEMO-PG-RAMU-99',
    title: 'Contoh syarat nonaktif — tidak dihitung dalam kemajuan',
    description: DEMO_DESCRIPTION,
    sortOrder: 99,
    active: false,
  },
];

export async function seed(ctx: SeedContext): Promise<void> {
  const { db, users, members, daysFromNow } = ctx;
  const rows = await db.insert(schema.competencyRequirements).values(demoRequirements()).onConflictDoNothing().returning();
  if (!rows.length) return;
  const byCode = new Map(rows.map((r) => [r.code, r]));

  const pembina: UserRow | undefined = users['gudep.smp1'];
  const kwarcab: UserRow | undefined = users['kwarcab'];
  const dimasId = users['peserta.dimas']?.memberId ?? null;

  const active = (m: MemberRow) => m.status === 'ACTIVE' && !m.anonymizedAt;
  const own = members
    .filter((m) => active(m) && m.gudepId === pembina?.gudepId && m.golongan === 'PENGGALANG' && m.id !== dimasId)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  const dimas = dimasId ? members.find((m) => m.id === dimasId && !m.anonymizedAt) : undefined;

  type Insert = typeof schema.memberCompetencies.$inferInsert;
  const out: Insert[] = [];
  const add = (member: MemberRow, code: string, by: UserRow | undefined, day: number, extra: Partial<Insert> = {}) => {
    const req = byCode.get(code);
    if (!req || req.golongan !== member.golongan) return;
    out.push({
      memberId: member.id,
      requirementId: req.id,
      verifiedAt: daysFromNow(day, 10),
      verifiedById: by?.id ?? null,
      verifiedByName: by?.name ?? 'Pembina (demo)',
      note: null,
      ...extra,
    });
  };

  // Anggota pertama: 4 dari 6 Ramu, 1 SKK; Ramu-05 pernah diverifikasi lalu dibatalkan; Ramu-99 nonaktif.
  const [first, second] = own.length > 1 ? own : [own[0], undefined];
  if (first) {
    for (const [i, n] of ['01', '02', '03', '04'].entries()) add(first, `DEMO-PG-RAMU-${n}`, pembina, -40 + i * 5);
    add(first, 'DEMO-PG-RAMU-05', pembina, -20, {
      note: 'Contoh alasan pembatalan (fiktif): tercatat untuk anggota yang salah.',
      revokedAt: daysFromNow(-19, 9),
      revokedByName: pembina?.name ?? 'Pembina (demo)',
    });
    add(first, 'DEMO-PG-RAMU-99', pembina, -60);
    add(first, 'DEMO-PG-SKK-A-01', pembina, -12, { note: 'Contoh catatan pembina (fiktif).' });
  }
  // Anggota kedua: 2 dari 6 Ramu. Anggota aktif sisanya belum diverifikasi sama sekali.
  if (second && second !== own[own.length - 1]) {
    add(second, 'DEMO-PG-RAMU-01', pembina, -15);
    add(second, 'DEMO-PG-RAMU-02', pembina, -8);
  }
  // peserta.dimas (golongan apa pun): dua syarat SKU pertama + satu SKK golongannya bila ada.
  if (dimas) {
    const mine = rows.filter((r) => r.active && r.golongan === dimas.golongan).sort((a, b) => a.sortOrder - b.sortOrder);
    const sku = mine.filter((r) => r.kind === 'SKU').slice(0, 2);
    const skk = mine.filter((r) => r.kind === 'SKK').slice(0, 1);
    [...sku, ...skk].forEach((r, i) => add(dimas, r.code, kwarcab, -30 + i * 7, { note: 'Contoh catatan pembina (fiktif).' }));
  }

  if (out.length) await db.insert(schema.memberCompetencies).values(out).onConflictDoNothing();
}
