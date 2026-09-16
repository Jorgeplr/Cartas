import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconoDado, IconoLlama } from './Icon'
import { TEMATICAS, type Theme } from '../lib/types'
import {
  DESCRIPCION_TEMA,
  ETIQUETA_GRUPO,
  sugerenciaAlAzar,
  type Sugerencia,
} from '../lib/sugerencias'

/** Una llama por escalon de calor: se lee de un vistazo. */
const LLAMAS: Record<Theme, number> = { suave: 1, picante: 2, atrevida: 3 }

const ACTIVO: Record<Theme, string> = {
  suave: 'border-tema-suave/70 bg-tema-suave/10 text-tema-suave',
  picante: 'border-tema-picante/70 bg-tema-picante/10 text-tema-picante',
  atrevida: 'border-tema-atrevida/70 bg-tema-atrevida/10 text-tema-atrevida',
}

interface Props {
  /** Títulos que ya están en el mazo, para no proponerlos otra vez */
  usadas: string[]
  /** El grupo del que sale la sugerencia ES la tematica de la carta. */
  onElegir: (sugerencia: Sugerencia, tema: Theme) => void
}

export function SugerenciasPicker({ usadas, onElegir }: Props) {
  const [tema, setTema] = useState<Theme | null>(null)
  const [propuesta, setPropuesta] = useState<Sugerencia | null>(null)

  function tirar(t: Theme) {
    setTema(t)
    setPropuesta(sugerenciaAlAzar(t, usadas))
  }

  return (
    <section className="rounded-xl border border-borde bg-superficie-alta/60 p-4">
      <div className="flex items-center gap-2">
        <IconoDado className="size-4 text-tinta-suave" aria-hidden="true" />
        <h3 className="text-sm font-bold text-tinta">¿Sin ideas?</h3>
      </div>

      <p className="mt-1 mb-3 text-sm text-tinta-suave">
        Elige el tono y te propongo un reto. Puedes editarlo a tu gusto antes de guardar.
      </p>

      <div className="flex flex-wrap gap-2">
        {TEMATICAS.map((n) => {
          const activo = n === tema

          return (
            <button
              key={n}
              type="button"
              onClick={() => tirar(n)}
              aria-pressed={activo}
              title={DESCRIPCION_TEMA[n]}
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-bold transition-colors duration-200 ${
                activo
                  ? ACTIVO[n]
                  : 'border-borde text-tinta-suave hover:border-fucsia/50 hover:text-tinta'
              }`}
            >
              <span className="flex" aria-hidden="true">
                {Array.from({ length: LLAMAS[n] }, (_, i) => (
                  <IconoLlama key={i} className="size-3.5" />
                ))}
              </span>
              {ETIQUETA_GRUPO[n]}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {propuesta && tema && (
          <motion.div
            key={propuesta.title}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="mt-4 rounded-lg border border-borde bg-superficie p-4"
            aria-live="polite"
          >
            <p className="font-display text-base text-tinta">{propuesta.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-tinta/85">{propuesta.challenge}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onElegir(propuesta, tema)}
                className="inline-flex min-h-11 items-center rounded-lg bg-lima px-4 text-sm font-bold text-noche transition-colors duration-200 hover:bg-lima/90"
              >
                Usar esta
              </button>

              <button
                type="button"
                onClick={() => tirar(tema)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-borde px-4 text-sm font-bold text-tinta-suave transition-colors duration-200 hover:border-fucsia/50 hover:text-tinta"
              >
                <IconoDado className="size-4" aria-hidden="true" />
                Otra
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
