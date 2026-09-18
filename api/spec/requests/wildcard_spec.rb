require "rails_helper"

RSpec.describe "Wildcard" do
  let(:ana) { crear_usuario("ana@x.com") }
  let(:bea) { crear_usuario("bea@x.com") }
  let!(:pairing) { Pairing.create!(user_a: ana, user_b: bea, current_turn_user: ana) }

  def carta(author:, **attrs)
    Card.create!({ author: author, title: "T", challenge: "C", theme: "picante" }.merge(attrs))
  end

  describe "GET /api/wildcard" do
    it "sin elegir ninguno, devuelve el estado vacio" do
      get "/api/wildcard", headers: auth_headers(ana)

      expect(response).to have_http_status(:ok)
      expect(json).to eq(chosen: false, played: false, card: nil)
    end
  end

  describe "GET /api/pairing" do
    it "expone el comodin elegido del que consulta, no el de la otra persona" do
      mia = carta(author: ana, title: "Mia")
      suya = carta(author: bea, title: "Suya")
      Wildcard.create!(chosen_by: ana, card: mia)
      Wildcard.create!(chosen_by: bea, card: suya)

      get "/api/pairing", headers: auth_headers(ana)

      expect(json[:wildcard][:chosen]).to be(true)
      expect(json[:wildcard][:card][:id]).to eq(mia.id)
    end
  end

  describe "POST /api/wildcard" do
    it "elige una carta propia como comodin" do
      mia = carta(author: ana)

      post "/api/wildcard", params: { card_id: mia.id }, headers: auth_headers(ana)

      expect(response).to have_http_status(:ok)
      expect(json[:chosen]).to be(true)
      expect(json[:played]).to be(false)
      expect(json[:card][:id]).to eq(mia.id)
    end

    it "rechaza una carta ajena" do
      ajena = carta(author: bea)

      post "/api/wildcard", params: { card_id: ajena.id }, headers: auth_headers(ana)

      expect(response).to have_http_status(:not_found)
    end

    it "rechaza una carta ya jugada" do
      jugada = carta(author: ana, drawn_at: Time.current)

      post "/api/wildcard", params: { card_id: jugada.id }, headers: auth_headers(ana)

      expect(response).to have_http_status(:not_found)
    end

    it "reemplaza el comodin elegido antes, sin apilarlos" do
      primera = carta(author: ana, title: "Primera")
      segunda = carta(author: ana, title: "Segunda")

      post "/api/wildcard", params: { card_id: primera.id }, headers: auth_headers(ana)
      post "/api/wildcard", params: { card_id: segunda.id }, headers: auth_headers(ana)

      expect(json[:card][:id]).to eq(segunda.id)
      expect(Wildcard.where(chosen_by: ana).count).to eq(1)
    end

    it "la carta reservada no sale al robar al azar" do
      mia = carta(author: ana)
      carta(author: bea, title: "Otra")
      post "/api/wildcard", params: { card_id: mia.id }, headers: auth_headers(ana)

      expect(pairing.playable_cards).not_to include(mia)
    end
  end

  describe "DELETE /api/wildcard" do
    it "cancela la eleccion" do
      mia = carta(author: ana)
      post "/api/wildcard", params: { card_id: mia.id }, headers: auth_headers(ana)

      delete "/api/wildcard", headers: auth_headers(ana)

      expect(json[:chosen]).to be(false)
      expect(Wildcard.count).to eq(0)
      expect(pairing.playable_cards).to include(mia)
    end
  end

  describe "POST /api/wildcard/play" do
    it "juega el comodin en vez de robar al azar y pasa el turno" do
      mia = carta(author: ana, challenge: "Reto del comodin")
      carta(author: bea, title: "Otra")
      post "/api/wildcard", params: { card_id: mia.id }, headers: auth_headers(ana)

      post "/api/wildcard/play", headers: auth_headers(ana)

      expect(response).to have_http_status(:ok)
      expect(json[:card][:id]).to eq(mia.id)
      expect(json[:card][:challenge]).to eq("Reto del comodin")
      expect(mia.reload.drawn_by_id).to eq(ana.id)
      expect(pairing.reload.current_turn_user_id).to eq(bea.id)
    end

    it "da 403 si no es tu turno" do
      mia = carta(author: bea)
      post "/api/wildcard", params: { card_id: mia.id }, headers: auth_headers(bea)

      post "/api/wildcard/play", headers: auth_headers(bea)

      expect(response).to have_http_status(:forbidden)
      expect(json[:error][:code]).to eq("not_your_turn")
    end

    it "da 422 si no has elegido comodin" do
      post "/api/wildcard/play", headers: auth_headers(ana)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json[:error][:code]).to eq("no_wildcard_chosen")
    end

    it "no deja jugarlo dos veces" do
      mia = carta(author: ana)
      post "/api/wildcard", params: { card_id: mia.id }, headers: auth_headers(ana)
      post "/api/wildcard/play", headers: auth_headers(ana)

      # El turno ya paso a bea; se fuerza de vuelta a ana para aislar la
      # comprobacion de "ya jugado" de la de "no es tu turno". reload hace
      # falta: sin el, el objeto en memoria sigue pensando que el turno ya
      # era de ana y la reasignacion no llega a marcarse como cambio.
      pairing.reload.update!(current_turn_user: ana)
      post "/api/wildcard/play", headers: auth_headers(ana)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json[:error][:code]).to eq("wildcard_already_played")
    end

    it "no deja elegir uno nuevo tras jugar el anterior, hasta rebarajar" do
      mia = carta(author: ana)
      otra = carta(author: ana, title: "Otra mia")
      post "/api/wildcard", params: { card_id: mia.id }, headers: auth_headers(ana)
      post "/api/wildcard/play", headers: auth_headers(ana)

      post "/api/wildcard", params: { card_id: otra.id }, headers: auth_headers(ana)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json[:error][:code]).to eq("wildcard_already_played")
    end
  end
end
