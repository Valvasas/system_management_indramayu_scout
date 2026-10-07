'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { audit } from '@/lib/auth/audit';
import { requirePermission } from '@/lib/auth/session';
import { runBackup, verifyBackup } from './backup';

/** Super Admin: backup manual. Hasilnya (sukses/gagal) tercatat di backup_runs & log. */
export async function runBackupAction(): Promise<void> {
  const user = await requirePermission('system.backup');
  let result: 'ok' | 'gagal' | 'sibuk' = 'ok';
  try {
    const run = await runBackup({ id: user.id, name: user.name });
    result = run.status === 'SUCCESS' ? 'ok' : 'gagal';
    await audit(user, {
      action: 'backup.run',
      summary: run.status === 'SUCCESS' ? `Backup manual berhasil (${run.fileName})` : 'Backup manual GAGAL',
      entityType: 'backup',
      entityId: run.id,
    });
  } catch {
    result = 'sibuk';
  }
  revalidatePath('/dashboard/backup');
  redirect(`/dashboard/backup?hasil=${result}`);
}

export async function verifyBackupAction(runId: string): Promise<void> {
  const user = await requirePermission('system.backup');
  const id = z.string().uuid().safeParse(runId);
  if (!id.success) redirect('/dashboard/backup');
  const v = await verifyBackup(id.data);
  await audit(user, {
    action: 'backup.verify',
    summary: `Uji pulih backup: ${v.ok ? 'lulus' : 'GAGAL'}`,
    entityType: 'backup',
    entityId: id.data,
  });
  revalidatePath('/dashboard/backup');
  redirect(`/dashboard/backup?uji=${v.ok ? 'lulus' : 'gagal'}`);
}
