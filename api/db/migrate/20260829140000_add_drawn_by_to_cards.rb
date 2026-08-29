class AddDrawnByToCards < ActiveRecord::Migration[8.1]
  # Quien robo la carta es un dato, no algo a deducir del turno actual:
  # rebarajar o cualquier cambio futuro en el orden romperia la deduccion.
  def change
    add_reference :cards, :drawn_by, foreign_key: { to_table: :users }, null: true
  end
end
