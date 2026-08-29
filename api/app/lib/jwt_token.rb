module JwtToken
  ALGORITHM = "HS256".freeze
  TTL = 30.days

  def self.secret
    Rails.application.secret_key_base
  end

  def self.encode(user_id)
    JWT.encode({ user_id: user_id, exp: TTL.from_now.to_i }, secret, ALGORITHM)
  end

  def self.decode(token)
    JWT.decode(token, secret, true, algorithm: ALGORITHM).first
  rescue JWT::DecodeError
    nil
  end
end
