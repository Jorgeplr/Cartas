module PairingSerializer
  def self.call(pairing, viewer)
    {
      pairing: {
        id: pairing.id,
        current_turn_user_id: pairing.current_turn_user_id
      },
      partner: UserSerializer.partner(pairing.other_than(viewer)),
      cards_left: pairing.cards.in_deck.count,
      cards_total: pairing.cards.count
    }
  end
end
