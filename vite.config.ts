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
    environment: 'jsdom',
  },
})
