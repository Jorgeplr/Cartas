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
        card = current_pairing.playable_cards.in_deck.order(Arel.sql("RANDOM()")).lock.first
        next unless card

        card.update!(drawn_at: Time.current, drawn_by: current_user)
        current_pairing.update!(current_turn_user: current_pairing.other_than(current_user))
      end

      return render_deck_empty unless card

      render json: {
        card: CardSerializer.call(card, current_user),
        cards_left: current_pairing.playable_cards.in_deck.count,
        current_turn_user_id: current_pairing.reload.current_turn_user_id
      }
    end

    def reshuffle
      # Vuelve la baraja ENTERA, tambien las tematicas apagadas: el filtro dice
      # que sale ahora, no que se borra. Si luego se enciende otra tematica, sus
      # cartas tienen que estar ahi.
      current_pairing.cards.update_all(drawn_at: nil, drawn_by_id: nil)
      # Rebarajar es el inicio de una partida nueva: ambos recuperan sus 4 baneos.
      current_pairing.clear_bans!
      render json: { cards_left: current_pairing.playable_cards.count }
    end

    private

    # "No quedan cartas" a secas seria mentira cuando la baraja esta llena y lo
    # que esta vacio es el filtro (tematicas apagadas o baneos): el jugador se
    # quedaria mirando un boton apagado sin saber que hay algo que tocar.
    def render_deck_empty
      if current_pairing.cards.in_deck.exists?
        render_error(:unprocessable_entity, "no_playable_cards",
                     "No quedan cartas jugables: revisa las tematicas activas y los baneos")
      else
        render_error(:unprocessable_entity, "empty_deck",
                     "No quedan cartas en el mazo")
      end
    end
  end
end
