import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from './api'
import type { RpsRoundState } from './types'

/** Más rápido que el sondeo de la mesa (3s): aquí la espera es la partida
 *  entera, así que la revelación tiene que sentirse casi instantánea. */
const INTERVALO_MS = 1200

const VACIA: RpsRoundState = {
  resolved: false,
  my_choice: null,
  partner_chose: false,
  partner_choice: null,
  result: null,
  resolved_at: null,
}

/**
 * Sondea el estado de la ronda de piedra, papel o tijera, igual que
 * useDeckSync hace con la mesa. Vive aparte porque el ritmo de sondeo es
 * distinto y porque `elegir` necesita optimismo local: si se esperara al
 * siguiente sondeo para reflejar tu propia elección, el botón se sentiría
 * muerto durante hasta un segundo.
 */
export function useRpsSync() {
  const [ronda, setRonda] = useState<RpsRoundState>(VACIA)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const enVuelo = useRef(false)

  const sincronizar = useCallback(async () => {
    if (enVuelo.current) return

    enVuelo.current = true
    try {
      setRonda(await api.get<RpsRoundState>('/rps'))
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Se perdió la conexión con la partida.')
    } finally {
      enVuelo.current = false
      setCargando(false)
    }
  }, [])

  const elegir = useCallback(async (eleccion: RpsRoundState['my_choice']) => {
    setError(null)
    try {
      const resultado = await api.post<RpsRoundState>('/rps/choose', { choice: eleccion })
      setRonda(resultado)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos registrar tu jugada.')
      throw err
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void sincronizar()

    const tick = () => {
      if (document.visibilityState === 'visible') void sincronizar()
    }

    const alVolver = () => {
      if (document.visibilityState === 'visible') void sincronizar()
    }

    const id = setInterval(tick, INTERVALO_MS)
    document.addEventListener('visibilitychange', alVolver)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [sincronizar])

  return { ronda, cargando, error, elegir, setError }
}
