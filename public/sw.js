/**
 * Service worker ALTImates — volontairement minimal et sûr.
 *
 * Stratégies :
 * - Navigations (mode 'navigate') : RÉSEAU D'ABORD. On ne sert jamais une vieille
 *   version de l'app quand le réseau est disponible ; le cache du shell ne sert
 *   que de repli hors-ligne.
 * - /assets/* (fichiers buildés par Vite, noms hachés donc immuables) : CACHE
 *   D'ABORD, rempli au fil de l'eau.
 * - Tout le reste passe au réseau sans interception. En particulier, JAMAIS de
 *   cache pour Firestore / Firebase Auth / googleapis (cross-origin, donc déjà
 *   hors du filtre same-origin ci-dessous) ni pour nos fonctions /api/*.
 *
 * Incrémenter VERSION invalide les caches à l'activation (les assets des vieux
 * déploiements ne s'accumulent pas indéfiniment).
 */
const VERSION = 'v1'
const SHELL_CACHE = `altimates-shell-${VERSION}`
const ASSETS_CACHE = `altimates-assets-${VERSION}`

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.add('/'))
      .catch(() => {}) // hors-ligne à l'install : pas bloquant
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSETS_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Same-origin uniquement : Firestore, Auth, googleapis, fonts… ne sont jamais touchés.
  if (url.origin !== self.location.origin) return
  // Fonctions serverless : toujours le réseau, jamais de cache.
  if (url.pathname.startsWith('/api/')) return

  // Navigation SPA : réseau d'abord, repli sur le shell en cache si hors-ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches
            .open(SHELL_CACHE)
            .then((cache) => cache.put('/', copy))
            .catch(() => {})
          return response
        })
        .catch(async () => (await caches.match('/')) ?? Response.error()),
    )
    return
  }

  // Assets Vite hachés : immuables, cache d'abord.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches
                .open(ASSETS_CACHE)
                .then((cache) => cache.put(request, copy))
                .catch(() => {})
            }
            return response
          }),
      ),
    )
  }
  // Tout le reste (icônes, manifest, favicon…) : réseau par défaut, sans interception.
})
