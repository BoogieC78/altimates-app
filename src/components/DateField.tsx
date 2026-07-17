import { useEffect, useRef, useState } from 'react'

interface DateFieldProps {
  name: string
  /** Valeur initiale au format ISO (AAAA-MM-JJ), comme stockée en base. */
  defaultValue?: string
  required?: boolean
}

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]
const WEEKDAYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']

/** "AAAA-MM-JJ" → "JJ/MM/AAAA" (affichage). */
function isoToFr(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

/** "JJ/MM/AAAA" → "AAAA-MM-JJ", ou '' si la date n'existe pas (ex. 31/02). */
export function frToIso(fr: string): string {
  const m = fr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return ''
  const [, d, mo, y] = m
  const date = new Date(Number(y), Number(mo) - 1, Number(d))
  const valid =
    date.getFullYear() === Number(y) &&
    date.getMonth() === Number(mo) - 1 &&
    date.getDate() === Number(d)
  return valid ? `${y}-${mo}-${d}` : ''
}

/** Masque de saisie : ne garde que les chiffres, insère les / après JJ et MM. */
function maskFr(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

// Champ date français : saisie au clavier (JJ/MM/AAAA, masque automatique) ET
// calendrier custom en français — le picker natif des navigateurs suit la langue
// du navigateur (l'attribut lang de la page est ignoré), donc impossible de
// garantir un calendrier en français avec <input type="date">.
// La valeur soumise via FormData est au format JJ/MM/AAAA : convertir avec
// frToIso() côté submit.
export function DateField({ name, defaultValue, required }: DateFieldProps) {
  const [text, setText] = useState(defaultValue ? isoToFr(defaultValue) : '')
  const [open, setOpen] = useState(false)
  const today = new Date()
  const initialIso = defaultValue && isoToFr(defaultValue) ? defaultValue : ''
  const [viewYear, setViewYear] = useState(initialIso ? Number(initialIso.slice(0, 4)) : today.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialIso ? Number(initialIso.slice(5, 7)) - 1 : today.getMonth())
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const selectedIso = frToIso(text)

  const openCalendar = () => {
    if (selectedIso) {
      setViewYear(Number(selectedIso.slice(0, 4)))
      setViewMonth(Number(selectedIso.slice(5, 7)) - 1)
    }
    setOpen((o) => !o)
  }

  const pick = (day: number) => {
    const mo = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    setText(`${d}/${mo}/${viewYear}`)
    setOpen(false)
  }

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  // Grille : lundi en premier (getDay() : 0 = dimanche)
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lead = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  return (
    <div className="date-field" ref={wrapRef}>
      <button type="button" className="date-field-btn" aria-label="Ouvrir le calendrier" onClick={openCalendar}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      <input
        type="text"
        name={name}
        value={text}
        required={required}
        inputMode="numeric"
        placeholder="JJ/MM/AAAA"
        pattern="\d{2}/\d{2}/\d{4}"
        aria-label="Date"
        onChange={(e) => setText(maskFr(e.target.value))}
        onFocus={() => setOpen(false)}
      />
      {open && (
        <div className="date-pop" role="dialog" aria-label="Calendrier">
          <div className="date-pop-head">
            <button type="button" aria-label="Mois précédent" onClick={() => shiftMonth(-1)}>‹</button>
            <span>{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" aria-label="Mois suivant" onClick={() => shiftMonth(1)}>›</button>
          </div>
          <div className="date-pop-grid">
            {WEEKDAYS.map((d) => (
              <span key={d} className="date-pop-wd">{d}</span>
            ))}
            {Array.from({ length: lead }, (_, i) => (
              <span key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday =
                viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()
              return (
                <button
                  type="button"
                  key={day}
                  className={
                    'date-pop-day' +
                    (iso === selectedIso ? ' sel' : '') +
                    (isToday ? ' today' : '')
                  }
                  onClick={() => pick(day)}
                >
                  {day}
                </button>
              )
            })}
          </div>
          {text && (
            <button type="button" className="date-pop-clear" onClick={() => { setText(''); setOpen(false) }}>
              Effacer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
