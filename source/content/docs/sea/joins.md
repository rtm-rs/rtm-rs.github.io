+++
title = "Joins"
description = "Loading associated relations."
date = 2022-05-01T15:00:00+00:00
updated = 2022-05-01T15:00:00+00:00
draft = false
weight = 70
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = 'Loading associated relations.'
toc = true
top = false
+++

To load associated relations you can simply use `join`, `left_join`, or `right_join`.

## Using joins with relations

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class Users < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      has_many :tasks
      has_many :posts
    end
  end

  def with_tasks
    join(tasks)
  end

  def with_posts
    left_join(posts)
  end
end
```

---

```rust
class Users < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      has_many :tasks
      has_many :posts
    end
  end

  def with_tasks
    join(tasks)
  end

  def with_posts
    left_join(posts)
  end
end
```

{% end %}

## Using joins with explicit name and options

If you want to have more control, you can pass table name and additional options yourself:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class Users < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      has_many :tasks
      has_many :posts
    end
  end

  def with_tasks
    join(:tasks, user_id: :id, priority: 1)
  end

  def with_posts
    left_join(:posts, user_id: :id)
  end
end
```

---

```rust
class Users < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      has_many :tasks
      has_many :posts
    end
  end

  def with_tasks
    join(:tasks, user_id: :id, priority: 1)
  end

  def with_posts
    left_join(:posts, user_id: :id)
  end
end
```

{% end %}

## Using joins with additional options

The second option hash can be used too, if you want to provide more options:

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class Users < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      has_many :tasks
      has_many :posts
    end
  end

  def with_tasks
    join(:tasks, { user_id: :id }, table_alias: :user_tasks)
  end

  def with_posts
    left_join(posts, { user_id: :id }, table_alias: :user_posts)
  end
end
```

---

```rust
class Users < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      has_many :tasks
      has_many :posts
    end
  end

  def with_tasks
    join(:tasks, { user_id: :id }, table_alias: :user_tasks)
  end

  def with_posts
    left_join(posts, { user_id: :id }, table_alias: :user_posts)
  end
end
```

{% end %}

## Learn more

Check out API docs:

* [api::rom-sql::SQL/Relation/Reading]( join)
* [api::rom-sql::SQL/Relation/Reading]( left_join)
* [api::rom-sql::SQL/Relation/Reading]( right_join)
