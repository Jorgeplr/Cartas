require "rails_helper"

RSpec.describe Card do
  let(:ana) { crear_usuario("ana@x.com") }
  let(:bea) { crear_usuario("bea@x.com") }
  let(:pairing) { Pairing.create!(user_a: ana, user_b: bea, current_turn_user: ana) }

  def carta(**attrs)
    Card.new({ pairing: pairing, author: ana, title: "T", challenge: "C",
               difficulty: "medio" }.merge(attrs))
  end

  it "rechaza una dificultad desconocida" do
    expect(carta(difficulty: "imposible")).not_to be_valid
  end

  it "rechaza retos de mas de 280 caracteres" do
    expect(carta(challenge: "x" * 281)).not_to be_valid
  end

  it "el scope in_deck excluye las cartas ya robadas" do
    carta(drawn_at: Time.current).save!
    viva = carta(title: "Viva")
    viva.save!
    expect(pairing.cards.in_deck).to eq([viva])
  end
end
