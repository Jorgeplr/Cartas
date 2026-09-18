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
    is_my_wildcard: false,
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

describe('CardTile · comodín', () => {
  const propia = (overrides: Partial<Card> = {}) => carta({ mine: true, hidden: false, ...overrides })

  it('ofrece elegir como comodín una carta propia sin jugar', async () => {
    const onSetWildcard = vi.fn()
    render(<CardTile carta={propia()} indice={0} onSetWildcard={onSetWildcard} />)

    await userEvent.click(screen.getByRole('button', { name: /usar como comodín/i }))
    expect(onSetWildcard).toHaveBeenCalledWith(propia())
  })

  it('muestra "Tu comodín" y deja quitarlo cuando ya está elegida', async () => {
    const onClearWildcard = vi.fn()
    render(
      <CardTile
        carta={propia({ is_my_wildcard: true })}
        indice={0}
        onClearWildcard={onClearWildcard}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /tu comodín/i }))
    expect(onClearWildcard).toHaveBeenCalled()
  })

  it('deshabilita elegir otro comodín si ya jugaste el de esta partida', () => {
    render(
      <CardTile
        carta={propia()}
        indice={0}
        onSetWildcard={vi.fn()}
        comodinJugado
      />,
    )
    expect(screen.getByRole('button', { name: /usar como comodín/i })).toBeDisabled()
  })

  it('no ofrece comodín en cartas ajenas', () => {
    render(<CardTile carta={carta({ mine: false })} indice={0} onSetWildcard={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /comodín/i })).not.toBeInTheDocument()
  })

  it('no ofrece comodín en una carta ya jugada', () => {
    render(<CardTile carta={propia({ drawn: true })} indice={0} onSetWildcard={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /comodín/i })).not.toBeInTheDocument()
  })
})
