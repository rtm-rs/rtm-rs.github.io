+++
title = "Schemas"
description = "Augmenting the Relation Schema."
date = 2022-05-01T15:00:00+00:00
updated = 2022-05-01T15:00:00+00:00
draft = false
weight = 30
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = 'Augmenting the Relation Schema.'
toc = true
top = false
+++

The SQL adapter adds its own schema types and association declarations to the
built-in [Relation Schema](./../learn/core/schemas/) feature.

## Inferring Attributes

If you don't want to declare all attributes explicitly, you can tell rom-sql to
infer attributes from an existing schema.

Inference will define normal attributes, foreign keys and primary key (even when
it's a composite primary key).

To infer a schema automatically:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
require 'rom-sql'

class Users < ROM::Relation[:sql]
  schema(infer: true) # that's it
end
```
---
```rust
require 'rom-sql'

class Users < ROM::Relation[:sql]
  schema(infer: true) # that's it
end
```
{% end %}

## Coercions

Relations and commands can coerce output and input data automatically based on your schema attributes.
Default attribute types in schemas are used for input coercions in commands, if you want to apply additional
coercions when relations read their data, you can do it via `:read` type in schema definitions:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
class Posts < ROM::Relation[:sql]
  schema(infer: true) do
    attribute :status, Types::String, read: Types.Constructor(Symbol, &:to_sym)
  end
end

id = posts.insert(title: 'Hello World', status: :draft)

posts.by_pk(1).one
# => {:id => 1, :title => "Hello World", status: :draft }
```
---
```rust
class Posts < ROM::Relation[:sql]
  schema(infer: true) do
    attribute :status, Types::String, read: Types.Constructor(Symbol, &:to_sym)
  end
end

id = posts.insert(title: 'Hello World', status: :draft)

posts.by_pk(1).one
# => {:id => 1, :title => "Hello World", status: :draft }
```
{% end %}

## PostgreSQL Types

When you define relation schema attributes using custom PG types, the values
will be automatically coerced before executing commands, so you don't have to
handle that yourself.

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
require 'rom-sql'

class Users < ROM::Relation[:sql]
  schema do
    attribute :meta, Types::PG::JSONB
    attribute :tags, Types::PG::Array('varchar')
    attribute :info, Types::PG::HStore
  end
end

Users.schema[:meta][{ name: 'Jane' }].class
# Sequel::Postgres::JSONBHash

Users.schema[:meta][[1, 2, 3]].class
# Sequel::Postgres::JSONBArray

Users.schema[:tags][%w(red green blue)].class
# => Sequel::Postgres::PGArray

Users.schema[:info][{ some: 'info' }].class
# => Sequel::Postgres::HStore
```
---
```rust
require 'rom-sql'

class Users < ROM::Relation[:sql]
  schema do
    attribute :meta, Types::PG::JSONB
    attribute :tags, Types::PG::Array('varchar')
    attribute :info, Types::PG::HStore
  end
end

Users.schema[:meta][{ name: 'Jane' }].class
# Sequel::Postgres::JSONBHash

Users.schema[:meta][[1, 2, 3]].class
# Sequel::Postgres::JSONBArray

Users.schema[:tags][%w(red green blue)].class
# => Sequel::Postgres::PGArray

Users.schema[:info][{ some: 'info' }].class
# => Sequel::Postgres::HStore
```
{% end %}

For getting `hstore` to work be sure you have the `pg_hstore` extension loaded.
