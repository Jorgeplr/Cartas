const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
const TOKEN_KEY = 'cartas.token'

/** Se emite cuando la API rechaza el token. AuthContext lo escucha y cierra sesión. */
export const AUTH_EXPIRED = 'auth:expired'

export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()

  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    // Un token caducado no es un error que la pantalla deba resolver: se cierra
    // la sesión aquí y el contexto reacciona, sin que el cliente HTTP dependa
    // del router.
    if (response.status === 401) {
      clearToken()
      window.dispatchEvent(new Event(AUTH_EXPIRED))
    }

    throw new ApiError(
      payload?.error?.code ?? 'error_desconocido',
      payload?.error?.message ?? 'Algo salió mal. Inténtalo otra vez.',
      response.status,
    )
  }

  return payload as T
}

export const api = {
  get: <T,>(path: string) => request<T>('GET', path),
  post: <T,>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T,>(path: string, body: unknown) => request<T>('PATCH', path, body),
  del: <T,>(path: string) => request<T>('DELETE', path),
}
