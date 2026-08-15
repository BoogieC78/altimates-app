import { useState } from 'react'
import { randoSurveysCol } from '../../core/firebase/collections'
import { saveSurveyResponse } from '../../core/firebase/surveys'
import {
  DIFFICULTY_OPTIONS,
  SURVEY_COMMENT_MAX,
  SURVEY_OPEN_DAYS,
  WEATHER_OPTIONS,
  formatAvg,
  summarizeSurvey,
  surveyState,
} from '../../core/services/survey'
import { todayLocalISO } from '../../core/services/dates'
import { useAuth } from '../../hooks/useAuth'
import { useCollection, type WithDocId } from '../../hooks/useCollection'
import type { Rando, SurveyDifficulty, SurveyWeather } from '../../core/types'

const monoLabel: React.CSSProperties = {
  fontSize: 9,
  color: 'var(--ink3)',
  fontFamily: 'var(--mono)',
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  marginBottom: 6,
}

/** Rangée de 1 à 5 étoiles cliquables (note globale, organisation). */
function StarRow({ value, onChange, name }: { value: number; onChange: (v: number) => void; name: string }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          aria-label={`${name} : ${n} sur 5`}
          aria-pressed={value === n}
          onClick={() => onChange(n)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: 22,
            lineHeight: 1,
            color: n <= value ? 'var(--gold2)' : 'var(--ink4)',
          }}
        >
          {n <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}

/**
 * Onglet Enquête d'une sortie : une fois la date passée, chaque participant
 * note la rando à chaud (< 1 minute), et la cordée consulte la restitution
 * nominative. L'enquête reste ouverte {@link SURVEY_OPEN_DAYS} jours après la
 * date ; la réponse est modifiable tant qu'elle est ouverte (une resoumission
 * écrase la précédente — jamais deux réponses pour un même membre).
 */
