import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
// Extensions .js OBLIGATOIRES : package.json est en "type": "module", le runtime
// Vercel résout en ESM strict — './_ratelimit' sans extension = ERR_MODULE_NOT_FOUND.
import { allowRequest, clientIp } from './_ratelimit.js'

// Boîte à idées (ampoule) : crée une carte Trello à partir d'un retour membre.
// Le feedback est TOUJOURS écrit dans Firestore par le client (collection
// `feedbacks`, règles membres) AVANT cet appel — cette fonction n'est que le
// relais Trello. Si Trello échoue (secrets absents, API down), on logue et on
// répond quand même ok : l'utilisateur a déjà son feedback en base, pas de
// double erreur pour un problème purement interne.
//
// Variables d'environnement (Vercel > Settings > Environment Variables) :
//   TRELLO_KEY                clé API Trello (https://trello.com/power-ups/admin)
//   TRELLO_TOKEN              token utilisateur Trello associé à la clé
//   FIREBASE_SERVICE_ACCOUNT  déjà présente (rate-limit Firestore)
//   TRELLO_LIST_BUG / TRELLO_LIST_IDEE / TRELLO_LIST_CONTACT (optionnelles,
//   remplacent les ids par défaut ci-dessous — board ALTImates Backlog)

const LIST_BUG = process.env.TRELLO_LIST_BUG ?? '6a511ba092cfae285f268055' // 🐞 Bugs à corriger
const LIST_IDEE = process.env.TRELLO_LIST_IDEE ?? '6a5137d233c4a3c2dbb0d5b3' // ✨ Améliorations / plus tard
const LIST_CONTACT = process.env.TRELLO_LIST_CONTACT ?? '6a511ba092cfae285f268054' // 🔧 Config manuelle

const TYPES: Record<string, { label: string; listId: string }> = {
  bug: { label: 'Bug', listId: LIST_BUG },
  amelioration: { label: 'Amélioration', listId: LIST_IDEE },
  feature: { label: 'Nouvelle fonctionnalité', listId: LIST_IDEE },
  contact: { label: 'Contact', listId: LIST_CONTACT },
}

function initAdmin(): void {
  if (getApps().length) return
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT manquant')
  initializeApp({ credential: cert(JSON.parse(raw)) })
}

async function createTrelloCard(
  type: keyof typeof TYPES,
  text: string,
  email: string,
): Promise<void> {
  const key = process.env.TRELLO_KEY
  const token = process.env.TRELLO_TOKEN
  if (!key || !token) throw new Error('TRELLO_KEY / TRELLO_TOKEN manquant')

  const { label, listId } = TYPES[type]
  const firstLine = text.split('\n')[0]
  const name = `💡 Boîte à idée : [${label}] ${firstLine.slice(0, 80)}${firstLine.length > 80 ? '…' : ''}`
  const desc = [
    `**Type** : ${label}`,
    `**Auteur** : ${email || 'inconnu'}`,
    `**Date** : ${new Date().toISOString()}`,
    '',
    '---',
    '',
    text,
  ].join('\n')

  const params = new URLSearchParams({ key, token, idList: listId, name, desc, pos: 'top' })
  const res = await fetch(`https://api.trello.com/1/cards?${params}`, { method: 'POST' })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Trello ${res.status}: ${body}`)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }

  const body = (typeof req.body === 'string' ? safeParse(req.body) : req.body) ?? {}
  const type = String(body.type ?? '')
  const text = String(body.text ?? '').trim()
  const email = String(body.email ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 120)
  if (!(type in TYPES) || !text || text.length > 2000) {
    res.status(400).json({ error: 'Retour invalide.' })
    return
  }

  // Rate-limiting anti-abus (spam de cartes Trello). Fail-open : si l'init admin
  // ou Firestore échoue, on tente quand même Trello — le rate-limit est une
  // protection, pas un contrôle d'accès.
  try {
    initAdmin()
    const ip = clientIp(req.headers)
    const allowed =
      (await allowRequest(`feedback:ip:${ip}`, 10, 60 * 60_000)) && // 10 / heure / IP
      (await allowRequest('feedback:global', 40, 24 * 60 * 60_000)) // 40 / jour au total
    if (!allowed) {
      console.warn('send-feedback: rate limited')
      // ok:true — le feedback est déjà en base côté client, ne pas faire croire
      // à un échec ; on coupe juste le relais Trello.
      res.status(200).json({ ok: true, trello: false })
      return
    }
  } catch (err) {
    console.error('send-feedback: ratelimit indisponible', err)
  }

  try {
    await createTrelloCard(type as keyof typeof TYPES, text, email)
    res.status(200).json({ ok: true, trello: true })
  } catch (err) {
    // Trello indisponible / non configuré : le feedback est déjà en base
    // (écrit par le client), on logue et on répond ok.
    console.error('send-feedback: Trello KO', err)
    res.status(200).json({ ok: true, trello: false })
  }
}

function safeParse(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}
