require "rails_helper"

RSpec.describe "Cards" do
  let(:ana) { crear_usuario("ana@x.com") }
  let(:bea) { crear_usuario("bea@x.com") }
  let!(:pairing) { Pairing.create!(user_a: ana, user_b: bea, current_turn_user: ana) }

  def carta(author:, **attrs)
    Card.create!({ author: author, title: "T", challenge: "C",
                   theme: "picante" }.merge(attrs))
  end

  it "crea una carta en la baraja de la pareja" do
    post "/api/cards", params: { title: "Baile", challenge: "Baila 30s", theme: "suave" },
         headers: auth_headers(ana)

    expect(response).to have_http_status(:created)
    expect(Card.last.author_id).to eq(ana.id)
    expect(Card.last.author_id).to eq(ana.id)
  end

  it "OCULTA el reto de las cartas ajenas que siguen en el mazo" do
    carta(author: bea, title: "Secreto", challenge: "TEXTO PROHIBIDO")

    get "/api/cards", headers: auth_headers(ana)
    card = json[:cards].first

    expect(card[:title]).to eq("Secreto")
    expect(card[:challenge]).to be_nil
    expect(card[:hidden]).to be(true)
    expect(response.body).not_to include("TEXTO PROHIBIDO")
  end

  it "muestra el reto de tus propias cartas" do
    carta(author: ana, title: "Mia", challenge: "Mi texto")

    get "/api/cards", headers: auth_headers(ana)
    expect(json[:cards].first[:challenge]).to eq("Mi texto")
  end

  it "revela el reto ajeno una vez robada la carta" do
    carta(author: bea, title: "Ya salio", challenge: "Visible", drawn_at: Time.current)

    get "/api/cards", headers: auth_headers(ana)
    expect(json[:cards].first[:challenge]).to eq("Visible")
  end

  it "prohibe editar o borrar una carta ajena" do
    ajena = carta(author: bea)

    patch "/api/cards/#{ajena.id}", params: { title: "Hackeada" }, headers: auth_headers(ana)
    expect(response).to have_http_status(:forbidden)

    delete "/api/cards/#{ajena.id}", headers: auth_headers(ana)
    expect(response).to have_http_status(:forbidden)
  end

  it "permite editar una carta propia aunque ya se haya jugado" do
    # El mazo se rebaraja y se vuelve a jugar: congelar la carta al primer
    # robo dejaba media baraja intocable.
    mia = carta(author: ana, drawn_at: Time.current)

    patch "/api/cards/#{mia.id}", params: { title: "Corregida" }, headers: auth_headers(ana)

    expect(response).to have_http_status(:ok)
    expect(mia.reload.title).to eq("Corregida")
  end

  it "permite borrar una carta propia ya jugada" do
    mia = carta(author: ana, drawn_at: Time.current)

    delete "/api/cards/#{mia.id}", headers: auth_headers(ana)

    expect(response).to have_http_status(:no_content)
  end

  it "permite borrar tu propia carta que sigue en el mazo" do
    mia = carta(author: ana)

    delete "/api/cards/#{mia.id}", headers: auth_headers(ana)
    expect(response).to have_http_status(:no_content)
    expect(Card.exists?(mia.id)).to be(false)
  end

  it "permite escribir cartas antes de tener pareja" do
    sola = crear_usuario("sola@x.com")

    post "/api/cards", params: { title: "Adelantada", challenge: "C", theme: "suave" },
         headers: auth_headers(sola)

    expect(response).to have_http_status(:created)
    expect(sola.cards.count).to eq(1)
  end

  it "sin pareja solo ves tus propias cartas" do
    sola = crear_usuario("sola@x.com")
    Card.create!(author: sola, title: "Mia", challenge: "C", theme: "suave")

    get "/api/cards", headers: auth_headers(sola)

    expect(json[:cards].size).to eq(1)
    expect(json[:cards].first[:title]).to eq("Mia")
  end

  describe "baneos" do
    it "banea una carta ajena y ya no sale en el mazo jugable" do
      ajena = carta(author: bea)

      post "/api/cards/#{ajena.id}/ban", headers: auth_headers(ana)

      expect(response).to have_http_status(:ok)
      expect(json[:card][:banned_by_me]).to be(true)
      expect(pairing.playable_cards).not_to include(ajena)
    end

    it "no revela el baneo a la otra persona" do
      ajena = carta(author: bea)
      post "/api/cards/#{ajena.id}/ban", headers: auth_headers(ana)

      get "/api/cards", headers: auth_headers(bea)

      expect(json[:cards].first[:banned_by_me]).to be(false)
    end

    it "rechaza banear tu propia carta" do
      mia = carta(author: ana)

      post "/api/cards/#{mia.id}/ban", headers: auth_headers(ana)

      expect(response).to have_http_status(:forbidden)
      expect(json[:error][:code]).to eq("own_card")
    end

    it "rechaza banear una carta ya jugada" do
      ajena = carta(author: bea, drawn_at: Time.current)

      post "/api/cards/#{ajena.id}/ban", headers: auth_headers(ana)

      expect(response).to have_http_status(:unprocessable_content)
      expect(CardBan.count).to eq(0)
    end

    it "no deja banear una quinta carta" do
      4.times { |i| post "/api/cards/#{carta(author: bea, title: "C#{i}").id}/ban", headers: auth_headers(ana) }
      quinta = carta(author: bea, title: "C5")

      post "/api/cards/#{quinta.id}/ban", headers: auth_headers(ana)

      expect(response).to have_http_status(:unprocessable_content)
      expect(CardBan.where(banned_by_id: ana.id).count).to eq(4)
    end

    it "desbanea una carta y vuelve a estar disponible" do
      ajena = carta(author: bea)
      post "/api/cards/#{ajena.id}/ban", headers: auth_headers(ana)

      delete "/api/cards/#{ajena.id}/ban", headers: auth_headers(ana)

      expect(response).to have_http_status(:ok)
      expect(json[:card][:banned_by_me]).to be(false)
      expect(pairing.playable_cards).to include(ajena)
    end
  end
end
