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
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
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
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
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
  level: 'Kecamatan' | 'Kabupaten' | 'Provinsi' | 'Nasional' | 'Internasional';
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
