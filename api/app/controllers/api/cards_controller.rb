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

    # Vetar hasta 4 cartas ajenas para que no salgan en la baraja. El limite y
    # que la carta siga en el mazo se validan en el modelo, no aqui: es la
    # misma regla la use quien la use.
    def ban
      card = carta_ajena
      ban = current_user.card_bans.new(card: card)

      if ban.save
        render json: { card: CardSerializer.call(card, current_user) }
      else
        render_error(:unprocessable_entity, "cannot_ban", ban.errors.full_messages.to_sentence)
      end
    end

    def unban
      card = carta_ajena
      current_user.card_bans.where(card: card).destroy_all
      render json: { card: CardSerializer.call(card, current_user) }
    end

    private

    # Sin pareja solo existen tus cartas; con pareja, la baraja de ambos.
    def mazo
      current_user.pairing&.cards || current_user.cards
    end

    def editable_card
      card = mazo.find(params[:id])

      # Solo el autor toca sus cartas. Que ya se haya jugado no la congela:
      # el mazo se rebaraja y se vuelve a jugar, asi que corregir una errata
      # o subir el tono de un reto sigue teniendo sentido despues.
      raise Forbidden, "not_your_card" unless card.author_id == current_user.id

      card
    end

    # Lo opuesto a editable_card: solo tiene sentido banear lo que escribio
    # la otra persona, nunca lo tuyo.
    def carta_ajena
      card = mazo.find(params[:id])
      raise Forbidden, "own_card" if card.author_id == current_user.id

      card
    end

    def card_params
      params.permit(:title, :challenge, :theme)
    end
  end
end
