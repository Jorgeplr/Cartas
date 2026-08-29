class DecoupleCardsFromPairing < ActiveRecord::Migration[8.1]
  # Una carta pertenece a quien la escribio, no a la pareja: asi se puede
  # llenar el mazo antes de tener con quien jugar, y al emparejarse las
  # cartas ya escritas entran solas a la baraja.
  def change
    remove_reference :cards, :pairing, foreign_key: true, index: true
    add_index :cards, [:author_id, :drawn_at]
  end
end
