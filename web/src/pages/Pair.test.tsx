import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthContext'
import { setToken } from '../lib/api'
import { Pair } from './Pair'

const SESION = {
  user: { id: 1, email: 'ana@x.com', display_name: 'ana', invite_code: 'ABC234' },
  pairing: null,
  partner: null,
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Responde a cada endpoint según la ruta, no según el orden de llamada. */
function servidor(cards: unknown[] = []) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    void init
    if (url.endsWith('/me')) return json(SESION)
    if (url.endsWith('/cards')) return json({ cards })
    return json({})
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function pintar() {
  setToken('token-valido')

  render(
    <MemoryRouter>
      <AuthProvider>
        <Pair />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('pantalla de emparejamiento', () => {
  it('muestra tu código de invitación', async () => {
    servidor()
    pintar()

    expect(await screen.findByText('ABC234')).toBeInTheDocument()
  })

  it('deja escribir cartas aunque todavía no haya pareja', async () => {
    const fetchMock = servidor()
    pintar()

    await userEvent.click(await screen.findByRole('button', { name: /escribir la primera/i }))
    await userEvent.type(screen.getByLabelText(/^Título/), 'Karaoke')
    await userEvent.type(screen.getByLabelText('El reto'), 'Canta el estribillo')
    await userEvent.click(screen.getByRole('button', { name: /añadir al mazo/i }))

    const creacion = fetchMock.mock.calls.find(
      ([url, init]) => url.endsWith('/cards') && init?.method === 'POST',
    )

    expect(creacion).toBeDefined()
    expect(JSON.parse(String(creacion?.[1]?.body))).toEqual({
      title: 'Karaoke',
      challenge: 'Canta el estribillo',
      difficulty: 'medio',
    })
  })

  it('lista las cartas ya escritas', async () => {
    servidor([
      {
        id: 1,
        title: 'Ya escrita',
        challenge: 'Su reto',
        difficulty: 'facil',
        mine: true,
        drawn: false,
        hidden: false,
        created_at: '2026-08-29T00:00:00Z',
      },
    ])
    pintar()

    expect(await screen.findByText('Ya escrita')).toBeInTheDocument()
    expect(screen.getByText(/Tus cartas/)).toHaveTextContent('(1)')
  })

  it('mantiene Emparejar deshabilitado hasta tener los 6 caracteres', async () => {
    servidor()
    pintar()

    const boton = await screen.findByRole('button', { name: /emparejar/i })
    expect(boton).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/tengo el código/i), 'abc23')
    expect(boton).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/tengo el código/i), '4')
    expect(boton).toBeEnabled()
  })
})
