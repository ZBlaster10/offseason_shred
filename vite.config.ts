import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // GitHub Pages serves the app from /<repo>/; the deploy workflow sets BASE_PATH.
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Offseason Shred',
        short_name: 'Shred',
        description: 'Personalized snowboard home training for the offseason.',
        theme_color: '#0B1A2E',
        background_color: '#0B1A2E',
        display: 'standalone',
        orientation: 'any',
        // start_url and scope default to `base`. Icon paths are relative to the manifest for the same reason.
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        // Relative, so deep links fall back to <base>index.html.
        navigateFallback: 'index.html',
      },
    }),
  ],
  build: {
    // React + router + motion land around 210 KB gzipped; fine for an installable PWA.
    chunkSizeWarningLimit: 800,
  },
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
