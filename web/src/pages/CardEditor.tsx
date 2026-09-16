import { useState, type FormEvent } from 'react'
import { Button } from '../components/Button'
import { ThemePicker } from '../components/ThemePicker'
import { Field, TextAreaField } from '../components/Field'
import { PlayCard } from '../components/PlayCard'
import { SugerenciasPicker } from '../components/SugerenciasPicker'
import type { Card, Theme } from '../lib/types'

export const MAX_TITULO = 60
export const MAX_RETO = 280

export interface BorradorCarta {
  title: string
  challenge: string
  theme: Theme
}

interface Props {
  /** Si viene, el editor edita esa carta en vez de crear una nueva */
  carta?: Card
  /** Títulos que ya están en el mazo, para no sugerir repetidos */
  usadas?: string[]
  onSave: (borrador: BorradorCarta) => Promise<void> | void
  onCancel?: () => void
  error?: string | null
}

/**
 * Split en vivo: escribes a la izquierda y la carta se dibuja a la derecha con
 * el mismo componente que verá la otra persona al robarla. Sin sorpresas entre
 * lo que compones y lo que se juega.
 */
export function CardEditor({ carta, usadas = [], onSave, onCancel, error }: Props) {
  const [title, setTitle] = useState(carta?.title ?? '')
  const [challenge, setChallenge] = useState(carta?.challenge ?? '')
  const [theme, setTheme] = useState<Theme>(carta?.theme ?? 'picante')
  const [guardando, setGuardando] = useState(false)

  const valida =
    title.trim().length > 0 &&
    title.length <= MAX_TITULO &&
    challenge.trim().length > 0 &&
    challenge.length <= MAX_RETO

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!valida) return

    setGuardando(true)
    try {
      await onSave({ title: title.trim(), challenge: challenge.trim(), theme })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="grid gap-8 md:grid-cols-[1fr_minmax(0,17rem)]">
      <div className="flex flex-col gap-5">
        {/* Solo al crear: editando ya tienes un texto, y proponerte otro
            invitaria a perderlo de un clic. */}
        {!carta && (
          <SugerenciasPicker
            usadas={usadas}
            onElegir={(s, tema) => {
              setTitle(s.title)
              setChallenge(s.challenge)
              setTheme(tema)
            }}
          />
        )}

        <Field
          label="Título"
          value={title}
          maxLength={MAX_TITULO}
          required
          placeholder="Karaoke sin piedad"
          onChange={(e) => setTitle(e.target.value)}
          ayuda="Lo único que la otra persona verá antes de robarla."
        />

        <TextAreaField
          label="El reto"
          valor={challenge}
          maximo={MAX_RETO}
          placeholder="Canta el estribillo de la última canción que escuchaste, de pie."
          onChange={(e) => setChallenge(e.target.value)}
        />

        <ThemePicker valor={theme} onChange={setTheme} />

        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={!valida} cargando={guardando}>
            {carta ? 'Guardar cambios' : 'Añadir al mazo'}
          </Button>

          {onCancel && (
            <Button type="button" variante="fantasma" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <div className="md:sticky md:top-6 md:self-start">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-tinta-suave">
          Vista previa
        </p>

        <div data-testid="preview" className="mx-auto max-w-64">
          <PlayCard title={title} challenge={challenge} theme={theme} />
        </div>
      </div>
    </form>
  )
}
