// Export PDF du kit, porté tel quel depuis generatePDF() de l'ancienne app
// (mêmes couleurs, mêmes sections, même mise en page A4).
// jspdf est importé dynamiquement : ~400 Ko chargés uniquement au clic sur PDF.
import { GEAR_INFO, type KitMode, type KitStatus } from '../constants/gear'
import { allItems } from './kit'

export async function generateKitPdf(mode: KitMode, kitStatus: Record<string, KitStatus>, userName: string): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const all = allItems(mode)

  const toBuy = all.filter((g) => kitStatus[g.id] === 'want' || (!kitStatus[g.id] && g.cat === 'indispensable'))
  const toThink = all.filter((g) => kitStatus[g.id] === 'maybe')
  const have = all.filter((g) => kitStatus[g.id] === 'have')
  const skip = all.filter((g) => kitStatus[g.id] === 'skip')

  const W = 210
  const M = 16
  const CW = W - M * 2
  let y = 20

  doc.setFillColor(45, 45, 42)
  doc.roundedRect(M, y - 6, CW, 14, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(232, 200, 74)
  doc.text('ALTImates — Liste Kit', W / 2, y + 2, { align: 'center' })
  doc.setFontSize(8)
  doc.setTextColor(180, 160, 100)
  doc.text(
    `${mode === 'trek' ? 'Trek' : 'Journée'} · ${new Date().toLocaleDateString('fr')} · ${userName}`,
    W / 2,
    y + 7,
    { align: 'center' },
  )
  y += 18

  doc.setFillColor(253, 248, 230)
  doc.roundedRect(M, y, CW, 10, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(140, 112, 0)
  doc.text('RAPPEL : Prévoir au moins 1 gourde de 1L par personne + filtrante si ruisseau sur le tracé', M + 4, y + 6.5)
  y += 15

  const sectionHeader = (label: string, color: [number, number, number]) => {
    doc.setFillColor(...color)
    doc.roundedRect(M, y, CW, 7, 1.5, 1.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.text(label, M + 4, y + 5)
    y += 10
  }

  const itemRow = (g: (typeof all)[number], showLinks = false) => {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    const links = GEAR_INFO[g.id]?.links ?? []
    doc.setFillColor(247, 243, 236)
    doc.roundedRect(M, y, CW, showLinks && links.length ? 14 : 8, 1, 1, 'F')

    const catLabel = g.cat === 'indispensable' ? 'INDIS.' : g.cat === 'recommande' ? 'REC.' : 'FAC.'
    const catColor: [number, number, number] =
      g.cat === 'indispensable' ? [196, 83, 26] : g.cat === 'recommande' ? [12, 68, 124] : [107, 101, 96]
    doc.setFillColor(...catColor)
    doc.roundedRect(M + 2, y + 2, 10, 4, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5.5)
    doc.setTextColor(255, 255, 255)
    doc.text(catLabel, M + 7, y + 4.8, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(45, 45, 42)
    doc.text(g.name, M + 14, y + 5.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(107, 101, 96)
    doc.text(g.price, M + CW - 2, y + 5.5, { align: 'right' })

    if (showLinks && links.length) {
      const ORDER = ['Decathlon', 'Vinted', 'Amazon', 'LeBonCoin']
      const sorted = [...links].sort(
        (a, b) => (ORDER.indexOf(a.label) + 1 || 99) - (ORDER.indexOf(b.label) + 1 || 99),
      )
      let lx = M + 14
      doc.setFontSize(7)
      sorted.slice(0, 3).forEach((l) => {
        doc.setTextColor(12, 68, 124)
        doc.textWithLink(l.label + ' ↗', lx, y + 11, { url: l.url })
        lx += doc.getTextWidth(l.label + ' ↗') + 4
      })
      y += 14
    } else {
      y += 9
    }
  }

  if (toBuy.length > 0) {
    sectionHeader(`À ACHETER — ${toBuy.length} article${toBuy.length > 1 ? 's' : ''}`, [196, 83, 26])
    toBuy.forEach((g) => itemRow(g, true))
    y += 3
  }

  if (toThink.length > 0) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    sectionHeader(`À RÉFLÉCHIR — ${toThink.length} article${toThink.length > 1 ? 's' : ''}`, [140, 112, 0])
    toThink.forEach((g) => itemRow(g, true))
    y += 3
  }

  if (have.length > 0) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    sectionHeader(`J'AI DÉJÀ — ${have.length} article${have.length > 1 ? 's' : ''}`, [42, 92, 53])
    have.forEach((g) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(107, 101, 96)
      doc.text('✓  ' + g.name, M + 4, y)
      y += 5
    })
    y += 3
  }

  if (skip.length > 0) {
    if (y > 260) {
      doc.addPage()
      y = 20
    }
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(180, 175, 168)
    doc.text('Ignorés : ' + skip.map((g) => g.name).join(', '), M, y)
  }

  doc.save('altimates-kit.pdf')
}
