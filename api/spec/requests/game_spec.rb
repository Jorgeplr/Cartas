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

  it "registra quien robo la carta" do
    llenar_mazo(1)

    post "/api/draw", headers: auth_headers(ana)

    expect(Card.first.drawn_by_id).to eq(ana.id)
  end

  it "la otra persona ve la ultima jugada sin haber robado ella" do
    llenar_mazo(2)
    post "/api/draw", headers: auth_headers(ana)

    get "/api/pairing", headers: auth_headers(bea)

    expect(json[:last_play][:drawn_by][:display_name]).to eq("ana")
    expect(json[:last_play][:drawn_by_me]).to be(false)
    # El reto de una carta ya jugada se revela a ambos: es lo que hay que cumplir.
    expect(json[:last_play][:card][:challenge]).to be_present
    expect(json[:pairing][:current_turn_user_id]).to eq(bea.id)
  end

  it "una carta robada antes de registrar quien robaba no rompe last_play" do
    llenar_mazo(1)
    Card.first.update!(drawn_at: Time.current, drawn_by_id: nil)

    get "/api/pairing", headers: auth_headers(ana)

    expect(response).to have_http_status(:ok)
    expect(json[:last_play][:drawn_by]).to be_nil
    expect(json[:last_play][:card][:title]).to eq("C0")
  end

  it "sin jugadas todavia, last_play es nulo" do
    llenar_mazo(1)

    get "/api/pairing", headers: auth_headers(ana)

    expect(json[:last_play]).to be_nil
  end

  it "rebarajar devuelve todas las cartas al mazo" do
    llenar_mazo(3)
    Card.update_all(drawn_at: Time.current)

    post "/api/deck/reshuffle", headers: auth_headers(ana)

    expect(json[:cards_left]).to eq(3)
    expect(Card.where.not(drawn_at: nil)).to be_empty
    expect(Card.where.not(drawn_by_id: nil)).to be_empty
  end
end
