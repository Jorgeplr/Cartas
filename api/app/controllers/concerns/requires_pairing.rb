module RequiresPairing
  extend ActiveSupport::Concern

  included do
    before_action :require_pairing!
  end

  private

  def current_pairing
    @current_pairing ||= current_user.pairing
  end

  def require_pairing!
    return if current_pairing

    render_error(:unprocessable_entity, "no_pairing",
                 "Necesitas emparejarte con alguien antes de jugar")
  end
end
