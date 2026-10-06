import { desc, eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { AchievementItem, AchievementLevel } from '@/types';

export const ACHIEVEMENT_LEVELS: AchievementLevel[] = ['Internasional', 'Nasional', 'Provinsi', 'Kabupaten', 'Kecamatan'];

export const levelSlug = (level: string) => level.toLowerCase();

export const levelFromSlug = (slug: string): AchievementLevel | undefined => ACHIEVEMENT_LEVELS.find((l) => levelSlug(l) === slug);

async function publishedAchievements(): Promise<AchievementItem[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.achievements)
    .where(eq(schema.achievements.published, true))
    .orderBy(desc(schema.achievements.year), desc(schema.achievements.createdAt));
  return rows.map((a) => ({
    id: a.id,
    slug: a.id,
    title: a.title,
    level: (ACHIEVEMENT_LEVELS as string[]).includes(a.level) ? (a.level as AchievementLevel) : 'Kabupaten',
    year: a.year,
    recipient: a.recipient,
    description: a.description,
    image: '',
  }));
}

export interface AchievementQuery {
  level?: AchievementLevel;
  limit?: number;
}

export async function getAchievements({ level, limit }: AchievementQuery = {}): Promise<AchievementItem[]> {
  let items = await publishedAchievements();
  if (level) items = items.filter((a) => a.level === level);
  return typeof limit === 'number' ? items.slice(0, limit) : items;
}

/** Hanya tingkat yang benar-benar punya data — chip filter kosong itu jebakan. */
export async function getAchievementLevels(): Promise<AchievementLevel[]> {
  const present = new Set((await publishedAchievements()).map((a) => a.level));
  return ACHIEVEMENT_LEVELS.filter((l) => present.has(l));
}
