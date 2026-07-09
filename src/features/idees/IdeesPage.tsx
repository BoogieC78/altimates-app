import { useState } from 'react'
import { feedbacksCol } from '../../core/firebase/collections'
import {
  addFeedback,
  addFeedbackComment,
  deleteFeedback,
  deleteFeedbackComment,
  setFeedbackStatus,
  voteFeedback,
} from '../../core/firebase/feedbacks'
import { relativeTime } from '../../core/services/time'
import { useCollection, type WithDocId } from '../../hooks/useCollection'
import type { Feedback, FeedbackStatus } from '../../core/types'
import { BubbleIcon, ThumbIcon, TrashIcon } from '../../components/icons'

const CATL: Record<string, string> = { feature: 'Feature', ux: 'UX', bug: 'Bug', content: 'Contenu' }
const CATCLS: Record<string, string> = { feature: 'tb', ux: 'tg', bug: 'tr', content: 'tgold' }
const STATUSES: FeedbackStatus[] = ['backlog', 'todo', 'inprogress', 'done', 'wontdo']
const STATUS_LABELS: Record<FeedbackStatus, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  inprogress: 'In progress',
  done: 'Done',
  wontdo: "Won't do",
}
const STATUS_CLS: Record<FeedbackStatus, string> = {
  backlog: 'status-backlog',
  todo: 'status-todo',
  inprogress: 'status-wip',
  done: 'status-done',
  wontdo: 'status-wontdo',
}

interface IdeesPageProps {
  memberName: string
}

