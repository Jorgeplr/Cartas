require "rails_helper"

RSpec.describe "Cards" do
  let(:ana) { crear_usuario("ana@x.com") }
  let(:bea) { crear_usuario("bea@x.com") }
  let!(:pairing) { Pairing.create!(user_a: ana, user_b: bea, current_turn_user: ana) }

  def carta(author:, **attrs)
    Card.create!({ author: author, title: "T", challenge: "C",
                   difficulty: "medio" }.merge(attrs))
  end

  it "crea una carta en la baraja de la pareja" do
    post "/api/cards", params: { title: "Baile", challenge: "Baila 30s", difficulty: "facil" },
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

  it "prohibe editar una carta propia ya robada" do
    mia = carta(author: ana, drawn_at: Time.current)

    patch "/api/cards/#{mia.id}", params: { title: "Nueva" }, headers: auth_headers(ana)
    expect(response).to have_http_status(:forbidden)
  end

  it "permite borrar tu propia carta que sigue en el mazo" do
    mia = carta(author: ana)

    delete "/api/cards/#{mia.id}", headers: auth_headers(ana)
    expect(response).to have_http_status(:no_content)
    expect(Card.exists?(mia.id)).to be(false)
  end

  it "permite escribir cartas antes de tener pareja" do
    sola = crear_usuario("sola@x.com")

    post "/api/cards", params: { title: "Adelantada", challenge: "C", difficulty: "facil" },
         headers: auth_headers(sola)

    expect(response).to have_http_status(:created)
    expect(sola.cards.count).to eq(1)
  end

  it "sin pareja solo ves tus propias cartas" do
    sola = crear_usuario("sola@x.com")
    Card.create!(author: sola, title: "Mia", challenge: "C", difficulty: "facil")

    get "/api/cards", headers: auth_headers(sola)

    expect(json[:cards].size).to eq(1)
    expect(json[:cards].first[:title]).to eq("Mia")
  end
end
