import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button } from './Button'
import { IconoComodin, IconoLapiz, IconoMas, IconoPapelera, IconoProhibido } from './Icon'
import { PlayCard } from './PlayCard'
import { ETIQUETA_TEMA, TEMATICAS, type Card, type Theme } from '../lib/types'

export function CardGrid({ children }: { children: ReactNode }) {
  return (
    // Dos columnas desde el movil: con minmax(11rem) una pantalla de 375px
    // daba UNA sola carta de 500px de alto, que obliga a scrollear por cada reto.
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] sm:gap-5">
      {children}
    </div>
  )
}

const PUNTO: Record<Theme, string> = {
  suave: 'bg-tema-suave',
  picante: 'bg-tema-picante',
  atrevida: 'bg-tema-atrevida',
}

/** Cuántas cartas hay de cada temática. Ayuda a ver si el mazo está
 *  desequilibrado antes de jugarlo, que es cuando aún puedes arreglarlo. */
export function ResumenTematicas({ cards }: { cards: Card[] }) {
  if (cards.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-3">
      {TEMATICAS.map((tema) => {
        const total = cards.filter((c) => c.theme === tema).length

        return (
          <li key={tema} className="flex items-center gap-1.5 text-sm text-tinta-suave">
            <span className={`size-2 rounded-full ${PUNTO[tema]}`} aria-hidden="true" />
            <span className="tabular-nums">{total}</span>
            <span>{ETIQUETA_TEMA[tema].toLowerCase()}</span>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Entrada escalonada de 40ms: la rejilla se llena con ritmo en vez de aparecer
 * de golpe. Al pasar el ratón la carta se eleva con `transform`, que no
 * recalcula el layout ni desplaza a sus vecinas.
 */
export function CardTile({
  carta,
  indice,
  onOpen,
  onEdit,
  onDelete,
  onBan,
  onUnban,
  quedanBaneos,
  onSetWildcard,
  onClearWildcard,
  comodinJugado,
}: {
  carta: Card
  indice: number
  /** Abre la carta a tamaño completo para leer el reto entero */
  onOpen?: (carta: Card) => void
  onEdit?: (carta: Card) => void
  onDelete?: (carta: Card) => void
  /** Solo tiene sentido en cartas ajenas: banear las tuyas no evita nada. */
  onBan?: (carta: Card) => void
  onUnban?: (carta: Card) => void
  /** Cuántos de tus 4 baneos te quedan libres. Sin esto no se sabe si el botón debe estar activo. */
  quedanBaneos?: number
  /** Solo tiene sentido en cartas propias: el comodín siempre es tuyo. */
  onSetWildcard?: (carta: Card) => void
  onClearWildcard?: (carta: Card) => void
  /** Ya jugaste tu comodín esta partida (en otra carta): no puedes elegir uno nuevo hasta rebarajar. */
  comodinJugado?: boolean
}) {
  // Tus cartas se editan siempre, tambien las ya jugadas: el mazo se rebaraja
  // y se vuelve a jugar, asi que una errata o un reto flojo siguen importando.
  const editable = carta.mine
  // Banear una carta ya jugada no tiene sentido: ya salio, ya se sabe que decia.
  const baneable = !carta.mine && !carta.drawn && (onBan || onUnban)
  // Elegir comodín tampoco: una vez jugada, ya no hay nada que reservar.
  const comodinable = carta.mine && !carta.drawn && (onSetWildcard || onClearWildcard)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: Math.min(indice, 8) * 0.04 }}
      className="group"
    >
      {/* Cualquier carta se abre, tambien las ya jugadas: en la rejilla el
          texto va recortado y esta es la unica forma de leerlo entero. */}
      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(carta)}
          aria-label={`Ver la carta ${carta.title}`}
          className="block w-full cursor-pointer rounded-carta text-left transition-transform duration-200 ease-out group-hover:-translate-y-1"
        >
          <PlayCard
            title={carta.title}
            challenge={carta.challenge}
            theme={carta.theme}
            hidden={carta.hidden}
            drawn={carta.drawn}
            compact
          />
        </button>
      ) : (
        <PlayCard
          title={carta.title}
          challenge={carta.challenge}
          theme={carta.theme}
          hidden={carta.hidden}
          drawn={carta.drawn}
          compact
        />
      )}

      {editable && (onEdit || onDelete) && (
        <div className="mt-2 flex gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(carta)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-borde text-sm text-tinta-suave transition-colors duration-200 hover:border-fucsia/60 hover:text-tinta"
            >
              <IconoLapiz className="size-4" aria-hidden="true" />
              Editar
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Borrar "${carta.title}"? No se puede deshacer.`)) onDelete(carta)
              }}
              aria-label={`Borrar la carta ${carta.title}`}
              className="grid size-11 place-items-center rounded-lg border border-borde text-tinta-suave transition-colors duration-200 hover:border-error/60 hover:text-error"
            >
              <IconoPapelera className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {baneable && (
        <div className="mt-2">
          {carta.banned_by_me ? (
            <button
              type="button"
              onClick={() => onUnban?.(carta)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-error/50 bg-error/10 text-sm font-semibold text-error transition-colors duration-200 hover:bg-error/15"
            >
              <IconoProhibido className="size-4" aria-hidden="true" />
              Baneada
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onBan?.(carta)}
              disabled={quedanBaneos === 0}
              title={quedanBaneos === 0 ? 'Ya usaste tus 4 baneos' : undefined}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-borde text-sm text-tinta-suave transition-colors duration-200 hover:border-error/60 hover:text-error disabled:pointer-events-none disabled:opacity-50"
            >
              <IconoProhibido className="size-4" aria-hidden="true" />
              Banear
            </button>
          )}
        </div>
      )}

      {comodinable && (
        <div className="mt-2">
          {carta.is_my_wildcard ? (
            <button
              type="button"
              onClick={() => onClearWildcard?.(carta)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-lima/60 bg-lima/10 text-sm font-semibold text-lima transition-colors duration-200 hover:bg-lima/15"
            >
              <IconoComodin className="size-4" aria-hidden="true" />
              Tu comodín
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSetWildcard?.(carta)}
              disabled={comodinJugado}
              title={comodinJugado ? 'Ya jugaste tu comodín en esta partida' : undefined}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-borde text-sm text-tinta-suave transition-colors duration-200 hover:border-lima/60 hover:text-lima disabled:pointer-events-none disabled:opacity-50"
            >
              <IconoComodin className="size-4" aria-hidden="true" />
              Usar como comodín
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}

export function EmptyDeck({ mensaje, accion }: { mensaje: string; accion?: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-borde px-6 py-10 text-center">
      <p className="mx-auto max-w-sm text-tinta-suave">{mensaje}</p>
      {accion && (
        <Button variante="lima" onClick={accion} className="mt-4">
          <IconoMas className="size-5" aria-hidden="true" />
          Escribir la primera
        </Button>
      )}
    </div>
  )
}
