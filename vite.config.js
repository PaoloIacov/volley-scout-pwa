import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// In produzione (GitHub Pages) l'app vive sotto /volley-scout-pwa/, in dev alla radice.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/volley-scout-pwa/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'images/circo.JPG'],
      manifest: {
        name: 'Volley Scout - 1DM Albano Circo',
        short_name: 'Volley Scout',
        description: 'Gestione rosa, calendario e statistiche della 1DM Albano Circo.',
        lang: 'it',
        display: 'standalone',
        theme_color: '#09090b',
        background_color: '#09090b',
        icons: [
          { src: 'icons/icon-72x72.png', sizes: '72x72', type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-152x152.png', sizes: '152x152', type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            handler: 'CacheFirst',
            urlPattern: /\.(?:jpg|jpeg|png|webp|avif|gif)$/i,
            options: { cacheName: 'images', expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
    }),
  ],
}));
