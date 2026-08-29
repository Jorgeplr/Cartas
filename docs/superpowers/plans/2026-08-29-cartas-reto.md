# Cartas de Reto — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App web dockerizada donde dos personas emparejadas 1:1 comparten una baraja de cartas-reto que escriben mutuamente y roban por turnos.

**Architecture:** Tres contenedores (postgres, Rails 8 API-only, Vite/React). La API expone JSON bajo `/api` con auth JWT Bearer. La pareja *es* la baraja: no hay tabla `decks`. El serializador oculta el texto de los retos ajenos no robados.

**Tech Stack:** Ruby 3.3 / Rails 8 / PostgreSQL 17 / RSpec · React 19 / TypeScript / Vite / Tailwind / Framer Motion / Vitest · Docker Compose

**Spec:** `docs/superpowers/specs/2026-08-29-cartas-reto-design.md`

---

## Estructura de archivos

```
docker-compose.yml            # db + api + web, healthcheck en db
.env.example                  # POSTGRES_PASSWORD, RAILS_MASTER_KEY

api/
  Dockerfile                  # multi-stage: target dev y target prod
  app/controllers/
    application_controller.rb # rescue_from + include Authenticatable
    concerns/authenticatable.rb
    api/auth_controller.rb    # signup, login
    api/me_controller.rb
    api/pairings_controller.rb
    api/cards_controller.rb
    api/game_controller.rb    # draw, reshuffle
  app/models/
    user.rb  pairing.rb  card.rb
  app/serializers/
    card_serializer.rb        # LA regla de ocultar retos vive aquí
    user_serializer.rb  pairing_serializer.rb
  app/lib/jwt_token.rb
  spec/requests/              # un archivo por controlador
  spec/models/

web/
  Dockerfile
  src/lib/api.ts              # fetch + token + logout en 401
  src/lib/types.ts            # contratos de la API
  src/auth/AuthContext.tsx    # sesión, login, signup, logout
  src/auth/guards.tsx         # RequireAuth, RequireAnon, RequirePairing
  src/design/tokens.css       # paleta y escala (ui-ux-pro-max)
  src/components/
    PlayCard.tsx              # la carta visual, compartida entre editor y mesa
    Button.tsx  Field.tsx  DifficultyPicker.tsx
  src/pages/
    Login.tsx  Signup.tsx  Pair.tsx  Table.tsx  Cards.tsx
    CardEditor.tsx            # split en vivo
  src/App.tsx  src/main.tsx
```

`PlayCard.tsx` se comparte entre el editor y la mesa a propósito: garantiza que la vista previa sea idéntica a lo que verá la otra persona.

---

## Task 1: Esqueleto Docker + Rails API arrancando

**Files:**
- Create: `docker-compose.yml`, `.env.example`, `api/Dockerfile`, `api/` (app Rails generada)

- [ ] **Step 1: Generar la app Rails dentro de un contenedor efímero**

```bash
docker run --rm -v "$PWD:/work" -w /work ruby:3.3-slim bash -c \
  "apt-get update -qq && apt-get install -y build-essential git libpq-dev && \
   gem install rails -v '~> 8.0' --no-document && \
   rails new api --api --database=postgresql --skip-test --skip-kamal --skip-solid --skip-jbuilder"
```

- [ ] **Step 2: Escribir `api/Dockerfile`**

```dockerfile
FROM ruby:3.3-slim AS base
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    build-essential libpq-dev postgresql-client git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install
COPY . .

FROM base AS dev
CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]

FROM base AS prod
ENV RAILS_ENV=production
CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]
```

- [ ] **Step 3: Escribir `docker-compose.yml`**

Servicios `db` (postgres:17-alpine, healthcheck `pg_isready -U postgres`, volumen `pgdata`),
`api` (build `./api` target `dev`, `depends_on: db: condition: service_healthy`,
volumen `./api:/app`, `DATABASE_URL=postgres://postgres:postgres@db:5432/cartas_development`,
puerto 3000), `web` (se añade en Task 7).

- [ ] **Step 4: Configurar `api/config/database.yml` para leer `DATABASE_URL`, y CORS**

Añadir `rack-cors` al Gemfile y `config/initializers/cors.rb` permitiendo
`http://localhost:5173` con headers `Authorization`.

- [ ] **Step 5: Levantar y verificar**

