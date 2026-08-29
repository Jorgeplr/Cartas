import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from './api'
import type { Card } from './types'
import type { BorradorCarta } from '../pages/CardEditor'

/**
 * Toda la gestión del mazo en un sitio. La usan la pantalla de emparejamiento
 * y la del mazo: son la misma operación en dos contextos, y duplicarla dejaría
 * dos sitios donde arreglar el mismo error.
 */
export function useCards() {
  const [cards, setCards] = useState<Card[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const { cards } = await api.get<{ cards: Card[] }>('/cards')
      setCards(cards)
      setError(null)
    } catch (err) {
      setError(mensaje(err, 'No pudimos cargar el mazo.'))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const guardar = useCallback(
    async (borrador: BorradorCarta, carta?: Card) => {
      setError(null)

      try {
        if (carta) {
          await api.patch(`/cards/${carta.id}`, borrador)
        } else {
          await api.post('/cards', borrador)
        }
        await cargar()
        return true
      } catch (err) {
        setError(mensaje(err, 'No pudimos guardar la carta.'))
        return false
      }
    },
    [cargar],
  )

  const borrar = useCallback(
    async (carta: Card) => {
      setError(null)

      try {
        await api.del(`/cards/${carta.id}`)
        await cargar()
      } catch (err) {
        setError(mensaje(err, 'No pudimos borrar la carta.'))
      }
    },
    [cargar],
  )

  return {
    cards,
    mias: cards.filter((c) => c.mine),
    suyas: cards.filter((c) => !c.mine),
    cargando,
    error,
    recargar: cargar,
    guardar,
    borrar,
  }
}

function mensaje(err: unknown, porDefecto: string): string {
  return err instanceof ApiError ? err.message : porDefecto
}
