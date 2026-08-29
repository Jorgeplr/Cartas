import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function Explota(): never {
  throw new Error('drawn_by es null')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React imprime el error por consola aunque lo capturemos; silenciarlo
    // mantiene legible la salida de los tests.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deja la pantalla usable en vez de en blanco cuando algo revienta', () => {
    render(
      <ErrorBoundary>
        <Explota />
      </ErrorBoundary>,
    )

    expect(screen.getByText(/se nos cayó una carta/i)).toBeInTheDocument()
    expect(screen.getByText('drawn_by es null')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recargar/i })).toBeInTheDocument()
  })

  it('no se interpone cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <p>la mesa</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('la mesa')).toBeInTheDocument()
    expect(screen.queryByText(/se nos cayó una carta/i)).not.toBeInTheDocument()
  })
})
