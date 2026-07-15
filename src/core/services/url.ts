// Validation des URLs externes saisies par les membres (traces Komoot, etc.).
// Seuls http/https sont acceptés : bloque les schémas dangereux (javascript:,
// data:, vbscript:…) qui, rendus dans un href, deviendraient du XSS stocké.

/**
 * URL de recherche d'itinéraires autour d'une rando. Komoot n'a plus de
 * recherche texte par URL (komoot.com/search/<query> → 404) : sa recherche est
 * géographique. Avec lat/lon on ouvre la page discover de Komoot ; sans
 * coordonnées, repli sur une recherche Google.
 */
export function tourSearchUrl(r: { name: string; region: string; lat?: number; lon?: number }): string {
  if (r.lat != null && r.lon != null) {
    return (
      'https://www.komoot.com/fr-fr/discover/' +
      encodeURIComponent(r.name) +
      `/@${r.lat},${r.lon}/tours?sport=hike&map=true&max_distance=15000`
    )
  }
  return 'https://www.google.com/search?q=' + encodeURIComponent(r.name + ' ' + r.region + ' komoot')
}

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
