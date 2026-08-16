import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

// Config publique par design (la sécurité repose sur les règles Firestore, voir firestore.rules).
// Même projet Firebase que l'ancienne app : les données sont partagées pendant la migration.
// Sur les domaines de déploiement, le handler d'auth est servi same-origin via le
// rewrite /__/auth/* de vercel.json : indispensable pour que signInWithRedirect
// survive au partitionnement du storage de Safari iOS (PWA standalone).
// En local (vite dev/preview), pas de rewrite : on garde le domaine Firebase.
const AUTH_PROXY_HOSTS = ['altimates-app.vercel.app', 'altimates-app-staging.vercel.app']
const authDomain = AUTH_PROXY_HOSTS.includes(window.location.hostname)
  ? window.location.hostname
  : 'altimates-4c37f.firebaseapp.com'

const firebaseConfig = {
  apiKey: 'AIzaSyBHJUlBtfKWg2kgwO_qMar5qR2X-SgHcPM',
  authDomain,
  projectId: 'altimates-4c37f',
  storageBucket: 'altimates-4c37f.firebasestorage.app',
  messagingSenderId: '457113501581',
  appId: '1:457113501581:web:42354801d3eb52ffe3c7c4',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Les e-mails Firebase (lien de connexion, etc.) sont envoyés en français.
auth.languageCode = 'fr'

// Mode E2E : on branche l'app sur les émulateurs Firebase locaux au lieu de la prod.
// Activé uniquement quand VITE_USE_EMULATOR=1 au build/dev (jamais en prod).
// Voir e2e/ et la doc émulateurs pour le seed et les tests Playwright.
if (import.meta.env.VITE_USE_EMULATOR === '1') {
  const host = import.meta.env.VITE_EMULATOR_HOST ?? '127.0.0.1'
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true })
  connectFirestoreEmulator(db, host, 8080)
}
