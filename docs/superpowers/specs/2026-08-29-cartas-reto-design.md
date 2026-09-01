# Cartas de Reto — Diseño

**Fecha:** 2026-08-29
**Estado:** aprobado

## Concepto

Dos personas emparejadas comparten una baraja. Cada una escribe cartas-reto
para la otra. En la mesa se roba a ciegas por turnos y cumple el reto quien
roba. El azar reparte porque cada quien escribió para el otro.

## Alcance

Dentro:

- Registro y login con email + contraseña. Nada más.
- Emparejamiento fijo 1:1 mediante código de invitación.
- CRUD de cartas propias (título, reto, dificultad).
- Mesa de juego: robar carta al azar, alternar turno, rebarajar.
- Todo dockerizado (`docker compose up`).

Fuera (YAGNI):

- Recuperación de contraseña, confirmación de email, OAuth.
- Marcador, estados cumplida/rechazada, historial completo de partidas.
  (Sí se guarda la ultima jugada: sin ella la otra persona no se entera
  de que ha salido una carta.)
- Más de una pareja por usuario, o barajas múltiples.
- Notificaciones push, tiempo real (websockets), imágenes en cartas.

## Arquitectura

Tres contenedores orquestados por Docker Compose:

| Servicio | Imagen base            | Puerto dev | Rol                                     |
|----------|------------------------|-----------|------------------------------------------|
| `db`     | `postgres:17-alpine`   | 5432      | Persistencia, volumen nombrado           |
| `api`    | `ruby:3.3-slim`        | 3000      | Rails 8 API-only                         |
| `web`    | `node:22-alpine`       | 5173      | Vite dev server (React + TS + Tailwind)  |

- `db` expone healthcheck (`pg_isready`); `api` depende de él con
  `condition: service_healthy`.
- Volúmenes montados sobre el código en dev para hot reload en ambos lados.
- Producción: `web` se compila a estáticos y los sirve nginx en el puerto 80
  (Dockerfile multi-stage, target separado del de dev).

## Modelo de datos

### `users`

| Columna           | Tipo      | Notas                                     |
|-------------------|-----------|-------------------------------------------|
| `id`              | bigint    | PK                                        |
| `email`           | citext    | único, no nulo                            |
| `password_digest` | string    | bcrypt vía `has_secure_password`          |
| `display_name`    | string    | derivado del email al registrarse         |
| `invite_code`     | string(6) | único, no nulo, alfanumérico sin ambiguos |

### `pairings`

| Columna                | Tipo   | Notas                      |
|------------------------|--------|----------------------------|
| `id`                   | bigint | PK                         |
| `user_a_id`            | bigint | FK users, **índice único** |
| `user_b_id`            | bigint | FK users, **índice único** |
| `current_turn_user_id` | bigint | FK users                   |

Los índices únicos sobre `user_a_id` y `user_b_id` garantizan el 1:1 a nivel
de base de datos, no solo por validación de modelo. Un usuario no puede
aparecer dos veces en la misma columna. La comprobación cruzada (que no esté
en `user_a` de una fila y en `user_b` de otra) se hace en la transacción de
emparejamiento.

### `cards`

| Columna      | Tipo     | Notas                                 |
|--------------|----------|---------------------------------------|
| `id`         | bigint   | PK                                    |
| `author_id`  | bigint   | FK users                              |
| `title`      | string   | no nulo, máx 60                       |
| `challenge`  | text     | no nulo, máx 280                      |
| `difficulty` | string   | enum: `facil` / `medio` / `dificil`   |
| `drawn_at`   | datetime | nulo = sigue en el mazo               |

**Una carta pertenece a quien la escribió, no a la pareja.** Así se puede
llenar el mazo antes de tener con quien jugar, y al emparejarse las cartas ya
escritas entran solas a la baraja. La baraja de una pareja son las cartas de
sus dos miembros: no hay tabla `decks`. **No hay historial de
jugadas**: `drawn_at` marca la carta como gastada y rebarajar lo pone a `NULL`
en toda la baraja.

## Regla clave: ocultar retos ajenos

`GET /api/cards` devuelve todas las cartas de la baraja, pero **omite el campo
`challenge` de las cartas cuyo `author_id` no es el usuario actual** y que aún
no han sido robadas. El usuario ve que su pareja escribió 8 cartas, ve sus
títulos y dificultades, pero el texto del reto solo se revela al robarla.

Sin esta regla, hojear la baraja arruina el juego entero. Se implementa en el
serializador, no en el controlador, para que no se pueda olvidar en otro
endpoint.

## API

Todas las rutas bajo `/api`. Respuestas JSON. Auth por
`Authorization: Bearer <jwt>` salvo signup y login.

