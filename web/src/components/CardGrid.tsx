import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button } from './Button'
import { IconoLapiz, IconoMas, IconoPapelera } from './Icon'
import { PlayCard } from './PlayCard'
import { DIFICULTADES, ETIQUETA_DIFICULTAD, type Card, type Difficulty } from '../lib/types'

export function CardGrid({ children }: { children: ReactNode }) {
  return (
    // Dos columnas desde el movil: con minmax(11rem) una pantalla de 375px
    // daba UNA sola carta de 500px de alto, que obliga a scrollear por cada reto.
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] sm:gap-5">
      {children}
    </div>
  )
}

const PUNTO: Record<Difficulty, string> = {
  facil: 'bg-facil',
  medio: 'bg-medio',
  dificil: 'bg-dificil',
}

/** Cuántas cartas hay de cada nivel. Ayuda a ver si el mazo está desequilibrado
 *  antes de jugarlo, que es cuando aún puedes arreglarlo. */
export function ResumenDificultad({ cards }: { cards: Card[] }) {
  if (cards.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-3">
      {DIFICULTADES.map((nivel) => {
        const total = cards.filter((c) => c.difficulty === nivel).length

        return (
          <li key={nivel} className="flex items-center gap-1.5 text-sm text-tinta-suave">
            <span className={`size-2 rounded-full ${PUNTO[nivel]}`} aria-hidden="true" />
            <span className="tabular-nums">{total}</span>
            <span>{ETIQUETA_DIFICULTAD[nivel].toLowerCase()}</span>
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
}: {
  carta: Card
  indice: number
  /** Abre la carta a tamaño completo para leer el reto entero */
  onOpen?: (carta: Card) => void
  onEdit?: (carta: Card) => void
  onDelete?: (carta: Card) => void
}) {
  const editable = carta.mine && !carta.drawn

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
            difficulty={carta.difficulty}
            hidden={carta.hidden}
            drawn={carta.drawn}
            compact
          />
        </button>
      ) : (
        <PlayCard
          title={carta.title}
          challenge={carta.challenge}
          difficulty={carta.difficulty}
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
