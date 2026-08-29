class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    enable_extension "citext"

    create_table :users do |t|
      t.citext :email, null: false
      t.string :password_digest, null: false
      t.string :display_name, null: false
      t.string :invite_code, limit: 6, null: false
      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :invite_code, unique: true
  end
end
