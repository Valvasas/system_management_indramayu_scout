#!/bin/sh
# Membuat user aplikasi non-superuser. `postgres` hanya untuk migrasi & retensi log.
# Dijalankan otomatis sekali saat volume database pertama kali dibuat.
#
# Hak tabel diberikan lewat DEFAULT PRIVILEGES (berlaku untuk tabel yang dibuat migrasi).
# Pengecualian log audit (INSERT-only) ada di migrasi drizzle/0004_audit_insert_only.sql
# karena tabelnya belum ada saat skrip ini berjalan.
set -e
: "${APP_DB_PASSWORD:?APP_DB_PASSWORD wajib diisi}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE ROLE ${APP_DB_USER} LOGIN PASSWORD '${APP_DB_PASSWORD}' NOSUPERUSER NOCREATEDB NOCREATEROLE;
  GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${APP_DB_USER};
  GRANT USAGE ON SCHEMA public TO ${APP_DB_USER};
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_DB_USER};
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${APP_DB_USER};
EOSQL
