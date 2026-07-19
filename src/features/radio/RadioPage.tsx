import { useEffect, useRef, useState, type ReactNode } from 'react'
import { messagesCol, usersCol } from '../../core/firebase/collections'
import {
  deleteMessage,
  initials,
  markRead,
  sendMessage,
  togglePin,
} from '../../core/firebase/messages'
import { relativeTime } from '../../core/services/time'
import { useCollection } from '../../hooks/useCollection'
import type { MessageType } from '../../core/types'
import {
  BubbleIcon,
  CheckIcon,
  SendIcon,
  SmallAlertIcon,
  SmallPinIcon,
  TrashIcon,
} from '../../components/icons'

const MSG_TYPES: MessageType[] = ['message', 'position', 'alerte', 'confirmation']
const MSG_TYPE_LABELS: Record<MessageType, string> = {
  message: 'Message',
  position: 'Position',
  alerte: 'Alerte',
  confirmation: 'Confirmation',
}
const MSG_TYPE_ICONS: Record<MessageType, ReactNode> = {
  message: <BubbleIcon />,
  position: <SmallPinIcon />,
  alerte: <SmallAlertIcon />,
  confirmation: <CheckIcon />,
}

interface RadioPageProps {
  memberName: string
}

export function RadioPage({ memberName }: RadioPageProps) {
  const { data: messages, loading } = useCollection(messagesCol)
  const { data: users } = useCollection(usersCol)
  const [activeType, setActiveType] = useState<MessageType>('message')
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const myInitials = initials(memberName)

  const sorted = [...messages].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
  const pinned = sorted.filter((m) => m.pinned)
  const feed = sorted.filter((m) => !m.pinned)

  const memberInitialsList = users
    .map((u) => u.profile?.name || u.displayName?.split(' ')[0] || '')
    .filter(Boolean)
    .map(initials)

  // Marquage lu : à l'ouverture de l'onglet, on ajoute nos initiales aux messages non lus.
  useEffect(() => {
    for (const m of messages) {
      if (m.reads && !m.reads.includes(myInitials)) {
        void markRead(m.docId, myInitials).catch(() => {})
      }
    }
  }, [messages, myInitials])

  const send = () => {
    const t = text.trim()
    if (!t) return
    setText('')
    void sendMessage(memberName, t, activeType).catch((e) => console.warn('send:', e))
  }

  const time = (m: (typeof messages)[number]) =>
    m.createdAt ? relativeTime(m.createdAt.toMillis(), Date.now()) : m.time ?? ''

  const renderDelete = (docId: string, light = false) => (
    <button
      onClick={() => deleteMessage(docId).catch((e) => console.warn('delete:', e))}
      title="Supprimer"
      aria-label="Supprimer"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 8,
        margin: -5,
        color: light ? 'rgba(255,255,255,.7)' : 'var(--ink4)',
        opacity: 0.35,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <TrashIcon size={11} />
    </button>
  )

  return (
    <div className="tab active" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="radio-header">
        <div>
          <div className="radio-title">RADIO · CORDÉE</div>
          <div className="radio-sub">Messages de la cordée</div>
        </div>
      </div>

      {pinned.length > 0 && (
        <>
          <h2 className="sec">Épinglés</h2>
          {pinned.map((m) => (
            <div className="msg-pinned" key={m.docId}>
              <div className="msg-pin-icon">·</div>
              <div style={{ flex: 1 }}>
                <div className="msg-pinned-text">{m.text}</div>
                <div className="msg-pinned-meta">
                  {MSG_TYPE_LABELS[m.type] ?? m.type} · {m.author} · {time(m)}
                </div>
              </div>
              <button
                onClick={() => void togglePin(m.docId, false)}
                title="Désépingler"
                aria-label="Désépingler"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 8,
                  margin: -5,
                  opacity: 0.35,
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  color: 'var(--ink4)',
                }}
              >
                📌
              </button>
              {renderDelete(m.docId)}
            </div>
          ))}
        </>
      )}

      <h2 className="sec" style={{ marginTop: 4 }}>
        Fil de la cordée
      </h2>
      <div className="msg-list" aria-live="polite">
        {loading && (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        )}
        {!loading && feed.length === 0 && (
          <div className="card">
            <div className="t-body">Aucun message. Lance la conversation !</div>
          </div>
        )}
        {feed.map((m) => {
          const isMe = m.author === memberName
          return (
            <div className={isMe ? 'msg me' : 'msg'} key={m.docId}>
              <div className="msg-header">
                <span
                  className={`msg-type type-${m.type}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
                >
                  {MSG_TYPE_ICONS[m.type]}
                  {MSG_TYPE_LABELS[m.type] ?? m.type}
                </span>
                <span className="msg-author">{m.author}</span>
                <span className="msg-time">{time(m)}</span>
                <button
                  onClick={() => void togglePin(m.docId, true)}
                  title="Épingler"
                  aria-label="Épingler"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 8,
                    margin: -6,
                    marginLeft: -2,
                    opacity: 0.35,
                    display: 'flex',
                    alignItems: 'center',
                    color: isMe ? 'rgba(255,255,255,.7)' : 'var(--ink4)',
                  }}
                >
                  📌
                </button>
                {renderDelete(m.docId, isMe)}
              </div>
              <div className="msg-text">{m.text}</div>
              <div className="msg-receipts">
                {memberInitialsList.map((ini, i) => (
                  <div
                    key={i}
                    className={m.reads?.includes(ini) ? 'receipt read' : 'receipt unread'}
                    title={ini}
                    role="img"
                    aria-label={m.reads?.includes(ini) ? `${ini} a lu` : `${ini} n'a pas lu`}
                  >
                    {ini[0]}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="msg-compose" style={{ marginTop: 12 }}>
        <div className="msg-type-row">
          {MSG_TYPES.map((t) => (
            <button
              key={t}
              className={activeType === t ? 'type-btn active' : 'type-btn'}
              aria-pressed={activeType === t}
              onClick={() => setActiveType(t)}
            >
              {MSG_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="msg-input-row">
          <textarea
            ref={textareaRef}
            className="msg-textarea"
            rows={1}
            placeholder="Ton message..."
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 100)}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button className="send-btn" onClick={send} aria-label="Envoyer">
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
