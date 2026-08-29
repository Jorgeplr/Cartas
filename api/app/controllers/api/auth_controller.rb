module Api
  class AuthController < ApplicationController
    skip_before_action :authenticate!

    def signup
      user = User.create!(email: params[:email], password: params[:password])
      render json: sesion(user), status: :created
    end

    def login
      user = User.find_by(email: params[:email].to_s.strip)

      unless user&.authenticate(params[:password].to_s)
        return render_error(:unauthorized, "invalid_credentials",
                            "Email o contrasena incorrectos")
      end

      render json: sesion(user), status: :ok
    end

    private

    def sesion(user)
      { token: JwtToken.encode(user.id), user: UserSerializer.call(user) }
    end
  end
end
