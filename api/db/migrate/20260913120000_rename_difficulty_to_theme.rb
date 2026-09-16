class RenameDifficultyToTheme < ActiveRecord::Migration[8.1]
  # La dificultad y el tono eran el mismo eje con dos nombres: las sugerencias
  # ya venian agrupadas en suave/picante/atrevida y al guardarlas ese tono se
  # traducia a una dificultad y se perdia. Se queda uno solo.
  MAPA = { "facil" => "suave", "medio" => "picante", "dificil" => "atrevida" }.freeze

  def up
    rename_column :cards, :difficulty, :theme
    change_column_default :cards, :theme, "picante"
    traducir(MAPA)

    # Que temáticas se juegan es de la pareja, no de cada jugador: robar lo
    # resuelve el servidor, asi que un filtro por cliente no se podria aplicar.
    add_column :pairings, :active_themes, :string, array: true,
               default: %w[suave picante atrevida], null: false
  end

  def down
    remove_column :pairings, :active_themes

    traducir(MAPA.invert)
    change_column_default :cards, :theme, "medio"
    rename_column :cards, :theme, :difficulty
  end

  private

  # Hay cartas escritas de verdad ahi dentro: se traducen, no se descartan.
  # En los dos sentidos la columna se llama ya `theme` al llegar aqui: al subir
  # porque se renombro antes, al bajar porque se renombra despues.
  def traducir(mapa)
    mapa.each do |antes, despues|
      execute <<~SQL.squish
        UPDATE cards SET theme = #{connection.quote(despues)}
        WHERE theme = #{connection.quote(antes)}
      SQL
    end
  end
end
