# Run using bin/ci

CI.run do
  step "Setup", "bin/setup --skip-server"

  step "Style: Ruby", "bin/rubocop"

  step "Security: Gem audit", "bin/bundler-audit"

  # Este paso faltaba. La suite existia y estaba bien, pero bin/ci no la
  # llamaba, asi que "CI en verde" no queria decir que los tests pasaran.
  # db:test:prepare va delante porque la base de test tiene que existir y
  # estar al dia antes de que RSpec la toque.
  step "Tests: RSpec", "bin/rails db:test:prepare && bundle exec rspec"

  # Optional: set a green GitHub commit status to unblock PR merge.
  # Requires the `gh` CLI and `gh extension install basecamp/gh-signoff`.
  # if success?
  #   step "Signoff: All systems go. Ready for merge and deploy.", "gh signoff"
  # else
  #   failure "Signoff: CI failed. Do not merge or deploy.", "Fix the issues and try again."
  # end
end
