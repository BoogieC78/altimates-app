// Icônes SVG reprises telles quelles de l'ancienne app (index.html).

export const LogoIcon = ({ size = 30 }: { size?: number }) => (
  <svg className="logo-icon" width={size} height={size} viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="10" fill="#2D2D2A" />
    <path
      d="M4,36 L14,10 L24,28 L34,8 L44,36"
      fill="none"
      stroke="#E8C84A"
      strokeWidth="2.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
)

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export const NAV_ICONS: Record<string, React.ReactNode> = {
  sommets: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M8 3l4 8 5-5 5 15H2L8 3z" />
    </svg>
  ),
  kit: (
    <svg width="17" height="17" viewBox="0 0 36 32" {...stroke}>
      <path d="M6 30 L6 9 Q6 3 13 3 L17 3 Q20 3 20 7 L20 20 Q28 19 32 22 L33 26 Q33 30 30 30 Z" />
      <path d="M3 30 L34 30" />
      <path d="M4 28 L33 28" />
      <line x1="8" y1="12" x2="19" y2="12" />
      <line x1="8" y1="16" x2="19" y2="16" />
      <line x1="8" y1="20" x2="19" y2="20" />
    </svg>
  ),
  radio: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </svg>
  ),
  idees: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.6-1.4 4.9-3.5 6.2V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.8C6.4 13.9 5 11.6 5 9a7 7 0 0 1 7-7z" />
    </svg>
  ),
  cordee: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M13 15 Q16 17.5 19 15" strokeDasharray="2 1.5" />
    </svg>
  ),
  basecamp: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M3 22L12 5l9 17H3z" />
      <line x1="12" y1="5" x2="12" y2="22" />
      <path d="M9.5 22v-3.5L12 16l2.5 2.5V22" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
}

export const PinIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" {...stroke}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export const KmIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" {...stroke}>
    <path d="M2 12h20M2 12l4-4M2 12l4 4" />
  </svg>
)

export const DplusIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" {...stroke}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
  </svg>
)

export const DurIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" {...stroke}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

export const ThumbIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" {...stroke}>
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
)

export const MaybeIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" {...stroke}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

export const TrashIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

export const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4531A" strokeWidth="2" strokeLinecap="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

export const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export const BubbleIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" {...stroke}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

export const SmallAlertIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" {...stroke}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
  </svg>
)

export const SmallPinIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" {...stroke}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#E8C84A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

export const PlusIcon = () => (
  <svg viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export const CalendarIcon = () => (
  <svg viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
