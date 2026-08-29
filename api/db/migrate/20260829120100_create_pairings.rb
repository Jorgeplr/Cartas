class CreatePairings < ActiveRecord::Migration[8.1]
  def change
    create_table :pairings do |t|
      t.references :user_a, null: false, foreign_key: { to_table: :users }, index: { unique: true }
      t.references :user_b, null: false, foreign_key: { to_table: :users }, index: { unique: true }
      t.references :current_turn_user, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end
  end
end
