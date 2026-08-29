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
   robó. Cuando el mazo se agota, podéis rebarajar.

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
