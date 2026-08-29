module Api
  class CardsController < ApplicationController
    # A proposito NO exige pareja: se puede ir llenando el mazo mientras
    # esperas a que la otra persona se una.
    def index
      render json: { cards: CardSerializer.collection(mazo.order(created_at: :desc), current_user) }
    end

    def create
      card = current_user.cards.create!(card_params)
      render json: { card: CardSerializer.call(card, current_user) }, status: :created
    end

    def update
      card = editable_card
      card.update!(card_params)
      render json: { card: CardSerializer.call(card, current_user) }
    end

    def destroy
      editable_card.destroy!
      head :no_content
    end

    private

    # Sin pareja solo existen tus cartas; con pareja, la baraja de ambos.
    def mazo
      current_user.pairing&.cards || current_user.cards
    end

    def editable_card
      card = mazo.find(params[:id])

      raise Forbidden, "not_your_card" unless card.author_id == current_user.id
      # Una carta ya robada es historia: no se reescribe lo que la otra
      # persona ya leyo.
      raise Forbidden, "card_already_drawn" if card.drawn?

      card
    end

    def card_params
      params.permit(:title, :challenge, :difficulty)
    end
  end
end
