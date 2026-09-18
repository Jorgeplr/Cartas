module WildcardSerializer
  # `wildcard` es el ultimo elegido en esta partida (jugado o no), o nil si
  # todavia no se ha elegido ninguno. Distinguir "jugado" de "no elegido" es
  # lo que deja al frontend explicar por que no se puede elegir otro.
  def self.call(wildcard, viewer)
    return { chosen: false, played: false, card: nil } unless wildcard

    {
      chosen: true,
      played: wildcard.played?,
      card: CardSerializer.call(wildcard.card, viewer)
    }
  end
end
