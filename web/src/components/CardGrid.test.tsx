import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardTile } from './CardGrid'
import type { Card } from '../lib/types'

function carta(overrides: Partial<Card> = {}): Card {
  return {
    id: 1,
    title: 'Ajena',
    challenge: null,
    theme: 'picante',
    mine: false,
    drawn: false,
    hidden: true,
    banned_by_me: false,
    created_at: '2026-09-19T00:00:00Z',
    ...overrides,
  }
}

describe('CardTile · baneo', () => {
  it('ofrece banear una carta ajena sin jugar', async () => {
    const onBan = vi.fn()
    render(<CardTile carta={carta()} indice={0} onBan={onBan} quedanBaneos={4} />)

    await userEvent.click(screen.getByRole('button', { name: /banear/i }))
    expect(onBan).toHaveBeenCalledWith(carta())
  })

  it('muestra "Baneada" y deja quitarla cuando ya está baneada', async () => {
    const onUnban = vi.fn()
    render(
      <CardTile
        carta={carta({ banned_by_me: true })}
        indice={0}
        onUnban={onUnban}
      />,
    )

    const boton = screen.getByRole('button', { name: /baneada/i })
    await userEvent.click(boton)
    expect(onUnban).toHaveBeenCalled()
  })

  it('deshabilita banear sin baneos disponibles', () => {
    render(<CardTile carta={carta()} indice={0} onBan={vi.fn()} quedanBaneos={0} />)
    expect(screen.getByRole('button', { name: /banear/i })).toBeDisabled()
  })

  it('no ofrece banear tus propias cartas', () => {
    render(<CardTile carta={carta({ mine: true })} indice={0} onBan={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /banear/i })).not.toBeInTheDocument()
  })

  it('no ofrece banear una carta ya jugada', () => {
    render(<CardTile carta={carta({ drawn: true })} indice={0} onBan={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /banear/i })).not.toBeInTheDocument()
  })

  it('sin onBan ni onUnban no aparece ningún control de baneo', () => {
    render(<CardTile carta={carta()} indice={0} />)
    expect(screen.queryByRole('button', { name: /banear/i })).not.toBeInTheDocument()
  })
})
