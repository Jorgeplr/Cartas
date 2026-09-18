class Wildcard < ApplicationRecord
  belongs_to :chosen_by, class_name: "User"
  belongs_to :card

  # Sin jugar todavia: es la reserva activa. Una vez jugado se queda como
  # historial hasta que la partida se reinicia (rebarajar o desemparejar),
  # que es lo que impide elegir uno nuevo antes de tiempo.
  scope :active, -> { where(played_at: nil) }

  validate :es_carta_propia
  # Solo al crear: jugarlo (marcar played_at) es precisamente lo que pone la
  # carta como robada, asi que revalidar esto en ese update se saltaria a si
  # misma.
  validate :sigue_en_el_mazo, on: :create

  def played?
    played_at.present?
  end

  private

  def es_carta_propia
    errors.add(:card, "no es tuya") if card && chosen_by_id != card.author_id
  end

  def sigue_en_el_mazo
    errors.add(:card, "ya salio del mazo") if card&.drawn?
  end
end
