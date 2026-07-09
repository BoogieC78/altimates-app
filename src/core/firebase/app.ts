import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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
