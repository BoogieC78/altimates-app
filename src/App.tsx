import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useMemberName } from './hooks/useMemberName'
import { signInWithGoogle, signOut, isAdmin } from './core/firebase/auth'
import { SommetsPage } from './features/sommets/SommetsPage'
import './App.css'

const TABS = ['Sommets', 'Kit', 'Radio', 'Idées', 'Cordée', 'Base Camp'] as const
type Tab = (typeof TABS)[number] | 'Admin'

export default function App() {
  const { user, loading } = useAuth()
  const memberName = useMemberName(user)
  const [tab, setTab] = useState<Tab>('Sommets')
  const [loginError, setLoginError] = useState('')

  if (loading) return <div className="screen-center">…</div>

  if (!user) {
    return (
      <div className="screen-center">
        <h1>Altimates</h1>
        <p className="muted">Plan · Gear up · Summit together</p>
        <button
          className="btn-primary"
          onClick={() =>
            signInWithGoogle().catch((e: Error) => setLoginError(e.message))
          }
        >
          Se connecter avec Google
        </button>
        {loginError && <p className="error">{loginError}</p>}
      </div>
    )
  }

  const tabs: Tab[] = isAdmin(user) ? [...TABS, 'Admin'] : [...TABS]

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">Altimates</span>
        <button className="btn-ghost" onClick={() => void signOut()}>
          {user.displayName?.split(' ')[0]} · Déconnexion
        </button>
      </header>
      <nav className="tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={t === tab ? 'tab active' : 'tab'}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>
      <main className="content">
        {tab === 'Sommets' ? (
          <SommetsPage memberName={memberName} />
        ) : (
          <p className="muted">{tab} : migration en cours.</p>
        )}
      </main>
    </div>
  )
}
