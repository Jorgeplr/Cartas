/**
 * La tematica es el unico eje de la carta: el tono Y el nivel de calor a la
 * vez. Antes habia dos (dificultad facil/medio/dificil y tono suave/picante/
 * atrevida) y se pisaban, asi que se fundieron en este. El orden es de menos
 * a mas: es la escala que ve el jugador.
 */
export type Theme = 'suave' | 'picante' | 'atrevida'

export const TEMATICAS: Theme[] = ['suave', 'picante', 'atrevida']

export const ETIQUETA_TEMA: Record<Theme, string> = {
  suave: 'Suave',
  picante: 'Picante',
  atrevida: 'Atrevida',
}

export interface User {
  id: number
  email: string
  display_name: string
  invite_code: string
}

export interface Partner {
  id: number
  display_name: string
}

export interface Card {
  id: number
  title: string
  theme: Theme
  /** true si la escribiste tú */
  mine: boolean
  /** true si ya salió del mazo */
  drawn: boolean
  /** true si el reto está oculto: es de la otra persona y sigue en el mazo */
  hidden: boolean
  /** null cuando `hidden` es true */
  challenge: string | null
  /** true si TÚ baneaste esta carta ajena. Nunca dice si la baneó la otra persona: eso es secreto. */
  banned_by_me: boolean
  created_at: string
}

/** Cuántas cartas ajenas puedes banear antes de rebarajar o terminar la pareja. */
export const MAXIMO_BANEOS = 4

export interface Pairing {
  id: number
  current_turn_user_id: number
  /** Que tematicas pueden salir al robar. Es de la pareja, no de cada jugador. */
  active_themes: Theme[]
}

export interface Session {
  user: User
  pairing: Pairing | null
  partner: Partner | null
}

export interface LastPlay {
  card: Card
  /** null en cartas robadas antes de que se registrara quien robaba */
  drawn_by: Partner | null
  /** true si la robaste tu; false si la robo la otra persona */
  drawn_by_me: boolean
  drawn_at: string
}

export interface DeckState {
  pairing: Pairing
  partner: Partner
  /** Filtrados por las tematicas activas: es "lo que puede salir ahora" */
  cards_left: number
  cards_total: number
  /** Sin filtrar: rebarajar devuelve la baraja entera */
  cards_drawn_total: number
  /** Cuantas cartas en mazo aporta cada tematica. Van siempre las tres claves. */
  deck_by_theme: Record<Theme, number>
  /** null hasta que sale la primera carta, y tras rebarajar */
  last_play: LastPlay | null
}

export interface DrawResult {
  card: Card
  cards_left: number
  current_turn_user_id: number
}

export type RpsChoice = 'piedra' | 'papel' | 'tijera'

export const ELECCIONES_RPS: RpsChoice[] = ['piedra', 'papel', 'tijera']

export interface RpsRoundState {
  resolved: boolean
  /** Tu propia elección: siempre visible, incluso antes de resolver. */
  my_choice: RpsChoice | null
  /** Si la otra persona ya eligió, sin decir qué. */
  partner_chose: boolean
  /** null hasta que la ronda se resuelve: es la elección ajena, oculta hasta entonces. */
  partner_choice: RpsChoice | null
  result: 'gane' | 'perdi' | 'empate' | null
  resolved_at: string | null
}
