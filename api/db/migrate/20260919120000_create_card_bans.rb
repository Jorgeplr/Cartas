class CreateCardBans < ActiveRecord::Migration[8.1]
  def change
    create_table :card_bans do |t|
      t.references :banned_by, null: false, foreign_key: { to_table: :users }
      t.references :card, null: false, foreign_key: true

      t.timestamps
    end

    # Una vez por carta y por persona: repetir el POST no debe contar dos veces
    # contra el limite de 4.
    add_index :card_bans, [ :banned_by_id, :card_id ], unique: true
  end
end
