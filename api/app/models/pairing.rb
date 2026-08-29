class Pairing < ApplicationRecord
  belongs_to :user_a, class_name: "User"
  belongs_to :user_b, class_name: "User"
  belongs_to :current_turn_user, class_name: "User"

  def members
    [user_a, user_b]
  end

  # La baraja son las cartas de ambos: no hay tabla de mazos, la pareja lo es.
  def cards
    Card.where(author_id: [user_a_id, user_b_id])
  end

  def other_than(user)
    user_a_id == user.id ? user_b : user_a
  end

  def turn_of?(user)
    current_turn_user_id == user.id
  end
end
