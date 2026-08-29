import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Una excepción en cualquier componente dejaba la pantalla en negro sin
 * explicación. Aquí se corta la caída: se enseña qué pasó y cómo salir, y el
 * error sigue llegando a la consola para poder depurarlo.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Fallo en la interfaz:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <main className="grid min-h-dvh place-items-center px-5 py-12">
        <div className="w-full max-w-md rounded-2xl border border-error/40 bg-superficie p-6 text-center">
          <h1 className="font-display text-2xl text-tinta">Se nos cayó una carta</h1>

          <p className="mt-2 text-tinta-suave">
            Algo falló al pintar esta pantalla. Tus datos están a salvo: nada de lo que
            escribiste se ha perdido.
          </p>

          <p className="mt-4 rounded-lg border border-borde bg-noche/60 p-3 text-left text-xs text-tinta-suave">
            {error.message}
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Recargar
            </Button>

            <Button
              variante="fantasma"
              onClick={() => this.setState({ error: null })}
              className="w-full"
            >
              Intentar seguir
            </Button>
          </div>
        </div>
      </main>
    )
  }
}
