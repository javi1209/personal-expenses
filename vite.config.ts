import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { VitePWA } from 'vite-plugin-pwa'

const rawBasePath = process.env.VITE_BASE_PATH?.trim()
const basePath = rawBasePath ? `${rawBasePath.replace(/\/+$/, '')}/` : './'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    svgr(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['crown.svg', 'robots.txt', 'icons/png/*.png'],
      manifest: {
        name: 'Gastos App',
        short_name: 'GastosApp',
        description: 'Controla tus finanzas con honor',
        theme_color: '#100C08',
        background_color: '#100C08',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icons/png/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/png/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/png/maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api/]
      }
    })
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true
      }
    }
  }
})
