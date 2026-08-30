# Cartas de Reto

Dos personas emparejadas comparten una baraja. Cada una escribe cartas-reto para
la otra. En la mesa se roba a ciegas por turnos y cumple el reto quien roba.

El detalle que hace que el juego funcione: **los retos que escribe la otra
persona llegan al navegador censurados**. Ves cuántas cartas te esperan y sus
títulos, pero el texto solo se revela al robar la carta.

## Arrancar

Necesitas Docker y Docker Compose. Nada más: ni Ruby ni Node en tu máquina.

```bash
cp .env.example .env
docker compose up
```

- Web: <http://localhost:5173>
- API: <http://localhost:3000>

El contenedor `api` prepara la base al arrancar, asi que las migraciones se
aplican solas con cada `docker compose up`. No hay paso manual.

## Cómo se juega

1. Regístrate con email y contraseña.
2. La app te da un **código de 6 caracteres**. Pásaselo a la otra persona, o
   mete el suyo. Al emparejaros compartís baraja para siempre.
3. En **Mazo**, cada quien escribe sus cartas: título, reto y dificultad.
4. En **Mesa**, se roba por turnos. Sale una carta al azar y la cumple quien la
   robó. **Reiniciar mazo** devuelve todas las jugadas cuando queráis, no solo
   al agotarse la baraja.

## Tests

```bash
docker compose run --rm -e RAILS_ENV=test api bundle exec rspec   # 31 ejemplos
docker compose run --rm web npx vitest run                        # 15 tests
docker compose run --rm web npx tsc -b --noEmit                   # typecheck
```

## API

Todo bajo `/api`, JSON, con `Authorization: Bearer <jwt>` salvo signup y login.

| Método | Ruta | Qué hace |
|--------|------|----------|
| POST | `/auth/signup` | Crea cuenta, devuelve token |
| POST | `/auth/login` | Devuelve token |
| GET | `/me` | Usuario, pareja y turno actual |
| GET | `/pairing` | Estado de la baraja y cartas restantes |
| POST | `/pairing/join` | Empareja usando un código de invitación |
| GET | `/cards` | La baraja, con los retos ajenos ocultos |
| POST | `/cards` | Crea una carta |
| PATCH | `/cards/:id` | Edita una carta propia no robada |
| DELETE | `/cards/:id` | Borra una carta propia no robada |
| POST | `/draw` | Roba al azar, marca la carta y pasa el turno |
| POST | `/deck/reshuffle` | Devuelve todas las cartas al mazo |

Los errores siempre tienen la misma forma:

```json
{ "error": { "code": "not_your_turn", "message": "No es tu turno" } }
```

## Estructura

```
api/   Rails 8 API-only. La regla de ocultar retos vive en
       app/serializers/card_serializer.rb, no en los controladores,
       para que ningún endpoint pueda saltársela.
web/   React 19 + TypeScript + Tailwind v4 + Framer Motion.
       src/components/PlayCard.tsx lo comparten el editor y la mesa:
       por eso la vista previa es fiel a lo que verá la otra persona.
docs/  Spec de diseño y plan de implementación.
```

## Producción

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Exige `POSTGRES_PASSWORD` y `SECRET_KEY_BASE` en `.env` — el compose falla si
faltan en vez de arrancar con valores de desarrollo. El front se compila a
estáticos y lo sirve nginx en el puerto 80.

`VITE_API_URL` se incrusta en el bundle **en tiempo de build**: si despliegas la
API en otro dominio, pásalo al construir, no al arrancar.

## Problemas conocidos

### `password authentication failed for user "postgres"`

Postgres fija `POSTGRES_PASSWORD` **solo al crear el volumen**. Si el volumen
ya existía con otra contraseña, cambiar la variable no sirve de nada: la API
seguirá siendo rechazada.

Con datos que quieras conservar, cambia la contraseña del usuario en vez de
borrar el volumen:

```bash
docker exec <contenedor-db> \
  psql -U postgres -c "ALTER USER postgres PASSWORD 'LA-DE-TU-ENV'"
```

Si la base está vacía, borrar el volumen y redesplegar es equivalente:

```bash
docker compose -p <proyecto> -f docker-compose.prod.yml down -v
```

Para ver qué contraseña está usando realmente la API:

```bash
docker exec <contenedor-api> env | grep DATABASE_URL
```

### El deploy publica puertos y choca con Traefik

Señal: `Bind for 0.0.0.0:3000 failed: port is already allocated`.

Es que se está desplegando `docker-compose.yml`, el de desarrollo. El path
del compose debe ser `docker-compose.prod.yml`.

### `bin/rails: Permission denied` en el servidor

El bit de ejecución de `api/bin/*` se perdió al commitear desde Windows. Se
arregla con `git update-index --chmod=+x api/bin/*`; el Dockerfile además
hace `chmod +x bin/*` por si vuelve a pasar.
