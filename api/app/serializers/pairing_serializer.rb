module PairingSerializer
  def self.call(pairing, viewer)
    ultima = pairing.cards.jugadas.first

    {
      pairing: {
        id: pairing.id,
        current_turn_user_id: pairing.current_turn_user_id
      },
      partner: UserSerializer.partner(pairing.other_than(viewer)),
      cards_left: pairing.cards.in_deck.count,
      cards_total: pairing.cards.count,
      # La ultima jugada viaja siempre: es como la otra persona se entera de
      # que ha salido una carta sin tener que recargar ni preguntar.
      last_play: ultima && {
        card: CardSerializer.call(ultima, viewer),
        drawn_by: UserSerializer.partner(ultima.drawn_by),
        drawn_by_me: ultima.drawn_by_id == viewer.id,
        drawn_at: ultima.drawn_at
      }
    }
  end
end
