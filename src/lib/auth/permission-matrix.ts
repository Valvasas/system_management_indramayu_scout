/** Matriks izin sebagai tabel Markdown — sumber tabel di docs/security/authorization-model.md (dicek tes). */
import type { Role } from '@/db/schema';
import { PERMISSIONS, ROLE_LABELS, roleCan } from './permissions';

export const MATRIX_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN_KWARCAB', 'ADMIN_WEBSITE', 'STAFF_KWARRAN', 'STAFF_GUDEP', 'PESERTA'];

export function permissionMatrixMarkdown(): string {
  const head = `| Izin | ${MATRIX_ROLES.map((r) => ROLE_LABELS[r]).join(' | ')} |`;
  const sep = `|---|${MATRIX_ROLES.map(() => ':---:').join('|')}|`;
  const rows = PERMISSIONS.map((p) => `| \`${p}\` | ${MATRIX_ROLES.map((r) => (roleCan(r, p) ? 'ya' : '—')).join(' | ')} |`);
  return [head, sep, ...rows].join('\n');
}
