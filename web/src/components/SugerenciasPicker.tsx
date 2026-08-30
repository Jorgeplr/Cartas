import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconoDado, IconoLlama } from './Icon'
import {
  DESCRIPCION_NIVEL,
  ETIQUETA_NIVEL,
  NIVELES,
  sugerenciaAlAzar,
  type Nivel,
  type Sugerencia,
} from '../lib/sugerencias'

/** Un nivel de picante, tres llamas: el calor se lee de un vistazo. */
const LLAMAS: Record<Nivel, number> = { suave: 1, picante: 2, atrevida: 3 }

const ACTIVO: Record<Nivel, string> = {
  suave: 'border-facil/70 bg-facil/10 text-facil',
  picante: 'border-medio/70 bg-medio/10 text-medio',
  atrevida: 'border-dificil/70 bg-dificil/10 text-dificil',
}

interface Props {
  /** Títulos que ya están en el mazo, para no proponerlos otra vez */
  usadas: string[]
  onElegir: (sugerencia: Sugerencia) => void
}

export function SugerenciasPicker({ usadas, onElegir }: Props) {
  const [nivel, setNivel] = useState<Nivel | null>(null)
  const [propuesta, setPropuesta] = useState<Sugerencia | null>(null)

  function tirar(n: Nivel) {
    setNivel(n)
    setPropuesta(sugerenciaAlAzar(n, usadas))
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
        {NIVELES.map((n) => {
          const activo = n === nivel

          return (
            <button
              key={n}
              type="button"
              onClick={() => tirar(n)}
              aria-pressed={activo}
              title={DESCRIPCION_NIVEL[n]}
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
              {ETIQUETA_NIVEL[n]}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {propuesta && nivel && (
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
                onClick={() => onElegir(propuesta)}
                className="inline-flex min-h-11 items-center rounded-lg bg-lima px-4 text-sm font-bold text-noche transition-colors duration-200 hover:bg-lima/90"
              >
                Usar esta
              </button>

              <button
                type="button"
                onClick={() => tirar(nivel)}
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
