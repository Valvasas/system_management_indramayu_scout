import type { Metadata } from 'next';
import { Notice } from '@/components/dashboard/ui';
import { PesertaHome } from '@/components/dashboard/home/PesertaHome';
import { StaffHome } from '@/components/dashboard/home/StaffHome';
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Ringkasan' };

export default async function RingkasanPage({ searchParams }: { searchParams?: { sandi?: string } }) {
  const user = await requireUser();
  const notice = searchParams?.sandi === 'diganti' ? <Notice>Kata sandi berhasil diganti.</Notice> : undefined;
  return user.role === 'PESERTA' ? <PesertaHome user={user} notice={notice} /> : <StaffHome user={user} notice={notice} />;
}
