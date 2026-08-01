import { useRef, useState } from 'react'
import { randoMediaCol } from '../../core/firebase/collections'
import { addRandoMedia, removeRandoMedia } from '../../core/firebase/randoMedia'
import { isAdmin } from '../../core/firebase/auth'
import { MAX_PHOTOS, checkCanAdd, compressImage } from '../../core/services/media'
import { useAuth } from '../../hooks/useAuth'
import { useCollection, type WithDocId } from '../../hooks/useCollection'
import type { Rando } from '../../core/types'

/**
 * Onglet Photos d'une sortie : l'organisateur partage quelques images après la
 * rando, tous les membres les consultent. Volontairement limité à
 * {@link MAX_PHOTOS} images compressées — l'objectif est de se remémorer une
 * sortie et d'aider les prochains groupes, pas d'héberger une galerie.
 */
export function PhotosTab({ rando: r, memberName }: { rando: WithDocId<Rando>; memberName: string }) {
  const randoId = String(r.id)
  const { user } = useAuth()
  const { data: allMedia } = useCollection(randoMediaCol)
  const photos = allMedia.filter((m) => m.randoId === randoId)

  const admin = isAdmin(user)
  const canAdd = r.proposedBy === memberName || admin

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [zoomed, setZoomed] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onPick = async (file: File | undefined) => {
    if (!file || !user) return
    const refusal = checkCanAdd(photos.length, file.type)
    if (refusal) {
      setError(refusal)
      return
    }
    setError('')
    setBusy(true)
    try {
      const dataUrl = await compressImage(file)
      await addRandoMedia({ randoId, randoDocId: r.docId, author: memberName, authorUid: user.uid, dataUrl })
    } catch (e) {
      // Message lisible plutôt qu'un échec silencieux : sur mobile, une photo
      // refusée sans explication laisse croire que l'app est cassée.
      setError(e instanceof Error ? e.message.toUpperCase() : 'ÉCHEC DE L\'AJOUT')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginBottom: 10 }}>
        {photos.length}/{MAX_PHOTOS} photos ·{' '}
        {canAdd ? 'partage quelques images de la sortie' : "seul l'organisateur peut ajouter des photos"}
      </div>

      {canAdd && (
        <div style={{ marginBottom: 12 }}>
          {/* Le sélecteur natif s'affiche en anglais et ignore les styles : on le
              masque à l'œil (sans le retirer du DOM, pour rester accessible au
              clavier et aux lecteurs d'écran) et on déclenche via un vrai bouton. */}
          <input
            ref={inputRef}
            id="photo-input"
            type="file"
            accept="image/*"
            aria-label="Ajouter une photo de la sortie"
            disabled={busy || photos.length >= MAX_PHOTOS}
            onChange={(e) => void onPick(e.target.files?.[0])}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
          />
          <label
            htmlFor="photo-input"
            className="btn btn-primary btn-sm"
            style={{
              width: '100%',
              justifyContent: 'center',
              minHeight: 44,
              cursor: busy || photos.length >= MAX_PHOTOS ? 'default' : 'pointer',
              opacity: busy || photos.length >= MAX_PHOTOS ? 0.5 : 1,
            }}
          >
            {photos.length >= MAX_PHOTOS ? `Maximum ${MAX_PHOTOS} photos` : 'Ajouter une photo'}
          </label>
          {busy && (
            <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginTop: 6 }}>
              Compression en cours…
            </div>
          )}
          {error && (
            <div role="alert" style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--mono)', marginTop: 6 }}>
              {error}
            </div>
          )}
        </div>
      )}

      {photos.length === 0 ? (
        <div style={{ padding: '14px 0', fontSize: 11, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>
          Aucune photo pour cette sortie.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
          {photos.map((p) => (
            <figure key={p.docId} style={{ margin: 0, position: 'relative' }}>
              <button
                onClick={() => setZoomed(p.dataUrl)}
                aria-label={`Agrandir la photo de ${p.author}`}
                style={{ padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', width: '100%' }}
              >
                <img
                  src={p.dataUrl}
                  alt={`Photo de la sortie partagée par ${p.author}`}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, display: 'block' }}
                />
              </button>
              <figcaption style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginTop: 3 }}>
                {p.author}
              </figcaption>
              {(p.authorUid === user?.uid || admin) && (
                <button
                  onClick={() => void removeRandoMedia(p.docId).catch((e) => console.warn('removeRandoMedia:', e))}
                  aria-label={`Supprimer la photo de ${p.author}`}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    minWidth: 28,
                    minHeight: 28,
                    borderRadius: 14,
                    border: 'none',
                    background: 'rgba(45,45,42,.72)',
                    color: '#fff',
                    fontSize: 13,
                    lineHeight: 1,
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              )}
            </figure>
          ))}
        </div>
      )}

      {zoomed && (
        <button
          onClick={() => setZoomed(null)}
          aria-label="Fermer la photo"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            border: 'none',
            padding: 16,
            background: 'rgba(20,20,18,.92)',
            cursor: 'zoom-out',
          }}
        >
          <img src={zoomed} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
        </button>
      )}
    </div>
  )
}
