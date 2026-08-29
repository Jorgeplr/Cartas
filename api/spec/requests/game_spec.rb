require "rails_helper"

RSpec.describe "Game" do
  let(:ana) { crear_usuario("ana@x.com") }
  let(:bea) { crear_usuario("bea@x.com") }
  let!(:pairing) { Pairing.create!(user_a: ana, user_b: bea, current_turn_user: ana) }

  def llenar_mazo(n)
    n.times do |i|
      Card.create!(author: bea, title: "C#{i}",
                   challenge: "Reto #{i}", difficulty: "medio")
    end
  end

  it "roba una carta, la marca y pasa el turno" do
    llenar_mazo(1)

    post "/api/draw", headers: auth_headers(ana)

    expect(response).to have_http_status(:ok)
    expect(json[:card][:challenge]).to eq("Reto 0")
    expect(json[:cards_left]).to eq(0)
    expect(Card.first.drawn_at).to be_present
    expect(pairing.reload.current_turn_user_id).to eq(bea.id)
  end

  it "nunca devuelve dos veces la misma carta" do
    llenar_mazo(5)

    ids = Array.new(5) do
      turno = pairing.reload.current_turn_user_id == ana.id ? ana : bea
      post "/api/draw", headers: auth_headers(turno)
      json[:card][:id]
    end

    expect(ids.uniq.size).to eq(5)
  end

  it "da 403 si no es tu turno" do
    llenar_mazo(1)

    post "/api/draw", headers: auth_headers(bea)

    expect(response).to have_http_status(:forbidden)
    expect(json[:error][:code]).to eq("not_your_turn")
  end

  it "da 422 si el mazo esta vacio y no gasta el turno" do
    post "/api/draw", headers: auth_headers(ana)

    expect(response).to have_http_status(:unprocessable_content)
    expect(json[:error][:code]).to eq("empty_deck")
    expect(pairing.reload.current_turn_user_id).to eq(ana.id)
  end

  it "rebarajar devuelve todas las cartas al mazo" do
    llenar_mazo(3)
    Card.update_all(drawn_at: Time.current)

    post "/api/deck/reshuffle", headers: auth_headers(ana)

    expect(json[:cards_left]).to eq(3)
    expect(Card.where.not(drawn_at: nil)).to be_empty
  end
end
