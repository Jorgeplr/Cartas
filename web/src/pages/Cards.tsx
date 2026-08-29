import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { IconoCerrar, IconoLapiz, IconoMas, IconoPapelera } from '../components/Icon'
import { PlayCard } from '../components/PlayCard'
import { api, ApiError } from '../lib/api'
import type { Card } from '../lib/types'
import { CardEditor, type BorradorCarta } from './CardEditor'

export function Cards() {
  const { session } = useAuth()
  const [cards, setCards] = useState<Card[]>([])
  const [cargando, setCargando] = useState(true)
  const [editor, setEditor] = useState<{ carta?: Card } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const { cards } = await api.get<{ cards: Card[] }>('/cards')
      setCards(cards)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos cargar la baraja.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function guardar(borrador: BorradorCarta) {
    setError(null)

    try {
      if (editor?.carta) {
        await api.patch(`/cards/${editor.carta.id}`, borrador)
      } else {
        await api.post('/cards', borrador)
      }
      setEditor(null)
      await cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos guardar la carta.')
    }
  }

  async function borrar(carta: Card) {
    if (!confirm(`¿Borrar "${carta.title}"? No se puede deshacer.`)) return

    try {
      await api.del(`/cards/${carta.id}`)
      await cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos borrar la carta.')
    }
  }

  const mias = cards.filter((c) => c.mine)
  const suyas = cards.filter((c) => !c.mine)
  const nombrePareja = session?.partner?.display_name ?? 'tu pareja'

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl text-tinta">El mazo</h1>
          <p className="mt-1 text-tinta-suave">
            Escribe retos para {nombrePareja}. Los suyos permanecen tapados hasta que salgan.
          </p>
        </div>

        {!editor && (
          <Button onClick={() => setEditor({})}>
            <IconoMas className="size-5" aria-hidden="true" />
            Nueva carta
          </Button>
        )}
      </header>

      <AnimatePresence>
        {editor && (
          <motion.section
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="mb-10 rounded-2xl border border-fucsia/40 bg-superficie p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl">
                {editor.carta ? 'Editar carta' : 'Nueva carta'}
              </h2>

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
              onSave={guardar}
              onCancel={() => setEditor(null)}
              error={error}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {error && !editor && (
        <p role="alert" className="mb-6 text-sm font-semibold text-error">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-tinta-suave" role="status">
          Cargando el mazo…
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          <Seccion titulo={`Tus cartas (${mias.length})`}>
            {mias.length === 0 ? (
              <Vacio
                mensaje="Todavía no has escrito ninguna. La primera marca el tono de la partida."
                accion={!editor ? () => setEditor({}) : undefined}
              />
            ) : (
              <Rejilla>
                {mias.map((carta, i) => (
                  <Entrada key={carta.id} indice={i}>
                    <PlayCard
                      title={carta.title}
                      challenge={carta.challenge}
                      difficulty={carta.difficulty}
                      drawn={carta.drawn}
                    />

                    {!carta.drawn && (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => setEditor({ carta })}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-borde text-sm text-tinta-suave hover:border-fucsia/60 hover:text-tinta"
                        >
                          <IconoLapiz className="size-4" aria-hidden="true" />
                          Editar
                        </button>

                        <button
                          onClick={() => borrar(carta)}
                          aria-label={`Borrar la carta ${carta.title}`}
                          className="grid size-11 place-items-center rounded-lg border border-borde text-tinta-suave hover:border-error/60 hover:text-error"
                        >
                          <IconoPapelera className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </Entrada>
                ))}
              </Rejilla>
            )}
          </Seccion>

          <Seccion titulo={`Las de ${nombrePareja} (${suyas.length})`}>
            {suyas.length === 0 ? (
              <Vacio mensaje={`${nombrePareja} aún no ha escrito ninguna carta.`} />
            ) : (
              <Rejilla>
                {suyas.map((carta, i) => (
                  <Entrada key={carta.id} indice={i}>
                    <PlayCard
                      title={carta.title}
                      challenge={carta.challenge}
                      difficulty={carta.difficulty}
                      hidden={carta.hidden}
                      drawn={carta.drawn}
                    />
                  </Entrada>
                ))}
              </Rejilla>
            )}
          </Seccion>
        </div>
      )}
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 font-display text-lg text-tinta-suave">{titulo}</h2>
      {children}
    </section>
  )
}

function Rejilla({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-5">{children}</div>
  )
}

/** Entrada escalonada de 40ms: la rejilla se llena con ritmo en vez de aparecer de golpe. */
function Entrada({ indice, children }: { indice: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: Math.min(indice, 8) * 0.04 }}
    >
      {children}
    </motion.div>
  )
}

function Vacio({ mensaje, accion }: { mensaje: string; accion?: () => void }) {
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
