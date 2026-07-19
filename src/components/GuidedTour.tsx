import { useState } from 'react'

// Tour guidé plein écran, porté du tuto de l'ancienne app (markup tuto-wrap).
// Textes et illustrations SVG repris tels quels.

const TUTO_KEY = 'altimates-tuto-done'

/** Le tour doit-il s'afficher ? (jamais complété sur ce navigateur) */
export function shouldShowTour(): boolean {
  try {
    return !localStorage.getItem(TUTO_KEY)
  } catch {
    return false
  }
}

const SLIDES = [
  {
    title: 'Bienvenue sur ALTImates',
    desc: "Ton QG de rando — planifier, s'équiper et partir ensemble, quel que soit ton niveau.",
    illo: (
      <svg width="52" height="52" viewBox="0 0 44 44">
        <path d="M4,36 L14,10 L24,28 L34,8 L44,36" fill="none" stroke="#E8C84A" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Planifie les Sommets',
    desc: 'Propose des randos, vote pour le weekend, consulte la météo en temps réel et envoie la trace GPX sur ta Garmin en un clic.',
    illo: (
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#E8C84A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3l4 8 5-5 5 15H2L8 3z" />
      </svg>
    ),
  },
  {
    title: 'Prépare ton Kit',
    desc: "Ta liste d'équipement selon ton niveau, avec fourchettes de prix et liens d'achat. Télécharge le PDF avant de partir.",
    illo: (
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#E8C84A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        <rect x="3" y="8" width="5" height="12" />
        <rect x="16" y="12" width="5" height="8" />
      </svg>
    ),
  },
  {
    title: 'La Radio de la Cordée',
    desc: 'Alertes, positions, confirmations — les infos critiques de ta cordée, organisées et épinglées pour que personne ne rate rien.',
    illo: (
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#E8C84A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" />
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
      </svg>
    ),
  },
  {
    title: 'Ton Base Camp',
    desc: 'Ton tableau de bord perso — stats de saison, prochaine sortie, progression de ton kit et ton niveau dans la cordée.',
    illo: (
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#E8C84A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
  },
]

export function GuidedTour({ onDone }: { onDone: () => void }) {
  const [slide, setSlide] = useState(0)
  const last = slide === SLIDES.length - 1

  const finish = () => {
    try {
      localStorage.setItem(TUTO_KEY, '1')
    } catch {
      // localStorage indisponible : on termine quand même
    }
    onDone()
  }

  return (
    <div className="tuto-wrap open">
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="22" height="22" viewBox="0 0 44 44">
            <rect width="44" height="44" rx="10" fill="#2D2D2A" />
            <path d="M4,36 L14,10 L24,28 L34,8 L44,36" fill="none" stroke="#E8C84A" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: 14, color: 'var(--ink)', letterSpacing: '.02em' }}>ALTI</span>
          <span style={{ fontFamily: 'var(--font)', fontWeight: 700, fontStyle: 'italic', fontSize: 14, color: 'var(--gold2)' }}>mates</span>
        </div>
        <button className="tuto-skip" onClick={finish}>
          Passer →
        </button>
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {SLIDES.map((s, i) => (
          <div className={i === slide ? 'tuto-slide active' : 'tuto-slide'} key={s.title}>
            <div className="tuto-illo">{s.illo}</div>
            <h1 className="tuto-title">{s.title}</h1>
            <p className="tuto-desc">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="tuto-dots">
        {SLIDES.map((s, i) => (
          <button
            type="button"
            className={i === slide ? 'tuto-dot active' : 'tuto-dot'}
            key={s.title}
            aria-label={`Aller à l'étape ${i + 1} sur ${SLIDES.length}`}
            aria-current={i === slide}
            onClick={() => setSlide(i)}
          />
        ))}
      </div>
      <div className="tuto-footer">
        {slide > 0 && (
          <button className="btn btn-sm" aria-label="Étape précédente" onClick={() => setSlide(slide - 1)}>
            <span aria-hidden="true">←</span>
          </button>
        )}
        <button className="btn btn-primary btn-full" onClick={() => (last ? finish() : setSlide(slide + 1))}>
          {last ? "C'est parti →" : 'Suivant →'}
        </button>
      </div>
    </div>
  )
}
