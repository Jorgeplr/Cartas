import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import { setToken } from '../lib/api'
import { Rps } from './Rps'
import type { RpsRoundState } from '../lib/types'

const YO = { id: 1, email: 'ana@x.com', display_name: 'ana', invite_code: 'ABC234' }
const PAREJA = { id: 2, display_name: 'bea' }

const SESION = {
  user: YO,
  pairing: { id: 1, current_turn_user_id: 1, active_themes: ['suave', 'picante', 'atrevida'] },
  partner: PAREJA,
}

function ronda(overrides: Partial<RpsRoundState> = {}): RpsRoundState {
  return {
    resolved: false,
    my_choice: null,
    partner_chose: false,
    partner_choice: null,
    result: null,
    resolved_at: null,
    ...overrides,
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function servidor(inicial: RpsRoundState) {
  const estado = { ronda: inicial, llamadas: [] as [string, RequestInit | undefined][] }

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      estado.llamadas.push([url, init])
      if (url.endsWith('/me')) return json(SESION)

      if (url.endsWith('/rps/choose') && init?.method === 'POST') {
        const { choice } = JSON.parse(init.body as string)
        estado.ronda = { ...estado.ronda, my_choice: choice }
        return json(estado.ronda)
      }

      if (url.endsWith('/rps')) return json(estado.ronda)
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
        <Rps />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('piedra, papel o tijera', () => {
  beforeEach(() => {
    document.title = 'Cartas de Reto'
  })

  it('ofrece elegir cuando no hay ronda activa', async () => {
    servidor(ronda())
    pintar()

    expect(await screen.findByRole('button', { name: 'Piedra' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Papel' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Tijera' })).toBeEnabled()
  })

  it('al elegir, espera a la otra persona sin revelar nada', async () => {
    servidor(ronda())
    pintar()

    await userEvent.click(await screen.findByRole('button', { name: 'Piedra' }))

    expect(await screen.findByText(/esperando a bea/i)).toBeInTheDocument()
  })

  it('avisa si la otra persona ya eligió', async () => {
    servidor(ronda({ partner_chose: true }))
    pintar()

    expect(await screen.findByText('bea ya eligió')).toBeInTheDocument()
  })

  it('revela ambas jugadas y el resultado cuando la ronda se resuelve', async () => {
    servidor(
      ronda({
        resolved: true,
        my_choice: 'tijera',
        partner_choice: 'piedra',
        result: 'perdi',
        resolved_at: '2026-09-18T10:00:00Z',
      }),
    )
    pintar()

    expect(await screen.findByText('Perdiste')).toBeInTheDocument()
    expect(screen.getByText(/Tú · Tijera/)).toBeInTheDocument()
    expect(screen.getByText(/bea · Piedra/)).toBeInTheDocument()
  })

  it('la revelación llega sola por sondeo, sin recargar', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    const estado = servidor(ronda({ my_choice: 'piedra' }))
    pintar()

    expect(await screen.findByText(/esperando a bea/i)).toBeInTheDocument()

    estado.ronda = ronda({
      resolved: true,
      my_choice: 'piedra',
      partner_choice: 'tijera',
      result: 'gane',
      resolved_at: '2026-09-18T10:00:00Z',
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300)
    })

    await waitFor(() => expect(screen.getByText('¡Ganaste!')).toBeInTheDocument())

    vi.useRealTimers()
  })

  it('deja jugar otra vez tras el resultado', async () => {
    const estado = servidor(
      ronda({
        resolved: true,
        my_choice: 'papel',
        partner_choice: 'papel',
        result: 'empate',
        resolved_at: '2026-09-18T10:00:00Z',
      }),
    )
    pintar()

    await screen.findByText('Empate')
    await userEvent.click(screen.getByRole('button', { name: 'Tijera' }))

    await waitFor(() => {
      const llamada = estado.llamadas.find(
        ([url, init]) => url.endsWith('/rps/choose') && init?.method === 'POST',
      )
      expect(llamada).toBeDefined()
    })
  })
})
