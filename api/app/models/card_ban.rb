class CardBan < ApplicationRecord
  # Cuantas cartas ajenas puede vetar cada quien antes de que se reinicien
  # al rebarajar o al terminar el emparejamiento.
  MAXIMO_POR_JUGADOR = 4

  belongs_to :banned_by, class_name: "User"
  belongs_to :card

  validates :card_id, uniqueness: { scope: :banned_by_id }
  validate :no_es_carta_propia
  validate :la_carta_sigue_en_el_mazo
  validate :no_supera_el_limite, on: :create

  private

  # Banear tus propias cartas no tiene sentido: ya sabes lo que dicen. La
  # regla vive aqui, no en el controlador, para que ninguna otra vía de
  # crear un CardBan pueda saltársela.
  def no_es_carta_propia
    errors.add(:card, "es tuya") if card && banned_by_id == card.author_id
  end

  def la_carta_sigue_en_el_mazo
    errors.add(:card, "ya salio del mazo") if card&.drawn?
  end

  def no_supera_el_limite
    return unless banned_by_id

    ya_baneadas = CardBan.where(banned_by_id: banned_by_id).count
    errors.add(:base, "ya usaste tus #{MAXIMO_POR_JUGADOR} baneos") if ya_baneadas >= MAXIMO_POR_JUGADOR
  end
end
