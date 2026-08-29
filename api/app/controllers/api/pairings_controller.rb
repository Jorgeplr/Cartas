module Api
  class PairingsController < ApplicationController
    def show
      pairing = current_user.pairing
      return render_error(:not_found, "no_pairing", "Aun no tienes pareja") unless pairing

      render json: PairingSerializer.call(pairing, current_user)
    end

    def join
      code = params[:code].to_s.strip.upcase
      other = User.find_by(invite_code: code)

      unless other
        return render_error(:unprocessable_entity, "code_not_found", "Ese codigo no existe")
      end

      if other.id == current_user.id
        return render_error(:unprocessable_entity, "self_pairing", "Ese es tu propio codigo")
      end

      if current_user.pairing || other.pairing
        return render_error(:unprocessable_entity, "already_paired",
                            "Uno de los dos ya tiene pareja")
      end

      # Quien se une empieza jugando: acaba de hacer el esfuerzo de entrar.
      pairing = Pairing.create!(user_a: other, user_b: current_user,
                                current_turn_user: current_user)

      render json: PairingSerializer.call(pairing, current_user), status: :created
    rescue ActiveRecord::RecordNotUnique
      # El indice unico de la base de datos es la ultima palabra si dos
      # peticiones simultaneas intentan emparejar a la misma persona.
      render_error(:unprocessable_entity, "already_paired", "Uno de los dos ya tiene pareja")
    end
  end
end
