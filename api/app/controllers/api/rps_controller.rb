module Api
  class RpsController < ApplicationController
    include RequiresPairing

    def show
      render json: RpsRoundSerializer.call(ronda_visible, current_user)
    end

    def choose
      eleccion = params[:choice].to_s

      unless RpsRound::ELECCIONES.include?(eleccion)
        return render_error(:unprocessable_entity, "invalid_choice", "Elige piedra, papel o tijera")
      end

      round = nil

      RpsRound.transaction do
        round = current_pairing.rps_rounds.sin_resolver.lock.first || crear_ronda
        round.set_choice(current_user, eleccion)
        round.resolver! if round.ambos_eligieron?
      end

      render json: RpsRoundSerializer.call(round, current_user)
    end

    private

    # Si ya hay una ronda abierta, es esa la que hay que ver. Si no, se
    # enseña la ultima jugada para que el resultado no desaparezca de la
    # pantalla del otro en cuanto termina.
    def ronda_visible
      current_pairing.rps_rounds.sin_resolver.first || current_pairing.rps_rounds.jugadas.first
    end

    # El indice unico de "una ronda sin resolver por pareja" es la ultima
    # palabra si dos peticiones simultaneas intentan abrir cada una la suya.
    def crear_ronda
      current_pairing.rps_rounds.create!
    rescue ActiveRecord::RecordNotUnique
      current_pairing.rps_rounds.sin_resolver.lock.first
    end
  end
end
