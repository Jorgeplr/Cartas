module PairingSerializer
  def self.call(pairing, viewer)
    ultima = pairing.cards.jugadas.first

    {
      pairing: {
        id: pairing.id,
        current_turn_user_id: pairing.current_turn_user_id,
        active_themes: pairing.active_themes
      },
      partner: UserSerializer.partner(pairing.other_than(viewer)),
      # Los dos recuentos de la mesa van filtrados por las tematicas activas:
      # son "lo que puede salir ahora" y "de cuantas sale", y con el filtro
      # puesto cualquier otra cosa seria mentira.
      cards_left: pairing.playable_cards.in_deck.count,
      cards_total: pairing.playable_cards.count,
      # Este NO se filtra: rebarajar devuelve la baraja entera, asi que el
      # boton debe aparecer aunque todo lo jugado sea de una tematica apagada.
      cards_drawn_total: pairing.cards.jugadas.count,
      # Cuantas aporta cada tematica, para que el filtro diga lo que cuesta
      # apagar una antes de apagarla. Van SIEMPRE las tres claves: `group`
      # omite las que no tienen ninguna, y un hueco obligaria al cliente a
      # distinguir "cero" de "no vino".
      deck_by_theme: deck_by_theme(pairing),
      # La ultima jugada viaja siempre: es como la otra persona se entera de
      # que ha salido una carta sin tener que recargar ni preguntar. Tampoco
      # se filtra: es lo que ya paso, no lo que puede salir.
      last_play: ultima && {
        card: CardSerializer.call(ultima, viewer),
        drawn_by: UserSerializer.partner(ultima.drawn_by),
        drawn_by_me: ultima.drawn_by_id == viewer.id,
        drawn_at: ultima.drawn_at
      },
      # El tuyo, nunca el de la otra persona: cada quien juega el suyo desde
      # su propia mesa, no hay nada ajeno que enseñar aqui.
      wildcard: WildcardSerializer.call(viewer.wildcards.order(created_at: :desc).first, viewer)
    }
  end

  def self.deck_by_theme(pairing)
    contadas = pairing.cards.in_deck.group(:theme).count
    Card::TEMATICAS.index_with { |tema| contadas.fetch(tema, 0) }
  end
end
