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

  // Devuelve las cartas recien cargadas: elegir/cancelar comodín las
  // necesita para saber cómo queda la carta que se está mostrando en el
  // diálogo, sin esperar al siguiente render.
  const cargar = useCallback(async () => {
    try {
      const { cards } = await api.get<{ cards: Card[] }>('/cards')
      setCards(cards)
      setError(null)
      return cards
    } catch (err) {
      setError(mensaje(err, 'No pudimos cargar el mazo.'))
      return undefined
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    // La regla asume que el estado cambia de forma sincrona, pero aqui se
    // actualiza despues del await del fetch. Pedir datos a la API al montar
    // es sincronizar con un sistema externo, que es justo para lo que sirve
    // un efecto.
    // oxlint-disable-next-line react/set-state-in-effect
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

  // Devuelven la carta actualizada (o undefined si falla): quien la banea
  // desde el diálogo de carta completa, y no solo desde la rejilla, necesita
  // ese valor para refrescar lo que está mostrando ahí sin cerrarlo.
  const banear = useCallback(async (carta: Card) => {
    setError(null)

    try {
      const { card } = await api.post<{ card: Card }>(`/cards/${carta.id}/ban`)
      setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)))
      return card
    } catch (err) {
      setError(mensaje(err, 'No pudimos banear la carta.'))
      return undefined
    }
  }, [])

  const desbanear = useCallback(async (carta: Card) => {
    setError(null)

    try {
      const { card } = await api.del<{ card: Card }>(`/cards/${carta.id}/ban`)
      setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)))
      return card
    } catch (err) {
      setError(mensaje(err, 'No pudimos quitar el baneo.'))
      return undefined
    }
  }, [])

  // Elegir uno nuevo desmarca el anterior (una carta DISTINTA), así que la
  // única forma fiable de refrescar todas las banderas `is_my_wildcard` a la
  // vez es recargar el mazo entero en vez de parchear una sola carta.
  const elegirComodin = useCallback(
    async (carta: Card) => {
      setError(null)

      try {
        await api.post('/wildcard', { card_id: carta.id })
        const frescas = await cargar()
        return frescas?.find((c) => c.id === carta.id)
      } catch (err) {
        setError(mensaje(err, 'No pudimos elegir el comodín.'))
        return undefined
      }
    },
    [cargar],
  )

  // `carta` es opcional: solo hace falta cuando quien cancela lo hace desde
  // el diálogo de una carta concreta y necesita su versión refrescada.
  const cancelarComodin = useCallback(
    async (carta?: Card) => {
      setError(null)

      try {
        await api.del('/wildcard')
        const frescas = await cargar()
        return carta ? frescas?.find((c) => c.id === carta.id) : undefined
      } catch (err) {
        setError(mensaje(err, 'No pudimos quitar el comodín.'))
        return undefined
      }
    },
    [cargar],
  )

  const suyas = cards.filter((c) => !c.mine)
  const mias = cards.filter((c) => c.mine)
  const comodin = mias.find((c) => c.is_my_wildcard)

  return {
    cards,
    mias,
    suyas,
    baneosUsados: suyas.filter((c) => c.banned_by_me).length,
    comodin,
    // Sin comodín elegido todavía, `comodin` es undefined: no hay nada jugado.
    comodinJugado: comodin?.drawn ?? false,
    cargando,
    error,
    recargar: cargar,
    guardar,
    borrar,
    banear,
    desbanear,
    elegirComodin,
    cancelarComodin,
  }
}

function mensaje(err: unknown, porDefecto: string): string {
  return err instanceof ApiError ? err.message : porDefecto
}
