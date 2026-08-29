import { describe, expect, it, vi } from 'vitest'
import { api, ApiError, AUTH_EXPIRED, getToken, setToken } from './api'

function respuesta(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('cliente API', () => {
  it('adjunta el token Bearer cuando hay sesión', async () => {
    setToken('abc')
    const fetchMock = vi.fn().mockResolvedValue(respuesta({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await api.get('/cards')

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer abc')
  })

  it('no manda cabecera Authorization si no hay sesión', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await api.get('/cards')

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })

  it('lanza ApiError con el código del servidor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        respuesta({ error: { code: 'not_your_turn', message: 'No es tu turno' } }, 403),
      ),
    )

    await expect(api.post('/draw')).rejects.toMatchObject({
      code: 'not_your_turn',
      message: 'No es tu turno',
      status: 403,
    })
  })

  it('borra el token y avisa de sesión caducada ante un 401', async () => {
    setToken('caducado')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        respuesta({ error: { code: 'unauthorized', message: 'Sesión inválida' } }, 401),
      ),
    )

    const aviso = vi.fn()
    window.addEventListener(AUTH_EXPIRED, aviso)

    await expect(api.get('/cards')).rejects.toBeInstanceOf(ApiError)

    expect(getToken()).toBeNull()
    expect(aviso).toHaveBeenCalledOnce()
    window.removeEventListener(AUTH_EXPIRED, aviso)
  })

  it('devuelve undefined en un 204 sin intentar parsear el cuerpo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    await expect(api.del('/cards/1')).resolves.toBeUndefined()
  })
})
