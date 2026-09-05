import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // .glsl files are imported with `?raw` — no plugin needed.
  assetsInclude: ['**/*.glsl'],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) return 'three'
            if (id.includes('gsap')) return 'gsap'
            return 'vendor'
          }
        },
      },
    },
  },
})
