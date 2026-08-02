/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Vendors séparés du code applicatif : meilleur cache navigateur,
    // et le chunk Firebase ne déclenche plus l'avertissement de taille.
    //
    // jspdf et html2canvas ne sont volontairement PAS groupés ici : les
    // déclarer en groupe nommé les faisait remonter dans le graphe initial
    // (balise modulepreload dans index.html), donc ~600 Ko téléchargés à
    // l'ouverture de l'app alors qu'ils ne servent qu'à l'export PDF du kit.
    // Sans groupe, rolldown les émet en chunks asynchrones, chargés au clic
    // sur "PDF" via le `await import('jspdf')` de src/core/services/kitPdf.ts.
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: 'firebase', test: /node_modules\/(@firebase|firebase)\// },
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
