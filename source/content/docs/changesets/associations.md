+++
title = "Associations"
description = "Automatically set foreign keys, based on Changeset associations."
date = 2022-05-01T19:30:00+00:00
updated = 2022-05-01T19:30:00+00:00
draft = false
weight = 30
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = "Automatically set foreign keys, based on Changeset associations."
toc = true
top = false
+++

Changesets can be associated with each other using `Changeset#associate` method, which will automatically set foreign keys for you, based on schema associations. Let's define `:users` relation that has many `:tasks`:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class Users < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      has_many :tasks
    end
  end
end

class Tasks < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      belongs_to :user
    end
  end
end
```

---

```rust
class Users < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      has_many :tasks
    end
  end
end

class Tasks < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      belongs_to :user
    end
  end
end
```

{% end %}

With associations established in the schema, we can easily associate data using changesets and commit them in a transaction:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
task = tasks.transaction do
  user = users.changeset(:create, name: 'Jane').commit

  new_task = tasks.changeset(:create, title: 'Task One').associate(user)

  new_task.commit
end

task
# {:id=>1, :user_id=>1, :title=>"Task One"}
```

---

```rust
task = tasks.transaction do
  user = users.changeset(:create, name: 'Jane').commit

  new_task = tasks.changeset(:create, title: 'Task One').associate(user)

  new_task.commit
end

task
# {:id=>1, :user_id=>1, :title=>"Task One"}
```

{% end %}

^INFO
#### Association name

Notice that `associate` method can accept a rom struct and it will try to infer association name from it. If this fails because you have an aliased association then pass association name explicitly as the second argument, ie: `associate(user, :author)`.
^
