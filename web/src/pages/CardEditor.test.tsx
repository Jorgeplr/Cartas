import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardEditor, MAX_RETO } from './CardEditor'

describe('CardEditor', () => {
  it('refleja en la vista previa lo que se escribe', async () => {
    render(<CardEditor onSave={vi.fn()} />)

    await userEvent.type(screen.getByLabelText(/^Título/), 'Karaoke')

    expect(screen.getByTestId('preview')).toHaveTextContent('Karaoke')
  })

  it('impide guardar mientras falte el título o el reto', async () => {
    render(<CardEditor onSave={vi.fn()} />)

    const guardar = screen.getByRole('button', { name: /añadir al mazo/i })
    expect(guardar).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/^Título/), 'T')
    expect(guardar).toBeDisabled()

    await userEvent.type(screen.getByLabelText('El reto'), 'Un reto')
    expect(guardar).toBeEnabled()
  })

  it(`impide guardar si el reto supera ${MAX_RETO} caracteres`, async () => {
    render(<CardEditor onSave={vi.fn()} />)

    await userEvent.type(screen.getByLabelText(/^Título/), 'T')
    fireEvent.change(screen.getByLabelText('El reto'), {
      target: { value: 'x'.repeat(MAX_RETO + 1) },
    })

    expect(screen.getByRole('button', { name: /añadir al mazo/i })).toBeDisabled()
  })

  it('envía el borrador con los espacios recortados', async () => {
    const onSave = vi.fn()
    render(<CardEditor onSave={onSave} />)

    await userEvent.type(screen.getByLabelText(/^Título/), '  Baile  ')
    await userEvent.type(screen.getByLabelText('El reto'), '  Baila 30s  ')
    await userEvent.click(screen.getByRole('button', { name: /añadir al mazo/i }))

    expect(onSave).toHaveBeenCalledWith({
      title: 'Baile',
      challenge: 'Baila 30s',
      difficulty: 'medio',
    })
  })

  it('cambia la dificultad desde el segmented control', async () => {
    const onSave = vi.fn()
    render(<CardEditor onSave={onSave} />)

    await userEvent.type(screen.getByLabelText(/^Título/), 'T')
    await userEvent.type(screen.getByLabelText('El reto'), 'C')
    await userEvent.click(screen.getByRole('radio', { name: /difícil/i }))
    await userEvent.click(screen.getByRole('button', { name: /añadir al mazo/i }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ difficulty: 'dificil' }))
  })

  it('precarga los valores cuando edita una carta existente', () => {
    render(
      <CardEditor
        carta={{
          id: 1,
          title: 'Existente',
          challenge: 'Su reto',
          difficulty: 'facil',
          mine: true,
          drawn: false,
          hidden: false,
          created_at: '2026-08-29T00:00:00Z',
        }}
        onSave={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/^Título/)).toHaveValue('Existente')
    expect(screen.getByLabelText('El reto')).toHaveValue('Su reto')
    expect(screen.getByRole('radio', { name: /fácil/i })).toHaveAttribute('aria-checked', 'true')
  })
})
