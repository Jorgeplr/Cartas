class ApplicationController < ActionController::API
  include Authenticatable

  class Forbidden < StandardError; end

  rescue_from ActiveRecord::RecordNotFound do
    render_error(:not_found, "not_found", "No encontrado")
  end

  rescue_from ActiveRecord::RecordInvalid do |e|
    render_error(:unprocessable_entity, "validation_failed",
                 e.record.errors.full_messages.to_sentence)
  end

  rescue_from Authenticatable::Unauthorized do
    render_error(:unauthorized, "unauthorized", "Sesion invalida o expirada")
  end

  rescue_from Forbidden do |e|
    render_error(:forbidden, e.message.presence || "forbidden", "No tienes permiso para esto")
  end

  private

  def render_error(status, code, message)
    render json: { error: { code: code, message: message } }, status: status
  end
end
