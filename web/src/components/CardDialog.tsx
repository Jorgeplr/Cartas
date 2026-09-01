import { useEffect, useId, useRef } from 'react'
import { motion } from 'framer-motion'
import { IconoCerrar, IconoLapiz, IconoPapelera } from './Icon'
import { PlayCard } from './PlayCard'
import { ETIQUETA_DIFICULTAD, type Card } from '../lib/types'

interface Props {
  carta: Card
  onClose: () => void
  onEdit?: (carta: Card) => void
  onDelete?: (carta: Card) => void
}

/**
 * La carta a tamaño completo, con el reto entero. Es la salida al recorte de
 * la rejilla, y funciona con cualquier carta: las ya jugadas no tienen botones
 * de editar, así que sin esto no habia forma de leerlas.
 */
export function CardDialog({ carta, onClose, onEdit, onDelete }: Props) {
  const tituloId = useId()
  const cerrarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cerrarRef.current?.focus()

    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [onClose])

  const editable = carta.mine && !carta.drawn

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-noche/80 p-5 backdrop-blur-sm"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-xs"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-tinta-suave">
            {ETIQUETA_DIFICULTAD[carta.difficulty]}
            {carta.drawn && ' · ya jugada'}
          </p>

          <button
            ref={cerrarRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar la carta"
            className="grid size-11 place-items-center rounded-lg text-tinta-suave transition-colors duration-200 hover:text-tinta"
          >
            <IconoCerrar className="size-5" aria-hidden="true" />
          </button>
        </div>

        <h2 id={tituloId} className="sr-only">
          {carta.title}
        </h2>

        <PlayCard
          title={carta.title}
          challenge={carta.challenge}
          difficulty={carta.difficulty}
          hidden={carta.hidden}
          drawn={carta.drawn}
        />

        {editable && (onEdit || onDelete) && (
          <div className="mt-3 flex gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(carta)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-borde text-sm font-bold text-tinta-suave transition-colors duration-200 hover:border-fucsia/60 hover:text-tinta"
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
    </motion.div>
  )
}
