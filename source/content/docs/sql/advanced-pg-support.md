+++
title = "Advanced PostgreSQL"
description = "PostgreSQL and semi-structured data."
date = 2022-05-01T15:00:00+00:00
updated = 2022-05-01T15:00:00+00:00
draft = false
weight = 100
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = 'PostgreSQL and semi-structured data.'
toc = true
top = false
+++

## JSON(B) data types

One of the nicest features of PostgreSQL nowadays, is support for semi-structured data using the JSON format which makes it possible to use this database in scenarios where you don't know the schema of the data beforehand.

Once you defined schema attributes as having the JSONB type, you can call the methods specific to this type on the attributes.

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
class Users < ROM::Relation[:sql]
  schema do
    attribute :id, Types::Serial
    attribute :properties, Types::PG::JSONB
  end
end

# .has_key will be translated to the '?' operator call
users_with_emails = users.where { properties.has_key('email') }

# equivalent to "properties" @> '{"name": "John"}'::jsonb
johns = users.where { properties.contain(name: 'John') }
```
---
```rust
class Users < ROM::Relation[:sql]
  schema do
    attribute :id, Types::Serial
    attribute :properties, Types::PG::JSONB
  end
end

# .has_key will be translated to the '?' operator call
users_with_emails = users.where { properties.has_key('email') }

# equivalent to "properties" @> '{"name": "John"}'::jsonb
johns = users.where { properties.contain(name: 'John') }
```
{% end %}

## Learn more

* [api::rom-sql::SQL](Attribute)
* [api::rom-sql::SQL](Postgres/Types)
