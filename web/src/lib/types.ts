export type Difficulty = 'facil' | 'medio' | 'dificil'

export const DIFICULTADES: Difficulty[] = ['facil', 'medio', 'dificil']

export const ETIQUETA_DIFICULTAD: Record<Difficulty, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
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
  difficulty: Difficulty
  /** true si la escribiste tú */
  mine: boolean
  /** true si ya salió del mazo */
  drawn: boolean
  /** true si el reto está oculto: es de la otra persona y sigue en el mazo */
  hidden: boolean
  /** null cuando `hidden` es true */
  challenge: string | null
  created_at: string
}

export interface Pairing {
  id: number
  current_turn_user_id: number
}

export interface Session {
  user: User
  pairing: Pairing | null
  partner: Partner | null
}

export interface LastPlay {
  card: Card
  drawn_by: Partner
  /** true si la robaste tu; false si la robo la otra persona */
  drawn_by_me: boolean
  drawn_at: string
}

export interface DeckState {
  pairing: Pairing
  partner: Partner
  cards_left: number
  cards_total: number
  /** null hasta que sale la primera carta, y tras rebarajar */
  last_play: LastPlay | null
}

export interface DrawResult {
  card: Card
  cards_left: number
  current_turn_user_id: number
}
