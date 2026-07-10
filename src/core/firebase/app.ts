import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

// Config publique par design (la sécurité repose sur les règles Firestore, voir firestore.rules).
// Même projet Firebase que l'ancienne app : les données sont partagées pendant la migration.
const firebaseConfig = {
  apiKey: 'AIzaSyBHJUlBtfKWg2kgwO_qMar5qR2X-SgHcPM',
  authDomain: 'altimates-4c37f.firebaseapp.com',
  projectId: 'altimates-4c37f',
  storageBucket: 'altimates-4c37f.firebasestorage.app',
  messagingSenderId: '457113501581',
  appId: '1:457113501581:web:42354801d3eb52ffe3c7c4',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Mode E2E : on branche l'app sur les émulateurs Firebase locaux au lieu de la prod.
// Activé uniquement quand VITE_USE_EMULATOR=1 au build/dev (jamais en prod).
// Voir e2e/ et la doc émulateurs pour le seed et les tests Playwright.
if (import.meta.env.VITE_USE_EMULATOR === '1') {
  const host = import.meta.env.VITE_EMULATOR_HOST ?? '127.0.0.1'
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true })
  connectFirestoreEmulator(db, host, 8080)
}
