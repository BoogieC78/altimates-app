// Médaillon rond SVG d'un palier de l'échelle animalière.
//
// Silhouette pleine de l'animal en négatif (couleur du fond de zone) sur un
// disque à la couleur de la zone, anneau extérieur de progression vers le
// palier suivant, liseré doré « partageur », rang discret en bas du disque.
// Silhouettes dessinées à la main en paths simples — aucune image externe.

import type { ReactElement } from 'react'
import type { BadgeTier, BadgeZone } from '../../core/services/badges'

/** Couleurs par zone, accordées au thème kraft (vert / bleu-vert / ambre doux). */
const ZONE_COLORS: Record<BadgeZone, { disc: string; fg: string }> = {
  verte: { disc: '#3D6B4F', fg: '#D4EDD9' },
  'bleu-vert': { disc: '#3E6F7C', fg: '#DCEDF0' },
  ambre: { disc: '#B0812A', fg: '#FDF8E6' },
}

/** Palier futur : disque et silhouette en kraft grisé. */
const LOCKED_COLORS = { disc: '#D8D0C0', fg: '#F7F3EC' }

/** Or du logo (var(--gold)) pour le liseré « partageur ». */
const GOLD = '#E8C84A'

/**
 * Silhouettes par rang, dessinées dans une boîte 100×100 (corps utile ~22-90),
 * remises à l'échelle 0.72 pour tenir dans le disque r=38. Un trait distinctif
 * par animal pour rester reconnaissable à 40 px : queue touffue, queue en lyre,
 * cornes crochues, envergure…
 */
const SILHOUETTES: Record<number, ReactElement> = {
  // 1 — Écureuil roux : assis, grande queue touffue en S dans le dos.
  1: (
    <g>
      <path d="M54,74 C74,72 82,56 76,40 C71,26 56,20 48,28 C43,34 46,42 53,44 C61,46 64,53 62,60 C60,66 56,70 50,71 Z" />
      <ellipse cx="42" cy="60" rx="14" ry="15" />
      <circle cx="35" cy="40" r="9" />
      <path d="M29,34 L31,22 L38,31 Z" />
    </g>
  ),
  // 2 — Renard : assis de face, museau pointu, oreilles dressées, queue devant les pattes.
  2: (
    <g>
      <path d="M50,24 C56,24 60,28 60,32 C60,37 55,42 50,45 C45,42 40,37 40,32 C40,28 44,24 50,24 Z" />
      <path d="M42,30 L38,14 L50,22 Z" />
      <path d="M58,30 L62,14 L50,22 Z" />
      <path d="M50,40 C58,48 63,60 63,71 L37,71 C37,60 42,48 50,40 Z" />
      <path d="M66,73 C66,64 56,60 45,63 C36,66 32,70 34,75 C44,78 66,80 66,73 Z" />
    </g>
  ),
  // 3 — Tétras-lyre : corps rond, queue en lyre (deux plumes divergentes recourbées).
  3: (
    <g>
      <ellipse cx="40" cy="58" rx="15" ry="13" />
      <circle cx="28" cy="43" r="7" />
      <path d="M22,42 L15,45 L22,48 Z" />
      <path d="M50,50 C58,46 62,38 60,28 C68,34 66,48 54,56 Z" />
      <path d="M52,62 C60,64 66,70 66,78 C74,70 70,58 56,54 Z" />
    </g>
  ),
  // 4 — Marmotte : dressée sur ses pattes arrière, ronde, petites oreilles.
  4: (
    <g>
      <circle cx="50" cy="33" r="11" />
      <circle cx="41" cy="24" r="3.5" />
      <circle cx="59" cy="24" r="3.5" />
      <path d="M50,40 C63,42 67,56 65,74 L35,74 C33,56 37,42 50,40 Z" />
    </g>
  ),
  // 5 — Hermine : corps long, bas et sinueux, bout de la queue marqué.
  5: (
    <g>
      <circle cx="73" cy="49" r="6.5" />
      <path d="M70,44 L73,36 L77,44 Z" />
      <path d="M70,52 C60,44 48,46 40,54 C34,60 26,62 20,58 C22,66 32,68 40,63 C48,58 58,56 66,58 C71,59 74,56 70,52 Z" />
      <path d="M22,60 C15,62 13,69 18,74 C20,69 24,66 29,65 Z" />
    </g>
  ),
  // 6 — Chamois : profil, cou court, deux petites cornes crochues vers l'arrière.
  6: (
    <g>
      <ellipse cx="46" cy="60" rx="18" ry="11" />
      <rect x="33" y="68" width="5" height="12" />
      <rect x="55" y="68" width="5" height="12" />
      <path d="M58,56 C62,48 63,42 63,36 L73,38 C73,46 70,52 66,60 Z" />
      <circle cx="69" cy="36" r="6" />
      <path d="M66,31 C65,23 68,18 73,17 C70,21 69,25 70,30 Z" />
      <path d="M71,32 C71,24 75,19 80,19 C76,23 75,27 75,32 Z" />
    </g>
  ),
  // 7 — Lagopède alpin : rondelet, petite tête, queue courte.
  7: (
    <g>
      <circle cx="50" cy="58" r="17" />
      <circle cx="61" cy="39" r="7.5" />
      <path d="M67,37 L74,39 L67,42 Z" />
      <path d="M34,52 L20,44 L31,60 Z" />
    </g>
  ),
  // 8 — Bouquetin : profil, grande corne en croissant recourbée au-dessus du dos.
  8: (
    <g>
      <ellipse cx="44" cy="62" rx="18" ry="11" />
      <rect x="31" y="69" width="5" height="12" />
      <rect x="53" y="69" width="5" height="12" />
      <path d="M56,58 L66,46 L74,50 L62,64 Z" />
      <circle cx="68" cy="46" r="6.5" />
      <path d="M73,40 C76,24 64,12 48,14 C60,16 68,26 66,40 C66,44 71,45 73,40 Z" />
    </g>
  ),
  // 9 — Gypaète barbu : en vol, longues ailes étroites et pointues, queue en losange.
  9: (
    <g>
      <path d="M50,44 C42,36 26,30 12,31 L14,35 C26,38 38,44 47,49 L50,50 L53,49 C62,44 74,38 86,35 L88,31 C74,30 58,36 50,44 Z" />
      <circle cx="50" cy="34" r="4" />
      <ellipse cx="50" cy="46" rx="5" ry="8" />
      <path d="M50,52 L56,63 L50,80 L44,63 Z" />
    </g>
  ),
  // 10 — Aigle royal : en vol, ailes larges aux rémiges digitées, queue en éventail.
  10: (
    <g>
      <path d="M50,42 C44,32 30,26 12,26 L16,31 L11,32 L16,36 L12,38 L18,40 C30,45 42,47 48,49 L52,49 C58,47 70,45 82,40 L88,38 L84,36 L89,32 L84,31 L88,26 C70,26 56,32 50,42 Z" />
      <circle cx="50" cy="32" r="4.5" />
      <ellipse cx="50" cy="44" rx="6" ry="9" />
      <path d="M50,52 C57,58 60,67 57,74 C52,71 48,71 43,74 C40,67 43,58 50,52 Z" />
    </g>
  ),
}

