module Helpers
  def json
    JSON.parse(response.body, symbolize_names: true)
  end

  def auth_headers(user)
    { "Authorization" => "Bearer #{JwtToken.encode(user.id)}" }
  end

  def crear_usuario(email, nombre = nil)
    User.create!(email: email, password: "secreto123", display_name: nombre)
  end
end
