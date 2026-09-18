import type { SVGProps } from 'react'
import type { Theme } from '../lib/types'

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

/** Un glifo distinto por tematica: no se distingue solo por color. */
export function IconoTema({ tema, ...props }: IconProps & { tema: Theme }) {
  if (tema === 'suave') {
    return (
      <Svg {...props}>
        <circle cx="12" cy="12" r="7" />
      </Svg>
    )
  }

  if (tema === 'picante') {
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

export function IconoDado(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </Svg>
  )
}

export function IconoLlama(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3c3 3.5 5 6 5 9a5 5 0 0 1-10 0c0-1.6.7-3 2-4.4 0 1.6.8 2.4 1.6 2.4.9 0 1.4-.8 1.4-2 0-1.8-.5-3.4-1-5Z" />
    </Svg>
  )
}

export function IconoPiedra(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 5 9v6l3 6h8l3-6V9l-7-6Z" />
    </Svg>
  )
}

export function IconoPapel(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="6" y="3" width="12" height="18" rx="1.5" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </Svg>
  )
}

export function IconoChevronAbajo(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  )
}

export function IconoCorazonRoto(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.65-9.5 9-9.5 9Z" />
      <path d="m12.5 6.5-2.5 4.5 3 2-1.5 4.5" />
    </Svg>
  )
}

export function IconoTijera(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M8.1 8.1 20 20M14.5 14.5 20 4M8.1 15.9 12 12" />
    </Svg>
  )
}
