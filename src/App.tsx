import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from './hooks/useAuth'
import { useMemberName } from './hooks/useMemberName'
import {
  signInWithGoogle,
  isAdmin,
  isDevAutoLoginEnabled,
  sendEmailSignInLink,
  completeEmailSignIn,
} from './core/firebase/auth'
import { SommetsPage } from './features/sommets/SommetsPage'
import { RadioPage } from './features/radio/RadioPage'
import { KitPage } from './features/kit/KitPage'
import { IdeesPage } from './features/idees/IdeesPage'
import { CordeePage } from './features/cordee/CordeePage'
import { BasecampPage } from './features/basecamp/BasecampPage'
import { AdminPage } from './features/admin/AdminPage'
import { GuidedTour, shouldShowTour } from './components/GuidedTour'
import { TopoBackground } from './components/TopoBackground'
import { LogoIcon, NAV_ICONS } from './components/icons'

// Traduit les erreurs Firebase Auth (codes bruts type "Firebase: Error
// (auth/popup-closed-by-user)") en messages lisibles pour l'utilisateur.
function friendlyAuthError(err: Error): string {
  const msg = err.message || ''
  if (msg.includes('auth/popup-closed-by-user') || msg.includes('auth/cancelled-popup-request')) {
    return 'Connexion annulée : la fenêtre Google a été fermée avant la fin.'
  }
  if (msg.includes('auth/popup-blocked')) {
    return "Ton navigateur a bloqué la fenêtre de connexion Google. Autorise les popups pour ce site et réessaie."
  }
  if (msg.includes('auth/network-request-failed')) {
    return 'Problème de connexion internet. Vérifie ton réseau et réessaie.'
  }
  if (msg.includes('Email non autorisé')) {
    return msg
  }
  return msg || 'Connexion impossible pour le moment. Réessaie dans un instant.'
}

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
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [showTour, setShowTour] = useState(shouldShowTour)

  // Si on revient d'un lien de connexion e-mail, on termine la connexion au chargement.
  useEffect(() => {
    completeEmailSignIn(() => window.prompt('Confirme ton e-mail pour terminer la connexion')).catch(
      (e: Error) => setLoginError(e.message),
    )
  }, [])

  const submitEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const addr = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(addr)) {
      setLoginError('Entre une adresse e-mail valide.')
      return
    }
    setLoginError('')
    sendEmailSignInLink(addr)
      .then(() => setEmailSent(true))
      .catch((err: Error) => setLoginError(friendlyAuthError(err)))
  }

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
            onClick={() => signInWithGoogle().catch((e: Error) => setLoginError(friendlyAuthError(e)))}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            Continuer avec Google
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: '14px 0',
              color: 'var(--ink4)',
              fontSize: 10,
              fontFamily: 'var(--mono)',
            }}
          >
            <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
            OU
            <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
          </div>

          {emailSent ? (
            <div className="auth-sub" style={{ textAlign: 'center', lineHeight: 1.6 }}>
              📧 Lien de connexion envoyé à <b>{email}</b>.
              <br />
              Ouvre-le sur cet appareil pour te connecter.
            </div>
          ) : (
            <form onSubmit={submitEmail}>
              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <button className="btn btn-primary btn-full" style={{ marginTop: 8 }} type="submit">
                Recevoir un lien de connexion
              </button>
            </form>
          )}

          {loginError && (
            <div className="auth-error" style={{ display: 'block' }}>
              {loginError}
            </div>
          )}
        </div>
      </div>
    )
  }

  const tabs = isAdmin(user) ? [...TABS, { key: 'admin', label: 'Admin' } as const] : [...TABS]

  if (showTour) {
    return <GuidedTour onDone={() => setShowTour(false)} />
  }

  return (
    <>
      {import.meta.env.DEV && isDevAutoLoginEnabled() && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            textAlign: 'center',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '.08em',
            padding: '3px 0',
            background: '#e6c356',
            color: '#23221e',
          }}
        >
          MODE DEV · AUTO-LOGIN ÉMULATEUR — jamais en production
        </div>
      )}
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
          <button
            className="av-btn"
            onClick={() => setTab('basecamp')}
            title="Mon Base Camp"
            aria-label="Mon Base Camp"
          >
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
        ) : tab === 'admin' ? (
          <AdminPage memberName={memberName} />
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
