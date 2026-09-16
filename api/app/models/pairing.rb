class Pairing < ApplicationRecord
  belongs_to :user_a, class_name: "User"
  belongs_to :user_b, class_name: "User"
  belongs_to :current_turn_user, class_name: "User"

  validate :tematicas_validas

  def members
    [user_a, user_b]
  end

  # La baraja son las cartas de ambos: no hay tabla de mazos, la pareja lo es.
  def cards
    Card.where(author_id: [user_a_id, user_b_id])
  end

  # Lo que puede salir con el filtro puesto. Vive aqui y no en el controlador
  # porque lo necesitan tanto robar como los recuentos de la mesa: si cada uno
  # se acordara de filtrar por su cuenta, antes o despues uno se olvidaria y
  # saldria una carta de una tematica apagada.
  def playable_cards
    cards.where(theme: active_themes)
  end

  def other_than(user)
    user_a_id == user.id ? user_b : user_a
  end

  def turn_of?(user)
    current_turn_user_id == user.id
  end

  private

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
