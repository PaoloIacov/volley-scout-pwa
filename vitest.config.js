import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // vite-plugin-pwa non gira in vitest: il modulo virtuale che registra il
    // service worker viene ripuntato a uno stub no-op.
    alias: [
      {
        find: 'virtual:pwa-register/react',
        replacement: fileURLToPath(new URL('./src/test/pwa-register-stub.js', import.meta.url)),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
