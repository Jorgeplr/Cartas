import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { IconoBarajar, IconoMas } from '../components/Icon'
import { CardBack, PlayCard } from '../components/PlayCard'
import { api, ApiError } from '../lib/api'
import type { Card, DeckState, DrawResult } from '../lib/types'

export function Table() {
  const { session, refresh } = useAuth()
  const [deck, setDeck] = useState<DeckState | null>(null)
  const [robada, setRobada] = useState<Card | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [robando, setRobando] = useState(false)
  const menosMovimiento = useReducedMotion()

  const cargar = useCallback(async () => {
    try {
      setDeck(await api.get<DeckState>('/pairing'))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos cargar la mesa.')
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const miId = session?.user.id
  const miTurno = deck != null && miId != null && deck.pairing.current_turn_user_id === miId
  const quedan = deck?.cards_left ?? 0
  const nombrePareja = deck?.partner.display_name ?? 'tu pareja'

  async function robar() {
    setError(null)
    setRobando(true)

    try {
      const resultado = await api.post<DrawResult>('/draw')
      setRobada(resultado.card)
      await Promise.all([cargar(), refresh()])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos robar la carta.')
    } finally {
      setRobando(false)
    }
  }

  async function rebarajar() {
    setError(null)
    setRobada(null)

    try {
      await api.post('/deck/reshuffle')
      await cargar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos rebarajar.')
    }
  }

  const motivoBloqueo = !miTurno
    ? `Le toca a ${nombrePareja}`
    : quedan === 0
      ? 'El mazo está vacío'
      : null

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-5 py-8">
      <Turnos
        yo={session?.user.display_name ?? 'Tú'}
        pareja={nombrePareja}
        miTurno={miTurno}
      />

      <div className="grid min-h-[26rem] w-full place-items-center">
        <AnimatePresence mode="wait">
          {robada ? (
            <motion.div
              key={`carta-${robada.id}`}
              initial={
                menosMovimiento ? { opacity: 0 } : { rotateY: 180, y: -40, opacity: 0, scale: 0.9 }
              }
              animate={
                menosMovimiento ? { opacity: 1 } : { rotateY: 0, y: 0, opacity: 1, scale: 1 }
              }
              exit={menosMovimiento ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: 'preserve-3d', perspective: 1200 }}
              className="w-60 cara-carta"
            >
              <PlayCard
                title={robada.title}
                challenge={robada.challenge}
                difficulty={robada.difficulty}
              />
            </motion.div>
          ) : (
            <motion.div
              key="mazo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-60"
            >
              {quedan > 0 ? (
                <>
                  {/* Pila: dos cartas asomando detrás dan volumen al mazo. */}
                  <div className="absolute inset-0 -rotate-6 opacity-40">
                    <CardBack />
                  </div>
                  <div className="absolute inset-0 rotate-3 opacity-70">
                    <CardBack />
                  </div>
                  <div className="relative">
                    <CardBack />
                  </div>
                </>
              ) : (
                <div className="grid aspect-[2/3] place-items-center rounded-carta border-2 border-dashed border-borde px-6 text-center">
                  <p className="text-tinta-suave">
                    {deck?.cards_total === 0
                      ? 'La baraja está vacía. Escribid vuestras primeras cartas.'
                      : 'Se acabaron las cartas. Podéis rebarajar.'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="font-display text-sm uppercase tracking-[0.2em] text-tinta-suave tabular-nums">
        {quedan} {quedan === 1 ? 'carta' : 'cartas'} en el mazo
      </p>

      {error && (
        <p role="alert" className="text-sm font-semibold text-error">
          {error}
        </p>
      )}

      <div className="flex w-full max-w-sm flex-col items-center gap-3">
        {robada ? (
          <Button variante="fantasma" onClick={() => setRobada(null)} className="w-full">
            Siguiente
          </Button>
        ) : (
          <Button
            onClick={robar}
            cargando={robando}
            disabled={Boolean(motivoBloqueo)}
            className="w-full text-lg"
          >
            ROBAR
          </Button>
        )}

        {/* El botón deshabilitado nunca se queda mudo: siempre dice por qué. */}
        {motivoBloqueo && !robada && (
          <p className="text-sm text-tinta-suave" aria-live="polite">
            {motivoBloqueo}
          </p>
        )}

        {quedan === 0 && (deck?.cards_total ?? 0) > 0 && (
          <Button variante="lima" onClick={rebarajar} className="w-full">
            <IconoBarajar className="size-5" aria-hidden="true" />
            Rebarajar
          </Button>
        )}

        {(deck?.cards_total ?? 0) === 0 && (
          <Link
            to="/cards"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-lima px-5 font-display text-base font-semibold text-noche shadow-lima transition-colors duration-200 hover:bg-lima/90"
          >
            <IconoMas className="size-5" aria-hidden="true" />
            Escribir cartas
          </Link>
        )}
      </div>
    </div>
  )
}

function Turnos({ yo, pareja, miTurno }: { yo: string; pareja: string; miTurno: boolean }) {
  return (
    <div className="flex w-full items-center justify-center gap-3" aria-live="polite">
      <Jugador nombre={yo} activo={miTurno} sufijo="(tú)" />
      <span className="font-display text-sm text-tinta-suave" aria-hidden="true">
        vs
      </span>
      <Jugador nombre={pareja} activo={!miTurno} />
    </div>
  )
}

function Jugador({
  nombre,
  activo,
  sufijo,
}: {
  nombre: string
  activo: boolean
  sufijo?: string
}) {
  return (
    <span
      className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors duration-200 ${
        activo
          ? 'border-lima bg-lima/10 text-lima shadow-lima'
          : 'border-borde text-tinta-suave'
      }`}
    >
      {nombre} {sufijo}
      {activo && <span className="sr-only"> — es su turno</span>}
    </span>
  )
}
