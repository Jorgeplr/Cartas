import { BrowserRouter, Link, NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { RequireAnon, RequireNoPairing, RequirePairing } from './auth/guards'
import { ErrorBoundary } from './components/ErrorBoundary'
import { IconoSalir } from './components/Icon'
import { AuthPage } from './pages/Login'
import { Cards } from './pages/Cards'
import { Pair } from './pages/Pair'
import { Table } from './pages/Table'

function Layout() {
  const { session, logout } = useAuth()

  const enlace = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center rounded-lg px-3 font-display text-sm font-semibold transition-colors duration-200 ${
      isActive ? 'bg-fucsia/15 text-fucsia' : 'text-tinta-suave hover:text-tinta'
    }`

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-borde bg-noche/85 backdrop-blur-md">
        <nav className="mx-auto flex w-full max-w-5xl items-center gap-2 px-5 py-2">
          <Link
            to="/"
            className="mr-auto truncate font-display text-sm font-semibold tracking-tight text-fucsia sm:text-base"
          >
            Cartas de Reto
          </Link>

          <NavLink to="/" end className={enlace}>
            Mesa
          </NavLink>
          <NavLink to="/cards" className={enlace}>
            Mazo
          </NavLink>

          <button
            onClick={logout}
            aria-label={`Cerrar la sesión de ${session?.user.display_name ?? ''}`}
            className="grid size-11 place-items-center rounded-lg text-tinta-suave hover:text-error"
          >
            <IconoSalir className="size-5" aria-hidden="true" />
          </button>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
            <Route element={<RequireAnon />}>
              <Route path="/login" element={<AuthPage modo="login" />} />
              <Route path="/signup" element={<AuthPage modo="signup" />} />
            </Route>

            <Route element={<RequireNoPairing />}>
              <Route path="/pair" element={<Pair />} />
            </Route>

            <Route element={<RequirePairing />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Table />} />
                <Route path="/cards" element={<Cards />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
