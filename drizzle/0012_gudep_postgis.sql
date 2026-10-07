-- Migrasi kustom (drizzle-kit generate --custom): PostGIS untuk peta internal (2.7).
-- Hanya bila ekstensi postgis TERSEDIA di server (image postgis/postgis di docker-compose).
-- PGlite & PostgreSQL tanpa PostGIS: dilewati; aplikasi memakai lat/lng + Haversine.
-- Kolom `location` sengaja TIDAK ada di src/db/schema.ts (kondisional); kode membacanya
-- lewat SQL mentah setelah mendeteksi ekstensi (src/features/map/).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'postgis') THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS postgis';
    EXECUTE 'ALTER TABLE gudep ADD COLUMN IF NOT EXISTS location geography(Point, 4326)';
    EXECUTE 'UPDATE gudep SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography WHERE lat IS NOT NULL AND lng IS NOT NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS gudep_location_gix ON gudep USING gist (location)';
    EXECUTE $f$
      CREATE OR REPLACE FUNCTION gudep_sync_location() RETURNS trigger LANGUAGE plpgsql AS $body$
      BEGIN
        IF NEW.lat IS NULL OR NEW.lng IS NULL THEN
          NEW.location := NULL;
        ELSE
          NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
        END IF;
        RETURN NEW;
      END
      $body$
    $f$;
    EXECUTE 'DROP TRIGGER IF EXISTS gudep_location_sync ON gudep';
    EXECUTE 'CREATE TRIGGER gudep_location_sync BEFORE INSERT OR UPDATE OF lat, lng ON gudep FOR EACH ROW EXECUTE FUNCTION gudep_sync_location()';
  END IF;
END
$$;
