import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { Deck, type EstadoMazo } from '../components/Deck'
import { IconoBarajar, IconoMas } from '../components/Icon'
import { PlayCard } from '../components/PlayCard'
import { api, ApiError } from '../lib/api'
import { useDeckSync } from '../lib/useDeckSync'
import type { Card, DrawResult, LastPlay } from '../lib/types'

/** Lo que dura la barajada antes de que la carta se despegue del mazo. */
const BARAJADA_MS = 620

export function Table() {
  const { session, refresh } = useAuth()
  const { deck, cargando, error: errorSync, sincronizar, setError } = useDeckSync()

  const [revelada, setRevelada] = useState<Card | null>(null)
  const [estadoMazo, setEstadoMazo] = useState<EstadoMazo>('reposo')
  const [robando, setRobando] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const menosMovimiento = useReducedMotion()

  const miId = session?.user.id
  const miTurno = deck != null && miId != null && deck.pairing.current_turn_user_id === miId
  const quedan = deck?.cards_left ?? 0
  const total = deck?.cards_total ?? 0
  const nombrePareja = deck?.partner.display_name ?? 'tu pareja'

  // Mientras miras una carta recién robada no queremos que la última jugada
  // de la otra persona te la tape.
  const ultima = revelada ? null : (deck?.last_play ?? null)

  useAvisoDeTurno(miTurno, Boolean(deck))

  async function robar() {
    setErrorAccion(null)
    setRobando(true)
    setEstadoMazo('barajando')

    try {
      const resultado = await api.post<DrawResult>('/draw')

      // La barajada se ve entera aunque el servidor conteste antes: si no,
      // en local la animación se corta a media vuelta.
      if (!menosMovimiento) await esperar(BARAJADA_MS)

      setRevelada(resultado.card)
      await Promise.all([sincronizar(), refresh()])
    } catch (err) {
      setErrorAccion(err instanceof ApiError ? err.message : 'No pudimos robar la carta.')
      void sincronizar()
    } finally {
      setEstadoMazo('reposo')
      setRobando(false)
    }
  }

  async function rebarajar() {
    setErrorAccion(null)
    setRevelada(null)
    setEstadoMazo('barajando')

    try {
      await api.post('/deck/reshuffle')
      if (!menosMovimiento) await esperar(BARAJADA_MS)
      await sincronizar()
    } catch (err) {
      setErrorAccion(err instanceof ApiError ? err.message : 'No pudimos rebarajar.')
    } finally {
      setEstadoMazo('reposo')
    }
  }

  const motivoBloqueo = !miTurno
    ? `Le toca a ${nombrePareja}`
    : quedan === 0
      ? 'El mazo está vacío'
      : null

  if (cargando) {
    return (
      <p role="status" className="py-20 text-center text-tinta-suave">
        Preparando la mesa…
      </p>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-7 px-5 py-8">
      <Turnos
        yo={session?.user.display_name ?? 'Tú'}
        pareja={nombrePareja}
        miTurno={miTurno}
      />

      <div className="grid min-h-104 w-full place-items-center">
        <AnimatePresence mode="wait">
          {revelada ? (
            <CartaRevelada key={`carta-${revelada.id}`} carta={revelada} />
          ) : quedan > 0 ? (
            <motion.div
              key="mazo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <Deck estado={estadoMazo} />
            </motion.div>
          ) : (
            <motion.div
              key="vacio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid aspect-2/3 w-60 place-items-center rounded-carta border-2 border-dashed border-borde px-6 text-center"
            >
              <p className="text-tinta-suave">
                {total === 0
                  ? 'La baraja está vacía. Escribid vuestras primeras cartas.'
                  : 'Se acabaron las cartas. Podéis rebarajar.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="font-display text-sm uppercase tracking-[0.2em] text-tinta-suave tabular-nums">
        {quedan} {quedan === 1 ? 'carta' : 'cartas'} en el mazo
      </p>

      {(errorAccion || errorSync) && (
        <p role="alert" className="text-sm font-semibold text-error">
          {errorAccion ?? errorSync}
        </p>
      )}

      <div className="flex w-full max-w-sm flex-col items-center gap-3">
        {revelada ? (
          <Button
            variante="fantasma"
            onClick={() => {
              setRevelada(null)
              setError(null)
            }}
            className="w-full"
          >
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
        {motivoBloqueo && !revelada && (
          <p className="text-sm text-tinta-suave" aria-live="polite">
            {motivoBloqueo}
          </p>
        )}

        {quedan === 0 && total > 0 && (
          <Button variante="lima" onClick={rebarajar} className="w-full">
            <IconoBarajar className="size-5" aria-hidden="true" />
            Rebarajar
          </Button>
        )}

        {total === 0 && (
          <Link
            to="/cards"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-lima px-5 font-display text-base font-semibold text-noche shadow-lima transition-colors duration-200 hover:bg-lima/90"
          >
            <IconoMas className="size-5" aria-hidden="true" />
            Escribir cartas
          </Link>
        )}
      </div>

      <AnimatePresence>{ultima && <UltimaJugada jugada={ultima} />}</AnimatePresence>
    </div>
  )
}

function CartaRevelada({ carta }: { carta: Card }) {
  const menosMovimiento = useReducedMotion()

  return (
    <motion.div
      initial={
        menosMovimiento
          ? { opacity: 0 }
          : { rotateY: 180, y: -46, opacity: 0, scale: 0.88 }
      }
      animate={
        menosMovimiento ? { opacity: 1 } : { rotateY: 0, y: 0, opacity: 1, scale: 1 }
      }
      exit={menosMovimiento ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformStyle: 'preserve-3d', perspective: 1200 }}
      className="cara-carta w-60"
    >
      <PlayCard
        title={carta.title}
        challenge={carta.challenge}
        difficulty={carta.difficulty}
      />
    </motion.div>
  )
}

/** Lo que le tocó a la otra persona, sin tener que preguntárselo. */
function UltimaJugada({ jugada }: { jugada: LastPlay }) {
  // `drawn_by` puede ser null: las cartas robadas antes de que existiera ese
  // dato no tienen a quién atribuirse. Se enseña la carta igual, sin nombre.
  const quien = jugada.drawn_by_me
    ? 'Te tocó'
    : jugada.drawn_by
      ? `Le tocó a ${jugada.drawn_by.display_name}`
      : 'Salió'

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      aria-live="polite"
      className="w-full max-w-sm rounded-2xl border border-borde bg-superficie/70 p-4 backdrop-blur-sm"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-tinta-suave">
        Última carta
      </p>

      <p className="mt-1 font-display text-base text-tinta">
        {quien}: <span className="text-fucsia">{jugada.card.title}</span>
      </p>

      {jugada.card.challenge && (
        <p className="mt-1 text-sm leading-relaxed text-tinta/80">{jugada.card.challenge}</p>
      )}
    </motion.section>
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

function Jugador({ nombre, activo, sufijo }: { nombre: string; activo: boolean; sufijo?: string }) {
  return (
    <motion.span
      animate={activo ? { scale: 1.04 } : { scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors duration-300 ${
        activo ? 'border-lima bg-lima/10 text-lima shadow-lima' : 'border-borde text-tinta-suave'
      }`}
    >
      {nombre} {sufijo}
      {activo && <span className="sr-only"> — es su turno</span>}
    </motion.span>
  )
}

/** Cuando el turno pasa a ser tuyo, el título de la pestaña lo canta: puedes
 *  estar en otra ventana esperando a que la otra persona juegue. */
function useAvisoDeTurno(miTurno: boolean, listo: boolean) {
  const anterior = useRef<boolean | null>(null)

  useEffect(() => {
    if (!listo) return

    const acabaDeTocarme = anterior.current === false && miTurno
    anterior.current = miTurno

    if (!acabaDeTocarme) {
      document.title = 'Cartas de Reto'
      return
    }

    document.title = '¡Te toca! · Cartas de Reto'

    const alVolver = () => {
      if (document.visibilityState === 'visible') document.title = 'Cartas de Reto'
    }

    document.addEventListener('visibilitychange', alVolver)
    return () => document.removeEventListener('visibilitychange', alVolver)
  }, [miTurno, listo])
}

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
