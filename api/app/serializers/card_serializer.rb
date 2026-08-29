module CardSerializer
  # El reto solo es visible si lo escribiste tu o si la carta ya salio del mazo.
  # Esta es LA regla del juego: vive aqui para que ningun endpoint pueda saltarsela.
  def self.call(card, viewer)
    mine = card.author_id == viewer.id
    visible = mine || card.drawn?

    {
      id: card.id,
      title: card.title,
      difficulty: card.difficulty,
      mine: mine,
      drawn: card.drawn?,
      hidden: !visible,
      challenge: visible ? card.challenge : nil,
      created_at: card.created_at
    }
  end

  def self.collection(cards, viewer)
    cards.map { |card| call(card, viewer) }
  end
end
