module CardSerializer
  # El reto solo es visible si lo escribiste tu o si la carta ya salio del mazo.
  # Esta es LA regla del juego: vive aqui para que ningun endpoint pueda saltarsela.
  #
  # `baneadas_por_mi` es opcional: si no llega, se consulta carta por carta.
  # `collection` la precalcula una sola vez para no hacer una query por carta.
  def self.call(card, viewer, baneadas_por_mi = nil)
    mine = card.author_id == viewer.id
    visible = mine || card.drawn?
    baneada = baneadas_por_mi ? baneadas_por_mi.include?(card.id) :
      CardBan.exists?(banned_by_id: viewer.id, card_id: card.id)

    {
      id: card.id,
      title: card.title,
      theme: card.theme,
      mine: mine,
      drawn: card.drawn?,
      hidden: !visible,
      challenge: visible ? card.challenge : nil,
      # Solo cuenta en las ajenas: no hay nada que banear en las tuyas, y el
      # baneo de la otra persona sobre estas es secreto, no se refleja aqui.
      banned_by_me: !mine && baneada,
      created_at: card.created_at
    }
  end

  def self.collection(cards, viewer)
    baneadas_por_mi = CardBan.where(banned_by_id: viewer.id, card_id: cards.map(&:id)).pluck(:card_id).to_set
    cards.map { |card| call(card, viewer, baneadas_por_mi) }
  end
end
