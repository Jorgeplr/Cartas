module CardSerializer
  # Simbolo, nunca un id real: distingue "no se paso mi_comodin_id" (calcularlo
  # aqui) de "se paso y es nil" (no tienes comodin elegido).
  SIN_CALCULAR = :sin_calcular

  # El reto solo es visible si lo escribiste tu o si la carta ya salio del mazo.
  # Esta es LA regla del juego: vive aqui para que ningun endpoint pueda saltarsela.
  #
  # `baneadas_por_mi` y `mi_comodin_id` son opcionales: sin ellos se consultan
  # carta por carta. `collection` los precalcula una sola vez para no hacer
  # una query por carta.
  def self.call(card, viewer, baneadas_por_mi = nil, mi_comodin_id = SIN_CALCULAR)
    mine = card.author_id == viewer.id
    visible = mine || card.drawn?
    baneada = baneadas_por_mi ? baneadas_por_mi.include?(card.id) :
      CardBan.exists?(banned_by_id: viewer.id, card_id: card.id)
    comodin_id = mi_comodin_id == SIN_CALCULAR ? ultimo_comodin_id(viewer) : mi_comodin_id

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
      # El de esta partida, jugado o no: se queda marcado aunque ya haya
      # salido, para que el frontend sepa que este comodin ya se gasto sin
      # tener que consultar aparte si esta jugado.
      is_my_wildcard: mine && comodin_id == card.id,
      created_at: card.created_at
    }
  end

  def self.collection(cards, viewer)
    ids = cards.map(&:id)
    baneadas_por_mi = CardBan.where(banned_by_id: viewer.id, card_id: ids).pluck(:card_id).to_set
    mi_comodin_id = ultimo_comodin_id(viewer)
    cards.map { |card| call(card, viewer, baneadas_por_mi, mi_comodin_id) }
  end

  def self.ultimo_comodin_id(viewer)
    viewer.wildcards.order(created_at: :desc).pick(:card_id)
  end
end
