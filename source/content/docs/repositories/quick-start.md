+++
title = "Quick Start"
description = "Learn how to work with RTM repositories"
date = 2022-05-01T15:00:00+00:00
updated = 2022-05-01T15:00:00+00:00
draft = false
weight = 20
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = 'Learn how to work with RTM repositories'
toc = true
top = false
+++

This documentation uses `rom-sql` as an example. For in-depth information see documentation for specific databases.

## Creating a schema

You can quickly create a schema inside the setup block. Let's configure our SQL gateway and create a `:users` table:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
require 'rom'

rom = ROM.container(:sql, 'sqlite::memory') do |conf|
  conf.default.create_table(:users) do
    primary_key :id
    column :name, String, null: false
    column :email, String, null: false
  end

  class Users < ROM::Relation[:sql]
    schema(infer: true)
  end

  conf.register_relation(Users)
end
```
---
```rust
require 'rom'

rom = ROM.container(:sql, 'sqlite::memory') do |conf|
  conf.default.create_table(:users) do
    primary_key :id
    column :name, String, null: false
    column :email, String, null: false
  end

  class Users < ROM::Relation[:sql]
    schema(infer: true)
  end

  conf.register_relation(Users)
end
```
{% end %}

## Repositories

A Repository ("Repo") object provides a lot of conveniences for reading data with relations. Every repo can access one or more relations, depending on how you set it up.

To set up a repo to work with our `:users` relation simply define a class like this:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
require 'rom-repository'

class UserRepo < ROM::Repository[:users]
end
```
---
```rust
require 'rom-repository'

class UserRepo < ROM::Repository[:users]
end
```
{% end %}

Repositories must be instantiated with a rom container passed to the constructor, this gives access to all components within the container:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
user_repo = UserRepo.new(rom)
```
---
```rust
user_repo = UserRepo.new(rom)
```
{% end %}

Let's see how Create, Update and Delete commands work with repositories.

### Create

A repo can be configured to provide access to `Create` commands:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
require 'rom-repository'

class UserRepo < ROM::Repository[:users]
  commands :create
end
```
---
```rust
require 'rom-repository'

class UserRepo < ROM::Repository[:users]
  commands :create
end
```
{% end %}

The `commands` macro defines a `UserRepo#create` method for us:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
user_repo.create(name: "Jane", email: "jane@doe.org")
# => #<ROM::Struct[User] id=1 name="Jane" email="jane@doe.org">
```
---
```rust
user_repo.create(name: "Jane", email: "jane@doe.org")
# => #<ROM::Struct[User] id=1 name="Jane" email="jane@doe.org">
```
{% end %}

By default, repos return simple `ROM::Struct` objects. You'll learn more about them in [reading][reading-simple-objects] section.

### Update and Delete

Update and Delete commands require restricting relations so that RTM knows exactly which records to modify. Provide :update and :delete with the symbol name of the method to call to get that restricted relation.

The most popular adapter, rom-sql, automatically defines a method, `by_pk`, that restricts by the primary key. In projects with rom-sql, we would use it to define update and delete commands in a repo:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
require 'rom-repository'

class UserRepo < ROM::Repository[:users]
  commands :create, update: :by_pk, delete: :by_pk
end
```
---
```rust
require 'rom-repository'

class UserRepo < ROM::Repository[:users]
  commands :create, update: :by_pk, delete: :by_pk
end
```
{% end %}

Now we have a full `CRUD` setup, we can create, update and delete user data:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}
```ruby
user = user_repo.create(name: "Jane", email: "jane@doe.org")
# => #<ROM::Struct[User] id=1 name="Jane" email="jane@doe.org">

# let's update the user
updated_user = user_repo.update(user.id, name: "Jane Doe")
# => #<ROM::Struct[User] id=1 name="Jane Doe" email="jane@doe.org">

# and now let's delete the user
user_repo.delete(user.id)
```
---
```rust
user = user_repo.create(name: "Jane", email: "jane@doe.org")
# => #<ROM::Struct[User] id=1 name="Jane" email="jane@doe.org">

# let's update the user
updated_user = user_repo.update(user.id, name: "Jane Doe")
# => #<ROM::Struct[User] id=1 name="Jane Doe" email="jane@doe.org">

# and now let's delete the user
user_repo.delete(user.id)
```
{% end %}

## Next

Now that you know how to create tables and define repositories with full CRUD support, you can proceed to [reading simple objects](./repositories/reading-simple-objects/).
