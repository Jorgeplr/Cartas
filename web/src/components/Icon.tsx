import type { SVGProps } from 'react'
import type { Difficulty } from '../lib/types'

// Iconos SVG en trazo de 2px, nunca emoji: escalan, heredan color y se
// controlan desde los tokens de diseño.
type IconProps = SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconoCandado(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Svg>
  )
}

export function IconoCopiar(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </Svg>
  )
}

export function IconoCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 13 4 4L19 7" />
    </Svg>
  )
}

export function IconoMas(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function IconoPapelera(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
    </Svg>
  )
}

export function IconoLapiz(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
    </Svg>
  )
}

export function IconoCerrar(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  )
}

export function IconoBarajar(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 6h3l10 12h3M4 18h3L17 6h3" />
      <path d="m18 3 3 3-3 3M18 15l3 3-3 3" />
    </Svg>
  )
}

export function IconoSalir(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5M5 12h10" />
    </Svg>
  )
}

/** Un glifo distinto por nivel: la dificultad no se distingue solo por color. */
export function IconoDificultad({ nivel, ...props }: IconProps & { nivel: Difficulty }) {
  if (nivel === 'facil') {
    return (
      <Svg {...props}>
        <circle cx="12" cy="12" r="7" />
      </Svg>
    )
  }

  if (nivel === 'medio') {
    return (
      <Svg {...props}>
        <path d="M12 4 20 19H4Z" />
      </Svg>
    )
  }

  return (
    <Svg {...props}>
      <path d="m12 3 2.6 5.6 6.4.8-4.7 4.3 1.2 6.3L12 17l-5.5 3 1.2-6.3L3 9.4l6.4-.8Z" />
    </Svg>
  )
}
