RSpec.configure do |config|
  config.expect_with(:rspec) { |c| c.syntax = :expect }
  config.shared_context_metadata_behavior = :apply_to_host_groups
  config.disable_monkey_patching!
end
