Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch("WEB_ORIGIN", "http://localhost:5173")
    resource "*",
      headers: :any,
      expose: ["Authorization"],
      methods: [:get, :post, :patch, :put, :delete, :options, :head]
  end
end
