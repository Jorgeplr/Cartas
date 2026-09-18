class RpsRound < ApplicationRecord
  belongs_to :pairing
  belongs_to :winner, class_name: "User", optional: true

  ELECCIONES = %w[piedra papel tijera].freeze

  # Cada eleccion le gana a la que señala.
  GANA_A = { "piedra" => "tijera", "papel" => "piedra", "tijera" => "papel" }.freeze

  scope :sin_resolver, -> { where(resolved_at: nil) }
  scope :jugadas, -> { where.not(resolved_at: nil).order(resolved_at: :desc) }

  def choice_for(user)
    pairing.user_a_id == user.id ? user_a_choice : user_b_choice
  end

  def set_choice(user, eleccion)
    if pairing.user_a_id == user.id
      update!(user_a_choice: eleccion)
    else
      update!(user_b_choice: eleccion)
    end
  end

  def ambos_eligieron?
    user_a_choice.present? && user_b_choice.present?
  end

  def resolver!
    return if resolved_at

    ganador_id =
      if user_a_choice == user_b_choice
        nil
      elsif GANA_A[user_a_choice] == user_b_choice
        pairing.user_a_id
      else
        pairing.user_b_id
      end

    update!(winner_id: ganador_id, resolved_at: Time.current)
  end
end
