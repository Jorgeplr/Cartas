class Pairing < ApplicationRecord
  belongs_to :user_a, class_name: "User"
  belongs_to :user_b, class_name: "User"
  belongs_to :current_turn_user, class_name: "User"

  has_many :rps_rounds, dependent: :destroy

  validate :tematicas_validas

  def members
    [ user_a, user_b ]
  end

  # La baraja son las cartas de ambos: no hay tabla de mazos, la pareja lo es.
  def cards
    Card.where(author_id: [ user_a_id, user_b_id ])
  end

  # Lo que puede salir con el filtro puesto. Vive aqui y no en el controlador
  # porque lo necesitan tanto robar como los recuentos de la mesa: si cada uno
  # se acordara de filtrar por su cuenta, antes o despues uno se olvidaria y
  # saldria una carta de una tematica apagada.
  #
  # Los baneos y los comodines reservados se restan igual que el filtro de
  # tematicas: son otra forma de decir "esto no puede salir ahora", asi que
  # cuentan para los dos mismos sitios y con la misma regla. Un comodin ya
  # jugado NO se resta aqui: su carta ya salio del mazo (drawn_at), asi que
  # el scope in_deck ya la excluye por su cuenta.
  def playable_cards
    cards.where(theme: active_themes)
         .where.not(id: CardBan.where(banned_by_id: miembros_ids).select(:card_id))
         .where.not(id: Wildcard.active.where(chosen_by_id: miembros_ids).select(:card_id))
  end

  def other_than(user)
    user_a_id == user.id ? user_b : user_a
  end

  def turn_of?(user)
    current_turn_user_id == user.id
  end

  # Cada rebarajada es una partida nueva: ambos recuperan sus 4 baneos.
  # Tambien se llama al terminar el emparejamiento, para que no sobrevivan
  # a una pareja distinta si estas dos personas vuelven a emparejarse.
  def clear_bans!
    CardBan.where(banned_by_id: miembros_ids).delete_all
  end

  # Misma logica que clear_bans!, pero para el comodin: partida nueva es
  # tambien la unica forma de volver a elegir uno despues de jugarlo.
  def clear_wildcards!
    Wildcard.where(chosen_by_id: miembros_ids).delete_all
  end

  private

  def miembros_ids
    [ user_a_id, user_b_id ]
  end

  # Sin ninguna tematica activa el mazo quedaria vacio para siempre y nada en
  # la pantalla explicaria por que. Al menos una, y todas conocidas.
  def tematicas_validas
    if active_themes.blank?
      errors.add(:active_themes, "necesita al menos una tematica")
    elsif (active_themes - Card::TEMATICAS).any?
      errors.add(:active_themes, "contiene una tematica desconocida")
    end
  end
end
