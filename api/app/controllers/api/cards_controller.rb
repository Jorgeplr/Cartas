module Api
  class CardsController < ApplicationController
    include RequiresPairing

    def index
      cards = current_pairing.cards.order(created_at: :desc)
      render json: { cards: CardSerializer.collection(cards, current_user) }
    end

    def create
      card = current_pairing.cards.create!(card_params.merge(author: current_user))
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

    def editable_card
      card = current_pairing.cards.find(params[:id])

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
