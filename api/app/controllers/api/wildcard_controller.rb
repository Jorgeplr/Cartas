module Api
  class WildcardController < ApplicationController
    include RequiresPairing

    def show
      render json: WildcardSerializer.call(comodin_actual, current_user)
    end

    # Elige (o reemplaza) tu comodin de esta partida: una carta propia que
    # todavia siga en el mazo. Reemplazar uno ya elegido pero sin jugar es
    # libre; una vez jugado, no se puede volver a elegir hasta rebarajar.
    def set
      if comodin_actual&.played?
        return render_error(:unprocessable_entity, "wildcard_already_played",
                             "Ya jugaste tu comodín en esta partida")
      end

      card = current_user.cards.in_deck.find(params[:card_id])
      nuevo = nil

      Wildcard.transaction do
        current_user.wildcards.active.destroy_all
        nuevo = current_user.wildcards.create!(card: card)
      end

      render json: WildcardSerializer.call(nuevo, current_user)
    rescue ActiveRecord::RecordInvalid => e
      render_error(:unprocessable_entity, "cannot_set_wildcard", e.record.errors.full_messages.to_sentence)
    end

    # Deshace la eleccion, no lo jugado: si ya se jugo no hay nada que
    # cancelar, la carta ya salio del mazo.
    def destroy
      current_user.wildcards.active.destroy_all
      render json: WildcardSerializer.call(nil, current_user)
    end

    # Jugarlo reemplaza el robo normal de tu turno: la carta reservada sale
    # garantizada, en vez de una al azar del resto del mazo.
    def play
      unless current_pairing.turn_of?(current_user)
        return render_error(:forbidden, "not_your_turn", "No es tu turno")
      end

      comodin = comodin_actual

      if comodin.nil?
        return render_error(:unprocessable_entity, "no_wildcard_chosen",
                             "No has elegido un comodín todavía")
      end

      if comodin.played?
        return render_error(:unprocessable_entity, "wildcard_already_played",
                             "Ya jugaste tu comodín en esta partida")
      end

      card = nil

      Pairing.transaction do
        card = comodin.card.lock!
        card.update!(drawn_at: Time.current, drawn_by: current_user)
        comodin.update!(played_at: Time.current)
        current_pairing.update!(current_turn_user: current_pairing.other_than(current_user))
      end

      render json: {
        card: CardSerializer.call(card, current_user),
        cards_left: current_pairing.playable_cards.in_deck.count,
        current_turn_user_id: current_pairing.reload.current_turn_user_id
      }
    end

    private

    def comodin_actual
      current_user.wildcards.order(created_at: :desc).first
    end
  end
end
