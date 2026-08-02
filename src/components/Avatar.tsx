// Palette des pastilles d'initiales, héritée de l'ancienne app (fonction avS).
// Reprise ici pour que la Cordée, le header et le Base Camp aient la même
// couleur pour un même membre, au lieu d'une palette par écran.
const AV_COLORS = ['#E8C84A', '#C4531A', '#4A7FA8', '#2A5C35', '#8C7000']

/**
 * Couleur stable d'un membre, dérivée de son prénom. Un index de boucle
 * donnerait une couleur qui change dès qu'un membre est ajouté ou qu'un tri
 * bouge — or c'est justement le repère visuel qu'on cherche à offrir.
 */
export function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 9973
  return AV_COLORS[hash % AV_COLORS.length]
}

interface AvatarProps {
  name: string
  /** data URL de la photo de profil, si le membre en a choisi une */
  photo?: string | null
  size?: number
  className?: string
}

/**
 * Photo de profil d'un membre, avec repli sur ses initiales colorées. Toujours
 * décoratif : le prénom est écrit à côté partout où ce composant est utilisé,
 * donc l'image n'apporte pas d'information supplémentaire à un lecteur d'écran.
 */
export function Avatar({ name, photo, size = 32, className }: AvatarProps) {
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        aria-hidden="true"
        className={className ? `pp ${className}` : 'pp'}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: avatarColor(name),
        color: '#fff',
        fontFamily: 'var(--mono)',
        fontSize: Math.max(9, Math.round(size * 0.36)),
        fontWeight: 600,
        letterSpacing: '.02em',
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  )
}
