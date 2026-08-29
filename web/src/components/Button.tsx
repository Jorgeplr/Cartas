import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variante = 'primario' | 'lima' | 'fantasma' | 'peligro'

const VARIANTES: Record<Variante, string> = {
  // Texto casi negro sobre fucsia y lima: el neón se mantiene y el contraste
  // se va muy por encima del 4.5:1 exigido.
  primario: 'bg-fucsia text-noche hover:bg-fucsia/90 shadow-neon',
  lima: 'bg-lima text-noche hover:bg-lima/90 shadow-lima',
  fantasma: 'bg-superficie-alta text-tinta border border-borde hover:border-fucsia/60',
  peligro: 'bg-transparent text-error border border-error/40 hover:bg-error/10',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  cargando?: boolean
  children: ReactNode
}

/**
 * Deshabilitado se pinta en gris, no en la marca al 45%: un fucsia o un lima
 * translúcidos sobre fondo oscuro se leen como color roto, no como "todavía
 * no disponible".
 */
export function Button({
  variante = 'primario',
  cargando = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const inactivo = disabled || cargando

  return (
    <button
      {...props}
      disabled={inactivo}
      aria-busy={cargando || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 font-display text-base font-semibold transition-[background-color,border-color,transform,color] duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:border disabled:border-borde disabled:bg-superficie-alta disabled:text-tinta-suave/70 disabled:shadow-none ${VARIANTES[variante]} ${className}`}
    >
      {cargando && (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
