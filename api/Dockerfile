FROM ruby:3.3-slim AS base

RUN apt-get update -qq && apt-get install -y --no-install-recommends \
      build-essential libpq-dev postgresql-client git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Gemfile Gemfile.lock* ./
RUN bundle install

COPY . .


FROM base AS dev
ENV RAILS_ENV=development
EXPOSE 3000
CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]


FROM base AS prod
ENV RAILS_ENV=production
EXPOSE 3000
CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]
