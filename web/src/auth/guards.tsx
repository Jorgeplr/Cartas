import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

/** Mientras se resuelve GET /me no podemos decidir nada: redirigir aquí
 *  expulsaría al login a quien solo ha recargado la página. */
function Cargando() {
  return (
    <div
      className="grid min-h-dvh place-items-center text-tinta-suave"
      role="status"
      aria-live="polite"
    >
      <span className="font-display text-lg">Cargando…</span>
    </div>
  )
}

export function RequireAnon() {
  const { session, loading } = useAuth()
  if (loading) return <Cargando />
  return session ? <Navigate to="/" replace /> : <Outlet />
}

/** Al revés: con pareja hecha, la pantalla de emparejar ya no pinta nada.
 *  Sin esto, emparejarse con éxito deja al usuario mirando su propio código
 *  con el botón girando para siempre. */
export function RequireNoPairing() {
  const { session, loading } = useAuth()
  if (loading) return <Cargando />
  if (!session) return <Navigate to="/login" replace />
  return session.pairing ? <Navigate to="/" replace /> : <Outlet />
}

/** Sin pareja no hay baraja, así que la mesa y el mazo no tienen sentido. */
export function RequirePairing() {
  const { session, loading } = useAuth()
  if (loading) return <Cargando />
  if (!session) return <Navigate to="/login" replace />
  return session.pairing ? <Outlet /> : <Navigate to="/pair" replace />
}