Run: `docker compose up -d db api && sleep 15 && curl -s localhost:3000/up`
Expected: HTML con `background-color: green` (health check de Rails)

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: esqueleto Docker con Postgres y Rails API"
```

---

## Task 2: Modelos y migraciones

**Files:**
- Create: `api/db/migrate/*_create_users.rb`, `*_create_pairings.rb`, `*_create_cards.rb`
- Create: `api/app/models/user.rb`, `pairing.rb`, `card.rb`
- Test: `api/spec/models/user_spec.rb`, `pairing_spec.rb`, `card_spec.rb`

- [ ] **Step 1: Instalar RSpec y bcrypt/jwt**

Añadir a `Gemfile`: `bcrypt`, `jwt`, y en `:development, :test` → `rspec-rails`, `factory_bot_rails`.
Run: `docker compose exec api bundle install && docker compose exec api bin/rails generate rspec:install`

- [ ] **Step 2: Escribir las migraciones**

`users`: `enable_extension "citext"`, columna `email` tipo `:citext` con
`null: false` e índice único; `password_digest`, `display_name`,
`invite_code` string(6) `null: false` índice único.

`pairings`: `user_a_id` y `user_b_id` (references users, `null: false`), cada uno
con **índice único propio**; `current_turn_user_id` references users `null: false`.

`cards`: `pairing_id` (references, índice), `author_id` (references users),
`title` string `null: false`, `challenge` text `null: false`,
`difficulty` string `null: false, default: "medio"`, `drawn_at` datetime.

- [ ] **Step 3: Escribir el test de modelos que falle**

```ruby
# spec/models/user_spec.rb
RSpec.describe User do
  it "genera invite_code de 6 caracteres al crear" do
    user = User.create!(email: "a@b.com", password: "secreto123")
    expect(user.invite_code).to match(/\A[A-Z2-9]{6}\z/)
  end

  it "rechaza email duplicado sin importar mayúsculas" do
    User.create!(email: "a@b.com", password: "secreto123")
    dup = User.new(email: "A@B.COM", password: "secreto123")
    expect(dup).not_to be_valid
  end

  it "rechaza contraseñas de menos de 8 caracteres" do
    expect(User.new(email: "c@d.com", password: "corta")).not_to be_valid
  end
end
```

```ruby
# spec/models/card_spec.rb
RSpec.describe Card do
  it "rechaza dificultad desconocida" do
    expect { build(:card, difficulty: "imposible") }.to raise_error(ArgumentError)
  end

  it "scope :in_deck excluye las robadas" do
    deck = create(:pairing)
    create(:card, pairing: deck, drawn_at: Time.current)
    live = create(:card, pairing: deck)
    expect(deck.cards.in_deck).to eq([live])
  end
end
```

- [ ] **Step 4: Verificar que falla**

Run: `docker compose exec api bundle exec rspec spec/models`
Expected: FAIL — `uninitialized constant User`

- [ ] **Step 5: Escribir los modelos**

```ruby
# app/models/user.rb
class User < ApplicationRecord
  has_secure_password
  has_many :cards, foreign_key: :author_id, dependent: :destroy

  validates :email, presence: true, uniqueness: true,
            format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, allow_nil: true

  before_validation :assign_defaults, on: :create

  ALPHABET = ("A".."Z").to_a + ("2".."9").to_a  # sin 0/O/1/I

  def pairing
    Pairing.where(user_a_id: id).or(Pairing.where(user_b_id: id)).first
  end

  def partner
    p = pairing or return nil
    p.user_a_id == id ? p.user_b : p.user_a
  end

  private

  def assign_defaults
    self.display_name ||= email.to_s.split("@").first
    self.invite_code ||= loop do
      code = Array.new(6) { ALPHABET.sample }.join
      break code unless User.exists?(invite_code: code)
    end
  end
end
```

```ruby
# app/models/pairing.rb
class Pairing < ApplicationRecord
  belongs_to :user_a, class_name: "User"
  belongs_to :user_b, class_name: "User"
  belongs_to :current_turn_user, class_name: "User"
  has_many :cards, dependent: :destroy

  def members = [user_a, user_b]
  def other_than(user) = user_a_id == user.id ? user_b : user_a
end
```

```ruby
# app/models/card.rb
class Card < ApplicationRecord
  belongs_to :pairing
  belongs_to :author, class_name: "User"

  enum :difficulty, { facil: "facil", medio: "medio", dificil: "dificil" },
       validate: true

  validates :title, presence: true, length: { maximum: 60 }
  validates :challenge, presence: true, length: { maximum: 280 }

  scope :in_deck, -> { where(drawn_at: nil) }

  def drawn? = drawn_at.present?
end
```

- [ ] **Step 6: Migrar y verificar que pasa**

Run: `docker compose exec api bin/rails db:create db:migrate && docker compose exec api bundle exec rspec spec/models`
Expected: PASS, 5 examples 0 failures

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: modelos User, Pairing y Card"
```

---

## Task 3: Autenticación JWT

**Files:**
- Create: `api/app/lib/jwt_token.rb`, `api/app/controllers/concerns/authenticatable.rb`
- Create: `api/app/controllers/api/auth_controller.rb`, `api/app/controllers/api/me_controller.rb`
- Modify: `api/app/controllers/application_controller.rb`, `api/config/routes.rb`
- Test: `api/spec/requests/auth_spec.rb`

- [ ] **Step 1: Escribir el request spec que falle**

```ruby
# spec/requests/auth_spec.rb
RSpec.describe "Auth" do
  it "registra y devuelve token" do
    post "/api/auth/signup", params: { email: "a@b.com", password: "secreto123" }
    expect(response).to have_http_status(:created)
    expect(json[:token]).to be_present
    expect(json[:user][:email]).to eq("a@b.com")
  end

  it "rechaza email duplicado con 422" do
    User.create!(email: "a@b.com", password: "secreto123")
    post "/api/auth/signup", params: { email: "a@b.com", password: "secreto123" }
    expect(response).to have_http_status(:unprocessable_entity)
    expect(json[:error][:code]).to eq("validation_failed")
  end

  it "loguea con credenciales correctas y falla con 401 si no" do
    User.create!(email: "a@b.com", password: "secreto123")
    post "/api/auth/login", params: { email: "a@b.com", password: "secreto123" }
    expect(response).to have_http_status(:ok)
    post "/api/auth/login", params: { email: "a@b.com", password: "malamala" }
    expect(response).to have_http_status(:unauthorized)
  end

  it "GET /api/me exige token" do
    get "/api/me"
    expect(response).to have_http_status(:unauthorized)
  end

  it "GET /api/me devuelve el usuario con token válido" do
    user = User.create!(email: "a@b.com", password: "secreto123")
    get "/api/me", headers: auth_headers(user)
    expect(json[:user][:invite_code]).to eq(user.invite_code)
    expect(json[:pairing]).to be_nil
  end
end
```

Helpers en `spec/support/helpers.rb`:

```ruby
module Helpers
  def json = JSON.parse(response.body, symbolize_names: true)
  def auth_headers(user) = { "Authorization" => "Bearer #{JwtToken.encode(user.id)}" }
end
```

- [ ] **Step 2: Verificar que falla**

Run: `docker compose exec api bundle exec rspec spec/requests/auth_spec.rb`
Expected: FAIL — rutas inexistentes (404)

- [ ] **Step 3: Implementar `JwtToken`**

```ruby
# app/lib/jwt_token.rb
module JwtToken
  ALGORITHM = "HS256"
  TTL = 30.days

  def self.secret = Rails.application.secret_key_base

  def self.encode(user_id)
    JWT.encode({ user_id: user_id, exp: TTL.from_now.to_i }, secret, ALGORITHM)
  end

  def self.decode(token)
    JWT.decode(token, secret, true, algorithm: ALGORITHM).first
  rescue JWT::DecodeError
    nil
  end
end
```

- [ ] **Step 4: Implementar `Authenticatable` y `ApplicationController`**

```ruby
# app/controllers/concerns/authenticatable.rb
module Authenticatable
  extend ActiveSupport::Concern
  class Unauthorized < StandardError; end

  included { before_action :authenticate! }

  private

  def current_user
    @current_user ||= begin
      header = request.headers["Authorization"].to_s
      payload = JwtToken.decode(header.delete_prefix("Bearer ").strip)
      payload && User.find_by(id: payload["user_id"])
    end
  end

  def authenticate! = current_user || raise(Unauthorized)
end
```

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::API
  include Authenticatable
  class Forbidden < StandardError; end

  rescue_from ActiveRecord::RecordNotFound do |e|
    render_error(:not_found, "not_found", "No encontrado")
  end
  rescue_from ActiveRecord::RecordInvalid do |e|
    render_error(:unprocessable_entity, "validation_failed",
                 e.record.errors.full_messages.to_sentence)
  end
  rescue_from Authenticatable::Unauthorized do
    render_error(:unauthorized, "unauthorized", "Sesión inválida o expirada")
  end
  rescue_from Forbidden do |e|
    render_error(:forbidden, e.message.presence || "forbidden", "No permitido")
  end

  private

  def render_error(status, code, message)
    render json: { error: { code: code, message: message } }, status: status
  end
end
```

- [ ] **Step 5: Implementar controladores y rutas**

`Api::AuthController` con `skip_before_action :authenticate!`, acciones
`signup` (crea usuario con `create!`, responde 201 con token) y `login`
(`User.find_by(email:)&.authenticate(password)` o `render_error(:unauthorized,
"invalid_credentials", "Email o contraseña incorrectos")`).

`Api::MeController#show` responde `{ user:, pairing:, partner: }` usando los
serializadores. `pairing` y `partner` son `nil` si no hay pareja.

`config/routes.rb`:

```ruby
namespace :api do
  post "auth/signup", to: "auth#signup"
  post "auth/login",  to: "auth#login"
  get  "me",          to: "me#show"
end
```

- [ ] **Step 6: Verificar que pasa**

Run: `docker compose exec api bundle exec rspec spec/requests/auth_spec.rb`
Expected: PASS, 5 examples 0 failures

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: autenticación JWT con signup y login"
```

---

## Task 4: Emparejamiento 1:1

**Files:**
- Create: `api/app/controllers/api/pairings_controller.rb`, `api/app/serializers/pairing_serializer.rb`
- Modify: `api/config/routes.rb`
- Test: `api/spec/requests/pairings_spec.rb`

- [ ] **Step 1: Escribir el request spec que falle**

```ruby
RSpec.describe "Pairings" do
  let(:ana) { User.create!(email: "ana@x.com", password: "secreto123") }
  let(:bea) { User.create!(email: "bea@x.com", password: "secreto123") }

  it "empareja a dos usuarios libres y da el turno a quien se une" do
    post "/api/pairing/join", params: { code: ana.invite_code }, headers: auth_headers(bea)
    expect(response).to have_http_status(:created)
    expect(json[:partner][:display_name]).to eq("ana")
    expect(Pairing.count).to eq(1)
    expect(Pairing.first.current_turn_user_id).to eq(bea.id)
  end

  it "rechaza tu propio código" do
    post "/api/pairing/join", params: { code: ana.invite_code }, headers: auth_headers(ana)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(json[:error][:code]).to eq("self_pairing")
  end

  it "rechaza código inexistente" do
    post "/api/pairing/join", params: { code: "ZZZZZZ" }, headers: auth_headers(bea)
    expect(json[:error][:code]).to eq("code_not_found")
  end

  it "rechaza si alguno ya tiene pareja" do
    cris = User.create!(email: "cris@x.com", password: "secreto123")
    post "/api/pairing/join", params: { code: ana.invite_code }, headers: auth_headers(bea)
    post "/api/pairing/join", params: { code: ana.invite_code }, headers: auth_headers(cris)
    expect(json[:error][:code]).to eq("already_paired")
    expect(Pairing.count).to eq(1)
  end
end
```

- [ ] **Step 2: Verificar que falla**

Run: `docker compose exec api bundle exec rspec spec/requests/pairings_spec.rb`
Expected: FAIL — 404 en todas

- [ ] **Step 3: Implementar el controlador**

```ruby
# app/controllers/api/pairings_controller.rb
module Api
  class PairingsController < ApplicationController
    def show
      pairing = current_user.pairing
      return render_error(:not_found, "no_pairing", "Aún no tienes pareja") unless pairing
      render json: PairingSerializer.call(pairing, current_user)
    end

    def join
      code = params[:code].to_s.strip.upcase
      other = User.find_by(invite_code: code)

      return render_error(:unprocessable_entity, "code_not_found", "Ese código no existe") unless other
      return render_error(:unprocessable_entity, "self_pairing", "Ese es tu propio código") if other.id == current_user.id

      pairing = nil
      Pairing.transaction do
        if current_user.pairing || other.pairing
          return render_error(:unprocessable_entity, "already_paired", "Uno de los dos ya tiene pareja")
        end
        pairing = Pairing.create!(user_a: other, user_b: current_user,
                                  current_turn_user: current_user)
      end
      render json: PairingSerializer.call(pairing, current_user), status: :created
    rescue ActiveRecord::RecordNotUnique
      render_error(:unprocessable_entity, "already_paired", "Uno de los dos ya tiene pareja")
    end
  end
end
```

El `rescue ActiveRecord::RecordNotUnique` cubre la carrera entre dos peticiones
simultáneas: el índice único de la base de datos es la última palabra.

- [ ] **Step 4: Implementar `PairingSerializer`**

Devuelve `{ pairing: { id, current_turn_user_id }, partner: UserSerializer, cards_left: Integer }`.

- [ ] **Step 5: Rutas y verificación**

```ruby
get  "pairing",      to: "pairings#show"
post "pairing/join", to: "pairings#join"
```

Run: `docker compose exec api bundle exec rspec spec/requests/pairings_spec.rb`
Expected: PASS, 4 examples 0 failures

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: emparejamiento 1:1 por código de invitación"
```

---

## Task 5: CRUD de cartas con retos ajenos ocultos

**Files:**
- Create: `api/app/controllers/api/cards_controller.rb`, `api/app/serializers/card_serializer.rb`
- Test: `api/spec/requests/cards_spec.rb`

- [ ] **Step 1: Escribir el request spec que falle**

```ruby
RSpec.describe "Cards" do
  let(:ana) { User.create!(email: "ana@x.com", password: "secreto123") }
  let(:bea) { User.create!(email: "bea@x.com", password: "secreto123") }
  let!(:pairing) { Pairing.create!(user_a: ana, user_b: bea, current_turn_user: ana) }

  it "crea una carta en la baraja de la pareja" do
    post "/api/cards", params: { title: "Baile", challenge: "Baila 30s", difficulty: "facil" },
         headers: auth_headers(ana)
    expect(response).to have_http_status(:created)
    expect(Card.last.pairing_id).to eq(pairing.id)
    expect(Card.last.author_id).to eq(ana.id)
  end

  it "OCULTA el reto de las cartas ajenas no robadas" do
    Card.create!(pairing: pairing, author: bea, title: "Secreto",
                 challenge: "TEXTO PROHIBIDO", difficulty: "medio")
    get "/api/cards", headers: auth_headers(ana)
    card = json[:cards].first
    expect(card[:title]).to eq("Secreto")
    expect(card[:challenge]).to be_nil
    expect(card[:hidden]).to be(true)
    expect(response.body).not_to include("TEXTO PROHIBIDO")
  end

  it "muestra el reto de tus propias cartas" do
    Card.create!(pairing: pairing, author: ana, title: "Mía",
                 challenge: "Mi texto", difficulty: "medio")
    get "/api/cards", headers: auth_headers(ana)
    expect(json[:cards].first[:challenge]).to eq("Mi texto")
  end

  it "revela el reto ajeno una vez robada" do
    Card.create!(pairing: pairing, author: bea, title: "Ya salió",
                 challenge: "Visible", difficulty: "medio", drawn_at: Time.current)
    get "/api/cards", headers: auth_headers(ana)
    expect(json[:cards].first[:challenge]).to eq("Visible")
  end

  it "prohíbe editar o borrar carta ajena con 403" do
    card = Card.create!(pairing: pairing, author: bea, title: "T", challenge: "C", difficulty: "medio")
    patch "/api/cards/#{card.id}", params: { title: "Hackeada" }, headers: auth_headers(ana)
    expect(response).to have_http_status(:forbidden)
    delete "/api/cards/#{card.id}", headers: auth_headers(ana)
    expect(response).to have_http_status(:forbidden)
  end

  it "prohíbe editar una carta ya robada" do
    card = Card.create!(pairing: pairing, author: ana, title: "T", challenge: "C",
                        difficulty: "medio", drawn_at: Time.current)
    patch "/api/cards/#{card.id}", params: { title: "Nueva" }, headers: auth_headers(ana)
    expect(response).to have_http_status(:forbidden)
  end

  it "exige pareja para crear cartas" do
    sola = User.create!(email: "sola@x.com", password: "secreto123")
    post "/api/cards", params: { title: "T", challenge: "C", difficulty: "facil" },
         headers: auth_headers(sola)
    expect(json[:error][:code]).to eq("no_pairing")
  end
end
```

- [ ] **Step 2: Verificar que falla**

Run: `docker compose exec api bundle exec rspec spec/requests/cards_spec.rb`
Expected: FAIL — 404

- [ ] **Step 3: Implementar `CardSerializer` — aquí vive la regla del juego**

```ruby
# app/serializers/card_serializer.rb
module CardSerializer
  # Un reto solo es visible si lo escribiste tú o si la carta ya fue robada.
  def self.call(card, viewer)
    visible = card.author_id == viewer.id || card.drawn?
    {
      id: card.id,
      title: card.title,
      difficulty: card.difficulty,
      mine: card.author_id == viewer.id,
      drawn: card.drawn?,
      hidden: !visible,
      challenge: visible ? card.challenge : nil
    }
  end

  def self.collection(cards, viewer) = cards.map { call(_1, viewer) }
end
```

- [ ] **Step 4: Implementar el controlador**

`index` ordena por `created_at` y serializa con `CardSerializer.collection`.
`create` usa `current_pairing.cards.create!(card_params.merge(author: current_user))`.
`update`/`destroy` buscan dentro de `current_pairing.cards` y llaman a un
`authorize_edit!` privado que lanza `Forbidden` si `card.author_id != current_user.id`
o si `card.drawn?`.

Un `before_action :require_pairing!` compartido responde
`render_error(:unprocessable_entity, "no_pairing", "Necesitas una pareja")` si
`current_user.pairing` es nil. Va en un concern `RequiresPairing` porque
`GameController` lo necesita igual.

- [ ] **Step 5: Verificar que pasa**

Run: `docker compose exec api bundle exec rspec spec/requests/cards_spec.rb`
Expected: PASS, 7 examples 0 failures

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: CRUD de cartas ocultando los retos ajenos"
```

---

## Task 6: Robar y rebarajar

**Files:**
- Create: `api/app/controllers/api/game_controller.rb`
- Test: `api/spec/requests/game_spec.rb`

- [ ] **Step 1: Escribir el request spec que falle**

```ruby
RSpec.describe "Game" do
  let(:ana) { User.create!(email: "ana@x.com", password: "secreto123") }
  let(:bea) { User.create!(email: "bea@x.com", password: "secreto123") }
  let!(:pairing) { Pairing.create!(user_a: ana, user_b: bea, current_turn_user: ana) }

  def add_cards(n) = n.times { |i| Card.create!(pairing: pairing, author: bea,
                       title: "C#{i}", challenge: "Reto #{i}", difficulty: "medio") }

  it "roba una carta, la marca y pasa el turno" do
    add_cards(1)
    post "/api/draw", headers: auth_headers(ana)
    expect(response).to have_http_status(:ok)
    expect(json[:card][:challenge]).to eq("Reto 0")
    expect(Card.first.drawn_at).to be_present
    expect(pairing.reload.current_turn_user_id).to eq(bea.id)
  end

  it "nunca devuelve dos veces la misma carta" do
    add_cards(5)
    ids = 5.times.map do |i|
      turn = pairing.reload.current_turn_user_id == ana.id ? ana : bea
      post "/api/draw", headers: auth_headers(turn)
      json[:card][:id]
    end
    expect(ids.uniq.size).to eq(5)
  end

  it "da 403 si no es tu turno" do
    add_cards(1)
    post "/api/draw", headers: auth_headers(bea)
    expect(response).to have_http_status(:forbidden)
    expect(json[:error][:code]).to eq("not_your_turn")
  end

  it "da 422 si el mazo está vacío" do
    post "/api/draw", headers: auth_headers(ana)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(json[:error][:code]).to eq("empty_deck")
  end

  it "rebarajar devuelve todas las cartas al mazo" do
    add_cards(3)
    Card.update_all(drawn_at: Time.current)
    post "/api/deck/reshuffle", headers: auth_headers(ana)
    expect(json[:cards_left]).to eq(3)
    expect(Card.where.not(drawn_at: nil)).to be_empty
  end
end
```

- [ ] **Step 2: Verificar que falla**

Run: `docker compose exec api bundle exec rspec spec/requests/game_spec.rb`
Expected: FAIL — 404

- [ ] **Step 3: Implementar el controlador**

```ruby
# app/controllers/api/game_controller.rb
module Api
  class GameController < ApplicationController
    include RequiresPairing

    def draw
      pairing = current_pairing
      unless pairing.current_turn_user_id == current_user.id
        return render_error(:forbidden, "not_your_turn", "No es tu turno")
      end

      card = nil
      Pairing.transaction do
        card = pairing.cards.in_deck.lock.order("RANDOM()").first
        break unless card
        card.update!(drawn_at: Time.current)
        pairing.update!(current_turn_user: pairing.other_than(current_user))
      end

      return render_error(:unprocessable_entity, "empty_deck", "No quedan cartas") unless card

      render json: { card: CardSerializer.call(card.reload, current_user),
                     cards_left: pairing.cards.in_deck.count,
                     current_turn_user_id: pairing.reload.current_turn_user_id }
    end

    def reshuffle
      current_pairing.cards.update_all(drawn_at: nil)
      render json: { cards_left: current_pairing.cards.count }
    end
  end
end
```

`.lock` sobre la fila evita que dos peticiones simultáneas roben la misma carta.
`card.reload` tras el update hace que el serializador la vea como `drawn?` y
revele el reto aunque sea de la otra persona.

- [ ] **Step 4: Rutas y verificación**

```ruby
post "draw",           to: "game#draw"
post "deck/reshuffle", to: "game#reshuffle"
```

Run: `docker compose exec api bundle exec rspec`
Expected: PASS, todas las suites, 0 failures

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: robar carta por turnos y rebarajar"
```

---

## Task 7: Frontend dockerizado con cliente API y rutas

**Files:**
- Create: `web/` (Vite scaffold), `web/Dockerfile`, `web/src/lib/api.ts`, `web/src/lib/types.ts`
- Create: `web/src/auth/AuthContext.tsx`, `web/src/auth/guards.tsx`, `web/src/App.tsx`
- Modify: `docker-compose.yml` (servicio `web`)
- Test: `web/src/lib/api.test.ts`, `web/src/auth/guards.test.tsx`

- [ ] **Step 1: Generar el scaffold**

```bash
docker run --rm -v "$PWD:/work" -w /work node:22-alpine \
  npm create vite@latest web -- --template react-ts
```

Instalar: `tailwindcss @tailwindcss/vite framer-motion react-router-dom`
y en dev: `vitest @testing-library/react @testing-library/jest-dom jsdom`.

`vite.config.ts` necesita `server: { host: true, port: 5173, watch: { usePolling: true } }`
— sin `usePolling` el hot reload no ve los cambios a través del volumen de Docker en Windows.

- [ ] **Step 2: Añadir el servicio `web` a `docker-compose.yml`**

Build `./web`, volumen `./web:/app` más volumen anónimo `/app/node_modules`,
`VITE_API_URL=http://localhost:3000/api`, puerto 5173, `command: npm run dev`.

- [ ] **Step 3: Escribir el test del cliente API que falle**

```ts
// src/lib/api.test.ts
it("adjunta el token Bearer cuando hay sesión", async () => {
  localStorage.setItem("token", "abc");
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  await api.get("/cards");
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer abc");
});

it("borra el token y lanza ApiError ante un 401", async () => {
  localStorage.setItem("token", "caducado");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
    JSON.stringify({ error: { code: "unauthorized", message: "Sesión inválida" } }),
    { status: 401 })));
  await expect(api.get("/cards")).rejects.toThrow("Sesión inválida");
  expect(localStorage.getItem("token")).toBeNull();
});
```

- [ ] **Step 4: Verificar que falla**

Run: `docker compose exec web npx vitest run src/lib/api.test.ts`
Expected: FAIL — no existe `./api`

- [ ] **Step 5: Implementar `src/lib/types.ts` y `src/lib/api.ts`**

```ts
// types.ts
export type Difficulty = "facil" | "medio" | "dificil";
export interface User { id: number; email: string; display_name: string; invite_code: string }
export interface Card { id: number; title: string; difficulty: Difficulty;
  mine: boolean; drawn: boolean; hidden: boolean; challenge: string | null }
export interface Pairing { id: number; current_turn_user_id: number }
export interface Session { user: User; pairing: Pairing | null; partner: User | null }
```

`api.ts` exporta `ApiError` (con `code` y `message`), `getToken/setToken/clearToken`
sobre `localStorage`, y `api.get/post/patch/del`. Ante un 401 llama a `clearToken()`
y despacha `window.dispatchEvent(new Event("auth:expired"))` — el `AuthContext`
escucha ese evento y limpia la sesión, así el cliente HTTP no depende de React Router.

- [ ] **Step 6: Implementar `AuthContext` y los guards**

`AuthContext` guarda `session`, `loading`, y expone `login`, `signup`, `logout`,
`refresh`. Al montar, si hay token, llama a `GET /me`.

`guards.tsx`: `RequireAuth` (sin sesión → `/login`), `RequireAnon` (con sesión → `/`),
`RequirePairing` (sesión sin `pairing` → `/pair`). Mientras `loading` es true,
todos renderizan un spinner en vez de redirigir — si no, un refresh de página
te expulsa al login antes de que llegue la respuesta de `/me`.

- [ ] **Step 7: Test de los guards**

```tsx
it("manda a /pair cuando hay sesión pero no pareja", () => {
  renderWithSession({ user, pairing: null, partner: null },
    <Routes>
      <Route element={<RequirePairing />}>
        <Route path="/" element={<div>mesa</div>} />
      </Route>
      <Route path="/pair" element={<div>emparejar</div>} />
    </Routes>);
  expect(screen.getByText("emparejar")).toBeInTheDocument();
});
```

- [ ] **Step 8: Verificar que pasa**

Run: `docker compose exec web npx vitest run`
Expected: PASS, 3 tests

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: frontend React con cliente API, sesión y guards"
```

---

## Task 8: Sistema de diseño y componentes base

**Files:**
- Create: `web/src/design/tokens.css`, `web/src/components/PlayCard.tsx`,
  `Button.tsx`, `Field.tsx`, `DifficultyPicker.tsx`

- [ ] **Step 1: Invocar la skill `ui-ux-pro-max`**

Pedirle el sistema para: tono fiesta/amigos, paleta fucsia + lima sobre fondo
oscuro profundo, sans geométrica gruesa, target React + Tailwind. Fijar la
paleta concreta, la escala tipográfica, radios, sombras y estados de interacción
en `tokens.css` como variables CSS.

- [ ] **Step 2: Implementar `PlayCard.tsx`**

Props: `{ title, challenge, difficulty, faceDown?, hidden?, onClick? }`.
Proporción fija 2:3, borde coloreado según dificultad, dorso con patrón cuando
`faceDown`. Es **el mismo componente** que usan el editor y la mesa: por eso la
vista previa es fiel.

- [ ] **Step 3: Verificar visualmente**

Run: `docker compose up -d web` y abrir `http://localhost:5173`
Expected: los componentes se ven con la paleta correcta en una página de prueba

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: sistema de diseño y componentes base"
```

---

## Task 9: Pantallas de Login y Registro

**Files:**
- Create: `web/src/pages/Login.tsx`, `web/src/pages/Signup.tsx`

- [ ] **Step 1: Implementar ambas pantallas**

Formulario centrado sobre fondo oscuro, email + contraseña, enlace cruzado entre
las dos. Estado de error del servidor bajo el botón (mensaje de `ApiError`),
botón deshabilitado mientras se envía.

- [ ] **Step 2: Verificar el flujo completo con la API real**

Run: registrar `test@test.com / secreto123` desde el navegador
Expected: redirige a `/pair` mostrando tu código de invitación

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: pantallas de login y registro"
```

---

## Task 10: Pantalla de emparejamiento

**Files:**
- Create: `web/src/pages/Pair.tsx`

- [ ] **Step 1: Implementar**

Dos bloques: arriba tu código en tipografía enorme con botón de copiar; abajo un
input de 6 caracteres (auto-mayúsculas) y botón "Emparejar". Los errores del
servidor se mapean a mensajes en español por `code`: `code_not_found`,
`self_pairing`, `already_paired`. Al emparejar con éxito, `refresh()` de la
sesión y redirección a `/`.

- [ ] **Step 2: Verificar con dos usuarios**

Run: registrar un segundo usuario en una ventana de incógnito y meter el código
Expected: ambos llegan a la mesa; el que se unió tiene el turno

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: pantalla de emparejamiento por código"
```

---

## Task 11: Mis cartas y el editor en vivo

**Files:**
- Create: `web/src/pages/Cards.tsx`, `web/src/pages/CardEditor.tsx`
- Test: `web/src/pages/CardEditor.test.tsx`

- [ ] **Step 1: Escribir el test del editor que falle**

```tsx
it("refleja el título escrito en la vista previa", async () => {
  render(<CardEditor onSave={vi.fn()} />);
  await userEvent.type(screen.getByLabelText("Título"), "Baile");
  expect(screen.getByTestId("preview")).toHaveTextContent("Baile");
});

it("impide guardar si el reto supera 280 caracteres", async () => {
  render(<CardEditor onSave={vi.fn()} />);
  await userEvent.type(screen.getByLabelText("Título"), "T");
  fireEvent.change(screen.getByLabelText("El reto"), { target: { value: "x".repeat(281) } });
  expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();
});
```

- [ ] **Step 2: Verificar que falla**

Run: `docker compose exec web npx vitest run src/pages/CardEditor.test.tsx`
Expected: FAIL — no existe el módulo

- [ ] **Step 3: Implementar el editor**

Split en dos columnas (apilado en móvil). Izquierda: `Field` para título (máx 60),
textarea para el reto con contador `n/280` que se pone en rojo al pasarse, y
`DifficultyPicker` como segmented control. Derecha: `<PlayCard>` con los valores
en vivo dentro de un contenedor `sticky`.

- [ ] **Step 4: Implementar `Cards.tsx`**

Grid de tus cartas usando `PlayCard`; las de tu pareja se muestran `faceDown`
con su título y un candado, para que veas cuántas te esperan sin spoilearte.
Botón flotante "Nueva carta" que abre el editor en un panel. Editar y borrar
solo en las tuyas no robadas.

- [ ] **Step 5: Verificar que pasa**

Run: `docker compose exec web npx vitest run`
Expected: PASS, todos los tests

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: gestión de cartas con editor de vista previa en vivo"
```

---

## Task 12: La mesa de juego

**Files:**
- Create: `web/src/pages/Table.tsx`

- [ ] **Step 1: Implementar**

Centro: el mazo boca abajo con efecto de pila (tres `PlayCard faceDown`
desplazadas unos grados) y el contador de cartas restantes. Arriba: los dos
nombres, con el del turno actual resaltado. Abajo: botón ROBAR grande,
deshabilitado si no es tu turno o el mazo está vacío, con el motivo escrito
debajo.

Al robar, `framer-motion` anima la carta: se despega del mazo, rota 180° en Y
revelando la cara, y queda centrada. Un botón "Siguiente" la descarta y
devuelve la vista al mazo. Con el mazo vacío aparece "Rebarajar".

Refresco tras cada acción con `refresh()` del contexto para que el turno se vea
actualizado.

- [ ] **Step 2: Verificar el juego completo**

Run: con las dos sesiones abiertas, crear 3 cartas cada una y robar por turnos
Expected: cada robo revela un reto nuevo, el turno alterna, el contador baja, y
al agotarse aparece "Rebarajar"

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: mesa de juego con robo animado por turnos"
```

---

## Task 13: Build de producción y README

**Files:**
- Create: `web/nginx.conf`, `docker-compose.prod.yml`, `README.md`
- Modify: `web/Dockerfile` (stage `prod`)

- [ ] **Step 1: Añadir el stage de producción al Dockerfile del front**

`npm run build` en un stage node, copiar `dist` a `nginx:alpine`, con
`try_files $uri /index.html` para que las rutas de React Router funcionen al
recargar.

- [ ] **Step 2: Escribir `docker-compose.prod.yml`**

Mismos servicios con `target: prod`, sin volúmenes de código, y variables desde
`.env`.

- [ ] **Step 3: Verificar el build**

Run: `docker compose -f docker-compose.prod.yml up --build -d && curl -sI localhost`
Expected: `HTTP/1.1 200 OK`

- [ ] **Step 4: Escribir el README**

Qué es, cómo levantarlo (`cp .env.example .env && docker compose up`), cómo
correr los tests de ambos lados, y el mapa de endpoints.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: build de producción con nginx y README"
```

---

## Verificación final

- [ ] `docker compose exec api bundle exec rspec` → todo verde
- [ ] `docker compose exec web npx vitest run` → todo verde
- [ ] Flujo manual end-to-end con dos sesiones: registro → emparejar → crear
      cartas → robar por turnos → rebarajar
- [ ] Comprobar en la pestaña de red del navegador que la respuesta de
      `GET /api/cards` **no contiene** el texto de los retos de la otra persona
