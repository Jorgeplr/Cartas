module RpsRoundSerializer
  # La eleccion de la otra persona esta oculta mientras la ronda no se
  # resuelva: es la misma regla que censura los retos ajenos en las cartas,
  # aplicada aqui para que nadie elija sabiendo ya lo que jugo el otro.
  def self.call(round, viewer)
    return vacia unless round

    del_otro = otra_eleccion(round, viewer)
    resuelta = round.resolved_at.present?

    {
      resolved: resuelta,
      my_choice: round.choice_for(viewer),
      partner_chose: del_otro.present?,
      partner_choice: resuelta ? del_otro : nil,
      result: resuelta ? resultado_para(round, viewer) : nil,
      resolved_at: round.resolved_at
    }
  end

  def self.vacia
    { resolved: false, my_choice: nil, partner_chose: false, partner_choice: nil,
      result: nil, resolved_at: nil }
  end

  def self.otra_eleccion(round, viewer)
    round.pairing.user_a_id == viewer.id ? round.user_b_choice : round.user_a_choice
  end

  def self.resultado_para(round, viewer)
    return "empate" if round.winner_id.nil?
    round.winner_id == viewer.id ? "gane" : "perdi"
  end
end
