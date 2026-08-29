module Api
  class GameController < ApplicationController
    include RequiresPairing

    def draw
      unless current_pairing.turn_of?(current_user)
        return render_error(:forbidden, "not_your_turn", "No es tu turno")
      end

      card = nil

      Pairing.transaction do
        # El lock evita que dos peticiones simultaneas roben la misma carta.
        card = current_pairing.cards.in_deck.order(Arel.sql("RANDOM()")).lock.first
        next unless card

        card.update!(drawn_at: Time.current, drawn_by: current_user)
        current_pairing.update!(current_turn_user: current_pairing.other_than(current_user))
      end

      unless card
        return render_error(:unprocessable_entity, "empty_deck",
                            "No quedan cartas en el mazo")
      end

      render json: {
        card: CardSerializer.call(card, current_user),
        cards_left: current_pairing.cards.in_deck.count,
        current_turn_user_id: current_pairing.reload.current_turn_user_id
      }
    end

    def reshuffle
      current_pairing.cards.update_all(drawn_at: nil, drawn_by_id: nil)
      render json: { cards_left: current_pairing.cards.count }
    end
  end
end
