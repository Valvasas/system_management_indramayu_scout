/**
 * Data wilayah PUBLIK: Kwarran dan gugus depan. Hanya data kelembagaan
 * (nama, nomor, pangkalan, jenjang, titik lokasi pangkalan) dan angka agregat.
 * Tidak ada nama, kontak, atau alamat anggota maupun pembina (V5 §18 peta publik).
 */
import { and, asc, count, eq, isNotNull } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { slugify } from '@/lib/domain';
import type { KwarranInfo } from '@/types';
import { getKwarran } from './organization';

export const kwarranSlug = (name: string) => slugify(name);

export interface KwarranDirectoryEntry extends KwarranInfo {
  slug: string;
}

export async function getKwarranDirectory(): Promise<KwarranDirectoryEntry[]> {
  const rows = await getKwarran();
  return rows.map((k) => ({ ...k, slug: kwarranSlug(k.name) }));
}

export interface PublicGudep {
  id: string;
  name: string;
  number: string | null;
  pangkalan: string | null;
  jenjang: string | null;
  lat: number | null;
  lng: number | null;
  activeMembers: number;
}

export interface KwarranDetail extends KwarranDirectoryEntry {
  gudep: PublicGudep[];
}

export async function getKwarranBySlug(slug: string): Promise<KwarranDetail | null> {
  const directory = await getKwarranDirectory();
  const k = directory.find((d) => d.slug === slug);
  if (!k) return null;
  const db = await getDb();
  const members = db
    .select({ gudepId: schema.members.gudepId, n: count().as('n') })
    .from(schema.members)
    .where(eq(schema.members.status, 'ACTIVE'))
    .groupBy(schema.members.gudepId)
    .as('m');
  const rows = await db
    .select({
      id: schema.gudep.id,
      name: schema.gudep.name,
      number: schema.gudep.number,
      pangkalan: schema.gudep.pangkalan,
      jenjang: schema.gudep.jenjang,
      lat: schema.gudep.lat,
      lng: schema.gudep.lng,
      n: members.n,
    })
    .from(schema.gudep)
    .leftJoin(members, eq(members.gudepId, schema.gudep.id))
    .where(and(eq(schema.gudep.kwarranId, k.id), eq(schema.gudep.active, true)))
    .orderBy(asc(schema.gudep.name));
  return { ...k, gudep: rows.map(({ n, ...g }) => ({ ...g, activeMembers: Number(n ?? 0) })) };
}

export async function getKwarranSlugs(): Promise<string[]> {
  return (await getKwarranDirectory()).map((k) => k.slug);
}

export interface PublicGudepPoint {
  id: string;
  name: string;
  number: string | null;
  lat: number;
  lng: number;
  kwarranName: string;
  kwarranSlug: string;
  pangkalan: string | null;
}

/** Titik pangkalan gudep aktif yang sudah dipetakan, untuk peta publik. */
export async function getPublicGudepPoints(): Promise<PublicGudepPoint[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.gudep.id,
      name: schema.gudep.name,
      number: schema.gudep.number,
      lat: schema.gudep.lat,
      lng: schema.gudep.lng,
      pangkalan: schema.gudep.pangkalan,
      kwarranName: schema.kwarran.name,
    })
    .from(schema.gudep)
    .innerJoin(schema.kwarran, eq(schema.kwarran.id, schema.gudep.kwarranId))
    .where(and(eq(schema.gudep.active, true), isNotNull(schema.gudep.lat), isNotNull(schema.gudep.lng)));
  return rows.map((r) => ({ ...r, lat: r.lat as number, lng: r.lng as number, kwarranSlug: kwarranSlug(r.kwarranName) }));
}
