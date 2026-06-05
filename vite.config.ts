import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo-192.png', 'logo-512.png'],
      manifest: {
        name: 'Tas Hair & Beauty Cafe',
        short_name: 'Tas Hair',
        description: 'Book your appointment at Tas Hair & Beauty Cafe',
        theme_color: '#7B2D8B',
        background_color: '#1A1A1A',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'logo-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
