module Api
  class PairingsController < ApplicationController
    def show
      pairing = current_user.pairing
      return render_error(:not_found, "no_pairing", "Aun no tienes pareja") unless pairing

      render json: PairingSerializer.call(pairing, current_user)
    end

    # El filtro de tematicas es de la pareja, no de cada jugador: lo cambia
    # cualquiera de los dos, en cualquier turno, y al otro le llega solo con el
    # sondeo de la mesa.
    def update_themes
      pairing = current_user.pairing
      return render_error(:not_found, "no_pairing", "Aun no tienes pareja") unless pairing

      themes = Array(params[:themes]).map(&:to_s).uniq

      unless themes.any? && (themes - Card::TEMATICAS).empty?
        return render_error(:unprocessable_entity, "invalid_themes",
                            "Elige al menos una tematica valida")
      end

      pairing.update!(active_themes: themes)

      # Se devuelve la mesa entera, no solo las tematicas: los recuentos acaban
      # de cambiar con el filtro y pedirlos aparte dejaria un parpadeo.
      render json: PairingSerializer.call(pairing, current_user)
    end

    # Termina el emparejamiento. Cualquiera de los dos puede hacerlo, sin que
    # el otro tenga que confirmar: es una salida de emergencia, no una
    # negociacion. Las cartas de cada quien se quedan a su nombre -si alguno
    # se empareja de nuevo, entraran solas a la baraja de la nueva pareja,
    # igual que ya pasa con las escritas antes de emparejarse la primera vez.
    def destroy
      pairing = current_user.pairing
      return render_error(:not_found, "no_pairing", "Aun no tienes pareja") unless pairing

      pairing.clear_bans!
      pairing.clear_wildcards!
      pairing.destroy!
      head :no_content
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
