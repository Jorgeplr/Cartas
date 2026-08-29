require "rails_helper"

RSpec.describe User do
  it "genera codigos de 6 caracteres sin ninguno ambiguo" do
    codigos = Array.new(25) { |i| crear_usuario("u#{i}@x.com").invite_code }

    codigos.each do |codigo|
      expect(codigo).to match(/\A[A-Z2-9]{6}\z/)
      # Ni 0/1 (fuera del alfabeto) ni las letras que se confunden con ellos.
      expect(codigo).not_to match(/[OI]/)
    end
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
