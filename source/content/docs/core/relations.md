+++
title = "Relations"
description = "The heart of RTM."
date = 2022-05-01T19:30:00+00:00
updated = 2022-05-01T19:30:00+00:00
draft = false
weight = 30
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = "The heart of RTM."
toc = true
top = false
+++

Relations are really the heart of RTM. They provide APIs for reading the data
from various data stores, and low-level interfaces for making changes in the
data stores.
Relations are adapter-specific, which means that each adapter provides its own
relation specialization, exposing interfaces that make it easy to leverage the
features of the adapter backend.
At the same time, these relations encapsulate data access, so that details
about how it's done don't leak into your application domain layer.

## Relation types

In typical setup of an application using RTM, relations are a `struct`.
You can put them in separate files, namespace them or not, and configure
them when it's needed (especially useful when using a legacy database with
non-standard naming conventions).

The most important responsibility of relations is to expose a clear API for reading
data. Every relation *method* should return another relation, we call them
*relation views*. These views can be defined in ways that make them
*composable* by including combine-keys in the resulting tuples. This is not limited
to SQL, you can compose data from different data store sources.

### Example relation type

Let's say we have a `users` table in a SQL database, here's how you would define
a relation class for it:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
#[derive(rtm::Relation)]
#[rtm(adapter = sql, infer = true)] // `adapter = sql, infer = true` are defaults so could be omitted
struct Users;
```

---

```ruby
class Users < ROM::Relation[:sql]
  schema(infer: true)
end
```

{% end %}

Notice a few things:

- `rtm::Relation` uses `rtm(adapter = sql, infer = true)` attribute to resolve
  a relation type for the `rtm-sql` adapter
- `Users` type name is used by default to infer the `dataset` name and set it
  to `users`
- `infer = true` means type fields are inferred from the database schema, and
  will include fields based on the table columns

### Relation methods

Every method in a relation should return another relation, this happens automatically
whenever you use a query interface provided by adapters. In our example we use
`rtm-sql`, let's define a relation view called `listing`, using the SQL query DSL:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class Users < ROM::Relation
  def listing
    select(:id, :name, :email).order(:name)
  end
end
```

---

```rust
#[derive(rtm::Relation)]
#[rtm(adapter = sql, infer = true)] // `adapter = sql, infer = true` are defaults so could be omitted
struct Users;
// Implements find!(){find!(Users)}, etc.

async fn listing<C>(conn: &C ) -> Vec<UsersData>
      where C: rtm::Connection
{
    Users::find!().order!(Name, ascending).all!(conn).await?;
}

// Alternative:
impl Users {
  async fn listing<C>(conn: &C ) -> Vec<UsersData>
      where C: rtm::Connection
  {
    Self::find!().order!(Name, ascending).all!(conn).await?;
    // For Sea ORM:
    // Users::find()
    //       //.filter(users::Column::Name.contains("bob"))
    //       .order_by_asc(users::Column::Name)
    //       .all(conn)
    //       .await?
  }
}
```

{% end %}

## Materializing relations

To materialize a relation means asking it to load its data from a data store.
Relations can be materialized in a couple of ways, and you should be cautious
about when it's happening, so that the minimum amount of interactions with
a data store takes place.

### Getting all results

To get all results, simply coerce a relation to a `Vector` via `rel.to_vec()`:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
users.to_vec()
=> Vector< User {:id=>1, :name=>"Jane Doe"}, User {:id=>2, :name=>"John Doe"}]
```

---

```ruby
users.to_a
=> [{:id=>1, :name=>"Jane Doe"}, {:id=>2, :name=>"John Doe"}]
```

{% end %}

### Getting a single result

To materialize a relation and retrieve just a single result, use `#one` or `#one`:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
# Produces a single result or nil if none found.
# Raises an error if there are more than one.
users.one

# Produces a single tuple.
# Raises an error if there are 0 results or more than one.
users.one!
```

---

```rust
// Produces a single `Option` with `Some(type)` or `None` if none found.
// Raises an error if there are more than one.
users.one!()

// Produces a Result with Option type Some(value) or `None` if none found.
// Return a Result if there are 0 results or more than one.
users.try_one!()
```

{% end %}

### Iteration

If you start iterating over a relation via `Relation#iter`, the relation
will get its data via `#to_vec` and yield results to the block.

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
for user in users.iter() {
  println!("{}", user.name)
}
// Jane Doe
// John Doe
```

---

```ruby
users.each do |user|
  puts user[:name]
end
# Jane Doe
# John Doe
```

{% end %}

### Next

Now let's see how you can use [relation schemas](/docs/core/schemas).
