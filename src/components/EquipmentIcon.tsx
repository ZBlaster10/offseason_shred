import type { EquipmentId } from '@/domain/types'

interface Props {
  id: EquipmentId | 'bodyweight'
  size?: number
  className?: string
}

/** Small line icons for each piece of home equipment. */
export function EquipmentIcon({ id, size = 22, className = '' }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  }
  switch (id) {
    case 'kettlebell':
      return (
        <svg {...common}>
          <path d="M8.5 9.5 V7.5 a3.5 3.5 0 0 1 7 0 V9.5" />
          <circle cx="12" cy="15" r="6" />
        </svg>
      )
    case 'dumbbells':
      return (
        <svg {...common}>
          <path d="M7 12h10" />
          <rect x="3" y="8" width="4" height="8" rx="1.2" />
          <rect x="17" y="8" width="4" height="8" rx="1.2" />
        </svg>
      )
    case 'straps':
      return (
        <svg {...common}>
          <path d="M12 3 L7 16 M12 3 L17 16" />
          <path d="M5 16h4 M15 16h4" />
          <circle cx="12" cy="3" r="1" />
        </svg>
      )
    case 'bands':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="12" rx="8.5" ry="4.5" />
          <ellipse cx="12" cy="12" rx="5.5" ry="2" />
        </svg>
      )
    case 'balanceBoard':
      return (
        <svg {...common}>
          <path d="M3 11.5 L21 9.5" />
          <circle cx="12" cy="15.5" r="4" />
        </svg>
      )
    case 'jumpRope':
      return (
        <svg {...common}>
          <path d="M6 4v5 M18 4v5" />
          <path d="M6 9 C6 22 18 22 18 9" />
        </svg>
      )
    case 'foamRoller':
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="8" rx="4" />
          <path d="M8 8v8 M12 8v8 M16 8v8" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="4.5" r="2" />
          <path d="M12 7v7 M8 9.5l4-1 4 1 M9.5 21 L12 14 L14.5 21" />
        </svg>
      )
  }
}
