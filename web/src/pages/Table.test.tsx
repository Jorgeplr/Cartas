import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import { setToken } from '../lib/api'
import { Table } from './Table'
import type { DeckState } from '../lib/types'

const YO = { id: 1, email: 'ana@x.com', display_name: 'ana', invite_code: 'ABC234' }
const PAREJA = { id: 2, display_name: 'bea' }

const SESION = { user: YO, pairing: { id: 1, current_turn_user_id: 1 }, partner: PAREJA }

function mesa(overrides: Partial<DeckState> = {}): DeckState {
  return {
    pairing: { id: 1, current_turn_user_id: 1 },
    partner: PAREJA,
    cards_left: 3,
    cards_total: 3,
    last_play: null,
    ...overrides,
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Un servidor cuyo estado de mesa se puede cambiar entre sondeos, que es
 *  justo lo que pasa cuando la otra persona roba. */
function servidor(inicial: DeckState) {
  const estado = { mesa: inicial }

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.endsWith('/me')) return json(SESION)
      if (url.endsWith('/pairing')) return json(estado.mesa)
      return json({})
    }),
  )

  return estado
}

function pintar() {
  setToken('token-valido')

  render(
    <MemoryRouter>
      <AuthProvider>
        <Table />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('mesa de juego', () => {
  beforeEach(() => {
    document.title = 'Cartas de Reto'
  })

  it('deja robar cuando es tu turno', async () => {
    servidor(mesa())
    pintar()

    expect(await screen.findByRole('button', { name: 'ROBAR' })).toBeEnabled()
  })

  it('bloquea el robo y explica por qué cuando no es tu turno', async () => {
    servidor(mesa({ pairing: { id: 1, current_turn_user_id: 2 } }))
    pintar()

    expect(await screen.findByRole('button', { name: 'ROBAR' })).toBeDisabled()
    expect(screen.getByText('Le toca a bea')).toBeInTheDocument()
  })

  it('el turno llega solo cuando la otra persona roba, sin recargar', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    const estado = servidor(mesa({ pairing: { id: 1, current_turn_user_id: 2 }, cards_left: 3 }))
    pintar()

    expect(await screen.findByText('Le toca a bea')).toBeInTheDocument()

    // bea roba en su pantalla: cambia el estado del servidor, no el nuestro.
    estado.mesa = mesa({
      pairing: { id: 1, current_turn_user_id: 1 },
      cards_left: 2,
      last_play: {
        card: {
          id: 9,
          title: 'Karaoke',
          challenge: 'Canta el estribillo',
          difficulty: 'medio',
          mine: true,
          drawn: true,
          hidden: false,
          created_at: '2026-08-29T00:00:00Z',
        },
        drawn_by: PAREJA,
        drawn_by_me: false,
        drawn_at: '2026-08-29T10:00:00Z',
      },
    })

    // El sondeo actualiza estado por su cuenta: act envuelve ese despertar.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100)
    })

    await waitFor(() => expect(screen.getByRole('button', { name: 'ROBAR' })).toBeEnabled())
    expect(screen.queryByText('Le toca a bea')).not.toBeInTheDocument()
    expect(screen.getByText(/2 cartas en el mazo/i)).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('muestra qué carta le tocó a la otra persona', async () => {
    servidor(
      mesa({
        last_play: {
          card: {
            id: 9,
            title: 'Karaoke',
            challenge: 'Canta el estribillo',
            difficulty: 'medio',
            mine: true,
            drawn: true,
            hidden: false,
            created_at: '2026-08-29T00:00:00Z',
          },
          drawn_by: PAREJA,
          drawn_by_me: false,
          drawn_at: '2026-08-29T10:00:00Z',
        },
      }),
    )
    pintar()

    expect(await screen.findByText(/Le tocó a bea/)).toBeInTheDocument()
    expect(screen.getByText('Canta el estribillo')).toBeInTheDocument()
  })

  it('muestra la última jugada aunque no se sepa quién robó', async () => {
    // Las cartas robadas antes de que existiera `drawn_by` no tienen a quién
    // atribuirse. Antes esto tumbaba la pantalla entera.
    servidor(
      mesa({
        last_play: {
          card: {
            id: 9,
            title: 'Prenda',
            challenge: 'Quítate una prenda',
            difficulty: 'dificil',
            mine: true,
            drawn: true,
            hidden: false,
            created_at: '2026-08-29T00:00:00Z',
          },
          drawn_by: null,
          drawn_by_me: false,
          drawn_at: '2026-08-29T10:00:00Z',
        },
      }),
    )
    pintar()

    expect(await screen.findByText(/Salió/)).toBeInTheDocument()
    expect(screen.getByText('Quítate una prenda')).toBeInTheDocument()
  })

  it('avisa en el título de la pestaña cuando pasa a ser tu turno', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    const estado = servidor(mesa({ pairing: { id: 1, current_turn_user_id: 2 } }))
    pintar()

    await screen.findByText('Le toca a bea')
    expect(document.title).toBe('Cartas de Reto')

    estado.mesa = mesa({ pairing: { id: 1, current_turn_user_id: 1 } })
    // El sondeo actualiza estado por su cuenta: act envuelve ese despertar.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100)
    })

    await waitFor(() => expect(document.title).toBe('¡Te toca! · Cartas de Reto'))

    vi.useRealTimers()
  })

  it('ofrece rebarajar con el mazo agotado', async () => {
    servidor(mesa({ cards_left: 0, cards_total: 4 }))
    pintar()

    expect(await screen.findByRole('button', { name: /rebarajar/i })).toBeInTheDocument()
    expect(screen.getByText(/se acabaron las cartas/i)).toBeInTheDocument()
  })

  it('con la baraja vacía manda a escribir cartas', async () => {
    servidor(mesa({ cards_left: 0, cards_total: 0 }))
    pintar()

    expect(await screen.findByRole('link', { name: /escribir cartas/i })).toHaveAttribute(
      'href',
      '/cards',
    )
  })
})
