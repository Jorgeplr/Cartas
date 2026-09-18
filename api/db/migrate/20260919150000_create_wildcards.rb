class CreateWildcards < ActiveRecord::Migration[8.1]
  def change
    create_table :wildcards do |t|
      t.references :chosen_by, null: false, foreign_key: { to_table: :users }
      t.references :card, null: false, foreign_key: true
      t.datetime :played_at

      t.timestamps
    end

    # Como mucho un comodin reservado (sin jugar) por persona: elegir uno
    # nuevo reemplaza al anterior, nunca los apila.
    add_index :wildcards, :chosen_by_id, unique: true,
              where: "played_at IS NULL", name: "index_wildcards_on_chosen_by_id_active"
  end
end
