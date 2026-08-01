// Répartition des dépenses d'une sortie (principe Tricount) : qui a avancé quoi,
// qui doit combien à qui. Logique pure, sans Firebase ni React.
//
// Tous les montants sont en CENTIMES (entiers). Travailler en euros flottants
// ferait dériver les soldes (0.1 + 0.2 !== 0.3) et la somme des soldes ne
// tomberait plus exactement à zéro.

import type { Expense } from '../types'

/**
 * Répartit un montant entre n parts égales, au centime près.
 * Le reste de la division est donné aux premières parts (1 centime chacune),
 * de sorte que la somme des parts égale toujours le montant d'origine.
 */
export function splitAmount(amount: number, n: number): number[] {
  if (n <= 0) return []
  const base = Math.floor(amount / n)
  const rest = amount - base * n
  return Array.from({ length: n }, (_, i) => base + (i < rest ? 1 : 0))
}

/**
 * Solde de chaque participant, en centimes.
 * Positif = on lui doit de l'argent (il a avancé plus que sa part).
 * Négatif = il doit de l'argent au groupe.
 *
 * Un payeur qui ne figure pas dans les bénéficiaires (il a payé pour les autres
 * sans en profiter) est bien crédité de la totalité : c'est le cas du membre qui
 * achète les lyophilisés d'un autre.
 */
export function computeBalances(expenses: Expense[]): Record<string, number> {
  const balances: Record<string, number> = {}
  const add = (name: string, cents: number) => {
    balances[name] = (balances[name] ?? 0) + cents
  }

  for (const e of expenses) {
    const beneficiaries = e.beneficiaries ?? []
    if (!beneficiaries.length || !e.amount) {
      // Dépense sans bénéficiaire : le payeur reste crédité de son avance,
      // sinon l'argent disparaîtrait du calcul.
      add(e.payer, e.amount ?? 0)
      continue
    }
    add(e.payer, e.amount)
    const parts = splitAmount(e.amount, beneficiaries.length)
    beneficiaries.forEach((name, i) => add(name, -parts[i]))
  }

  return balances
}

export interface Settlement {
  from: string
  to: string
  /** centimes */
  amount: number
}

/**
 * Remboursements à effectuer pour solder le groupe.
 *
 * Algorithme glouton : on apparie à chaque tour le plus gros débiteur avec le
 * plus gros créancier. Chaque virement solde au moins l'un des deux, donc il en
 * faut au plus N-1 pour N participants — c'est l'objectif « le moins de
 * virements possible » recherché ici (l'optimum exact est NP-difficile, et pour
 * une cordée de 5-10 personnes l'écart est nul en pratique).
 */
export function computeSettlements(balances: Record<string, number>): Settlement[] {
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name))
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < 0)
    .map(([name, amount]) => ({ name, amount: -amount }))
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name))

  const settlements: Settlement[] = []
  let ci = 0
  let di = 0
  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].amount, debtors[di].amount)
    if (amount > 0) {
      settlements.push({ from: debtors[di].name, to: creditors[ci].name, amount })
    }
    creditors[ci].amount -= amount
    debtors[di].amount -= amount
    if (creditors[ci].amount === 0) ci++
    if (debtors[di].amount === 0) di++
  }
  return settlements
}

/** Total avancé par le groupe, en centimes. */
export function totalSpent(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
}

/** Formate des centimes en euros lisibles : 1250 → "12,50 €". */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

/**
 * Convertit une saisie utilisateur en centimes. Accepte la virgule comme
 * séparateur décimal (clavier français) et les espaces.
 * Renvoie null si la saisie n'est pas un montant strictement positif.
 */
export function parseAmountToCents(input: string): number | null {
  const normalized = input.replace(/\s/g, '').replace(',', '.')
  if (!/^\d*\.?\d*$/.test(normalized) || normalized === '' || normalized === '.') return null
  const euros = Number(normalized)
  if (!Number.isFinite(euros) || euros <= 0) return null
  return Math.round(euros * 100)
}
