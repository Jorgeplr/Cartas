import { DIFICULTADES, ETIQUETA_DIFICULTAD, type Difficulty } from '../lib/types'
import { IconoDificultad } from './Icon'

const ACTIVO: Record<Difficulty, string> = {
  facil: 'bg-facil text-noche',
  medio: 'bg-medio text-noche',
  dificil: 'bg-dificil text-noche',
}

interface Props {
  valor: Difficulty
  onChange: (valor: Difficulty) => void
}

/** Segmented control: las tres opciones se ven a la vez, sin desplegar nada. */
export function DifficultyPicker({ valor, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-tinta" id="etiqueta-dificultad">
        Dificultad
      </span>

      <div
        role="radiogroup"
        aria-labelledby="etiqueta-dificultad"
        className="flex gap-1 rounded-xl border border-borde bg-superficie p-1"
      >
        {DIFICULTADES.map((nivel) => {
          const activo = nivel === valor

          return (
            <button
              key={nivel}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => onChange(nivel)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-bold transition-colors duration-200 ease-out ${
                activo ? ACTIVO[nivel] : 'text-tinta-suave hover:text-tinta'
              }`}
            >
              <IconoDificultad nivel={nivel} className="size-4" aria-hidden="true" />
              {ETIQUETA_DIFICULTAD[nivel]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
