import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'server/**/*.ts'],
      exclude: ['node_modules', 'tests', '**/*.d.ts'],
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/server': path.resolve(__dirname, './server'),
      '@/components': path.resolve(__dirname, './components'),
    },
  },
});
