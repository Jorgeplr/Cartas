import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import { RequireAnon, RequireNoPairing, RequirePairing } from './guards'
import { setToken } from '../lib/api'
import type { Session } from '../lib/types'

const USUARIO = {
  id: 1,
  email: 'ana@x.com',
  display_name: 'ana',
  invite_code: 'ABC234',
}

function simularMe(session: Session | null) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(session), {
        status: session ? 200 : 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
}

function pintar(session: Session | null) {
  if (session) setToken('token-valido')
  simularMe(session)

  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route element={<RequirePairing />}>
            <Route path="/" element={<div>mesa</div>} />
          </Route>
          <Route element={<RequireNoPairing />}>
            <Route path="/pair" element={<div>emparejar</div>} />
          </Route>
          <Route element={<RequireAnon />}>
            <Route path="/login" element={<div>login</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('guards de rutas', () => {
  it('manda al login cuando no hay sesión', async () => {
    pintar(null)
    expect(await screen.findByText('login')).toBeInTheDocument()
  })

  it('manda a emparejar cuando hay sesión pero no pareja', async () => {
    pintar({ user: USUARIO, pairing: null, partner: null })
    expect(await screen.findByText('emparejar')).toBeInTheDocument()
  })

  it('deja entrar a la mesa cuando hay sesión y pareja', async () => {
    pintar({
      user: USUARIO,
      pairing: { id: 1, current_turn_user_id: 1 },
      partner: { id: 2, display_name: 'bea' },
    })

    expect(await screen.findByText('mesa')).toBeInTheDocument()
  })

  it('saca de emparejar a quien ya tiene pareja', async () => {
    setToken('token-valido')
    simularMe({
      user: USUARIO,
      pairing: { id: 1, current_turn_user_id: 1 },
      partner: { id: 2, display_name: 'bea' },
    })

    // Entrando directamente por /pair: es donde se queda el usuario justo
    // después de emparejarse, y sin este guard el botón gira para siempre.
    render(
      <MemoryRouter initialEntries={['/pair']}>
        <AuthProvider>
          <Routes>
            <Route element={<RequireNoPairing />}>
              <Route path="/pair" element={<div>emparejar</div>} />
            </Route>
            <Route element={<RequirePairing />}>
              <Route path="/" element={<div>mesa</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('mesa')).toBeInTheDocument()
    expect(screen.queryByText('emparejar')).not.toBeInTheDocument()
  })

  it('no redirige mientras la sesión aún se está resolviendo', async () => {
    setToken('token-valido')
    // Una promesa que nunca resuelve simula la petición a /me en vuelo:
    // durante ese rato nadie debe acabar en el login.
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route element={<RequirePairing />}>
              <Route path="/" element={<div>mesa</div>} />
            </Route>
            <Route element={<RequireAnon />}>
              <Route path="/login" element={<div>login</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(screen.queryByText('login')).not.toBeInTheDocument()
  })
})
