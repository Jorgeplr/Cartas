# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_08_29_140000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "citext"
  enable_extension "pg_catalog.plpgsql"

  create_table "cards", force: :cascade do |t|
    t.bigint "author_id", null: false
    t.text "challenge", null: false
    t.datetime "created_at", null: false
    t.string "difficulty", default: "medio", null: false
    t.datetime "drawn_at"
    t.bigint "drawn_by_id"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id", "drawn_at"], name: "index_cards_on_author_id_and_drawn_at"
    t.index ["author_id"], name: "index_cards_on_author_id"
    t.index ["drawn_by_id"], name: "index_cards_on_drawn_by_id"
  end

  create_table "pairings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "current_turn_user_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_a_id", null: false
    t.bigint "user_b_id", null: false
    t.index ["current_turn_user_id"], name: "index_pairings_on_current_turn_user_id"
    t.index ["user_a_id"], name: "index_pairings_on_user_a_id", unique: true
    t.index ["user_b_id"], name: "index_pairings_on_user_b_id", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "display_name", null: false
    t.citext "email", null: false
    t.string "invite_code", limit: 6, null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["invite_code"], name: "index_users_on_invite_code", unique: true
  end

  add_foreign_key "cards", "users", column: "author_id"
  add_foreign_key "cards", "users", column: "drawn_by_id"
  add_foreign_key "pairings", "users", column: "current_turn_user_id"
  add_foreign_key "pairings", "users", column: "user_a_id"
  add_foreign_key "pairings", "users", column: "user_b_id"
end
