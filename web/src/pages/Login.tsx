import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { ApiError } from '../lib/api'

interface Props {
  modo: 'login' | 'signup'
}

const TEXTOS = {
  login: {
    titulo: 'Vuelve a la mesa',
    accion: 'Entrar',
    pie: '¿Todavía no tienes cuenta?',
    enlace: 'Crear una',
    ruta: '/signup',
  },
  signup: {
    titulo: 'Crea tu cuenta',
    accion: 'Crear cuenta',
    pie: '¿Ya tienes cuenta?',
    enlace: 'Entrar',
    ruta: '/login',
  },
} as const

/** Login y registro comparten pantalla: son el mismo formulario de dos campos
 *  y duplicarlo solo crearía dos sitios donde arreglar el mismo error. */
export function AuthPage({ modo }: Props) {
  const { login, signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const textos = TEXTOS[modo]

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)

    try {
      await (modo === 'login' ? login(email, password) : signup(email, password))
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'No pudimos conectar con el servidor.',
      )
      setEnviando(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-fucsia">
            Cartas de Reto
          </p>
          <h1 className="mt-2 text-3xl text-tinta">{textos.titulo}</h1>
        </div>

        <form
          onSubmit={enviar}
          noValidate
          className="flex flex-col gap-5 rounded-2xl border border-borde bg-superficie/80 p-6 backdrop-blur-sm"
        >
          <Field
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Field
            label="Contraseña"
            type="password"
            autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            ayuda={modo === 'signup' ? 'Mínimo 8 caracteres.' : undefined}
          />

          {error && (
            <p role="alert" className="text-sm font-semibold text-error">
              {error}
            </p>
          )}

          <Button type="submit" cargando={enviando} className="w-full">
            {textos.accion}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-tinta-suave">
          {textos.pie}{' '}
          <Link to={textos.ruta} className="font-bold text-lima underline-offset-4 hover:underline">
            {textos.enlace}
          </Link>
        </p>
      </div>
    </main>
  )
}
