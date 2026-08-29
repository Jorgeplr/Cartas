import { useId } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

const BASE_CONTROL =
  'w-full rounded-xl border border-borde bg-superficie px-4 py-3 text-base text-tinta placeholder:text-tinta-suave/60 transition-colors duration-200 focus:border-fucsia'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  ayuda?: string
  error?: string
}

/** Etiqueta siempre visible: el placeholder desaparece al escribir y con él
 *  el único indicio de qué iba en el campo. */
export function Field({ label, ayuda, error, className = '', ...props }: FieldProps) {
  const id = useId()
  const ayudaId = `${id}-ayuda`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-tinta">
        {label}
        {props.required && <span className="ml-1 text-fucsia">*</span>}
      </label>

      <input
        {...props}
        id={id}
        aria-describedby={error || ayuda ? ayudaId : undefined}
        aria-invalid={error ? true : undefined}
        className={`${BASE_CONTROL} ${error ? 'border-error' : ''} ${className}`}
      />

      {(error || ayuda) && (
        <p
          id={ayudaId}
          role={error ? 'alert' : undefined}
          className={`text-sm ${error ? 'text-error' : 'text-tinta-suave'}`}
        >
          {error ?? ayuda}
        </p>
      )}
    </div>
  )
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  maximo: number
  valor: string
}

export function TextAreaField({
  label,
  maximo,
  valor,
  className = '',
  ...props
}: TextAreaFieldProps) {
  const id = useId()
  const contadorId = `${id}-contador`
  const pasado = valor.length > maximo

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-tinta">
        {label}
      </label>

      <textarea
        {...props}
        id={id}
        value={valor}
        aria-describedby={contadorId}
        aria-invalid={pasado || undefined}
        className={`${BASE_CONTROL} min-h-32 resize-y leading-relaxed ${pasado ? 'border-error' : ''} ${className}`}
      />

      <p
        id={contadorId}
        aria-live="polite"
        className={`self-end text-sm tabular-nums ${pasado ? 'font-bold text-error' : 'text-tinta-suave'}`}
      >
        {valor.length}/{maximo}
      </p>
    </div>
  )
}
