import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './topo.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA : enregistre le service worker (public/sw.js) uniquement en build de prod
// hors émulateurs — jamais en dev ni en E2E (VITE_USE_EMULATOR=1), pour que les
// tests et le débogage ne soient jamais pollués par un cache de SW.
if (
  'serviceWorker' in navigator &&
  import.meta.env.PROD &&
  import.meta.env.VITE_USE_EMULATOR !== '1'
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('sw:', e))
  })
}
