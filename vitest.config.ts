import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts', 'tests/security/**/*.test.ts'],
    // PGlite (WASM) + migrasi butuh waktu lebih dari bawaan 5 detik saat mesin sibuk.
    testTimeout: 20_000,
    hookTimeout: 60_000,
    coverage: { include: ['src/lib/**', 'src/features/**'], exclude: ['src/lib/data/**'] },
  },
});
