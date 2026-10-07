/** Cetak matriks izin dari kode: npm run docs:matrix → tempel ke docs/security/authorization-model.md. */
import { permissionMatrixMarkdown } from '../src/lib/auth/permission-matrix';

console.log(permissionMatrixMarkdown());
