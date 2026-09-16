import type { Theme } from './types'

export interface Sugerencia {
  title: string
  challenge: string
}

export const ETIQUETA_GRUPO: Record<Theme, string> = {
  suave: 'Suaves',
  picante: 'Picantes',
  atrevida: 'Atrevidas',
}

export const DESCRIPCION_TEMA: Record<Theme, string> = {
  suave: 'Para romper el hielo',
  picante: 'Sube la temperatura',
  atrevida: 'Sin red',
}

/**
 * Catálogo de arranque. No pretende ser la baraja: son chispas para cuando te
 * quedas en blanco delante del formulario, que es donde muere la mayoría de
 * mazos vacíos.
 */
export const SUGERENCIAS: Record<Theme, Sugerencia[]> = {
  suave: [
    {
      title: 'Karaoke',
      challenge: 'Canta el estribillo de la última canción que escuchaste, de pie.',
    },
    {
      title: 'Imitación',
      challenge: 'Imita a alguien que los dos conozcáis hasta que adivinen quién es.',
    },
    {
      title: 'Confesión de adolescente',
      challenge: 'Cuenta la anécdota más vergonzosa de tu adolescencia, sin adornarla.',
    },
    {
      title: 'Acento prestado',
      challenge: 'Habla con acento extranjero hasta que salga la siguiente carta.',
    },
    {
      title: 'Retrato exprés',
      challenge: 'Dibuja a la otra persona en 30 segundos y enséñale el resultado.',
    },
    {
      title: 'Barra libre',
      challenge: 'Prepárale algo de beber sin preguntarle qué le apetece.',
    },
    {
      title: 'Sin manos',
      challenge: 'Cómete lo que te den sin usar las manos.',
    },
    {
      title: 'Estatua',
      challenge: 'Quédate completamente inmóvil un minuto, pase lo que pase a tu alrededor.',
    },
    {
      title: 'Audio comprometido',
      challenge: 'Manda un audio cantando a la tercera persona de tu lista de chats.',
    },
    {
      title: 'Sin la letra A',
      challenge: 'Habla durante dos minutos sin usar ni una sola palabra con la letra A.',
    },
  ],

  picante: [
    {
      title: 'Tres cosas',
      challenge: 'Di tres cosas que te atraen de la otra persona, mirándola a los ojos.',
    },
    {
      title: 'Masaje a ciegas',
      challenge: 'Da un masaje de un minuto donde te pidan, sin rechistar.',
    },
    {
      title: 'Baile lento',
      challenge: 'Baila una canción lenta pegado a la otra persona, sin soltarte.',
    },
    {
      title: 'Al oído',
      challenge: 'Susurra al oído lo que pensaste la primera vez que la viste.',
    },
    {
      title: 'Repetición',
      challenge: 'Recread vuestro primer beso, igual que fue.',
    },
    {
      title: 'Prenda o trago',
      challenge: 'Quítate una prenda o bebe un trago. Tú eliges.',
    },
    {
      title: 'Diez segundos',
      challenge: 'Un beso de diez segundos contados en voz alta, sin separaros.',
    },
    {
      title: 'Duelo de miradas',
      challenge: 'Sostened la mirada un minuto entero, sin hablar y sin reíros.',
    },
    {
      title: 'Nunca lo dije',
      challenge: 'Cuenta algo que no le hayas contado a nadie que esté en esta sala.',
    },
    {
      title: 'Top 3',
      challenge: 'Nombra tus tres partes favoritas de la otra persona y por qué.',
    },
    {
      title: 'Dilo en voz alta',
      challenge: 'Dile algo subido de tono, mirándola a los ojos y sin bajar la voz.',
    },
    {
      title: 'Lo que haría ahora',
      challenge: 'Cuéntale al oído qué te gustaría estar haciendo con ella en este momento.',
    },
    {
      title: 'Qué me pone',
      challenge: 'Describe con detalle qué es lo que más te gusta de ella. Nada de respuestas cortas.',
    },
    {
      title: 'Mensaje caliente',
      challenge: 'Escríbele por chat lo que no te atreves a decirle en voz alta. Que lo lea delante de ti.',
    },
    {
      title: 'Dónde',
      challenge: 'Señala dónde te gustaría que te besara ahora mismo. Sin decir nada, solo señala.',
    },
    {
      title: 'Tres deseos',
      challenge: 'Di tres cosas que te gustaría que te hiciera esta noche.',
    },
    {
      title: 'Aquella vez',
      challenge: 'Cuéntale la última vez que pensaste en ella y no fue precisamente inocente.',
    },
    {
      title: 'Piropo sin filtro',
      challenge: 'Un piropo que jamás dirías en público. Ahora, en voz alta.',
    },
    {
      title: 'La escena',
      challenge: 'Describe la escena que se te viene a la cabeza cuando piensas en los dos a solas.',
    },
    {
      title: 'Cuenta atrás',
      challenge: 'Treinta segundos diciéndole cosas al oído. No puedes callarte ni un momento.',
    },
    {
      title: 'Ropa',
      challenge: 'Dile qué prenda suya te gusta más y cuál preferirías que no llevara puesta.',
    },
    {
      title: 'Sin tocar',
      challenge: 'Ponla nerviosa solo hablando. No vale tocarla, únicamente palabras.',
    },
    {
      title: 'Cuenta regresiva',
      challenge: 'Diez segundos mirándola a los ojos sin hacer nada. A la de cero, tú decides.',
    },
    {
      title: 'La primera vez que',
      challenge: 'Cuenta la primera vez que pensaste en ella de una forma poco decente.',
    },
    {
      title: 'Dos dedos',
      challenge: 'Recorre con dos dedos el camino que más te apetezca. Sin explicar la ruta.',
    },
    {
      title: 'Sin manos III',
      challenge: 'Consigue que se ría o se ponga nerviosa sin usar las manos ni una vez.',
    },
    {
      title: 'Peor idea',
      challenge: 'Propón la peor idea que se te ocurra ahora mismo. Si acepta, la hacéis.',
    },
    {
      title: 'Traducción libre',
      challenge: 'Dile lo que estás pensando, pero sin usar ninguna palabra directa.',
    },
  ],

  atrevida: [
    {
      title: 'A ciegas',
      challenge: 'Déjate vendar los ojos dos minutos y adivina lo que te den a probar.',
    },
    {
      title: 'Confesión guardada',
      challenge: 'Cuenta una fantasía que nunca hayas dicho en voz alta.',
    },
    {
      title: 'Intercambio',
      challenge: 'Intercambia una prenda de ropa con la otra persona y quédatela puesta.',
    },
    {
      title: 'Hielo',
      challenge: 'Un cubo de hielo, donde te digan, hasta que se derrita del todo.',
    },
    {
      title: 'Sin manos II',
      challenge: 'Quítale una prenda a la otra persona sin usar las manos.',
    },
    {
      title: 'Verdad obligada',
      challenge: 'Responde con la verdad a la pregunta que te hagan, sea cual sea.',
    },
    {
      title: 'Carta blanca',
      challenge: 'La otra persona decide tu próximo reto. No puedes negarte.',
    },
    {
      title: 'Dos minutos',
      challenge: 'Dos minutos a solas. Lo que pase ahí lo decidís vosotros.',
    },
    {
      title: 'Audio para ella',
      challenge: 'Grábale un audio diciéndole lo que te gustaría hacerle. Que lo escuche delante de ti.',
    },
    {
      title: 'Lista de la compra',
      challenge: 'Enumera cinco cosas que quieres hacer con ella. Sin saltarte ninguna por vergüenza.',
    },
    {
      title: 'Mapa',
      challenge: 'Recorre con un dedo el camino que harías. Solo el dedo, y sin explicar nada.',
    },
    {
      title: 'Preguntas sin filtro',
      challenge: 'Tres preguntas sobre lo que le gusta en la intimidad. Tiene que responder a todas.',
    },
    {
      title: 'Confesión de la primera vez',
      challenge: 'Cuenta qué pensaste la primera vez que os quedasteis a solas.',
    },
    {
      title: 'Ella decide',
      challenge: 'Que te diga algo al oído. Tienes que hacerlo, sea lo que sea.',
    },
    {
      title: 'Luces fuera',
      challenge: 'Apagad todas las luces. Dos minutos a oscuras y nadie dice qué va a pasar.',
    },
    {
      title: 'Cámara lenta',
      challenge: 'Repetid el último beso, pero al triple de lento. Sin acelerar aunque queráis.',
    },
    {
      title: 'Donde tú elijas',
      challenge: 'Un beso donde la otra persona decida. Sin negociar y sin poner cara rara.',
    },
    {
      title: 'Mordisco',
      challenge: 'Un mordisco suave donde te señalen. Ellos eligen el sitio y la fuerza.',
    },
    {
      title: 'Ni una palabra',
      challenge: 'Tres minutos sin hablar. Solo manos y miradas. El primero que hable, paga.',
    },
    {
      title: 'Un minuto entero',
      challenge: 'Un minuto haciendo exactamente lo que te pidan, sin preguntar por qué.',
    },
    {
      title: 'Manos quietas',
      challenge: 'Con las manos a la espalda, deja que te quite lo que quiera. Tú no ayudas.',
    },
    {
      title: 'Ruleta de prendas',
      challenge: 'Una prenda cada uno por turno, hasta que alguien se raje. Quien se raje, paga.',
    },
    {
      title: 'Susurro final',
      challenge: 'Dile al oído cómo quieres que acabe la noche. Con detalle, no con indirectas.',
    },
    {
      title: 'Adivina dónde',
      challenge: 'Con los ojos cerrados, adivina dónde te está tocando. Fallas, repites.',
    },
    {
      title: 'Puntuación',
      challenge: 'Puntúa del 1 al 10 lo último que hicisteis y di exactamente qué le faltó.',
    },
    {
      title: 'Reto al instante',
      challenge: 'La otra persona se inventa un reto ahora mismo. Lo cumples antes de seguir.',
    },
    {
      title: 'Lo más atrevido',
      challenge: 'Cuenta lo más atrevido que has hecho en tu vida. Sin suavizarlo.',
    },
    {
      title: 'El rincón',
      challenge: 'Señala el rincón de la casa donde quieres seguir. Se acaba la partida ahí.',
    },
    {
      // Conviene que salga pronto: pactar el freno de antemano es lo que
      // permite que el resto de la baraja se juegue sin frenos.
      title: 'Palabra de freno',
      challenge:
        'Acordad ahora una palabra. Quien la diga, corta el reto que sea sin dar explicaciones.',
    },
  ],
}

/**
 * Devuelve una sugerencia de la tematica pedida, evitando las ya usadas. Si se
 * agotan todas, vuelve a empezar: mejor repetir que dejar el botón muerto.
 */
export function sugerenciaAlAzar(tema: Theme, usadas: string[]): Sugerencia {
  const catalogo = SUGERENCIAS[tema]
  const frescas = catalogo.filter((s) => !usadas.includes(s.title))
  const fuente = frescas.length > 0 ? frescas : catalogo

  return fuente[Math.floor(Math.random() * fuente.length)]
}
