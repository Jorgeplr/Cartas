FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .


FROM base AS dev
EXPOSE 5173
CMD ["npm", "run", "dev"]


FROM base AS build
# Vite incrusta las variables VITE_* en el bundle, asi que la URL de la API
# tiene que estar presente en tiempo de build, no de arranque.
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build


FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
