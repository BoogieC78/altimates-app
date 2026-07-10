import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import nodemailer from 'nodemailer'
import { renderSignInEmail, SIGNIN_SUBJECT } from './_email'

// Envoie NOTRE e-mail de connexion (design cordée) au lieu du template Firebase.
// - le lien magique est généré côté serveur par le SDK Admin (aucun e-mail Firebase)
// - l'e-mail part via le SMTP Gmail (SPF/DKIM alignés → bonne délivrabilité, gratuit)
//
// Variables d'environnement (Vercel > Settings > Environment Variables) :
//   FIREBASE_SERVICE_ACCOUNT  clé de compte de service Firebase (JSON en une ligne)
//   GMAIL_USER                adresse Gmail expéditrice (ex. wacil78@gmail.com)
//   GMAIL_APP_PASSWORD        "mot de passe d'application" Google (16 caractères)

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
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  })
  await transporter.sendMail({
    from: `"ALTImates" <${process.env.GMAIL_USER}>`,
    to,
    subject: SIGNIN_SUBJECT,
    html: renderSignInEmail(link, to),
  })
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
