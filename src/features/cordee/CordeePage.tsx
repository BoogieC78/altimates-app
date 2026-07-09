import { useState } from 'react'
import { departItemsCol, usersCol } from '../../core/firebase/collections'
import {
  addDepartItem,
  assignDepartItem,
  deleteDepartItem,
  toggleDepartDone,
} from '../../core/firebase/depart'
import { findGearItem } from '../../core/services/kit'
import { LVLS, type Level } from '../../core/constants/gear'
import { useCollection } from '../../hooks/useCollection'
import { TrashIcon } from '../../components/icons'

// Palette d'avatars de l'ancienne app (fonction avS)
const AV_COLORS = ['#E8C84A', '#C4531A', '#4A7FA8', '#2A5C35', '#8C7000']

function avatarStyle(i: number) {
  return { background: AV_COLORS[i % AV_COLORS.length], color: '#fff' }
}

interface CordeePageProps {
  memberName: string
}

export function CordeePage({ memberName }: CordeePageProps) {
  const { data: users, loading } = useCollection(usersCol)
  const { data: departItems } = useCollection(departItemsCol)
  const [newItem, setNewItem] = useState('')
  const [copied, setCopied] = useState(false)

  // Lien d'invitation : URL de l'app (comme copyInvite de l'ancienne app)
  const inviteUrl = window.location.origin
  const copyInvite = () => {
    void navigator.clipboard
      .writeText(inviteUrl)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((e) => console.warn('clipboard:', e))
  }

  const members = users
    .map((u) => ({
      name: u.profile?.name || u.displayName?.split(' ')[0] || u.email,
      level: ((u.profile as { level?: Level } | undefined)?.level ?? 'newbie') as Level,
      km: u.profile?.km ?? 0,
      dplus: u.profile?.dplus ?? 0,
      sorties: u.profile?.sorties ?? 0,
      kitChecked: u.kitChecked ?? {},
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const sortedDepart = [...departItems].sort((a, b) => String(a.id).localeCompare(String(b.id)))

  const add = () => {
    const t = newItem.trim()
    if (!t) return
    setNewItem('')
    void addDepartItem(t).catch((e) => console.warn('depart:', e))
  }

  return (
    <div className="tab active">
      <div className="sec">Membres</div>
      <div className="card">
        {loading && (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        )}
        {members.map((m, i) => (
          <div className="member-row" key={m.name}>
            <div className="sm-av" style={avatarStyle(i)}>
              {m.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
              <div style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>
                {m.km}KM · +{m.dplus.toLocaleString()}M · {m.sorties} sorties
              </div>
            </div>
            <span className={`tag ${LVLS[m.level]?.cls ?? 'ta'}`}>{LVLS[m.level]?.l ?? 'Débutant'}</span>
          </div>
        ))}
      </div>

      <div className="sec" style={{ marginTop: 12 }}>
        Kit partagé du groupe
      </div>
      <div
        style={{
          background: 'rgba(74,127,168,.08)',
          border: '.5px solid rgba(74,127,168,.25)',
          borderRadius: 'var(--r)',
          padding: '9px 12px',
          marginBottom: 10,
          fontSize: 11,
          color: 'var(--blue)',
          fontFamily: 'var(--mono)',
          lineHeight: 1.6,
        }}
      >
        Déduit automatiquement du kit coché de chacun. Coche tes équipements dans l'onglet Kit pour apparaître ici.
      </div>
      <div className="card" style={{ padding: '0 14px' }}>
        {members.map((m, i) => {
          const items = Object.entries(m.kitChecked)
            .filter(([, v]) => v)
            .map(([id]) => findGearItem(id)?.name)
            .filter((n): n is string => !!n)
          if (!items.length) return null
          return (
            <div
              key={m.name}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '.5px solid var(--border)' }}
            >
              <div className="sm-av" style={{ ...avatarStyle(i), width: 28, height: 28, fontSize: 9 }}>
                {m.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{m.name}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {items.slice(0, 5).map((it) => (
                    <span
                      key={it}
                      style={{
                        fontSize: 9,
                        padding: '2px 6px',
                        borderRadius: 6,
                        background: 'var(--kraft2)',
                        color: 'var(--ink2)',
                        fontFamily: 'var(--mono)',
                        border: '.5px solid var(--border)',
                      }}
                    >
                      {it}
                    </span>
                  ))}
                  {items.length > 5 && (
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 6, background: 'var(--kraft2)', color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>
                      +{items.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="sec" style={{ marginTop: 12 }}>
        Checklist départ
      </div>
      <div
        style={{
          background: 'rgba(74,127,168,.08)',
          border: '.5px solid rgba(74,127,168,.25)',
          borderRadius: 'var(--r)',
          padding: '9px 12px',
          marginBottom: 10,
          fontSize: 11,
          color: 'var(--blue)',
          fontFamily: 'var(--mono)',
          lineHeight: 1.6,
        }}
      >
        Articles collectifs pour la sortie. Clique "Prendre en charge" pour t'assigner, les autres le verront en temps réel.
      </div>
      <div className="card" style={{ padding: '0 14px' }}>
        {sortedDepart.map((item) => (
          <div className="gear-item" key={item.docId}>
            <div
              className={item.done ? 'gear-check done' : 'gear-check'}
              onClick={() => void toggleDepartDone(item.docId, !item.done)}
            />
            <div style={{ flex: 1 }}>
              <div className={item.done ? 'gear-name done' : 'gear-name'}>{item.name}</div>
              <div style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                {item.assignee ? `Pris en charge par ${item.assignee}` : 'Personne dessus'}
              </div>
            </div>
            <button
              className="btn btn-sm"
              style={{ fontSize: 9 }}
              onClick={() => void assignDepartItem(item.docId, item.assignee === memberName ? null : memberName)}
            >
              {item.assignee === memberName ? 'Me retirer' : 'Prendre en charge'}
            </button>
            <button
              onClick={() => void deleteDepartItem(item.docId)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--ink4)', display: 'flex', alignItems: 'center' }}
              title="Supprimer"
            >
              <TrashIcon size={11} />
            </button>
          </div>
        ))}
        {sortedDepart.length === 0 && (
          <div style={{ textAlign: 'center', padding: 16, color: 'var(--ink3)', fontSize: 11, fontFamily: 'var(--mono)' }}>
            AUCUN ARTICLE
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input
          className="form-input"
          placeholder="Ajouter un article…"
          style={{ flex: 1, fontSize: 11 }}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className="btn btn-sm" onClick={add}>
          Ajouter
        </button>
      </div>

      <div className="sec" style={{ marginTop: 12 }}>
        Inviter
      </div>
      <div className="card" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="form-input" style={{ flex: 1, fontSize: 11 }} readOnly value={inviteUrl} />
        <button className="btn btn-sm" onClick={copyInvite}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>
    </div>
  )
}
