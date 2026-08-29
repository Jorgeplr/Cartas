class CreateCards < ActiveRecord::Migration[8.1]
  def change
    create_table :cards do |t|
      t.references :pairing, null: false, foreign_key: true
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :challenge, null: false
      t.string :difficulty, null: false, default: "medio"
      t.datetime :drawn_at
      t.timestamps
    end

    add_index :cards, [:pairing_id, :drawn_at]
  end
end
