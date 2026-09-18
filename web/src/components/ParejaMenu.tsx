import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../auth/AuthContext'
import { api, ApiError } from '../lib/api'
import { IconoChevronAbajo, IconoCorazonRoto } from './Icon'

/**
 * El único punto de la app para deshacer un emparejamiento. Vive en el
 * header, siempre visible, porque es una salida de emergencia: cualquiera
 * de los dos puede usarla sin que el otro confirme nada.
 */
export function ParejaMenu() {
  const { session, refresh } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const [terminando, setTerminando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const raiz = useRef<HTMLDivElement>(null)

  const pareja = session?.partner?.display_name ?? null

  useEffect(() => {
    if (!abierto) return

    const alPulsarFuera = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false)
    }
    const alEscapar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }

    document.addEventListener('mousedown', alPulsarFuera)
    document.addEventListener('keydown', alEscapar)
    return () => {
      document.removeEventListener('mousedown', alPulsarFuera)
      document.removeEventListener('keydown', alEscapar)
    }
  }, [abierto])

  if (!pareja) return null

  async function terminar() {
    const confirmado = confirm(
      `¿Terminar el emparejamiento con ${pareja}? Volveréis a la pantalla de emparejar. ` +
        'Vuestras cartas se quedan como están: no se borran.',
    )
    if (!confirmado) return

    setError(null)
    setTerminando(true)
    try {
      await api.del('/pairing')
      // No hace falta cerrar el menu ni navegar a mano: al refrescar la
      // sesion, `pairing` pasa a null y el guard de rutas manda a /pair solo.
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos terminar el emparejamiento.')
      setTerminando(false)
    }
  }

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="inline-flex min-h-11 max-w-32 items-center gap-1 rounded-lg px-2.5 font-display text-sm font-semibold text-tinta-suave transition-colors duration-200 hover:text-tinta sm:max-w-none sm:px-3"
      >
        <span className="truncate">{pareja}</span>
        <IconoChevronAbajo
          className={`size-3.5 shrink-0 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            role="menu"
            aria-label={`Opciones de pareja con ${pareja}`}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-borde bg-superficie-alta p-1.5 shadow-neon"
          >
            <p className="px-2.5 pb-1.5 pt-2 text-xs text-tinta-suave">
              Emparejado con <span className="font-semibold text-tinta">{pareja}</span>
            </p>

            <button
              type="button"
              role="menuitem"
              onClick={() => void terminar()}
              disabled={terminando}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm font-semibold text-error transition-colors duration-200 hover:bg-error/10 disabled:pointer-events-none disabled:opacity-60"
            >
              {terminando ? (
                <span
                  className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
              ) : (
                <IconoCorazonRoto className="size-4 shrink-0" aria-hidden="true" />
              )}
              Terminar emparejamiento
            </button>

            {error && (
              <p role="alert" className="px-2.5 pb-1.5 pt-1 text-xs font-semibold text-error">
                {error}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
