module Authenticatable
  extend ActiveSupport::Concern

  class Unauthorized < StandardError; end

  included do
    before_action :authenticate!
  end

  private

  def current_user
    return @current_user if defined?(@current_user)

    header = request.headers["Authorization"].to_s
    payload = JwtToken.decode(header.delete_prefix("Bearer ").strip)
    @current_user = payload && User.find_by(id: payload["user_id"])
  end

  def authenticate!
    current_user || raise(Unauthorized)
  end
end
