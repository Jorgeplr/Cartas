import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, AUTH_EXPIRED, clearToken, getToken, setToken } from '../lib/api'
import type { Session } from '../lib/types'

interface AuthValue {
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setSession(null)
      setLoading(false)
      return
    }

    try {
      setSession(await api.get<Session>('/me'))
    } catch {
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // La regla asume que el estado cambia de forma sincrona, pero aqui se
    // actualiza despues del await del fetch. Pedir datos a la API al montar
    // es sincronizar con un sistema externo, que es justo para lo que sirve
    // un efecto.
    // oxlint-disable-next-line react/set-state-in-effect
    void refresh()
  }, [refresh])

  useEffect(() => {
    const alCaducar = () => setSession(null)
    window.addEventListener(AUTH_EXPIRED, alCaducar)
    return () => window.removeEventListener(AUTH_EXPIRED, alCaducar)
  }, [])

  const autenticar = useCallback(
    async (ruta: string, email: string, password: string) => {
      const { token } = await api.post<{ token: string }>(ruta, { email, password })
      setToken(token)
      setSession(await api.get<Session>('/me'))
    },
    [],
  )

  const value = useMemo<AuthValue>(
    () => ({
      session,
      loading,
      login: (email, password) => autenticar('/auth/login', email, password),
      signup: (email, password) => autenticar('/auth/signup', email, password),
      logout: () => {
        clearToken()
        setSession(null)
      },
      refresh,
    }),
    [session, loading, autenticar, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return value
}
