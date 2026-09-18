class Card < ApplicationRecord
  # De menos a mas: el orden es el de la escala de calor que ve el jugador.
  TEMATICAS = %w[suave picante atrevida].freeze

  belongs_to :author, class_name: "User"
  belongs_to :drawn_by, class_name: "User", optional: true
  has_many :card_bans, dependent: :destroy

  validates :title, presence: true, length: { maximum: 60 }
  validates :challenge, presence: true, length: { maximum: 280 }
  validates :theme, inclusion: { in: TEMATICAS }

  scope :in_deck, -> { where(drawn_at: nil) }
  scope :jugadas, -> { where.not(drawn_at: nil).order(drawn_at: :desc) }

  def drawn?
    drawn_at.present?
  end
end
