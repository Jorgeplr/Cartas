Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    post "auth/signup", to: "auth#signup"
    post "auth/login",  to: "auth#login"

    get  "me", to: "me#show"

    get  "pairing",      to: "pairings#show"
    post "pairing/join", to: "pairings#join"

    resources :cards, only: [:index, :create, :update, :destroy]

    post "draw",           to: "game#draw"
    post "deck/reshuffle", to: "game#reshuffle"
  end
end
