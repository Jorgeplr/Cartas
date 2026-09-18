require "rails_helper"

RSpec.describe Wildcard do
  let(:ana) { crear_usuario("ana@x.com") }
  let(:bea) { crear_usuario("bea@x.com") }

  def carta(author:, **attrs)
    Card.create!({ author: author, title: "T", challenge: "C", theme: "picante" }.merge(attrs))
  end

  it "rechaza una carta ajena" do
    ajena = carta(author: bea)

    wildcard = Wildcard.new(chosen_by: ana, card: ajena)

    expect(wildcard).not_to be_valid
  end

  it "rechaza una carta ya jugada" do
    mia = carta(author: ana, drawn_at: Time.current)

    wildcard = Wildcard.new(chosen_by: ana, card: mia)

    expect(wildcard).not_to be_valid
  end

  it "acepta una carta propia que sigue en el mazo" do
    mia = carta(author: ana)

    wildcard = Wildcard.new(chosen_by: ana, card: mia)

    expect(wildcard).to be_valid
  end

  it "no esta jugado hasta que se marca played_at" do
    wildcard = Wildcard.create!(chosen_by: ana, card: carta(author: ana))
    expect(wildcard).not_to be_played

    wildcard.update!(played_at: Time.current)
    expect(wildcard).to be_played
  end
end
