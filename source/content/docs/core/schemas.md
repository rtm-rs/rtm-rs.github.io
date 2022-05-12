+++
title = "Schemas"
description = "Define explicit field names and types within a relation."
date = 2022-05-01T19:30:00+00:00
updated = 2022-05-01T19:30:00+00:00
draft = false
weight = 40
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = "Define explicit field names and types within a relation."
toc = true
top = false
+++

Schemas define explicit field names and types within a relation. All adapters
support relation schemas, and adapter-specific extensions can be provided as
well.  For example, `rtm-sql` extends the core schema DSL with support for
database-specific types.

Apart from adapter-specific extensions, schemas can be *extended by you* since
you can define your own *types* as well as your own custom methods available on
attribute objects.

## Why?

First of all, because schemas give an explicit definition for the data
structures a given relation returns.

Both **relations** and **commands** use schemas to process data, this gives you
type-safe commands out-of-the-box, with optional ability to perform low-level
database coercions (like coercing a hash to a PostgreSQL hash etc.), as well as
optional coercions when reading data.

Furthermore, schemas can provide meta-data that can be used to automate many
common tasks, like generating relations automatically for associations.

## Defining schemas explicitly

The DSL is simple. Provide a symbol name with a type from the Types module:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
#[derive(rtm::Relation)]
#[rtm(adapter = sql)]
struct Users {
  id: rtm::Types::Int,
  name: rtm::Types::String,
  age: rtm::Types::Int,
}
```

---

```ruby
class Users < ROM::Relation[:http]
  schema do
    attribute :id, Types::Int
    attribute :name, Types::String
    attribute :age, Types::Int
  end
end
```

{% end %}

## Inferring schemas

If the adapter that you use supports inferring schemas, your schemas can be
defined as:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
#[derive(rtm::Relation)]
#[rtm(adapter = sql, interpolate = true)]
struct Users;
```

---

```ruby
class Users < ROM::Relation[:sql]
  schema(infer: true)
end
```

{% end %}

You can also **override inferred attributes**:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
#[derive(rtm::Relation)]
#[rtm(adapter = sql, interpolate = true)]
struct Users {
  name: rtm::Types::MyCustomNameType,
};
```

---

```ruby
class Users < ROM::Relation[:sql]
  schema(infer: true) do
    # this overrides inferred :meta attribute
    attribute :meta, Types::MyCustomMetaType
  end
end
```

{% end %}

## Types namespace

All builtin types are defined in `rtm::Types` namespace, and individual adapters
may provide their own namespace which extends the builtin one. For example
`rtm-sql` provides `rtm::sql::Types` and `rtm::sql::types::PG`.

## Primary keys

You can set up a primary key, either a single attribute or a composite:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
#[derive(rtm::Relation)]
#[rtm(adapter = sql, primary_key=[id])]
struct Users {
  id: rtm::Types::Int,
  name: rtm::Types::String,
  age: rtm::Types::Int,
}
```

---

```ruby
class Users < ROM::Relation[:http]
  schema do
    attribute :id, Types::Int
    attribute :name, Types::String
    attribute :age, Types::Int

    primary_key :id
  end
end
```

{% end %}

For a composite primary key, pass the relevant field names:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
#[derive(rtm::Relation)]
#[rtm(adapter = http, primary_key=[user_id, group_id])]
struct UsersGroups {
  user_id: rtm::Types::Int,
  group_id: rtm::Types::Int,
}
```

---

```ruby
class UsersGroups < ROM::Relation[:http]
  schema do
    attribute :user_id, Types::Int
    attribute :group_id, Types::Int

    primary_key :user_id, :group_id
  end
end
```

{% end %}

{% info() %}
`primary_key` is a shortcut for the annotation:
`rtm::Types::Int.meta!(primary_key = true)`
{% end %}

## Foreign Keys

You can set up foreign keys pointing to a specific relation:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
#[derive(rtm::Relation)]
#[rtm(adapter = http)]
struct Posts {
  user_id: rtm::Types::ForeignKey(Users),
  // defaults to `Types::Int` but can be overridden:
  #[rtm(default = rtm::Types::Uuid)]
  user_id: rtm::Types::ForeignKey(Users),
}
```

