import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
// Extensions .js OBLIGATOIRES : package.json est en "type": "module", le runtime
// Vercel résout en ESM strict — './_email' sans extension = ERR_MODULE_NOT_FOUND
// en prod (crash au chargement, silencieux car le client a un repli Firebase).
import { renderSignInEmail, SIGNIN_SUBJECT } from './_email.js'
import { allowRequest, clientIp } from './_ratelimit.js'

// Envoie NOTRE e-mail de connexion (design cordée) au lieu du template Firebase.
// - le lien magique est généré côté serveur par le SDK Admin (aucun e-mail Firebase)
// - l'e-mail part via l'API Brevo (ex-Sendinblue) : gratuit (300/jour), pas de 2FA
//   requise (contrairement à un Gmail App Password), pas de domaine requis (simple
//   vérification de l'expéditeur par clic sur un lien reçu par mail).
//
// Variables d'environnement (Vercel > Settings > Environment Variables) :
//   FIREBASE_SERVICE_ACCOUNT  clé de compte de service Firebase (JSON en une ligne)
//   BREVO_API_KEY             clé API Brevo (Settings > SMTP & API > API Keys)
//   BREVO_SENDER_EMAIL        adresse expéditrice vérifiée dans Brevo (Senders)

// Admins codés en dur — miroir de src/core/firebase/auth.ts (toujours autorisés).
const ADMIN_EMAILS = ['hammadou.nordine@gmail.com', 'wacil78@gmail.com']
const APP_ORIGIN = 'https://altimates-app.vercel.app'

function initAdmin(): void {
  if (getApps().length) return
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT manquant')
  initializeApp({ credential: cert(JSON.parse(raw)) })
}

async function isMember(email: string): Promise<boolean> {
  if (ADMIN_EMAILS.includes(email)) return true
  const snap = await getFirestore().collection('config').doc('allowedEmails').get()
  const emails = (snap.data()?.emails as string[] | undefined) ?? []
  return emails.includes(email)
}

async function sendMail(to: string, link: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  const sender = process.env.BREVO_SENDER_EMAIL
  if (!apiKey || !sender) throw new Error('BREVO_API_KEY / BREVO_SENDER_EMAIL manquant')

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: 'ALTImates', email: sender },
      to: [{ email: to }],
      subject: SIGNIN_SUBJECT,
      htmlContent: renderSignInEmail(link, to),
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Brevo ${res.status}: ${body}`)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }

  const body = (typeof req.body === 'string' ? safeParse(req.body) : req.body) ?? {}
  const email = String(body.email ?? '').trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400).json({ error: 'Adresse e-mail invalide.' })
    return
  }

  try {
    initAdmin()
    // Rate-limiting anti-abus : bombardement d'e-mails d'un membre + épuisement
    // du quota Gmail (~500 mails/jour → DoS du login). Réponse 200 générique même
    // quand la limite est atteinte : pas d'oracle pour un attaquant.
    const ip = clientIp(req.headers)
    const allowed =
      (await allowRequest(`email:${email}`, 3, 15 * 60_000)) && // 3 / 15 min / adresse
      (await allowRequest(`ip:${ip}`, 10, 60 * 60_000)) // 10 / heure / IP
    if (!allowed) {
      console.warn('send-signin-link: rate limited', { ip })
      res.status(200).json({ ok: true })
      return
    }
    // Réponse générique dans tous les cas → ni spam, ni énumération des membres.
    if (await isMember(email)) {
      const link = await getAuth().generateSignInWithEmailLink(email, {
        url: `${APP_ORIGIN}/?e=${encodeURIComponent(email)}`,
        handleCodeInApp: true,
      })
      await sendMail(email, link)
    }
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('send-signin-link:', err)
    res.status(500).json({ error: "Envoi impossible pour l'instant. Réessaie dans un instant." })
  }
}

function safeParse(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}
