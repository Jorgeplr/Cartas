require "rails_helper"

RSpec.describe "Rps" do
  let(:ana) { crear_usuario("ana@x.com") }
  let(:bea) { crear_usuario("bea@x.com") }
  let!(:pairing) { Pairing.create!(user_a: ana, user_b: bea, current_turn_user: ana) }

  describe "GET /api/rps" do
    it "sin ninguna ronda jugada, devuelve el estado vacio" do
      get "/api/rps", headers: auth_headers(ana)

      expect(response).to have_http_status(:ok)
      expect(json).to eq(resolved: false, my_choice: nil, partner_chose: false,
                          partner_choice: nil, result: nil, resolved_at: nil)
    end

    it "no revela la eleccion de la otra persona antes de que ambos elijan" do
      post "/api/rps/choose", params: { choice: "piedra" }, headers: auth_headers(ana)

      get "/api/rps", headers: auth_headers(bea)

      expect(json[:partner_chose]).to be(true)
      expect(json[:partner_choice]).to be_nil
      expect(json[:my_choice]).to be_nil
      expect(json[:resolved]).to be(false)
    end
  end

  describe "POST /api/rps/choose" do
    it "rechaza una eleccion invalida" do
      post "/api/rps/choose", params: { choice: "spock" }, headers: auth_headers(ana)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json[:error][:code]).to eq("invalid_choice")
    end

    it "espera a la segunda eleccion para resolver la ronda" do
      post "/api/rps/choose", params: { choice: "piedra" }, headers: auth_headers(ana)

      expect(json[:resolved]).to be(false)
      expect(json[:my_choice]).to eq("piedra")
      expect(RpsRound.count).to eq(1)
    end

    it "resuelve la ronda cuando ambos han elegido y dice quien gana" do
      post "/api/rps/choose", params: { choice: "piedra" }, headers: auth_headers(ana)
      post "/api/rps/choose", params: { choice: "tijera" }, headers: auth_headers(bea)

      expect(json[:resolved]).to be(true)
      expect(json[:my_choice]).to eq("tijera")
      expect(json[:partner_choice]).to eq("piedra")
      expect(json[:result]).to eq("perdi")

      get "/api/rps", headers: auth_headers(ana)
      expect(json[:result]).to eq("gane")
    end

    it "un empate no declara ganador" do
      post "/api/rps/choose", params: { choice: "papel" }, headers: auth_headers(ana)
      post "/api/rps/choose", params: { choice: "papel" }, headers: auth_headers(bea)

      expect(json[:resolved]).to be(true)
      expect(json[:result]).to eq("empate")
    end

    it "deja cambiar de eleccion mientras la ronda sigue abierta" do
      post "/api/rps/choose", params: { choice: "piedra" }, headers: auth_headers(ana)
      post "/api/rps/choose", params: { choice: "papel" }, headers: auth_headers(ana)

      expect(json[:my_choice]).to eq("papel")
      expect(RpsRound.count).to eq(1)
    end

    it "jugar de nuevo tras una ronda resuelta abre una ronda nueva" do
      post "/api/rps/choose", params: { choice: "piedra" }, headers: auth_headers(ana)
      post "/api/rps/choose", params: { choice: "tijera" }, headers: auth_headers(bea)

      post "/api/rps/choose", params: { choice: "papel" }, headers: auth_headers(ana)

      expect(json[:resolved]).to be(false)
      expect(json[:my_choice]).to eq("papel")
      expect(RpsRound.count).to eq(2)
    end
  end
end
