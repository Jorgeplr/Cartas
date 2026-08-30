import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { CardGrid, CardTile, ResumenDificultad } from '../components/CardGrid'
import { IconoCerrar, IconoCheck, IconoCopiar, IconoMas, IconoSalir } from '../components/Icon'
import { api, ApiError } from '../lib/api'
import { useCards } from '../lib/useCards'
import type { Card } from '../lib/types'
import { CardEditor } from './CardEditor'

export function Pair() {
  const { session, refresh, logout } = useAuth()
  const { mias, cargando, error: errorMazo, guardar, borrar } = useCards()

  const [codigo, setCodigo] = useState('')
  const [errorPareja, setErrorPareja] = useState<string | null>(null)
  const [emparejando, setEmparejando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [editor, setEditor] = useState<{ carta?: Card } | null>(null)

  const miCodigo = session?.user.invite_code ?? ''

  async function copiar() {
    try {
      await navigator.clipboard.writeText(miCodigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setErrorPareja('Tu navegador no nos deja copiar. Apúntalo a mano.')
    }
  }

  async function emparejar(e: FormEvent) {
    e.preventDefault()
    setErrorPareja(null)
    setEmparejando(true)

    try {
      await api.post('/pairing/join', { code: codigo })
      await refresh()
    } catch (err) {
      setErrorPareja(
        err instanceof ApiError ? err.message : 'No pudimos conectar con el servidor.',
      )
      setEmparejando(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <header className="mb-10 text-center">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-fucsia">
          Cartas de Reto
        </p>
        <h1 className="mt-2 text-3xl text-tinta">Ve preparando tus retos</h1>
        <p className="mx-auto mt-2 max-w-xl text-tinta-suave">
          No hace falta esperar a nadie: escribe ya tus cartas y entrarán solas a la baraja
          en cuanto os emparejéis.
        </p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-5 lg:sticky lg:top-6">
          <section className="rounded-2xl border border-fucsia/40 bg-superficie p-6 text-center shadow-neon">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-tinta-suave">
              Tu código
            </h2>

            <p className="my-4 font-display text-4xl font-semibold sm:text-5xl tracking-[0.18em] text-fucsia tabular-nums drop-shadow-[0_0_18px_var(--color-fucsia)]">
              {miCodigo}
            </p>

            <Button variante="fantasma" onClick={copiar} className="w-full">
              {copiado ? <IconoCheck className="size-5" /> : <IconoCopiar className="size-5" />}
              {copiado ? 'Copiado' : 'Copiar código'}
            </Button>

            <p className="mt-3 text-sm text-tinta-suave">Pásaselo a la otra persona.</p>
          </section>

          <div className="flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-borde" />
            <span className="font-display text-sm uppercase tracking-widest text-tinta-suave">
              o
            </span>
            <span className="h-px flex-1 bg-borde" />
          </div>

          <form
            onSubmit={emparejar}
            className="flex flex-col gap-4 rounded-2xl border border-borde bg-superficie p-6"
          >
            <label htmlFor="codigo-pareja" className="text-sm font-bold text-tinta">
              Tengo el código de alguien
            </label>

            <input
              id="codigo-pareja"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC234"
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              aria-describedby={errorPareja ? 'error-pareja' : undefined}
              className="w-full rounded-xl border border-borde bg-superficie-alta px-4 py-4 text-center font-display text-3xl uppercase tracking-[0.25em] text-tinta tabular-nums placeholder:text-tinta-suave/25 focus:border-lima"
            />

            {errorPareja && (
              <p id="error-pareja" role="alert" className="text-sm font-semibold text-error">
                {errorPareja}
              </p>
            )}

            <Button
              type="submit"
              variante="lima"
              cargando={emparejando}
              disabled={codigo.length !== 6}
              className="w-full"
            >
              Emparejar
            </Button>
          </form>

        </div>

        <section className="rounded-2xl border border-borde bg-superficie/60 p-6 backdrop-blur-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-tinta">
                Tus cartas{' '}
                <span className="text-tinta-suave tabular-nums">({mias.length})</span>
              </h2>
              <p className="text-sm text-tinta-suave">
                Las escribes tú, las cumplirá la otra persona.
              </p>
              <div className="mt-2">
                <ResumenDificultad cards={mias} />
              </div>
            </div>

            {!editor && (
              <Button onClick={() => setEditor({})}>
                <IconoMas className="size-5" aria-hidden="true" />
                Nueva carta
              </Button>
            )}
          </div>

          <AnimatePresence>
            {editor && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="mb-8 rounded-xl border border-fucsia/40 bg-superficie p-5"
              >
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-display text-lg">
                    {editor.carta ? 'Editar carta' : 'Nueva carta'}
                  </h3>

                  <button
                    onClick={() => setEditor(null)}
                    aria-label="Cerrar el editor"
                    className="grid size-11 place-items-center rounded-lg text-tinta-suave hover:text-tinta"
                  >
                    <IconoCerrar className="size-5" aria-hidden="true" />
                  </button>
                </div>

                <CardEditor
                  carta={editor.carta}
                  usadas={mias.map((c) => c.title)}
                  error={errorMazo}
                  onCancel={() => setEditor(null)}
                  onSave={async (borrador) => {
                    if (await guardar(borrador, editor.carta)) setEditor(null)
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {cargando ? (
            <p role="status" className="text-tinta-suave">
              Cargando tus cartas…
            </p>
          ) : mias.length === 0 ? (
            <div className="rounded-xl border border-dashed border-borde px-6 py-12 text-center">
              <p className="mx-auto max-w-sm text-tinta-suave">
                Todavía no has escrito ninguna. La primera marca el tono de la partida:
                cuanto más concreta, mejor.
              </p>

              {!editor && (
                <Button variante="lima" onClick={() => setEditor({})} className="mt-5">
                  <IconoMas className="size-5" aria-hidden="true" />
                  Escribir la primera
                </Button>
              )}
            </div>
          ) : (
            <CardGrid>
              {mias.map((carta, i) => (
                <CardTile
                  key={carta.id}
                  carta={carta}
                  indice={i}
                  onEdit={(c) => setEditor({ carta: c })}
                  onDelete={borrar}
                />
              ))}
            </CardGrid>
          )}

          {errorMazo && !editor && (
            <p role="alert" className="mt-4 text-sm font-semibold text-error">
              {errorMazo}
            </p>
          )}
        </section>
      </div>

      <button
        onClick={logout}
        className="mx-auto mt-10 flex min-h-11 items-center gap-2 px-4 text-sm text-tinta-suave transition-colors duration-200 hover:text-tinta"
      >
        <IconoSalir className="size-4" aria-hidden="true" />
        Cerrar sesión
      </button>
    </div>
  )
}