export function SurveyTab({ rando: r, memberName }: { rando: WithDocId<Rando>; memberName: string }) {
  const randoId = String(r.id)
  const { user } = useAuth()
  const { data: allResponses } = useCollection(randoSurveysCol)
  const responses = allResponses.filter((s) => s.randoId === randoId)
  const state = surveyState(r, todayLocalISO())
  const mine = user ? responses.find((s) => s.authorUid === user.uid) : undefined

  // null = comportement par défaut (formulaire si pas encore répondu).
  const [editing, setEditing] = useState<boolean | null>(null)
  const [rating, setRating] = useState(0)
  const [difficulty, setDifficulty] = useState<SurveyDifficulty | null>(null)
  const [weather, setWeather] = useState<SurveyWeather | null>(null)
  const [organization, setOrganization] = useState(0)
  const [comment, setComment] = useState('')
  const [formError, setFormError] = useState('')

  const summary = summarizeSurvey(responses)
  const showForm = state === 'ouverte' && (editing ?? !mine)

  const startEdit = () => {
    // Préremplit depuis la réponse existante : modifier ≠ repartir de zéro.
    setRating(mine?.rating ?? 0)
    setDifficulty(mine?.difficulty ?? null)
    setWeather(mine?.weather ?? null)
    setOrganization(mine?.organization ?? 0)
    setComment(mine?.comment ?? '')
    setFormError('')
    setEditing(true)
  }

  const submit = () => {
    if (!user) return
    if (!rating) {
      setFormError('NOTE GLOBALE REQUISE')
      return
    }
    if (!difficulty) {
      setFormError('DIFFICULTÉ RESSENTIE REQUISE')
      return
    }
    if (!weather) {
      setFormError('MÉTÉO REQUISE')
      return
    }
    if (!organization) {
      setFormError('NOTE ORGANISATION REQUISE')
      return
    }
    setFormError('')
    // Un refus des règles Firestore doit se voir à l'écran : un console.warn
    // silencieux ferait croire que le bouton ne fait rien (piège déjà vécu).
    void saveSurveyResponse({
      randoId,
      author: memberName,
      authorUid: user.uid,
      rating,
      difficulty,
      weather,
      organization,
      comment,
    })
      .then(() => setEditing(false))
      .catch((e: Error) => {
        console.warn('saveSurveyResponse:', e)
        setFormError("Ta réponse n'a pas pu être enregistrée. Vérifie ta connexion et réessaie.")
      })
  }

  if (state === 'avant') {
    // Garde-fou : l'onglet n'est normalement pas proposé avant la date.
    return (
      <div style={{ padding: '10px 0', fontSize: 11, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>
        L'enquête ouvrira une fois la sortie passée.
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginBottom: 10 }}>
        {state === 'ouverte'
          ? `Note la sortie à chaud — moins d'une minute. Réponses nominatives, visibles par la cordée (modifiables ${SURVEY_OPEN_DAYS} jours après la date).`
          : 'Enquête fermée — voici ce que la cordée en a retenu.'}
      </div>

      {/* Ma réponse (déjà envoyée, formulaire replié) */}
      {mine && !showForm && (
        <div className="card" style={{ padding: '12px 14px', marginBottom: 12 }}>
          <div style={monoLabel}>Ta réponse</div>
          <div style={{ fontSize: 12, color: 'var(--ink)', marginBottom: 4 }}>
            {'★'.repeat(mine.rating)}
            {'☆'.repeat(5 - mine.rating)} · organisation {mine.organization}/5
          </div>
          <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginBottom: mine.comment ? 4 : 0 }}>
            {DIFFICULTY_OPTIONS.find((d) => d.id === mine.difficulty)?.label} ·{' '}
            {WEATHER_OPTIONS.find((w) => w.id === mine.weather)?.label}
          </div>
          {mine.comment && <div style={{ fontSize: 11, color: 'var(--ink2)' }}>{mine.comment}</div>}
          {state === 'ouverte' && (
            <button className="btn btn-sm" onClick={startEdit} style={{ marginTop: 8 }}>
              Modifier ma réponse
            </button>
          )}
        </div>
      )}

      {/* Formulaire (enquête ouverte, pas encore répondu ou en modification) */}
      {showForm && (
        <div className="card" style={{ padding: '12px 14px', marginBottom: 12 }}>
          <div style={monoLabel}>Note globale</div>
          <StarRow name="Note globale" value={rating} onChange={setRating} />

          <div style={monoLabel}>Difficulté ressentie</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d.id}
                className={difficulty === d.id ? 'time-btn active' : 'time-btn'}
                aria-pressed={difficulty === d.id}
                onClick={() => setDifficulty(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div style={monoLabel}>Météo rencontrée</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {WEATHER_OPTIONS.map((w) => (
              <button
                key={w.id}
                className={weather === w.id ? 'time-btn active' : 'time-btn'}
                aria-pressed={weather === w.id}
                aria-label={w.label}
                onClick={() => setWeather(w.id)}
              >
                {w.emoji} {w.label}
              </button>
            ))}
          </div>

          <div style={monoLabel}>Organisation</div>
          <StarRow name="Organisation" value={organization} onChange={setOrganization} />

          <input
            className="form-input"
            placeholder="Un mot sur la sortie ? (optionnel)"
            aria-label="Commentaire libre"
            maxLength={SURVEY_COMMENT_MAX}
            style={{ width: '100%', fontSize: 16, padding: '6px 9px', marginBottom: 10 }}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />

          <button className="btn btn-primary btn-sm" onClick={submit} style={{ width: '100%', justifyContent: 'center' }}>
            {mine ? 'Mettre à jour ma réponse' : 'Envoyer ma réponse'}
          </button>
          {formError && (
            <div role="alert" style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--mono)', marginTop: 6 }}>
              {formError}
            </div>
          )}
        </div>
      )}

      {/* Restitution — jamais de bloc vide : rien tant que personne n'a répondu */}
      {responses.length > 0 ? (
        <>
          <h2 className="sec">
            Retours de la cordée · {summary.count} réponse{summary.count > 1 ? 's' : ''}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div className="card" style={{ textAlign: 'center', padding: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>
                {formatAvg(summary.avgRating)}★
              </div>
              <div style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', marginTop: 2 }}>
                Note globale
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>
                {formatAvg(summary.avgOrganization)}/5
              </div>
              <div style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', marginTop: 2 }}>
                Organisation
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {DIFFICULTY_OPTIONS.filter((d) => summary.difficulty[d.id]).map((d) => (
              <span key={d.id} className="time-btn" style={{ cursor: 'default' }}>
                {d.label} · {summary.difficulty[d.id]}
              </span>
            ))}
            {WEATHER_OPTIONS.filter((w) => summary.weather[w.id]).map((w) => (
              <span key={w.id} className="time-btn" style={{ cursor: 'default' }}>
                {w.emoji} {w.label} · {summary.weather[w.id]}
              </span>
            ))}
          </div>
          <div className="card" style={{ padding: '0 14px', marginBottom: 12 }}>
            {responses.map((s) => (
              <div className="hydra-input-row" key={s.authorUid}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>
                    {s.author}
                    {s.author === memberName ? ' (toi)' : ''} — {'★'.repeat(s.rating)}
                    {'☆'.repeat(5 - s.rating)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>
                    {DIFFICULTY_OPTIONS.find((d) => d.id === s.difficulty)?.label} ·{' '}
                    {WEATHER_OPTIONS.find((w) => w.id === s.weather)?.emoji} · organisation {s.organization}/5
                  </div>
                  {s.comment && <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2 }}>{s.comment}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        state === 'fermee' && (
          <div style={{ padding: '10px 0', fontSize: 11, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>
            Aucun retour recueilli pour cette sortie.
          </div>
        )
      )}
    </div>
  )
}
