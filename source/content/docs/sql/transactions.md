+++
title = "Transactions"
description = "As simple as can be."
date = 2022-05-01T15:00:00+00:00
updated = 2022-05-01T15:00:00+00:00
draft = false
weight = 80
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = 'As simple as can be.'
toc = true
top = false
+++


To use a transaction simply wrap an operation via `Relation#transaction` method:

``` ruby
# rollback happens when any error is raised
users.transaction do |t|
  users.command(:create).call(name: "jane")
end

# manual rollback
users.transaction do |t|
  users.command(:create).call(name: "Jane")
  t.rollback!
end
```

## Learn more

* [api::rom-sql::SQL/Relation]( transaction)
