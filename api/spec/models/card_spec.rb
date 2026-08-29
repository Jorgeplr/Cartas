require "rails_helper"

RSpec.describe Card do
  let(:ana) { crear_usuario("ana@x.com") }

  def carta(**attrs)
    Card.new({ author: ana, title: "T", challenge: "C", difficulty: "medio" }.merge(attrs))
  end

  it "rechaza una dificultad desconocida" do
    expect(carta(difficulty: "imposible")).not_to be_valid
  end

  it "rechaza retos de mas de 280 caracteres" do
    expect(carta(challenge: "x" * 281)).not_to be_valid
  end

  it "se puede escribir sin tener pareja" do
    expect(carta).to be_valid
  end

  it "el scope in_deck excluye las cartas ya robadas" do
    carta(drawn_at: Time.current).save!
    viva = carta(title: "Viva")
    viva.save!
    expect(ana.cards.in_deck).to eq([viva])
  end
end