```
POST   /api/auth/signup   { email, password }              -> 201 { token, user }
POST   /api/auth/login    { email, password }              -> 200 { token, user }
GET    /api/me                                             -> 200 { user, pairing, partner }
POST   /api/pairing/join  { code }                         -> 201 { pairing, partner }
GET    /api/pairing                                        -> 200 { pairing, partner, cards_left }
GET    /api/cards                                          -> 200 { cards: [...] }
POST   /api/cards         { title, challenge, difficulty } -> 201 { card }
PATCH  /api/cards/:id                                      -> 200 { card }
DELETE /api/cards/:id                                      -> 204
POST   /api/draw                                           -> 200 { card, cards_left }
POST   /api/deck/reshuffle                                 -> 200 { cards_left }
```

Reglas de autorización:

- `PATCH` y `DELETE` de cartas: solo el autor. Que la carta ya se haya jugado
  no la congela: el mazo se rebaraja y se vuelve a jugar, asi que corregir una
  errata o subir el tono sigue teniendo sentido despues.
- `POST /api/draw`: solo si hay pareja, solo si es tu turno, solo si quedan
  cartas sin robar. Selecciona al azar entre las no robadas, marca `drawn_at`,
  alterna `current_turn_user_id` a la otra persona, todo en una transacción.
- `POST /api/pairing/join`: falla con 422 si el código no existe, es el tuyo
  propio, o si cualquiera de los dos ya tiene pareja.

## Autenticación

- `has_secure_password` (bcrypt) sobre `users`.
- JWT HS256 firmado con `Rails.application.secret_key_base`, expiración 30
  días, payload `{ user_id, exp }`.
- Concern `Authenticatable` incluido en `ApplicationController`: decodifica el
  header, resuelve `current_user`, responde 401 si falta o es inválido.
- El token se guarda en `localStorage` en el cliente. Aceptamos el riesgo de
  XSS a cambio de no lidiar con CSRF y cookies cross-origin entre dos
  contenedores; la app no maneja datos sensibles ni dinero.

## Manejo de errores

Formato único de error:

```json
{ "error": { "code": "not_your_turn", "message": "No es tu turno" } }
```

`rescue_from` en `ApplicationController` mapea:

| Excepción                          | HTTP |
|------------------------------------|------|
| `ActiveRecord::RecordNotFound`     | 404  |
| `ActiveRecord::RecordInvalid`      | 422  |
| `Authenticatable::Unauthorized`    | 401  |
| `ApplicationController::Forbidden` | 403  |

En React, un cliente HTTP único (`src/lib/api.ts`) envuelve `fetch`, inyecta
el token y, ante un 401, limpia la sesión y redirige a `/login`.

## Frontend

Stack: Vite + React 19 + TypeScript + Tailwind + Framer Motion + React Router.

### Rutas

| Ruta      | Guard                   | Contenido                                    |
|-----------|-------------------------|----------------------------------------------|
| `/login`  | solo anónimos           | email + contraseña                           |
| `/signup` | solo anónimos           | email + contraseña                           |
| `/pair`   | autenticado, sin pareja | código, emparejar y panel de escritura        |
| `/`       | autenticado, con pareja | mesa de juego                                |
| `/cards`  | autenticado, con pareja | tus cartas + editor                          |

`/pair` es bloqueante: sin pareja no hay baraja, así que cualquier intento de
llegar a `/` o `/cards` redirige allí.

### Estética

Tono fiesta / amigos: paleta saturada (fucsia y lima sobre fondo oscuro
profundo), tipografía sans geométrica gruesa para títulos, alto contraste,
movimiento generoso. La dificultad se codifica por color de borde.

### Editor de cartas

Split en vivo. Izquierda: campos de formulario (título, reto con contador de
caracteres, dificultad como segmented control). Derecha: la carta renderizada
en tiempo real, con la misma tipografía y proporción que tendrá en la mesa.
Al guardar, la carta se voltea y sale de pantalla hacia el mazo.

Se aplicará la skill `ui-ux-pro-max` para el sistema de diseño (paleta
concreta, escala tipográfica, estados de interacción) antes de escribir los
componentes.

### Mesa de juego

El mazo boca abajo con efecto de pila, contador de cartas restantes, indicador
de turno (el nombre de quien tiene el turno iluminado), botón ROBAR grande.
Al robar: la carta superior se despega, se voltea en 3D y queda en el centro
con el reto legible. El botón se deshabilita si no es tu turno.

## Testing

API (request specs, RSpec) — cubrir lo que puede romperse en silencio:

- Signup rechaza email duplicado y contraseña corta.
- Login devuelve token válido; credenciales malas dan 401.
- `pairing/join` empareja a dos usuarios libres; falla si alguno ya tiene
  pareja, si el código es el propio, o si no existe.
- `GET /api/cards` **no incluye `challenge` de cartas ajenas no robadas**.
- `POST /api/draw` marca la carta, alterna el turno y nunca devuelve dos veces
  la misma carta.
- `POST /api/draw` da 403 si no es tu turno y 422 si el mazo está vacío.
- Editar o borrar carta ajena da 403.

Frontend (Vitest + Testing Library):

- El editor valida longitudes y refleja los cambios en la vista previa.
- El guard de rutas manda a `/pair` cuando no hay pareja.
- El cliente HTTP hace logout ante un 401.

## Idioma

Interfaz íntegramente en español.
