import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import { KwarranForm } from '@/components/dashboard/gudep/KwarranForm';
import { PortalHeader } from '@/components/dashboard/ui';
import { updateKwarranAction } from '@/features/kwarran/actions';
import { requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Ubah kwarran' };

export default async function UbahKwarranPage({ params }: { params: { id: string } }) {
  await requirePermission('kwarran.manage');
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const db = await getDb();
  const [k] = await db.select().from(schema.kwarran).where(eq(schema.kwarran.id, params.id)).limit(1);
  if (!k) notFound();

  return (
    <>
      <PortalHeader title={`Kwarran ${k.name}`} back={{ href: '/dashboard/kwarran', label: 'Kembali ke daftar kwarran' }} />
      <div className="max-w-3xl">
        <KwarranForm action={updateKwarranAction.bind(null, k.id)} defaults={k} />
      </div>
    </>
  );
}
