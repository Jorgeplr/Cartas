import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../auth/AuthContext'
import { setToken } from '../lib/api'
import { ParejaMenu } from './ParejaMenu'

const YO = { id: 1, email: 'ana@x.com', display_name: 'ana', invite_code: 'ABC234' }
const PAREJA = { id: 2, display_name: 'bea' }

function sesion(overrides: { partner?: typeof PAREJA | null } = {}) {
  return {
    user: YO,
    pairing: { id: 1, current_turn_user_id: 1, active_themes: ['suave', 'picante', 'atrevida'] },
    partner: overrides.partner === undefined ? PAREJA : overrides.partner,
  }
}

function json(body: unknown, status = 200) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function servidor(sesionInicial: ReturnType<typeof sesion>) {
  const estado = { sesion: sesionInicial, llamadas: [] as [string, RequestInit | undefined][] }

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      estado.llamadas.push([url, init])
      if (url.endsWith('/me')) return json(estado.sesion)
      if (url.endsWith('/pairing') && init?.method === 'DELETE') {
        // El backend real destruye la pareja: el siguiente GET /me ya no trae partner.
        estado.sesion = sesion({ partner: null })
        return json(undefined, 204)
      }
      return json({})
    }),
  )

  return estado
}

function pintar() {
  setToken('token-valido')

  render(
    <AuthProvider>
      <ParejaMenu />
    </AuthProvider>,
  )
}

describe('menú de pareja', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('no muestra nada sin pareja emparejada', async () => {
    servidor(sesion({ partner: null }))
    pintar()

    await waitFor(() => expect(screen.queryByRole('button')).not.toBeInTheDocument())
  })

  it('abre el menú con el nombre de la pareja y la opción de terminar', async () => {
    servidor(sesion())
    pintar()

    await userEvent.click(await screen.findByRole('button', { name: /bea/ }))

    expect(screen.getByText(/Emparejado con/)).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /terminar emparejamiento/i })).toBeInTheDocument()
  })

  it('pide confirmación y no hace nada si se cancela', async () => {
    const estado = servidor(sesion())
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    pintar()

    await userEvent.click(await screen.findByRole('button', { name: /bea/ }))
    await userEvent.click(screen.getByRole('menuitem', { name: /terminar emparejamiento/i }))

    expect(window.confirm).toHaveBeenCalled()
    expect(
      estado.llamadas.find(([url, init]) => url.endsWith('/pairing') && init?.method === 'DELETE'),
    ).toBeUndefined()
  })

  it('termina el emparejamiento al confirmar y refresca la sesión', async () => {
    const estado = servidor(sesion())
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    pintar()

    await userEvent.click(await screen.findByRole('button', { name: /bea/ }))
    await userEvent.click(screen.getByRole('menuitem', { name: /terminar emparejamiento/i }))

    // Tras terminar, /me deja de traer pareja: el menú desaparece solo.
    await waitFor(() => expect(screen.queryByRole('button')).not.toBeInTheDocument())

    expect(
      estado.llamadas.find(([url, init]) => url.endsWith('/pairing') && init?.method === 'DELETE'),
    ).toBeDefined()
  })

  it('se cierra al pulsar Escape', async () => {
    servidor(sesion())
    pintar()

    await userEvent.click(await screen.findByRole('button', { name: /bea/ }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })
})
