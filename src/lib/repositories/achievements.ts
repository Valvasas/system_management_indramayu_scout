import { mockAchievements } from '@/lib/data/mock-data';
import type { AchievementItem, AchievementLevel } from '@/types';

export const ACHIEVEMENT_LEVELS: AchievementLevel[] = [
  'Internasional',
  'Nasional',
  'Provinsi',
  'Kabupaten',
  'Kecamatan',
];

export const levelSlug = (level: string) => level.toLowerCase();

export const levelFromSlug = (slug: string): AchievementLevel | undefined =>
  ACHIEVEMENT_LEVELS.find((l) => levelSlug(l) === slug);

export interface AchievementQuery {
  level?: AchievementLevel;
  limit?: number;
}

export async function getAchievements({
  level,
  limit,
}: AchievementQuery = {}): Promise<AchievementItem[]> {
  let items = [...mockAchievements].sort((a, b) => b.year - a.year);
  if (level) items = items.filter((a) => a.level === level);
  return typeof limit === 'number' ? items.slice(0, limit) : items;
}

/** Hanya tingkat yang benar-benar punya data — chip filter kosong itu jebakan. */
export async function getAchievementLevels(): Promise<AchievementLevel[]> {
  const present = new Set(mockAchievements.map((a) => a.level));
  return ACHIEVEMENT_LEVELS.filter((l) => present.has(l));
}
