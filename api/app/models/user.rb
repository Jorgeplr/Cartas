class User < ApplicationRecord
  has_secure_password

  has_many :cards, foreign_key: :author_id, dependent: :destroy, inverse_of: :author

  # Un codigo que se dicta en voz alta no puede ser ambiguo: fuera los digitos
  # 0 y 1, y fuera tambien las letras O e I que se confunden con ellos.
  AMBIGUOS = %w[O I].freeze
  ALFABETO = (("A".."Z").to_a - AMBIGUOS + ("2".."9").to_a).freeze

  validates :email, presence: true, uniqueness: true,
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, allow_nil: true

  before_validation :asignar_valores_por_defecto, on: :create

  def pairing
    @pairing ||= Pairing.where(user_a_id: id).or(Pairing.where(user_b_id: id)).first
  end

  def partner
    p = pairing
    return nil unless p

    p.user_a_id == id ? p.user_b : p.user_a
  end

  private

  def asignar_valores_por_defecto
    self.display_name = email.to_s.split("@").first.presence if display_name.blank?
    self.invite_code ||= loop do
      code = Array.new(6) { ALFABETO.sample }.join
      break code unless User.exists?(invite_code: code)
    end
  end
end
