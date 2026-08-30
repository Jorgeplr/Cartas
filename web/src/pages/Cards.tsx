import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { CardGrid, CardTile, EmptyDeck, ResumenDificultad } from '../components/CardGrid'
import { IconoCerrar, IconoMas } from '../components/Icon'
import { useCards } from '../lib/useCards'
import type { Card } from '../lib/types'
import { CardEditor } from './CardEditor'

export function Cards() {
  const { session } = useAuth()
  const { mias, suyas, cargando, error, guardar, borrar } = useCards()
  const [editor, setEditor] = useState<{ carta?: Card } | null>(null)

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
              usadas={mias.map((c) => c.title)}
              error={error}
              onCancel={() => setEditor(null)}
              onSave={async (borrador) => {
                if (await guardar(borrador, editor.carta)) setEditor(null)
              }}
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
        <p role="status" className="text-tinta-suave">
          Cargando el mazo…
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          <Seccion titulo={`Tus cartas ()`} extra={<ResumenDificultad cards={mias} />}>
            {mias.length === 0 ? (
              <EmptyDeck
                mensaje="Todavía no has escrito ninguna. La primera marca el tono de la partida."
                accion={editor ? undefined : () => setEditor({})}
              />
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
          </Seccion>

          <Seccion titulo={`Las de ${nombrePareja} (${suyas.length})`}>
            {suyas.length === 0 ? (
              <EmptyDeck mensaje={`${nombrePareja} aún no ha escrito ninguna carta.`} />
            ) : (
              <CardGrid>
                {suyas.map((carta, i) => (
                  <CardTile key={carta.id} carta={carta} indice={i} />
                ))}
              </CardGrid>
            )}
          </Seccion>
        </div>
      )}
    </div>
  )
}

function Seccion({
  titulo,
  extra,
  children,
}: {
  titulo: string
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg text-tinta-suave">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  )
}