---

```ruby
class Posts < ROM::Relation[:http]
  schema do
    attribute :user_id, Types::ForeignKey(:users)
    # defaults to `Types::Int` but can be overridden:
    attribute :user_id, Types::ForeignKey(:users, Types::UUID)
  end
end
```

{% end %}

{% info() %}
`foreign_key` is a shortcut for the annotation:
`rtm::Types::Int.meta!(foreign_key = true, relation = Users)`
{% end %}

## Annotations

Schema types provide an API for adding arbitrary meta-information. This is
mostly useful for adapters, or anything that may need to introspect relation
schemas.

Here's an example:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
#[derive(rtm::Relation)]
#[rtm(adapter=http)]
struct Users{
  name: rtm::Types::String.meta!(namespace = 'details'),
}
```

---

```ruby
class Users < ROM::Relation[:http]
  schema do
    attribute :name, Types::String.meta(namespace: 'details')
  end
end
```

{% end %}

Here we defined a `namespace` meta-information, that can be used accessed via
`name` type:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
Users::schema("name").meta("namespace") // 'details'
```

---

```ruby
Users.schema[:name].meta[:namespace] # 'details'
```

{% end %}

## Using `write` types

Relation commands will automatically use schema fields when processing the
input. This allows us to perform data store-specific coercions, setting default
values or applying low-level constraints.

Let's say our setup requires generating a UUID prior executing a command:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
#[derive(rtm::Relation)]
#[rtm(adapter = http)]
struct Users {
    id: rtm::Types::String(None).default(|| { SecureRandom::uuid() })
    name, Types::String
    age, Types::Int
}
```

---

```ruby
class Users < ROM::Relation[:http]
  UUID = Types::String.default { SecureRandom.uuid }

  schema do
    attribute :id, UUID
    attribute :name, Types::String
    attribute :age, Types::Int
  end
end
```

{% end %}

Now when you persist data using [repositories](/learn/repositories/) or
[commands](/learn/core/commands/), your schema will be used to process the
input data, and our `id` value will be handled by the type we've defined.

## Using `read` types

Apart from `write` types, you can also specify `read` types, these are used by
relations when they read data from a data store. You can define them using
`read` option:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
#[derive(rtm::Relation)]
#[rtm(adapter = http)]
struct Users {
    id: rtm::Types::Serial,
    name: rtm::Types::String,
    #[rtm(read = Types::Coercible::Date)]
    birthday: rtm::Types::String,
  end
end
```

---

```ruby
class Users < ROM::Relation[:http]
  schema do
    attribute :id, Types::Serial
    attribute :name, Types::String
    attribute :birthday, Types::String, read: Types::Coercible::Date
  end
end
```

{% end %}

Now when `Users` relation reads data, `birthday` values will be processed via
`Types::Coercible::Date`.

## Type System

Schemas use the Rust type system and you can define your own schema types
however you want. What types you need really depends on your application
requirements, the adapter you're using, specific use cases of your application
and so on.

Here are a couple of guidelines that should help you in making right decisions:

* Don't treat relation schemas as a complex coercion system that is used against
  data received at the HTTP boundary (e.g. request parameters)
* Coercion logic for input should be low-level (eg. `Hash` => `PGHash` in
  `rtm-sql`)
* Default values should be used as a low-level guarantee that some value is
  **always set** before making a change in your database. Generating a unique ID
  is a good example. For default values that are closer to your application
  domain it's better to handle this outside of the persistence layer. For
  example, setting `draft` as the default value for the `status` of a post,
  is part of your domain more than it is part of your persistence layer.
* Rust types will raise an `Error` when invalid data is accidentally passed to a
  command. Nonetheless, typically you want to validate the data prior
  sending them to a command, but there might be use cases where you expect data
  to be valid already, and any type error *is indeed an exception* and you want
  your system to panic.

## Learn more

You can learn more about adapter-specific schemas:

* [SQL schemas](/docs/sql/schemas)
