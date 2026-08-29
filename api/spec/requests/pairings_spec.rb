require "rails_helper"

RSpec.describe "Pairings" do
  let(:ana) { crear_usuario("ana@x.com") }
  let(:bea) { crear_usuario("bea@x.com") }

  it "empareja a dos usuarios libres y da el turno a quien se une" do
    post "/api/pairing/join", params: { code: ana.invite_code }, headers: auth_headers(bea)

    expect(response).to have_http_status(:created)
    expect(json[:partner][:display_name]).to eq("ana")
    expect(Pairing.count).to eq(1)
    expect(Pairing.first.current_turn_user_id).to eq(bea.id)
  end

  it "acepta el codigo en minusculas y con espacios" do
    post "/api/pairing/join", params: { code: "  #{ana.invite_code.downcase} " },
         headers: auth_headers(bea)

    expect(response).to have_http_status(:created)
  end

  it "rechaza tu propio codigo" do
    post "/api/pairing/join", params: { code: ana.invite_code }, headers: auth_headers(ana)

    expect(response).to have_http_status(:unprocessable_content)
    expect(json[:error][:code]).to eq("self_pairing")
  end

  it "rechaza un codigo inexistente" do
    post "/api/pairing/join", params: { code: "ZZZZZZ" }, headers: auth_headers(bea)
    expect(json[:error][:code]).to eq("code_not_found")
  end

  it "rechaza emparejar si alguno ya tiene pareja" do
    cris = crear_usuario("cris@x.com")
    post "/api/pairing/join", params: { code: ana.invite_code }, headers: auth_headers(bea)
    post "/api/pairing/join", params: { code: ana.invite_code }, headers: auth_headers(cris)

    expect(json[:error][:code]).to eq("already_paired")
    expect(Pairing.count).to eq(1)
  end
end
