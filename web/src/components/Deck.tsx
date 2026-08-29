import { useEffect, useState } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { CardBack } from './PlayCard'

/** Cuántos dorsos forman la pila. Suficiente para dar volumen sin recargar. */
const CAPAS = 4

/** Posición final de cada capa: un abanico leve, como un mazo dejado a mano. */
const REPOSO = [
  { rotate: -5, x: -5, y: 3 },
  { rotate: 3, x: 3, y: 1 },
  { rotate: -1.5, x: -1, y: 0 },
  { rotate: 0, x: 0, y: 0 },
]

export type EstadoMazo = 'reposo' | 'barajando'

const variantes: Variants = {
  // Entrada: las cartas caen desde arriba, desperdigadas, y se asientan.
  entrada: (i: number) => ({
    rotate: [i % 2 ? 22 : -22, REPOSO[i].rotate],
    x: [i % 2 ? 90 : -90, REPOSO[i].x],
    y: [-70, REPOSO[i].y],
    opacity: [0, 1],
    transition: { duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
  }),

  // Barajada: riffle corto, las capas se abren a lados opuestos y vuelven.
  barajando: (i: number) => ({
    x: [REPOSO[i].x, i % 2 ? 46 : -46, i % 2 ? -22 : 22, REPOSO[i].x],
    rotate: [REPOSO[i].rotate, i % 2 ? 13 : -13, i % 2 ? -6 : 6, REPOSO[i].rotate],
    y: [REPOSO[i].y, -10, 4, REPOSO[i].y],
    transition: { duration: 0.55, delay: i * 0.035, ease: 'easeInOut' },
  }),

  reposo: (i: number) => ({
    rotate: REPOSO[i].rotate,
    x: REPOSO[i].x,
    y: REPOSO[i].y,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  }),
}

interface Props {
  estado: EstadoMazo
  /** Se dispara al terminar la barajada de entrada */
  onEntradaLista?: () => void
}

/**
 * La pila de cartas boca abajo. Baraja al aparecer y cada vez que `estado`
 * pasa a 'barajando', para que robar no sea un cambio de pantalla seco sino
 * un gesto reconocible de juego de mesa.
 */
export function Deck({ estado, onEntradaLista }: Props) {
  const menosMovimiento = useReducedMotion()
  const [entrando, setEntrando] = useState(!menosMovimiento)

  useEffect(() => {
    if (!entrando) return

    // Duración de la entrada más el escalonado de la última capa.
    const t = setTimeout(
      () => {
        setEntrando(false)
        onEntradaLista?.()
      },
      600 + CAPAS * 70,
    )

    return () => clearTimeout(t)
  }, [entrando, onEntradaLista])

  // Con movimiento reducido la pila aparece ya montada: misma información,
  // sin el viaje.
  const animacion = menosMovimiento
    ? 'reposo'
    : entrando
      ? 'entrada'
      : estado === 'barajando'
        ? 'barajando'
        : 'reposo'

  return (
    <div className="relative w-60" aria-hidden="true">
      {/* La primera capa ocupa el flujo y da altura al contenedor. */}
      <div className="invisible">
        <CardBack />
      </div>

      {Array.from({ length: CAPAS }, (_, i) => (
        <motion.div
          key={i}
          custom={i}
          variants={variantes}
          animate={animacion}
          initial={menosMovimiento ? 'reposo' : { opacity: 0 }}
          className="absolute inset-0"
          style={{ zIndex: i, opacity: i === CAPAS - 1 ? 1 : 0.55 }}
        >
          <CardBack />
        </motion.div>
      ))}
    </div>
  )
}
