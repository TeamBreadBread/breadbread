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
      },
      '/bakeries': {
        target: 'https://api.breadbread.io',
        changeOrigin: true,
      },
      '/reservations': {
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
    },
  },
})
