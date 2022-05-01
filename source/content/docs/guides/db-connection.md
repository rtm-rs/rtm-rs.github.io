+++
title = "DB connection"
description = "Connect to an existing database and define a repository."
date = 2022-05-01T18:00:00+00:00
updated = 2022-05-01T18:00:00+00:00
draft = false
weight = 30
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = 'Connect to an existing database and define a repository.'
toc = true
top = false
+++

This article assumes:

* You have a database called `my_db`
* There's a table called `users` with `name` column
* You have the `rom` and `rom-sql` gems installed

To connect to your database and define a repository for `users` table, simply do:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
require "rom"

rom = ROM.container(:sql, 'postgres://localhost/my_db', username: 'user', password: 'secret') do |config|
  config.relation(:users) do
    schema(infer: true)
    auto_struct true
  end
end

users = rom.relations[:users]

users.changeset(:create, name: "Jane").commit

jane = users.where(name: "Jane").one
```

---

```rust
require "rom"

rom = ROM.container(:sql, 'postgres://localhost/my_db', username: 'user', password: 'secret') do |config|
  config.relation(:users) do
    schema(infer: true)
    auto_struct true
  end
end

users = rom.relations[:users]

users.changeset(:create, name: "Jane").commit

jane = users.where(name: "Jane").one
```

{% end %}

## Learn more

* [Repositories Quick Start](/5.0/learn/repositories/quick-start)
* [api::rom-sql::SQL](Gateway)
