/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Vendors séparés du code applicatif : meilleur cache navigateur,
    // et le chunk Firebase ne déclenche plus l'avertissement de taille.
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: 'firebase', test: /node_modules\/(@firebase|firebase)\// },
            { name: 'jspdf', test: /node_modules\/jspdf\// },
            { name: 'react', test: /node_modules\/(react|react-dom|scheduler)\// },
          ],
        },
      },
    },
  },
  test: {
    // Tests unitaires/composants Vitest uniquement (src/). Les specs Playwright
    // (e2e/) ont leur propre runner et ne doivent pas être ramassés ici.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    clearMocks: true,
    setupFiles: ['./src/setupTests.ts'],
  },
})
