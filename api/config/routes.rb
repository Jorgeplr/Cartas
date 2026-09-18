Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    post "auth/signup", to: "auth#signup"
    post "auth/login",  to: "auth#login"

    get  "me", to: "me#show"

    get    "pairing",        to: "pairings#show"
    post   "pairing/join",   to: "pairings#join"
    patch  "pairing/themes", to: "pairings#update_themes"
    delete "pairing",        to: "pairings#destroy"

    resources :cards, only: [:index, :create, :update, :destroy]
    post   "cards/:id/ban", to: "cards#ban"
    delete "cards/:id/ban", to: "cards#unban"

    post "draw",           to: "game#draw"
    post "deck/reshuffle", to: "game#reshuffle"

    get  "rps",        to: "rps#show"
    post "rps/choose", to: "rps#choose"

    get    "wildcard",      to: "wildcard#show"
    post   "wildcard",      to: "wildcard#set"
    delete "wildcard",      to: "wildcard#destroy"
    post   "wildcard/play", to: "wildcard#play"
  end
end
