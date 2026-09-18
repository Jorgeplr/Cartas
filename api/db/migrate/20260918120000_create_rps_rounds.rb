class CreateRpsRounds < ActiveRecord::Migration[8.1]
  def change
    create_table :rps_rounds do |t|
      t.references :pairing, null: false, foreign_key: true
      t.string :user_a_choice
      t.string :user_b_choice
      t.references :winner, foreign_key: { to_table: :users }, null: true
      t.datetime :resolved_at

      t.timestamps
    end

    # Como mucho una ronda sin resolver por pareja: el indice es la ultima
    # palabra si dos peticiones simultaneas intentan abrir cada una la suya.
    add_index :rps_rounds, :pairing_id, unique: true,
              where: "resolved_at IS NULL", name: "index_rps_rounds_on_pairing_id_active"
  end
end
