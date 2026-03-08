import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { VitePWA } from 'vite-plugin-pwa'

const rawBasePath = process.env.VITE_BASE_PATH?.trim()
const basePath = rawBasePath ? `${rawBasePath.replace(/\/+$/, '')}/` : './'

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    svgr(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['crown.svg', 'robots.txt'],
      manifest: {
        name: 'Gastos App',
        short_name: 'GastosApp',
        description: 'Controla tus finanzas con honor',
        theme_color: '#100C08',
        background_color: '#100C08',
        display: 'standalone',
        icons: [
          { src: 'crown.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
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
