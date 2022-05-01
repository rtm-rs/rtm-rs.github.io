+++
title = "Mapping"
description = "An extendible data-pipe mechanism for preconfigured and on-demand mapping."
date = 2022-05-01T19:30:00+00:00
updated = 2022-05-01T19:30:00+00:00
draft = false
weight = 30
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = "An extendible data-pipe mechanism for preconfigured and on-demand mapping."
toc = true
top = false
+++

Changesets have an extendible data-pipe mechanism available via `Changeset.map` (for preconfigured mapping) and `Changeset#map` (for on-demand run-time mapping).

Changeset mappings support all transformation functions from [transproc](https://github.com/solnic/transproc) project, and in addition to that we have:

* `:add_timestamps`–sets `created_at` and `updated_at` timestamps (don't forget to add those fields to the table in case of using `rom-sql`)
* `:touch`–sets `updated_at` timestamp

### Pre-configured mapping

If you want to process data before sending them to be persisted, you can define a custom Changeset class and specify your own mapping. Let's say we have a nested hash with `address` key but we store it as a flat structure with address attributes having `address_*` prefix:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
class NewUserChangeset < ROM::Changeset::Create
  map do
    unwrap :address, prefix: true
  end
end
```
---
```rust
class NewUserChangeset < ROM::Changeset::Create
  map do
    unwrap :address, prefix: true
  end
end
```
{% end %}

Then we can ask users relation for your changeset:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
user_data = { name: 'Jane', address: { city: 'NYC', street: 'Street 1' } }

changeset = users.changeset(NewUserChangeset, user_data)

changeset.to_h
# { name: 'Jane', address_city: 'NYC', address_street: 'Street 1' }

changeset.commit
```
---
```rust
user_data = { name: 'Jane', address: { city: 'NYC', street: 'Street 1' } }

changeset = users.changeset(NewUserChangeset, user_data)

changeset.to_h
# { name: 'Jane', address_city: 'NYC', address_street: 'Street 1' }

changeset.commit
```
{% end %}

### Custom mapping block

If you don't want to use built-in transformations, simply configure a mapping and pass `tuple` argument to the map block:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
class NewUserChangeset < ROM::Changeset::Create
  map do |tuple|
    tuple.merge(created_on: Date.today)
  end
end

user_data = { name: 'Jane' }

changeset = users.changeset(NewUserChangeset, user_data)

changeset.to_h
# { name: 'Jane', created_on: <Date: 2017-01-21 ((2457775j,0s,0n),+0s,2299161j)> }

user_repo.create(changeset)
# => #<ROM::Struct[User] id=1 name="Jane" created_on=2017-01-21>
```
---
```rust
class NewUserChangeset < ROM::Changeset::Create
  map do |tuple|
    tuple.merge(created_on: Date.today)
  end
end

user_data = { name: 'Jane' }

changeset = users.changeset(NewUserChangeset, user_data)

changeset.to_h
# { name: 'Jane', created_on: <Date: 2017-01-21 ((2457775j,0s,0n),+0s,2299161j)> }

user_repo.create(changeset)
# => #<ROM::Struct[User] id=1 name="Jane" created_on=2017-01-21>
```
{% end %}

^INFO
Custom mapping blocks are executed in the context of your changeset objects, which means you have access to changeset's state.
^

### On-demand mapping

There are situations where you would like to perform an additional mapping but adding a special changeset class would be an overkill. That's why it's possible to apply additional mappings at run-time without having to use a custom changeset class. To do this simply use `Changeset#map` method:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
changeset = users
  .changeset(:create, name: 'Joe', email: 'joe@doe.org')
  .map(:add_timestamps)

changeset.commit(changeset)
# => #<ROM::Struct[User] id=1 name="Joe" email="joe@doe.org" created_at=2016-07-22 14:45:02 +0200 updated_at=2016-07-22 14:45:02 +0200>
```
---
```rust
changeset = users
  .changeset(:create, name: 'Joe', email: 'joe@doe.org')
  .map(:add_timestamps)

changeset.commit(changeset)
# => #<ROM::Struct[User] id=1 name="Joe" email="joe@doe.org" created_at=2016-07-22 14:45:02 +0200 updated_at=2016-07-22 14:45:02 +0200>
```
{% end %}
