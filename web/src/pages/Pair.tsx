import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { IconoCheck, IconoCopiar, IconoSalir } from '../components/Icon'
import { api, ApiError } from '../lib/api'

export function Pair() {
  const { session, refresh, logout } = useAuth()
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const miCodigo = session?.user.invite_code ?? ''

  async function copiar() {
    try {
      await navigator.clipboard.writeText(miCodigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setError('Tu navegador no nos deja copiar. Apúntalo a mano.')
    }
  }

  async function emparejar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)

    try {
      await api.post('/pairing/join', { code: codigo })
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos conectar con el servidor.')
      setEnviando(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-8 px-5 py-12">
      <header className="text-center">
        <h1 className="text-3xl text-tinta">Necesitas a alguien</h1>
        <p className="mt-2 text-tinta-suave">
          La baraja se llena entre dos: cada quien escribe los retos que la otra persona
          tendrá que cumplir.
        </p>
      </header>

      <section className="rounded-2xl border border-fucsia/40 bg-superficie p-6 text-center shadow-neon">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-tinta-suave">
          Tu código
        </h2>

        <p className="my-4 font-display text-5xl font-semibold tracking-[0.18em] text-fucsia tabular-nums drop-shadow-[0_0_18px_var(--color-fucsia)]">
          {miCodigo}
        </p>

        <Button variante="fantasma" onClick={copiar} className="w-full">
          {copiado ? <IconoCheck className="size-5" /> : <IconoCopiar className="size-5" />}
          {copiado ? 'Copiado' : 'Copiar código'}
        </Button>

        <p className="mt-3 text-sm text-tinta-suave">Pásaselo a la otra persona.</p>
      </section>

      <div className="flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-borde" />
        <span className="font-display text-sm uppercase tracking-widest text-tinta-suave">o</span>
        <span className="h-px flex-1 bg-borde" />
      </div>

      <form
        onSubmit={emparejar}
        className="flex flex-col gap-4 rounded-2xl border border-borde bg-superficie p-6"
      >
        <label htmlFor="codigo-pareja" className="text-sm font-bold text-tinta">
          Tengo el código de alguien
        </label>

        <input
          id="codigo-pareja"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="7KQ2M9"
          maxLength={6}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-describedby={error ? 'error-pareja' : undefined}
          className="w-full rounded-xl border border-borde bg-superficie-alta px-4 py-4 text-center font-display text-3xl tracking-[0.25em] text-tinta uppercase tabular-nums placeholder:text-tinta-suave/40 focus:border-lima"
        />

        {error && (
          <p id="error-pareja" role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variante="lima"
          cargando={enviando}
          disabled={codigo.length !== 6}
          className="w-full"
        >
          Emparejar
        </Button>
      </form>

      <button
        onClick={logout}
        className="mx-auto inline-flex min-h-11 items-center gap-2 px-4 text-sm text-tinta-suave hover:text-tinta"
      >
        <IconoSalir className="size-4" aria-hidden="true" />
        Cerrar sesión
      </button>
    </main>
  )
}
