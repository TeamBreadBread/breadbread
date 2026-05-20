import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: './src/routes' }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'BreadBread',
        short_name: 'BreadBread',
        description: 'An agent that can help bread taxi service.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://api.breadbread.io',
        changeOrigin: true,
      },
      '/auth': {
        target: 'https://api.breadbread.io',
        changeOrigin: true,
        bypass(req) {
          const path = req.url?.split('?')[0] ?? '';
          if (
            path === '/auth/kakao/callback' ||
            path === '/auth/naver/callback' ||
            path === '/auth/google/callback'
          ) {
            return '/index.html';
          }
        },
      },
      '/bakeries': {
        target: 'https://api.breadbread.io',
        changeOrigin: true,
      },
      '/reservations': {
        target: 'https://api.breadbread.io',
        changeOrigin: true,
      },
      '/payments': {
        target: 'https://api.breadbread.io',
        changeOrigin: true,
      },
      '/courses': {
        target: 'https://api.breadbread.io',
        changeOrigin: true,
      },
      '/users': {
        target: 'https://api.breadbread.io',
        changeOrigin: true,
      },
      '/posts': {
        target: 'https://api.breadbread.io',
        changeOrigin: true,
      },
      '/images': {
        target: 'https://api.breadbread.io',
        changeOrigin: true,
      },
    },
  },
})
