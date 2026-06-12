import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'node:fs'

const feRoot = path.resolve(__dirname)
const GA4_SNIPPET_BLOCK =
  /<!-- GA4_SNIPPET_START -->[\s\S]*?<!-- GA4_SNIPPET_END -->/
const GA4_INLINE_INIT_MARKER = 'function gtag(){dataLayer.push(arguments);}'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, feRoot, '')
  const ga4MeasurementId = env.VITE_GA4_MEASUREMENT_ID?.trim() || 'G-VVHS24Q0M9'
  if (mode === 'development' && !env.VITE_FIREBASE_VAPID_KEY?.trim()) {
    process.stderr.write(
      '[vite] VITE_FIREBASE_VAPID_KEY 없음 → apps/fe/.env.local 확인 후 dev 서버를 완전히 재시작하세요.\n',
    )
  }

  return {
  envDir: feRoot,
  plugins: [
    TanStackRouterVite({ routesDirectory: './src/routes' }),
    react(),
    tailwindcss(),
    {
      name: 'inject-ga4-snippet',
      transformIndexHtml: {
        // PWA 등 다른 transform 이후 최종 HTML에 GA4 스니펫이 남도록 post 실행
        order: 'post',
        handler(html, ctx) {
          if (ctx.server) {
            return html.replace(GA4_SNIPPET_BLOCK, '')
          }

          return html.replaceAll('__VITE_GA4_MEASUREMENT_ID__', ga4MeasurementId)
        },
      },
      closeBundle() {
        if (mode !== 'production') return

        const indexPath = path.join(feRoot, 'dist', 'index.html')
        if (!fs.existsSync(indexPath)) {
          throw new Error('[inject-ga4-snippet] dist/index.html not found after build')
        }

        const builtHtml = fs.readFileSync(indexPath, 'utf8')
        if (!builtHtml.includes(GA4_INLINE_INIT_MARKER)) {
          throw new Error(
            '[inject-ga4-snippet] GA4 inline init script missing from dist/index.html',
          )
        }
        if (!builtHtml.includes(`gtag/js?id=${ga4MeasurementId}`)) {
          throw new Error(
            '[inject-ga4-snippet] GA4 async script missing from dist/index.html',
          )
        }
        if (builtHtml.includes('__VITE_GA4_MEASUREMENT_ID__')) {
          throw new Error(
            '[inject-ga4-snippet] GA4 measurement ID placeholder was not replaced in dist/index.html',
          )
        }
      },
    },
    VitePWA({
      // prompt: 새 버전 감지 시 자동 적용하지 않고 PwaUpdatePrompt 팝업에서 사용자가 새로고침
      registerType: 'prompt',
      workbox: {
        importScripts: ['firebase-messaging-sw.js'],
      },
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
      '/notifications': {
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
      '/tours': {
        target: 'https://api.breadbread.io',
        changeOrigin: true,
      },
      '/trends': {
        target: 'https://api.breadbread.io',
        changeOrigin: true,
      },
      '/curator': {
        target: 'https://api.breadbread.io',
        changeOrigin: true,
      },
      /** 카카오모빌리티 보행 길찾기 (로컬 CORS 우회) */
      '/kakao-mobility': {
        target: 'https://apis-navi.kakaomobility.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kakao-mobility/, ''),
      },
    },
  },
  }
})
