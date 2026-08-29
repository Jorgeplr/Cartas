require "rails_helper"

RSpec.describe User do
  it "genera un codigo de invitacion de 6 caracteres sin ambiguos" do
    user = crear_usuario("a@b.com")
    expect(user.invite_code).to match(/\A[A-Z2-9]{6}\z/)
  end

  it "deriva el nombre visible del email" do
    expect(crear_usuario("ana@x.com").display_name).to eq("ana")
  end

  it "rechaza email duplicado sin importar mayusculas" do
    crear_usuario("a@b.com")
    expect(User.new(email: "A@B.COM", password: "secreto123")).not_to be_valid
  end

  it "rechaza contrasenas de menos de 8 caracteres" do
    expect(User.new(email: "c@d.com", password: "corta")).not_to be_valid
  end
end
