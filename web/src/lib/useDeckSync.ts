import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from './api'
import type { DeckState } from './types'

const INTERVALO_MS = 3000

/**
 * Mantiene la mesa viva sin que nadie tenga que recargar.
 *
 * Sondea cada 3s en vez de abrir un websocket: son dos jugadores por turnos,
 * así que una petición ligera cada pocos segundos da la misma sensación que
 * ActionCable sin añadir Redis, autenticación sobre el socket ni lógica de
 * reconexión. Solo sondea con la pestaña visible, y refresca al instante
 * cuando vuelves a ella: una pestaña de fondo no gasta peticiones.
 */
export function useDeckSync() {
  const [deck, setDeck] = useState<DeckState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  // En una ref para que el intervalo no se recree en cada render.
  const enVuelo = useRef(false)

  const sincronizar = useCallback(async () => {
    if (enVuelo.current) return

    enVuelo.current = true
    try {
      setDeck(await api.get<DeckState>('/pairing'))
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Se perdió la conexión con la mesa.')
    } finally {
      enVuelo.current = false
      setCargando(false)
    }
  }, [])

  useEffect(() => {
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

  return { deck, cargando, error, sincronizar, setDeck, setError }
}
