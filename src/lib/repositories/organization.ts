import { mockKwarrans, mockOrganization } from '@/lib/data/mock-data';
import type { KwarranInfo, OrganizationMember } from '@/types';

export async function getOrganizationMembers(): Promise<OrganizationMember[]> {
  return mockOrganization;
}

/** Pengurus dikelompokkan per departemen, urutan departemen stabil. */
export async function getOrganizationByDepartment(): Promise<
  { department: string; members: OrganizationMember[] }[]
> {
  const groups = new Map<string, OrganizationMember[]>();
  for (const member of mockOrganization) {
    const list = groups.get(member.department) ?? [];
    list.push(member);
    groups.set(member.department, list);
  }
  return Array.from(groups, ([department, members]) => ({ department, members }));
}

export async function getKwarran(): Promise<KwarranInfo[]> {
  return [...mockKwarrans].sort((a, b) => a.name.localeCompare(b.name, 'id'));
}
