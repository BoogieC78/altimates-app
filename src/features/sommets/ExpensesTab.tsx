import { useState } from 'react'
import { addExpense, removeExpense } from '../../core/firebase/expenses'
import { expensesCol, usersCol } from '../../core/firebase/collections'
import {
  computeBalances,
  computeSettlements,
  formatCents,
  parseAmountToCents,
  totalSpent,
} from '../../core/services/expenses'
import { useCollection, type WithDocId } from '../../hooks/useCollection'
import type { Rando } from '../../core/types'

/**
 * Onglet Dépenses d'une sortie (principe Tricount) : chacun saisit ce qu'il a
 * avancé pour le groupe, l'app affiche les soldes et qui rembourse qui.
 * Aucun paiement n'est encaissé ici — le remboursement se fait hors app.
 */
export function ExpensesTab({ rando: r, memberName }: { rando: WithDocId<Rando>; memberName: string }) {
  const randoId = String(r.id)
  const { data: allExpenses } = useCollection(expensesCol)
  const { data: users } = useCollection(usersCol)
  const expenses = allExpenses.filter((e) => e.randoId === randoId)

  // Participants proposés : les partants de la sortie ; à défaut, tous les
  // membres ayant un profil (une dépense peut être avancée avant les votes).
  const partants = Object.entries(r.memberVotes ?? {})
    .filter(([, v]) => v === 'oui')
    .map(([name]) => name)
  const allMembers = users.map((u) => u.profile?.name).filter((n): n is string => !!n)
  const participants = Array.from(new Set(partants.length ? [...partants, memberName] : [...allMembers, memberName])).sort()

  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [selected, setSelected] = useState<string[] | null>(null)
  const [formError, setFormError] = useState('')

  // null = « tous les participants » (défaut, recalculé si la liste change).
  const beneficiaries = selected ?? participants

  const toggleBeneficiary = (name: string) => {
    const next = beneficiaries.includes(name)
      ? beneficiaries.filter((n) => n !== name)
      : [...beneficiaries, name]
    setSelected(next)
  }

  const submit = () => {
    const cents = parseAmountToCents(amount)
    if (!label.trim()) {
      setFormError('LIBELLÉ REQUIS')
      return
    }
    if (cents === null) {
      setFormError('MONTANT INVALIDE')
      return
    }
    if (!beneficiaries.length) {
      setFormError('AU MOINS UN BÉNÉFICIAIRE')
      return
    }
    setFormError('')
    void addExpense({ randoId, label: label.trim(), amount: cents, payer: memberName, beneficiaries }).catch((e) =>
      console.warn('addExpense:', e),
    )
    setLabel('')
    setAmount('')
    setSelected(null)
  }

  const balances = computeBalances(expenses)
  const settlements = computeSettlements(balances)
  const total = totalSpent(expenses)
  const balanceRows = Object.entries(balances).sort(([, a], [, b]) => b - a)

  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)', marginBottom: 10 }}>
        Qui a avancé quoi, et qui rembourse qui. Les remboursements se font entre vous, hors de l'app.
      </div>

      {/* Saisie d'une dépense */}
      <h2 className="sec">Ajouter une dépense</h2>
      <div className="card" style={{ padding: '12px 14px', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input
            className="form-input"
            placeholder="ex: Lyophilisés"
            aria-label="Libellé de la dépense"
            style={{ flex: 2, fontSize: 16, padding: '6px 9px' }}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className="form-input"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            aria-label="Montant en euros"
            style={{ flex: 1, fontSize: 16, padding: '6px 9px', minWidth: 0 }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        <div style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
          Pour qui ?
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {participants.map((name) => {
            const on = beneficiaries.includes(name)
            return (
              <button
                key={name}
                className={on ? 'time-btn active' : 'time-btn'}
                aria-pressed={on}
                onClick={() => toggleBeneficiary(name)}
              >
                {name}
              </button>
            )
          })}
        </div>
        <button className="btn btn-primary btn-sm" onClick={submit} style={{ width: '100%', justifyContent: 'center' }}>
          Ajouter la dépense
        </button>
        {formError && (
          <div role="alert" style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--mono)', marginTop: 6 }}>
            {formError}
          </div>
        )}
      </div>

      {/* Dépenses saisies */}
      <h2 className="sec">
        Dépenses {expenses.length > 0 ? `· ${formatCents(total)}` : ''}
      </h2>
      <div className="card" style={{ padding: '0 14px', marginBottom: 12 }}>
        {expenses.length === 0 && (
          <div style={{ padding: '10px 0', fontSize: 11, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>
            Aucune dépense pour l'instant.
          </div>
        )}
        {expenses.map((e) => (
          <div className="hydra-input-row" key={e.docId}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>
                {e.label} — {formatCents(e.amount)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'var(--mono)' }}>
                avancé par {e.payer} · pour {e.beneficiaries.length} pers.
              </div>
            </div>
            {e.payer === memberName && (
              <button
                onClick={() => void removeExpense(e.docId).catch((err) => console.warn('removeExpense:', err))}
                title="Supprimer"
                aria-label={`Supprimer la dépense ${e.label}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, margin: -5, color: 'var(--ink4)' }}
              >
                <svg aria-hidden="true" focusable="false" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Soldes */}
      {balanceRows.length > 0 && (
        <>
          <h2 className="sec">Soldes</h2>
          <div className="card" style={{ padding: '0 14px', marginBottom: 12 }}>
            {balanceRows.map(([name, value]) => (
              <div className="hydra-input-row" key={name}>
                <div style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>
                  {name}
                  {name === memberName ? ' (toi)' : ''}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: 'var(--mono)',
                    color: value > 0 ? 'var(--green)' : value < 0 ? 'var(--red)' : 'var(--ink3)',
                  }}
                >
                  {value > 0 ? `on lui doit ${formatCents(value)}` : value < 0 ? `doit ${formatCents(-value)}` : 'à jour'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Remboursements */}
      {settlements.length > 0 && (
        <>
          <h2 className="sec">Remboursements</h2>
          <div className="card" style={{ padding: '0 14px', marginBottom: 12 }}>
            {settlements.map((s, i) => (
              <div className="hydra-input-row" key={`${s.from}-${s.to}-${i}`}>
                <div style={{ flex: 1, fontSize: 12 }}>
                  <strong>{s.from}</strong> → <strong>{s.to}</strong>
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--ink)' }}>{formatCents(s.amount)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
