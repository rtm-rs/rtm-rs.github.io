+++
title = "Quick setup"
description = "Explains how to quickly set up ROM."
date = 2022-05-01T19:30:00+00:00
updated = 2022-05-01T19:30:00+00:00
draft = false
weight = 30
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = "Explains how to quickly set up ROM."
toc = true
top = false
+++

This guide explains how to quickly configure RTM using setup DSL, which is suitable for simple scripts.

^INFO
#### RTM & frameworks

If you want to use RTM with a framework, see specific instructions in the documentation for that framework.

#### Configuration

The configuration options explained in this document are the same for [Framework setup](/learn/core/%{version}/framework-setup) using `ROM::Configuration` object.
^

## Connect to a single database

Call `ROM.container` with the adapter symbol and configuration details for that adapter:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
# This creates a rom-sql adapter backed by SQLite in-memory database
ROM.container(:sql, 'sqlite::memory') do |config|
  # define relations and commands here...
end

# You can provide additional connection options too
ROM.container(:sql, 'postgres://localhost/my_db', extensions: [:pg_json]) do |config|
  # define relations and commands here...
end

# RTM also comes with a very barebones in-memory adapter.
ROM.container(:memory, 'memory://test') do |config|
  # define relations and commands here...
end
```

---

```rust
# This creates a rom-sql adapter backed by SQLite in-memory database
ROM.container(:sql, 'sqlite::memory') do |config|
  # define relations and commands here...
end

# You can provide additional connection options too
ROM.container(:sql, 'postgres://localhost/my_db', extensions: [:pg_json]) do |config|
  # define relations and commands here...
end

# RTM also comes with a very barebones in-memory adapter.
ROM.container(:memory, 'memory://test') do |config|
  # define relations and commands here...
end
```

{% end %}

### Connect to multiple databases

Sometimes you have multiple data sources. You can provide multiple [gateway](/learn/introduction/glossary/#gateway) configurations with a name hash.

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
# Example: an old mysql database, “tasks”, and a new database “task_master”
# This registers two rom-sql adapters and then labels postgres with “default” and mysql with “legacy”
ROM.container(
  default: [:sql, 'postgres://localhost/task_master'], # gateway 1
  legacy: [:sql, 'mysql2://localhost/tasks']           # gateway 2
) do |config|
    # setup code goes here...
end
```

---

```rust
# Example: an old mysql database, “tasks”, and a new database “task_master”
# This registers two rom-sql adapters and then labels postgres with “default” and mysql with “legacy”
ROM.container(
  default: [:sql, 'postgres://localhost/task_master'], # gateway 1
  legacy: [:sql, 'mysql2://localhost/tasks']           # gateway 2
) do |config|
    # setup code goes here...
end
```

{% end %}

If there is only one adapter provided, then its identifier is automatically set to `:default`:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
# This setup call...
ROM.container(:sql, 'sqlite::memory')

# is equivalent to this one:
ROM.container(default: [:sql, 'sqlite::memory'])
```

---

```rust
# This setup call...
ROM.container(:sql, 'sqlite::memory')

# is equivalent to this one:
ROM.container(default: [:sql, 'sqlite::memory'])
```

{% end %}

## Access the container

`ROM.container` always returns the finalized environment container **object**. This object is not global, and it must be managed either by you or a framework that you use.

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
rom = ROM.container(:sql, 'sqlite::memory') do |config|
  # define relations and commands here...
end
```

---

```rust
rom = ROM.container(:sql, 'sqlite::memory') do |config|
  # define relations and commands here...
end
```

{% end %}

^WARNING
ActiveRecord and DataMapper provide global access to their components, but this
is considered a bad practice in modern standards. RTM creates an isolated, local
container without polluting global namespaces. This allows you to easily pass
it around without being worried about accidental side-effects like conflicting
database connections or configurations being overridden in a non-thread-safe
way.
^

## Learn more

Learn [how to read data](/learn/repository/%{version}/reading-simple-objects/) via Repositories and Relations.
