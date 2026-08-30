import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SugerenciasPicker } from './SugerenciasPicker'
import { SUGERENCIAS, sugerenciaAlAzar } from '../lib/sugerencias'

describe('sugerenciaAlAzar', () => {
  it('evita proponer una que ya está en el mazo', () => {
    const catalogo = SUGERENCIAS.picante
    // Todas usadas menos una: solo puede salir esa.
    const usadas = catalogo.slice(1).map((s) => s.title)

    for (let i = 0; i < 20; i++) {
      expect(sugerenciaAlAzar('picante', usadas).title).toBe(catalogo[0].title)
    }
  })

  it('si se agotan todas, repite en vez de quedarse sin nada', () => {
    const todas = SUGERENCIAS.suave.map((s) => s.title)
    expect(sugerenciaAlAzar('suave', todas)).toBeDefined()
  })
})

describe('SugerenciasPicker', () => {
  it('ofrece los tres niveles de picante', () => {
    render(<SugerenciasPicker usadas={[]} onElegir={vi.fn()} />)

    expect(screen.getByRole('button', { name: /suaves/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /picantes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /atrevidas/i })).toBeInTheDocument()
  })

  it('propone un reto del nivel elegido', async () => {
    render(<SugerenciasPicker usadas={[]} onElegir={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /atrevidas/i }))

    const titulos = SUGERENCIAS.atrevida.map((s) => s.title)
    const propuesto = titulos.find((t) => screen.queryByText(t))
    expect(propuesto).toBeDefined()
    expect(screen.getByRole('button', { name: /usar esta/i })).toBeInTheDocument()
  })

  it('entrega la sugerencia completa al aceptarla', async () => {
    const onElegir = vi.fn()
    render(<SugerenciasPicker usadas={[]} onElegir={onElegir} />)

    await userEvent.click(screen.getByRole('button', { name: /suaves/i }))
    await userEvent.click(screen.getByRole('button', { name: /usar esta/i }))

    expect(onElegir).toHaveBeenCalledOnce()
    const entregada = onElegir.mock.calls[0][0]
    expect(SUGERENCIAS.suave).toContainEqual(entregada)
    expect(entregada.challenge.length).toBeGreaterThan(10)
  })

  it('no propone nada hasta que eliges un nivel', () => {
    render(<SugerenciasPicker usadas={[]} onElegir={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /usar esta/i })).not.toBeInTheDocument()
  })
})

describe('catálogo', () => {
  it('todas las sugerencias caben en los límites de la carta', () => {
    for (const lista of Object.values(SUGERENCIAS)) {
      for (const s of lista) {
        expect(s.title.length, `título "${s.title}"`).toBeLessThanOrEqual(60)
        expect(s.challenge.length, `reto de "${s.title}"`).toBeLessThanOrEqual(280)
      }
    }
  })

  it('no hay títulos repetidos entre niveles', () => {
    const titulos = Object.values(SUGERENCIAS).flatMap((l) => l.map((s) => s.title))
    expect(new Set(titulos).size).toBe(titulos.length)
  })
})
