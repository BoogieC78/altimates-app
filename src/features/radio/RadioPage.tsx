import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import {
  BROADCAST_CHANNEL_ID,
  CORDEE_ORIGINE_ID,
  cordeeMembersCol,
  messagesColForChannel,
  usersCol,
} from '../../core/firebase/collections'
import {
  getActiveCordeeId,
  listMyCordees,
  normalizeEmail,
  setActiveCordeeId,
  type WithDocId,
} from '../../core/firebase/cordees'
import {
  deleteMessage,
  initials,
  markRead,
  sendMessage,
  togglePin,
} from '../../core/firebase/messages'
import { relativeTime } from '../../core/services/time'
import { useCollection } from '../../hooks/useCollection'
import type { Cordee, MessageType } from '../../core/types'
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
  user: User
  memberName: string
}

/**
 * Radio par canal : un fil par cordée (isolé par firestore.rules — seuls les
 * membres de LA cordée le lisent) + le canal « 📢 Broadcast », l'ancienne radio
 * globale, visible par tous les membres de l'app. Canal par défaut : la cordée
 * active (localStorage), sinon la première de mes cordées, sinon le broadcast.
 */
export function RadioPage({ user, memberName }: RadioPageProps) {
  const email = normalizeEmail(user.email ?? '')
  const [cordees, setCordees] = useState<WithDocId<Cordee>[] | null>(null)
  const [channel, setChannel] = useState<string>(getActiveCordeeId())
  const isBroadcast = channel === BROADCAST_CHANNEL_ID

  const { data: messages, loading } = useCollection(messagesColForChannel(channel))
  const { data: users } = useCollection(usersCol)
  // Accusés de lecture d'un canal de cordée : les membres de CETTE cordée.
  // (Pour le broadcast, la liste `users` sert de référence, comme avant.)
  const { data: cordeeMembers } = useCollection(
    cordeeMembersCol(isBroadcast ? CORDEE_ORIGINE_ID : channel),
  )
  const [activeType, setActiveType] = useState<MessageType>('message')
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const myInitials = initials(memberName)

  useEffect(() => {
    if (!email) {
      setCordees([])
      return
    }
    void listMyCordees(email)
      .then(setCordees)
      .catch((e) => {
        console.warn('cordees:', e)
        setCordees([])
      })
  }, [email])

  // Si le canal courant n'est ni le broadcast ni une de mes cordées (localStorage
  // périmé, cordée quittée…), on retombe sur ma première cordée, sinon le broadcast.
  useEffect(() => {
    if (!cordees || isBroadcast) return
    if (!cordees.some((c) => c.docId === channel)) {
      setChannel(cordees[0]?.docId ?? BROADCAST_CHANNEL_ID)
    }
  }, [cordees, channel, isBroadcast])

  const selectChannel = (id: string) => {
    setChannel(id)
    // Le broadcast n'est pas une cordée : il ne devient jamais la cordée active.
    if (id !== BROADCAST_CHANNEL_ID) setActiveCordeeId(id)
  }

  const sorted = [...messages].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
  const pinned = sorted.filter((m) => m.pinned)
  const feed = sorted.filter((m) => !m.pinned)

  const memberInitialsList = (
    isBroadcast
      ? users.map((u) => u.profile?.name || u.displayName?.split(' ')[0] || '')
      : cordeeMembers.map((m) => m.name || m.email.split('@')[0])
  )
    .filter(Boolean)
    .map(initials)

  // Marquage lu : à l'ouverture du canal, on ajoute nos initiales aux messages non lus.
  useEffect(() => {
    for (const m of messages) {
      if (m.reads && !m.reads.includes(myInitials)) {
        void markRead(channel, m.docId, myInitials).catch(() => {})
      }
    }
  }, [messages, myInitials, channel])

  const send = () => {
    const t = text.trim()
    if (!t) return
    setText('')
    void sendMessage(channel, memberName, t, activeType).catch((e) => console.warn('send:', e))
  }

  const time = (m: (typeof messages)[number]) =>
    m.createdAt ? relativeTime(m.createdAt.toMillis(), Date.now()) : m.time ?? ''

  const activeCordee = cordees?.find((c) => c.docId === channel) ?? null
  const channelLabel = isBroadcast ? 'BROADCAST' : (activeCordee?.name ?? 'CORDÉE').toUpperCase()

  const renderDelete = (docId: string, light = false) => (
    <button
      onClick={() => deleteMessage(channel, docId).catch((e) => console.warn('delete:', e))}
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
          <div className="radio-title">RADIO · {channelLabel}</div>
          <div className="radio-sub">
            {isBroadcast ? "Visible par tous les membres de l'app" : 'Messages de la cordée'}
          </div>
        </div>
      </div>

      {/* Sélecteur de canal : mes cordées + le broadcast. */}
      <div className="msg-type-row" aria-label="Canal radio" style={{ marginBottom: 10 }}>
        {(cordees ?? []).map((c) => (
          <button
            key={c.docId}
            className={channel === c.docId ? 'type-btn active' : 'type-btn'}
            aria-pressed={channel === c.docId}
            onClick={() => selectChannel(c.docId)}
          >
            {c.name}
          </button>
        ))}
        <button
          className={isBroadcast ? 'type-btn active' : 'type-btn'}
          aria-pressed={isBroadcast}
          onClick={() => selectChannel(BROADCAST_CHANNEL_ID)}
        >
          📢 Broadcast
        </button>
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
                onClick={() => void togglePin(channel, m.docId, false)}
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
        {isBroadcast ? 'Fil général' : 'Fil de la cordée'}
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
                  onClick={() => void togglePin(channel, m.docId, true)}
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
