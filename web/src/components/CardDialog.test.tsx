import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardDialog } from './CardDialog'
import type { Card } from '../lib/types'

const RETO_LARGO =
  'Describe con todo detalle la escena que se te viene a la cabeza cuando piensas ' +
  'en los dos a solas, sin saltarte nada por vergüenza y sin abreviar el final.'

function carta(overrides: Partial<Card> = {}): Card {
  return {
    id: 1,
    title: 'La escena',
    challenge: RETO_LARGO,
    difficulty: 'dificil',
    mine: true,
    drawn: false,
    hidden: false,
    created_at: '2026-08-30T00:00:00Z',
    ...overrides,
  }
}

describe('CardDialog', () => {
  it('muestra el reto entero, sin recortar', () => {
    render(<CardDialog carta={carta()} onClose={vi.fn()} />)
    expect(screen.getByText(RETO_LARGO)).toBeInTheDocument()
  })

  it('abre también las cartas ya jugadas, que no tienen botón de editar', () => {
    // Este era el agujero: en la rejilla una carta jugada no se podia abrir
    // por ningun sitio, asi que su texto quedaba recortado para siempre.
    render(<CardDialog carta={carta({ drawn: true })} onClose={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText(RETO_LARGO)).toBeInTheDocument()
    expect(screen.getByText(/ya jugada/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
  })

  it('se cierra con Escape', async () => {
    const onClose = vi.fn()
    render(<CardDialog carta={carta()} onClose={onClose} />)

    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('se cierra al pulsar fuera, pero no al pulsar la carta', async () => {
    const onClose = vi.fn()
    render(<CardDialog carta={carta()} onClose={onClose} />)

    await userEvent.click(screen.getByText(RETO_LARGO))
    expect(onClose).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('dialog').parentElement!)
    expect(onClose).toHaveBeenCalled()
  })

  it('ofrece editar y borrar en tus cartas aún no jugadas', () => {
    render(<CardDialog carta={carta()} onClose={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /borrar/i })).toBeInTheDocument()
  })

  it('no ofrece editar una carta de la otra persona', () => {
    render(
      <CardDialog carta={carta({ mine: false })} onClose={vi.fn()} onEdit={vi.fn()} />,
    )
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
  })
})
