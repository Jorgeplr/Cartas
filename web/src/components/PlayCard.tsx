import type { Difficulty } from '../lib/types'
import { ETIQUETA_DIFICULTAD } from '../lib/types'
import { IconoCandado, IconoDificultad } from './Icon'

interface EstiloDificultad {
  borde: string
  texto: string
  barra: string
  glow: string
}

// Un color por dificultad, pero el nivel SIEMPRE lleva tambien su etiqueta:
// nadie debe depender del color para entender la carta.
//
// Las clases van escritas enteras porque Tailwind escanea el codigo fuente:
// una clase construida en runtime (`"text-" + nivel`) nunca llega al CSS.
const ESTILO: Record<Difficulty, EstiloDificultad> = {
  facil: {
    borde: 'border-facil/70',
    texto: 'text-facil',
    barra: 'bg-facil',
    glow: 'shadow-[0_0_30px_-10px_var(--color-facil)]',
  },
  medio: {
    borde: 'border-medio/70',
    texto: 'text-medio',
    barra: 'bg-medio',
    glow: 'shadow-[0_0_30px_-10px_var(--color-medio)]',
  },
  dificil: {
    borde: 'border-dificil/70',
    texto: 'text-dificil',
    barra: 'bg-dificil',
    glow: 'shadow-[0_0_30px_-10px_var(--color-dificil)]',
  },
}

const NIVELES: Difficulty[] = ['facil', 'medio', 'dificil']

interface PlayCardProps {
  title: string
  challenge: string | null
  difficulty: Difficulty
  /** Muestra el dorso en vez de la cara */
  faceDown?: boolean
  /** La cara se ve, pero el reto está oculto porque es de la otra persona */
  hidden?: boolean
  /** Marca visual de carta ya jugada */
  drawn?: boolean
  /**
   * Para rejillas: recorta el reto con elipsis en vez de dejar que rebose.
   * En la mesa siempre va completo, que es donde hay que poder leerlo.
   */
  compact?: boolean
  className?: string
}

/**
 * La carta. El editor y la mesa usan este mismo componente a propósito:
 * así la vista previa mientras escribes es idéntica a lo que verá la otra
 * persona cuando la robe.
 */
export function PlayCard({
  title,
  challenge,
  difficulty,
  faceDown = false,
  hidden = false,
  drawn = false,
  compact = false,
  className = '',
}: PlayCardProps) {
  if (faceDown) return <CardBack className={className} />

  const estilo = ESTILO[difficulty]

  return (
    <article
      className={`relative flex aspect-2/3 w-full flex-col justify-between overflow-hidden rounded-carta border-2 ${estilo.borde} bg-superficie ${compact ? 'p-4' : 'p-5'} ${estilo.glow} ${drawn ? 'opacity-55' : ''} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.07),transparent_60%)]" />

      <header className="relative flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] ${estilo.texto}`}
        >
          <IconoDificultad nivel={difficulty} className="size-4" aria-hidden="true" />
          {ETIQUETA_DIFICULTAD[difficulty]}
        </span>
        {drawn && (
          <span className="rounded-full border border-borde px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-tinta-suave">
            Jugada
          </span>
        )}
      </header>

      <div
        className={`relative flex flex-1 flex-col justify-center wrap-break-word ${
          compact ? 'gap-2 py-2' : 'gap-3 py-4'
        }`}
      >
        <h3
          className={`font-display leading-tight text-tinta wrap-break-word ${
            compact ? 'line-clamp-2 text-base' : 'text-xl'
          }`}
        >
          {title || 'Sin título'}
        </h3>

        {hidden ? (
          <p className="flex items-center gap-2 text-sm italic text-tinta-suave">
            <IconoCandado className="size-4 shrink-0" aria-hidden="true" />
            Reto oculto hasta que salga del mazo
          </p>
        ) : (
          <p
            className={`text-tinta/90 wrap-break-word ${
              // Tres lineas es lo que cabe de verdad en una carta de rejilla a
              // 375px. Con mas, el overflow del recuadro corta a media palabra
              // antes de que la elipsis llegue a aparecer.
              compact ? 'line-clamp-3 text-sm leading-snug' : 'text-[15px] leading-relaxed'
            }`}
          >
            {challenge || 'Escribe el reto…'}
          </p>
        )}
      </div>

      <footer className="relative flex items-center gap-1.5" aria-hidden="true">
        {NIVELES.map((nivel, i) => (
          <span
            key={nivel}
            className={`h-1 flex-1 rounded-full ${
              i <= NIVELES.indexOf(difficulty) ? estilo.barra : 'bg-borde'
            }`}
          />
        ))}
      </footer>
    </article>
  )
}

export function CardBack({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative aspect-2/3 w-full overflow-hidden rounded-carta border-2 border-fucsia/40 bg-superficie-alta shadow-neon ${className}`}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, var(--color-fucsia) 0 2px, transparent 2px 12px), repeating-linear-gradient(-45deg, var(--color-violeta) 0 2px, transparent 2px 12px)',
        }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-3xl font-semibold tracking-tight text-fucsia drop-shadow-[0_0_12px_var(--color-fucsia)]">
          RETO
        </span>
      </div>
    </div>
  )
}