export function IdeesPage({ memberName }: IdeesPageProps) {
  const { data: feedbacks, loading } = useCollection(feedbacksCol)
  const [view, setView] = useState<'liste' | 'kanban'>('liste')
  const [text, setText] = useState('')
  const [cat, setCat] = useState('feature')
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})

  const sorted = [...feedbacks].sort(
    (a, b) => (b.votes?.up ?? 0) - (b.votes?.down ?? 0) - ((a.votes?.up ?? 0) - (a.votes?.down ?? 0)),
  )

  const submit = () => {
    const t = text.trim()
    if (!t) return
    setText('')
    void addFeedback(memberName, t, cat).catch((e) => console.warn('feedback:', e))
  }

  const time = (f: WithDocId<Feedback>) =>
    f.createdAt ? relativeTime(f.createdAt.toMillis(), Date.now()) : f.ts ?? ''

  return (
    <div className="tab active">
      <div className="info-box">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4A7FA8" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>Propose des améliorations pour ALTImates. Les idées les plus votées seront intégrées.</p>
      </div>

      <div className="view-toggle">
        <button className={view === 'liste' ? 'view-btn active' : 'view-btn'} onClick={() => setView('liste')}>
          Liste
        </button>
        <button className={view === 'kanban' ? 'view-btn active' : 'view-btn'} onClick={() => setView('kanban')}>
          Kanban
        </button>
      </div>

      {view === 'kanban' ? (
        <div className="kanban-wrap">
          {STATUSES.map((s) => {
            const cards = sorted.filter((f) => (f.status ?? 'backlog') === s)
            return (
              <div className="kanban-col" data-col={s} key={s}>
                <div className="kanban-col-header">
                  {STATUS_LABELS[s]} <span className="kanban-col-count">{cards.length}</span>
                </div>
                <div className="kanban-cards">
                  {cards.map((f) => (
                    <div className="card" key={f.docId} style={{ marginBottom: 0, padding: '9px 11px' }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                        <span className={`tag ${CATCLS[f.cat] ?? 'tb'}`}>{CATL[f.cat] ?? f.cat}</span>
                      </div>
                      <div style={{ fontSize: 11, lineHeight: 1.5 }}>{f.text}</div>
                      <div style={{ fontSize: 9, color: 'var(--ink4)', fontFamily: 'var(--mono)', marginTop: 5 }}>
                        {f.author} · ▲{f.votes?.up ?? 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <>
          <div className="sec">Nouvelle idée</div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ marginBottom: 9 }}>
              <label className="form-lbl">Ton idée</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="ex: Filtrer par dénivelé max..."
                style={{ resize: 'vertical' }}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 9 }}>
              <label className="form-lbl">Catégorie</label>
              <select className="form-input" value={cat} onChange={(e) => setCat(e.target.value)}>
                <option value="feature">Fonctionnalité</option>
                <option value="ux">UX / Design</option>
                <option value="bug">Bug</option>
                <option value="content">Contenu</option>
              </select>
            </div>
            <button className="btn btn-primary btn-full" onClick={submit}>
              Soumettre
            </button>
          </div>

          <div className="sec">Idées du groupe</div>
          {loading && (
            <div className="spinner-wrap">
              <div className="spinner" />
            </div>
          )}
          {!loading && sorted.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink3)', fontSize: 11, fontFamily: 'var(--mono)' }}>
              AUCUNE IDÉE ENCORE
            </div>
          )}
          {sorted.map((f) => {
            const status = f.status ?? 'backlog'
            const myVote = f.voters?.[memberName]
            const comments = f.comments ?? []
            return (
              <div className="fb-item" key={f.docId}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 7 }}>
                  <span className={`tag ${CATCLS[f.cat] ?? 'tb'}`}>{CATL[f.cat] ?? f.cat}</span>
                  <span
                    className={STATUS_CLS[status]}
                    style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, fontFamily: 'var(--mono)', fontWeight: 500 }}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                  <span style={{ color: 'var(--ink4)', fontSize: 9, fontFamily: 'var(--mono)' }}>
                    {f.author} · {time(f)}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 10 }}>{f.text}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  <button
                    className={myVote === 'up' ? 'vote-chip up-active' : 'vote-chip'}
                    onClick={() => void voteFeedback(f, memberName, 'up')}
                  >
                    <ThumbIcon />
                    {f.votes?.up ?? 0}
                  </button>
                  <button
                    className={myVote === 'down' ? 'vote-chip down-active' : 'vote-chip'}
                    onClick={() => void voteFeedback(f, memberName, 'down')}
                  >
                    <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
                      <ThumbIcon />
                    </span>
                    {f.votes?.down ?? 0}
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ fontSize: 9, padding: '3px 8px' }}
                    onClick={() => setOpenComments({ ...openComments, [f.docId]: !openComments[f.docId] })}
                  >
                    <BubbleIcon />
                    {comments.length}
                  </button>
                  {(f.votes?.up ?? 0) >= 3 && <span className="tag tgold">POPULAIRE</span>}
                  <button
                    onClick={() => confirm('Supprimer cette idée ?') && void deleteFeedback(f.docId)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--ink4)', display: 'flex', alignItems: 'center' }}
                    title="Supprimer"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', paddingTop: 8, borderTop: '.5px solid var(--border)' }}>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => void setFeedbackStatus(f.docId, s)}
                      style={{
                        fontSize: 9,
                        padding: '2px 8px',
                        borderRadius: 20,
                        border: '.5px solid rgba(45,45,42,.15)',
                        cursor: 'pointer',
                        fontFamily: 'var(--mono)',
                        background: status === s ? 'var(--ink)' : 'transparent',
                        color: status === s ? 'var(--gold)' : 'var(--ink3)',
                        fontWeight: status === s ? 600 : 400,
                      }}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
                {openComments[f.docId] && (
                  <div style={{ marginTop: 10 }}>
                    {comments.map((c, ci) => (
                      <div key={ci} style={{ padding: '6px 0', borderTop: '.5px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--mono)' }}>{c.author}</span>{' '}
                          <span style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>{c.ts}</span>
                          <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 2, lineHeight: 1.5 }}>{c.text}</div>
                        </div>
                        {c.author === memberName && (
                          <button
                            onClick={() => void deleteFeedbackComment(f, ci)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--ink4)', flexShrink: 0, opacity: 0.4 }}
                          >
                            <TrashIcon size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <input
                        className="form-input"
                        placeholder="Ajouter un commentaire…"
                        style={{ fontSize: 11, padding: '6px 9px' }}
                        value={commentDrafts[f.docId] ?? ''}
                        onChange={(e) => setCommentDrafts({ ...commentDrafts, [f.docId]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const t = (commentDrafts[f.docId] ?? '').trim()
                            if (!t) return
                            setCommentDrafts({ ...commentDrafts, [f.docId]: '' })
                            void addFeedbackComment(f, { author: memberName, text: t, ts: "à l'instant" })
                          }
                        }}
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          const t = (commentDrafts[f.docId] ?? '').trim()
                          if (!t) return
                          setCommentDrafts({ ...commentDrafts, [f.docId]: '' })
                          void addFeedbackComment(f, { author: memberName, text: t, ts: "à l'instant" })
                        }}
                      >
                        Envoyer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
