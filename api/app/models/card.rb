class Card < ApplicationRecord
  DIFICULTADES = %w[facil medio dificil].freeze

  belongs_to :author, class_name: "User"

  validates :title, presence: true, length: { maximum: 60 }
  validates :challenge, presence: true, length: { maximum: 280 }
  validates :difficulty, inclusion: { in: DIFICULTADES }

  scope :in_deck, -> { where(drawn_at: nil) }

  def drawn?
    drawn_at.present?
  end
end
