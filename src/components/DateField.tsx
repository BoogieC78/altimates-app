import { useRef, useState } from 'react'

interface DateFieldProps {
  name: string
  defaultValue?: string
  required?: boolean
}

/** Affiche une date au format français JJ/MM/AAAA quel que soit la locale du navigateur. */
function frenchDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// Champ date au format français. L'input natif (invisible, par-dessus) garde le
// sélecteur de calendrier du navigateur et le name pour FormData (valeur ISO) ;
// l'affichage custom (.date-field) montre toujours JJ/MM/AAAA — les navigateurs
// ignorent l'attribut lang de la page pour le format des <input type="date">.
export function DateField({ name, defaultValue, required }: DateFieldProps) {
  const [value, setValue] = useState(defaultValue ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  // Le clic n'ouvre le calendrier natif que sur la zone de l'indicateur de
  // l'input (invisible ici) — showPicker() l'ouvre depuis toute la surface.
  const openPicker = () => {
    const input = inputRef.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  }
  return (
    <div className="date-field" onClick={openPicker}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      {value ? (
        <span className="date-field-val">{frenchDate(value)}</span>
      ) : (
        <span className="date-field-label">JJ/MM/AAAA</span>
      )}
      <input
        ref={inputRef}
        type="date"
        name={name}
        defaultValue={defaultValue}
        required={required}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Date"
      />
    </div>
  )
}
