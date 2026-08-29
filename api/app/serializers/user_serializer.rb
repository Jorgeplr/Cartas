module UserSerializer
  def self.call(user)
    return nil unless user

    { id: user.id, email: user.email, display_name: user.display_name,
      invite_code: user.invite_code }
  end

  # Los datos de la otra persona no incluyen su codigo de invitacion:
  # ya estais emparejados, no le sirve a nadie mas.
  def self.partner(user)
    return nil unless user

    { id: user.id, display_name: user.display_name }
  end
end
