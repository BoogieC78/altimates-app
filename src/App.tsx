import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useMemberName } from './hooks/useMemberName'
import { signInWithGoogle, signOut, isAdmin } from './core/firebase/auth'
import { SommetsPage } from './features/sommets/SommetsPage'
import { RadioPage } from './features/radio/RadioPage'
import { KitPage } from './features/kit/KitPage'
import { IdeesPage } from './features/idees/IdeesPage'
import { CordeePage } from './features/cordee/CordeePage'
import { BasecampPage } from './features/basecamp/BasecampPage'
import { TopoBackground } from './components/TopoBackground'
import { LogoIcon, NAV_ICONS } from './components/icons'

const TABS = [
  { key: 'sommets', label: 'Sommets' },
  { key: 'kit', label: 'Kit' },
  { key: 'radio', label: 'Radio' },
  { key: 'idees', label: 'Idées' },
  { key: 'cordee', label: 'Cordée' },
  { key: 'basecamp', label: 'Base Camp' },
] as const

export default function App() {
  const { user, loading } = useAuth()
  const memberName = useMemberName(user)
  const [tab, setTab] = useState('sommets')
  const [loginError, setLoginError] = useState('')

  if (loading) return null

  if (!user) {
    return (
      <div className="auth-screen">
        <div style={{ opacity: 0.4 }}>
          <TopoBackground />
        </div>
        <div className="auth-logo">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <LogoIcon size={56} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--ink)', letterSpacing: '.04em' }}>
            ALTI
            <span style={{ fontWeight: 700, fontStyle: 'italic', color: 'var(--gold2)' }}>mates</span>
          </div>
          <div
            style={{
              fontSize: 9,
              color: 'var(--ink4)',
              fontFamily: 'var(--mono)',
              letterSpacing: '.1em',
              marginTop: 4,
            }}
          >
            PLAN · GEAR UP · SUMMIT TOGETHER
          </div>
        </div>
        <div className="auth-card">
          <div className="auth-title">Bienvenue dans la cordée</div>
          <div className="auth-sub">Connecte-toi pour accéder à l'app et rejoindre ton groupe</div>
          <button
            className="auth-google-btn"
            onClick={() => signInWithGoogle().catch((e: Error) => setLoginError(e.message))}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            Continuer avec Google
          </button>
          {loginError && (
            <div className="auth-error" style={{ display: 'block' }}>
              Accès réservé à la cordée ALTImates.
              <br />
              Contacte Nordine pour être ajouté.
            </div>
          )}
        </div>
      </div>
    )
  }

  const tabs = isAdmin(user) ? [...TABS, { key: 'admin', label: 'Admin' } as const] : [...TABS]

  return (
    <>
      <TopoBackground />
      <div className="app">
        <div className="header">
          <div className="logo">
            <LogoIcon />
            <div>
              <div className="logo-name">
                <span className="alti">ALTI</span>
                <span className="mates">mates</span>
              </div>
              <div className="logo-sub">GROUPE · 5 MEMBRES</div>
            </div>
          </div>
          <button className="av-btn" onClick={() => void signOut()} title="Déconnexion">
            {memberName.slice(0, 2).toUpperCase()}
          </button>
        </div>

        {tab === 'sommets' ? (
          <SommetsPage memberName={memberName} />
        ) : tab === 'radio' ? (
          <RadioPage memberName={memberName} />
        ) : tab === 'kit' ? (
          <KitPage user={user} memberName={memberName} />
        ) : tab === 'idees' ? (
          <IdeesPage memberName={memberName} />
        ) : tab === 'cordee' ? (
          <CordeePage memberName={memberName} />
        ) : tab === 'basecamp' ? (
          <BasecampPage user={user} memberName={memberName} onGoKit={() => setTab('kit')} />
        ) : (
          <div className="tab active">
            <div className="sec">{tabs.find((t) => t.key === tab)?.label}</div>
            <div className="card">
              <div className="t-body">Migration en cours, disponible bientôt sur la nouvelle app.</div>
            </div>
          </div>
        )}

        <nav className="nav">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={t.key === tab ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setTab(t.key)}
            >
              {NAV_ICONS[t.key]}
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}
