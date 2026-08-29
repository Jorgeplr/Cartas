class Card < ApplicationRecord
  DIFICULTADES = %w[facil medio dificil].freeze

  belongs_to :author, class_name: "User"
  belongs_to :drawn_by, class_name: "User", optional: true

  validates :title, presence: true, length: { maximum: 60 }
  validates :challenge, presence: true, length: { maximum: 280 }
  validates :difficulty, inclusion: { in: DIFICULTADES }

  scope :in_deck, -> { where(drawn_at: nil) }
  scope :jugadas, -> { where.not(drawn_at: nil).order(drawn_at: :desc) }

  def drawn?
    drawn_at.present?
  end
end