interface BadgeMedallionProps {
  tier: BadgeTier
  /** palier atteint (couleurs de zone) ou futur (grisé) */
  acquired: boolean
  /** liseré doré « partageur » (a organisé au moins une sortie) */
  gold?: boolean
  /** progression 0..1 vers le palier suivant — anneau affiché seulement si fourni */
  progress?: number
  size?: number
  'aria-label'?: string
}

const RING_R = 47
const RING_LEN = 2 * Math.PI * RING_R

export function BadgeMedallion({ tier, acquired, gold = false, progress, size = 52, ...aria }: BadgeMedallionProps) {
  const colors = acquired ? ZONE_COLORS[tier.zone] : LOCKED_COLORS
  const label = aria['aria-label'] ?? `${tier.animal} — palier ${tier.rank}, ${tier.threshold} sorties`

  return (
    <svg
      className={`badge-medal ${acquired ? 'badge-acquired' : 'badge-locked'}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={label}
      data-rank={tier.rank}
    >
      {progress !== undefined && (
        <g transform="rotate(-90 50 50)">
          <circle cx="50" cy="50" r={RING_R} fill="none" stroke="#E4DDD0" strokeWidth="4.5" />
          {progress > 0 && (
            <circle
              className="badge-ring"
              cx="50"
              cy="50"
              r={RING_R}
              fill="none"
              stroke={colors.disc}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={`${(Math.min(1, progress) * RING_LEN).toFixed(1)} ${RING_LEN.toFixed(1)}`}
            />
          )}
        </g>
      )}
      {gold && acquired && (
        <circle className="badge-gold-ring" cx="50" cy="50" r="41.5" fill="none" stroke={GOLD} strokeWidth="3" />
      )}
      <circle cx="50" cy="50" r="38" fill={colors.disc} />
      <g fill={colors.fg} transform="translate(50 46) scale(0.62) translate(-50 -50)">
        {SILHOUETTES[tier.rank]}
      </g>
      <text
        x="50"
        y="80"
        textAnchor="middle"
        fontSize="10"
        fontFamily="'DM Mono',monospace"
        fill={colors.fg}
        opacity="0.85"
      >
        {tier.rank}
      </text>
    </svg>
  )
}
