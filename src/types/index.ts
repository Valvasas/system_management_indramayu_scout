export type NewsStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type AgendaStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export type AchievementLevel =
  | 'Kecamatan'
  | 'Kabupaten'
  | 'Provinsi'
  | 'Nasional'
  | 'Internasional';

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  tags: string[];
  status: NewsStatus;
}

export interface AgendaItem {
  id: string;
  slug: string;
  title: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  organizer: string;
  description: string;
  status: AgendaStatus;
  contactPerson: string;
}

export interface Photo {
  id: string;
  url: string;
  caption: string;
  altText: string;
}

export interface GalleryAlbum {
  id: string;
  slug: string;
  title: string;
  date: string;
  location: string;
  organizer: string;
  description: string;
  coverImage: string;
  category: string;
  photos: Photo[];
}

export interface AchievementItem {
  id: string;
  slug: string;
  title: string;
  level: AchievementLevel;
  year: number;
  recipient: string;
  description: string;
  image: string;
}

export interface OrganizationMember {
  id: string;
  name: string;
  role: string;
  department: string;
  period: string;
  photoUrl: string;
  bio: string;
}

export interface KwarranInfo {
  id: string;
  name: string;
  code: string;
  gudepCount: number;
  activeMembers: number;
  address: string;
  leader: string;
}

export interface StatSummary {
  totalMembers: number;
  totalGudep: number;
  totalKwarran: number;
  totalActivities: number;
  verifiedPercent: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  type: string;
  size: string;
  date: string;
  url: string;
  description?: string;
}
