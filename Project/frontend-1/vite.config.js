import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallbackDenylist: [
          /^\/member/,
          /^\/admin/,
          /^\/api/,
          /^\/_next/,
          /^\/auth/,
          /^\/survey/,
          /^\/storage/,
          /^\/email/,
          /^\/captcha/,
        ],
      },
    }),
  ],

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },

  build: {
    target: 'es2019',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 700,
  },

  ssr: {
    noExternal: ['react-router-dom', 'react-router'],
  },
});
