import { ETIQUETA_TEMA, TEMATICAS, type Theme } from '../lib/types'
import { IconoTema } from './Icon'

const ACTIVO: Record<Theme, string> = {
  suave: 'bg-tema-suave text-noche',
  picante: 'bg-tema-picante text-noche',
  atrevida: 'bg-tema-atrevida text-noche',
}

interface Props {
  valor: Theme
  onChange: (valor: Theme) => void
}

/** Segmented control: las tres opciones se ven a la vez, sin desplegar nada. */
export function ThemePicker({ valor, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-tinta" id="etiqueta-tema">
        Temática
      </span>

      <div
        role="radiogroup"
        aria-labelledby="etiqueta-tema"
        className="flex gap-1 rounded-xl border border-borde bg-superficie p-1"
      >
        {TEMATICAS.map((tema) => {
          const activo = tema === valor

          return (
            <button
              key={tema}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => onChange(tema)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-bold transition-colors duration-200 ease-out ${
                activo ? ACTIVO[tema] : 'text-tinta-suave hover:text-tinta'
              }`}
            >
              <IconoTema tema={tema} className="size-4" aria-hidden="true" />
              {ETIQUETA_TEMA[tema]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
