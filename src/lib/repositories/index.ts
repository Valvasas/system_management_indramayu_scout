/**
 * Lapisan akses data (TASKS.md P5-2).
 *
 * Aturan: HANYA file di direktori ini yang boleh mengimpor `@/lib/data/mock-data`.
 * Halaman dan komponen memanggil repository, tidak pernah sumber datanya langsung.
 * Saat Prisma masuk (P5-3), isi fungsi di sini diganti query database — pemanggil
 * tidak berubah karena semua fungsi sudah async dan mengembalikan tipe domain.
 */

export * from './news';
export * from './agenda';
export * from './gallery';
export * from './achievements';
export * from './documents';
export * from './organization';
export * from './stats';
