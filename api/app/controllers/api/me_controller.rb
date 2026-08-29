module Api
  class MeController < ApplicationController
    def show
      pairing = current_user.pairing

      render json: {
        user: UserSerializer.call(current_user),
        pairing: pairing && { id: pairing.id,
                              current_turn_user_id: pairing.current_turn_user_id },
        partner: pairing && UserSerializer.partner(pairing.other_than(current_user))
      }
    end
  end
end
