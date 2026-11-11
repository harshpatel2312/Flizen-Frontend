import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    // Keep country flags as separate files so only the ones on screen are downloaded.
    assetsInlineLimit: (filePath) => (filePath.includes('country-flag-icons') ? false : undefined),
  },
})
