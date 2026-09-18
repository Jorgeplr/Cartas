require "rails_helper"

RSpec.describe CardBan do
  let(:ana) { crear_usuario("ana@x.com") }
  let(:bea) { crear_usuario("bea@x.com") }

  def carta(author:, **attrs)
    Card.create!({ author: author, title: "T", challenge: "C", theme: "picante" }.merge(attrs))
  end

  it "rechaza banear tu propia carta" do
    mia = carta(author: ana)

    ban = CardBan.new(banned_by: ana, card: mia)

    expect(ban).not_to be_valid
  end

  it "rechaza banear una carta ya jugada" do
    ajena = carta(author: bea, drawn_at: Time.current)

    ban = CardBan.new(banned_by: ana, card: ajena)

    expect(ban).not_to be_valid
  end

  it "rechaza el quinto baneo de la misma persona" do
    4.times { |i| CardBan.create!(banned_by: ana, card: carta(author: bea, title: "C#{i}")) }

    quinto = CardBan.new(banned_by: ana, card: carta(author: bea, title: "C5"))

    expect(quinto).not_to be_valid
  end

  it "no repite baneo sobre la misma carta" do
    ajena = carta(author: bea)
    CardBan.create!(banned_by: ana, card: ajena)

    repetido = CardBan.new(banned_by: ana, card: ajena)

    expect(repetido).not_to be_valid
  end

  it "los baneos de cada quien no comparten limite" do
    4.times { |i| CardBan.create!(banned_by: ana, card: carta(author: bea, title: "C#{i}")) }

    de_bea = CardBan.new(banned_by: bea, card: carta(author: ana, title: "Otra"))

    expect(de_bea).to be_valid
  end
end
