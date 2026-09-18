import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '../auth/AuthContext'
import { IconoPapel, IconoPiedra, IconoTijera } from '../components/Icon'
import { useRpsSync } from '../lib/useRpsSync'
import { ELECCIONES_RPS, type RpsChoice } from '../lib/types'

const ICONO: Record<RpsChoice, typeof IconoPiedra> = {
  piedra: IconoPiedra,
  papel: IconoPapel,
  tijera: IconoTijera,
}

const ETIQUETA: Record<RpsChoice, string> = {
  piedra: 'Piedra',
  papel: 'Papel',
  tijera: 'Tijera',
}

const RESULTADO: Record<'gane' | 'perdi' | 'empate', { texto: string; clase: string }> = {
  gane: { texto: '¡Ganaste!', clase: 'text-lima drop-shadow-[0_0_18px_var(--color-lima)]' },
  perdi: { texto: 'Perdiste', clase: 'text-error' },
  empate: { texto: 'Empate', clase: 'text-tinta-suave' },
}

export function Rps() {
  const { session } = useAuth()
  const { ronda, cargando, error, elegir, setError } = useRpsSync()
  const [enviando, setEnviando] = useState<RpsChoice | null>(null)

  const nombrePareja = session?.partner?.display_name ?? 'tu pareja'
  const esperando = ronda.my_choice != null && !ronda.resolved

  async function jugar(eleccion: RpsChoice) {
    setEnviando(eleccion)
    try {
      await elegir(eleccion)
    } catch {
      // El error ya queda en pantalla vía useRpsSync; aquí solo evitamos
      // que el botón se quede girando para siempre.
    } finally {
      setEnviando(null)
    }
  }

  if (cargando) {
    return (
      <p role="status" className="py-20 text-center text-tinta-suave">
        Preparando la partida…
      </p>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-5 py-8">
      <header className="text-center">
        <h1 className="text-3xl text-tinta">Piedra, papel o tijera</h1>
        <p className="mt-1 text-tinta-suave">
          Decidid algo rápido sin tocar el mazo: al mejor gesto contra {nombrePareja}.
        </p>
      </header>

      {error && (
        <p role="alert" className="text-sm font-semibold text-error">
          {error}
        </p>
      )}

      <div className="grid min-h-64 w-full place-items-center">
        <AnimatePresence mode="wait">
          {ronda.resolved ? (
            <Revelacion
              key={`revelada-${ronda.resolved_at}`}
              miEleccion={ronda.my_choice}
              suEleccion={ronda.partner_choice}
              resultado={ronda.result}
              nombrePareja={nombrePareja}
            />
          ) : esperando ? (
            <Esperando key="esperando" miEleccion={ronda.my_choice} nombrePareja={nombrePareja} />
          ) : (
            <motion.p
              key="invitacion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-display text-sm uppercase tracking-[0.2em] text-tinta-suave"
            >
              {ronda.partner_chose ? `${nombrePareja} ya eligió` : 'Elige tu jugada'}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <Selector
        seleccion={ronda.my_choice}
        enviando={enviando}
        etiqueta={ronda.resolved ? 'Jugar otra vez' : esperando ? 'Cambiar elección' : undefined}
        onElegir={(eleccion) => {
          setError(null)
          void jugar(eleccion)
        }}
      />

      <p className="max-w-md text-center text-xs text-tinta-suave">
        Piedra vence a tijera · Papel vence a piedra · Tijera vence a papel
      </p>
    </div>
  )
}

function Selector({
  seleccion,
  enviando,
  etiqueta,
  onElegir,
}: {
  seleccion: RpsChoice | null
  enviando: RpsChoice | null
  etiqueta?: string
  onElegir: (eleccion: RpsChoice) => void
}) {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      {etiqueta && (
        <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-tinta-suave">
          {etiqueta}
        </p>
      )}

      <div className="grid w-full max-w-sm grid-cols-3 gap-3">
        {ELECCIONES_RPS.map((eleccion) => {
          const Icono = ICONO[eleccion]
          const activa = seleccion === eleccion

          return (
            <button
              key={eleccion}
              type="button"
              onClick={() => onElegir(eleccion)}
              disabled={enviando != null}
              aria-pressed={activa}
              aria-label={ETIQUETA[eleccion]}
              className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 px-2 py-4 font-display text-sm font-semibold transition-[border-color,background-color,transform] duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-60 ${
                activa
                  ? 'border-fucsia bg-fucsia/15 text-fucsia shadow-neon'
                  : 'border-borde bg-superficie-alta text-tinta hover:border-fucsia/60'
              }`}
            >
              {enviando === eleccion ? (
                <span
                  className="size-7 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
              ) : (
                <Icono className="size-7" aria-hidden="true" />
              )}
              {ETIQUETA[eleccion]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Esperando({
  miEleccion,
  nombrePareja,
}: {
  miEleccion: RpsChoice | null
  nombrePareja: string
}) {
  const menosMovimiento = useReducedMotion()
  const Icono = miEleccion ? ICONO[miEleccion] : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col items-center gap-4"
      aria-live="polite"
    >
      <motion.div
        animate={menosMovimiento ? {} : { scale: [1, 1.06, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        className="grid size-24 place-items-center rounded-full border-2 border-lima bg-lima/10 text-lima shadow-lima"
      >
        {Icono && <Icono className="size-10" aria-hidden="true" />}
      </motion.div>

      <p className="text-tinta-suave">
        Elegiste <span className="font-semibold text-tinta">{miEleccion && ETIQUETA[miEleccion]}</span>.
        Esperando a {nombrePareja}…
      </p>
    </motion.div>
  )
}

function Revelacion({
  miEleccion,
  suEleccion,
  resultado,
  nombrePareja,
}: {
  miEleccion: RpsChoice | null
  suEleccion: RpsChoice | null
  resultado: 'gane' | 'perdi' | 'empate' | null
  nombrePareja: string
}) {
  const menosMovimiento = useReducedMotion()
  const info = resultado ? RESULTADO[resultado] : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-6"
    >
      <div className="flex items-center gap-4 sm:gap-8">
        <Gesto eleccion={miEleccion} etiqueta="Tú" desde="left" menosMovimiento={menosMovimiento} />

        <span className="font-display text-sm text-tinta-suave" aria-hidden="true">
          vs
        </span>

        <Gesto
          eleccion={suEleccion}
          etiqueta={nombrePareja}
          desde="right"
          menosMovimiento={menosMovimiento}
        />
      </div>

      {info && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className={`font-display text-2xl font-semibold ${info.clase}`}
          aria-live="polite"
        >
          {info.texto}
        </motion.p>
      )}
    </motion.div>
  )
}

function Gesto({
  eleccion,
  etiqueta,
  desde,
  menosMovimiento,
}: {
  eleccion: RpsChoice | null
  etiqueta: string
  desde: 'left' | 'right'
  menosMovimiento: boolean | null
}) {
  const Icono = eleccion ? ICONO[eleccion] : null

  return (
    <motion.div
      initial={menosMovimiento ? { opacity: 0 } : { opacity: 0, x: desde === 'left' ? -24 : 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-2"
    >
      <div className="grid size-24 place-items-center rounded-full border-2 border-borde bg-superficie-alta text-tinta sm:size-28">
        {Icono && <Icono className="size-10 sm:size-12" aria-hidden="true" />}
      </div>
      <span className="max-w-24 truncate text-sm text-tinta-suave">
        {etiqueta} · {eleccion ? ETIQUETA[eleccion] : '—'}
      </span>
    </motion.div>
  )
}
