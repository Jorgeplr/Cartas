import type { Difficulty } from './types'

export type Nivel = 'suave' | 'picante' | 'atrevida'

export interface Sugerencia {
  title: string
  challenge: string
  difficulty: Difficulty
}

export const NIVELES: Nivel[] = ['suave', 'picante', 'atrevida']

export const ETIQUETA_NIVEL: Record<Nivel, string> = {
  suave: 'Suaves',
  picante: 'Picantes',
  atrevida: 'Atrevidas',
}

export const DESCRIPCION_NIVEL: Record<Nivel, string> = {
  suave: 'Para romper el hielo',
  picante: 'Sube la temperatura',
  atrevida: 'Sin red',
}

/**
 * Catálogo de arranque. No pretende ser la baraja: son chispas para cuando te
 * quedas en blanco delante del formulario, que es donde muere la mayoría de
 * mazos vacíos.
 */
export const SUGERENCIAS: Record<Nivel, Sugerencia[]> = {
  suave: [
    {
      title: 'Karaoke',
      challenge: 'Canta el estribillo de la última canción que escuchaste, de pie.',
      difficulty: 'facil',
    },
    {
      title: 'Imitación',
      challenge: 'Imita a alguien que los dos conozcáis hasta que adivinen quién es.',
      difficulty: 'facil',
    },
    {
      title: 'Confesión de adolescente',
      challenge: 'Cuenta la anécdota más vergonzosa de tu adolescencia, sin adornarla.',
      difficulty: 'facil',
    },
    {
      title: 'Acento prestado',
      challenge: 'Habla con acento extranjero hasta que salga la siguiente carta.',
      difficulty: 'facil',
    },
    {
      title: 'Retrato exprés',
      challenge: 'Dibuja a la otra persona en 30 segundos y enséñale el resultado.',
      difficulty: 'facil',
    },
    {
      title: 'Barra libre',
      challenge: 'Prepárale algo de beber sin preguntarle qué le apetece.',
      difficulty: 'facil',
    },
    {
      title: 'Sin manos',
      challenge: 'Cómete lo que te den sin usar las manos.',
      difficulty: 'medio',
    },
    {
      title: 'Estatua',
      challenge: 'Quédate completamente inmóvil un minuto, pase lo que pase a tu alrededor.',
      difficulty: 'medio',
    },
    {
      title: 'Audio comprometido',
      challenge: 'Manda un audio cantando a la tercera persona de tu lista de chats.',
      difficulty: 'medio',
    },
    {
      title: 'Sin la letra A',
      challenge: 'Habla durante dos minutos sin usar ni una sola palabra con la letra A.',
      difficulty: 'medio',
    },
  ],

  picante: [
    {
      title: 'Tres cosas',
      challenge: 'Di tres cosas que te atraen de la otra persona, mirándola a los ojos.',
      difficulty: 'medio',
    },
    {
      title: 'Masaje a ciegas',
      challenge: 'Da un masaje de un minuto donde te pidan, sin rechistar.',
      difficulty: 'medio',
    },
    {
      title: 'Baile lento',
      challenge: 'Baila una canción lenta pegado a la otra persona, sin soltarte.',
      difficulty: 'medio',
    },
    {
      title: 'Al oído',
      challenge: 'Susurra al oído lo que pensaste la primera vez que la viste.',
      difficulty: 'medio',
    },
    {
      title: 'Repetición',
      challenge: 'Recread vuestro primer beso, igual que fue.',
      difficulty: 'medio',
    },
    {
      title: 'Prenda o trago',
      challenge: 'Quítate una prenda o bebe un trago. Tú eliges.',
      difficulty: 'dificil',
    },
    {
      title: 'Diez segundos',
      challenge: 'Un beso de diez segundos contados en voz alta, sin separaros.',
      difficulty: 'dificil',
    },
    {
      title: 'Duelo de miradas',
      challenge: 'Sostened la mirada un minuto entero, sin hablar y sin reíros.',
      difficulty: 'medio',
    },
    {
      title: 'Nunca lo dije',
      challenge: 'Cuenta algo que no le hayas contado a nadie que esté en esta sala.',
      difficulty: 'dificil',
    },
    {
      title: 'Top 3',
      challenge: 'Nombra tus tres partes favoritas de la otra persona y por qué.',
      difficulty: 'medio',
    },
  ],

  atrevida: [
    {
      title: 'A ciegas',
      challenge: 'Déjate vendar los ojos dos minutos y adivina lo que te den a probar.',
      difficulty: 'dificil',
    },
    {
      title: 'Confesión guardada',
      challenge: 'Cuenta una fantasía que nunca hayas dicho en voz alta.',
      difficulty: 'dificil',
    },
    {
      title: 'Intercambio',
      challenge: 'Intercambia una prenda de ropa con la otra persona y quédatela puesta.',
      difficulty: 'dificil',
    },
    {
      title: 'Hielo',
      challenge: 'Un cubo de hielo, donde te digan, hasta que se derrita del todo.',
      difficulty: 'dificil',
    },
    {
      title: 'Sin manos II',
      challenge: 'Quítale una prenda a la otra persona sin usar las manos.',
      difficulty: 'dificil',
    },
    {
      title: 'Verdad obligada',
      challenge: 'Responde con la verdad a la pregunta que te hagan, sea cual sea.',
      difficulty: 'dificil',
    },
    {
      title: 'Carta blanca',
      challenge: 'La otra persona decide tu próximo reto. No puedes negarte.',
      difficulty: 'dificil',
    },
    {
      title: 'Dos minutos',
      challenge: 'Dos minutos a solas. Lo que pase ahí lo decidís vosotros.',
      difficulty: 'dificil',
    },
  ],
}

/**
 * Devuelve una sugerencia del nivel pedido, evitando las ya usadas. Si se
 * agotan todas, vuelve a empezar: mejor repetir que dejar el botón muerto.
 */
export function sugerenciaAlAzar(nivel: Nivel, usadas: string[]): Sugerencia {
  const catalogo = SUGERENCIAS[nivel]
  const frescas = catalogo.filter((s) => !usadas.includes(s.title))
  const fuente = frescas.length > 0 ? frescas : catalogo

  return fuente[Math.floor(Math.random() * fuente.length)]
}
