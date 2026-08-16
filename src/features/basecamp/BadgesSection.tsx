// Section « Mes badges » du Base Camp : badge courant en grand + progression
// vers le suivant + collection complète des 10 paliers (acquis en couleur,
// futurs grisés avec leur seuil), à la Garmin. Tout est calculé côté client
// depuis les randos existantes — voir core/services/badges.ts.

import type { Rando } from '../../core/types'
import {
  BADGE_TIERS,
  ZONE_LABELS,
  badgeProgress,
  countDoneOutings,
  hasOrganized,
} from '../../core/services/badges'
import { todayLocalISO } from '../../core/services/dates'
import { BadgeMedallion } from './BadgeMedallion'

interface BadgesSectionProps {
  randos: readonly Rando[]
  memberName: string
}

export function BadgesSection({ randos, memberName }: BadgesSectionProps) {
  const today = todayLocalISO()
  const done = countDoneOutings(randos, memberName, today)
  const gold = hasOrganized(randos, memberName)
  const prog = badgeProgress(done)

  // En tête : le badge courant en grand, ou le premier palier grisé si aucun.
  const heroTier = prog.current ?? BADGE_TIERS[0]

  return (
    <div className="bc-section">
      <div className="bc-section-title">Mes badges</div>
      <div className="card" style={{ padding: '0 14px' }}>
        <div className="badge-hero">
          <BadgeMedallion
            tier={heroTier}
            acquired={prog.current !== null}
            gold={gold}
            progress={prog.ratio}
            size={84}
            aria-label={
              prog.current
                ? `Badge actuel : ${prog.current.animal}, ${prog.current.altitude}`
                : 'Aucun badge pour l’instant'
            }
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            {prog.current ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{prog.current.animal}</div>
                <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                  {prog.current.altitude} · {ZONE_LABELS[prog.current.zone]}
                  {gold ? ' · Partageur' : ''}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun badge pour l’instant</div>
                <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                  Ta première sortie faite débloque l’Écureuil roux
                </div>
              </>
            )}
            <div style={{ fontSize: 10, color: 'var(--ink2)', fontFamily: 'var(--mono)', marginTop: 6, lineHeight: 1.5 }}>
              {prog.label}
            </div>
            <div style={{ fontSize: 9, color: 'var(--ink4)', fontFamily: 'var(--mono)', marginTop: 3 }}>
              {done} sortie{done > 1 ? 's' : ''} faite{done > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="badge-grid">
          {BADGE_TIERS.map((tier) => {
            const acquired = done >= tier.threshold
            return (
              <div className="badge-cell" key={tier.rank}>
                <BadgeMedallion
                  tier={tier}
                  acquired={acquired}
                  gold={gold}
                  aria-label={`${tier.animal} — ${tier.threshold} sortie${tier.threshold > 1 ? 's' : ''}${acquired ? ', acquis' : ', à débloquer'}`}
                />
                <div className="badge-cell-name">{tier.animal}</div>
                <div className="badge-cell-thr">
                  {tier.threshold} sortie{tier.threshold > 1 ? 's' : ''}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
