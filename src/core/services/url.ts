// Validation des URLs externes saisies par les membres (traces Komoot, etc.).
// Seuls http/https sont acceptés : bloque les schémas dangereux (javascript:,
// data:, vbscript:…) qui, rendus dans un href, deviendraient du XSS stocké.

/** Renvoie l'URL normalisée si elle est http(s), sinon null. */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const u = new URL(raw.trim())
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}
