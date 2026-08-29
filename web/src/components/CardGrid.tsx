import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button } from './Button'
import { IconoLapiz, IconoMas, IconoPapelera } from './Icon'
import { PlayCard } from './PlayCard'
import type { Card } from '../lib/types'

export function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-4">{children}</div>
  )
}

/** Entrada escalonada de 40ms: la rejilla se llena con ritmo en vez de aparecer de golpe. */
export function CardTile({
  carta,
  indice,
  onEdit,
  onDelete,
}: {
  carta: Card
  indice: number
  onEdit?: (carta: Card) => void
  onDelete?: (carta: Card) => void
}) {
  const editable = carta.mine && !carta.drawn && (onEdit || onDelete)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: Math.min(indice, 8) * 0.04 }}
    >
      <PlayCard
        title={carta.title}
        challenge={carta.challenge}
        difficulty={carta.difficulty}
        hidden={carta.hidden}
        drawn={carta.drawn}
      />

      {editable && (
        <div className="mt-2 flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(carta)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-borde text-sm text-tinta-suave transition-colors duration-200 hover:border-fucsia/60 hover:text-tinta"
            >
              <IconoLapiz className="size-4" aria-hidden="true" />
              Editar
            </button>
          )}

          {onDelete && (
            <button
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
      <p className="text-tinta-suave">{mensaje}</p>
      {accion && (
        <Button variante="lima" onClick={accion} className="mt-4">
          <IconoMas className="size-5" aria-hidden="true" />
          Escribir la primera
        </Button>
      )}
    </div>
  )
}
