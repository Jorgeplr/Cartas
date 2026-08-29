require "rails_helper"

RSpec.describe "Auth" do
  it "registra y devuelve token" do
    post "/api/auth/signup", params: { email: "a@b.com", password: "secreto123" }

    expect(response).to have_http_status(:created)
    expect(json[:token]).to be_present
    expect(json[:user][:email]).to eq("a@b.com")
  end

  it "rechaza email duplicado con 422" do
    crear_usuario("a@b.com")
    post "/api/auth/signup", params: { email: "a@b.com", password: "secreto123" }

    expect(response).to have_http_status(:unprocessable_content)
    expect(json[:error][:code]).to eq("validation_failed")
  end

  it "loguea con credenciales correctas" do
    crear_usuario("a@b.com")
    post "/api/auth/login", params: { email: "a@b.com", password: "secreto123" }

    expect(response).to have_http_status(:ok)
    expect(json[:token]).to be_present
  end

  it "rechaza credenciales incorrectas con 401" do
    crear_usuario("a@b.com")
    post "/api/auth/login", params: { email: "a@b.com", password: "malamala" }

    expect(response).to have_http_status(:unauthorized)
    expect(json[:error][:code]).to eq("invalid_credentials")
  end

  it "GET /api/me exige token" do
    get "/api/me"
    expect(response).to have_http_status(:unauthorized)
  end

  it "GET /api/me devuelve el usuario y pairing nulo si no hay pareja" do
    user = crear_usuario("a@b.com")
    get "/api/me", headers: auth_headers(user)

    expect(json[:user][:invite_code]).to eq(user.invite_code)
    expect(json[:pairing]).to be_nil
    expect(json[:partner]).to be_nil
  end
end
