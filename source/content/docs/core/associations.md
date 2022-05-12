+++
title = "Associations"
description = "Define associations between different tables or datastores."
date = 2022-05-01T19:30:00+00:00
updated = 2022-05-01T19:30:00+00:00
draft = false
weight = 50
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = "Define associations between different tables or datastores."
toc = true
top = false
+++

Associations in RTM are based on the Relation API, you can configure them using
`associations` block in schema definition. All adapters have access to this API
and you can define associations between different datastores too. Available
associations are: `has_one`, `has_many`, `belongs_to` (many-to-many or `M<->N`)

## Association model explained

{% tip() %}

Using associations means **composing relations**, this gives you a lot of
freedom in the way you fetch complex data structures from your database.

{% end %}

Here's how it works using plain Rust:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
users = vec![ User { id: 1, name: "Jane" }, User { id: 2, name: "John" }]
tasks = vec![ Task { id: 1, user_id: 1, title: "Jane's task" },
              Task { id: 2, user_id: 2, title: "John's task" }]

tasks_for_users = |users| {
  let user_ids = users.iter().map(|u| u.id ).collect();
  tasks.retain(|t| user_ids.contain(t.user_id) )
}

// Fetch tasks for specific users
tasks_for_users(vec![User { id: 2, name: "John", }])
// Vec<Task { id: 2, user_id: 2, title: "John's task" }>
```

---

```ruby
users = [{ id: 1, name: "Jane" }, { id: 2, name: "John" }]
tasks = [{ id: 1, user_id: 1, title: "Jane's task" },
         { id: 2, user_id: 2, title: "John's task" }]

tasks_for_users = -> users {
  user_ids = users.map { |u| u[:id] }
  tasks.select { |t| user_ids.include?(t[:user_id]) }
}

# fetch tasks for specific users
tasks_for_users.call([{ id: 2, name: "John" }])
# [{ id: 2, user_id: 2, title: "John's task" }]
```

{% end %}

This example shows **the exact conceptual model of associations in RTM**. Here
are the important parts to understand:

- `tasks_for_users` is an association **function** (actually an anonymous
  function or closure) which returns all tasks matching particular users
- `user_id` is **our combine-key**, it **must be included** in the resulting
  data and it's used to merge results into nested data structures

Let's translate this to actual relations using the memory adapter:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
use "rtm"
use "rtm/memory"

#[derive(rtm::Relation)]
#[rtm(adapter = memory, primary_key=[id],
      associations = [
        has_many = [ relation = Tasks, combine_key = user_id, override = true,
                     view = for_users]
                   ]
)]
struct Users {
    id: Types::Int,
    name: Types::String,
}

#[derive(rtm::Relation)]
#[rtm(adapter = memory, primary_key=[id], has_many = Tasks)]
struct Tasks {
    id: rtm::Types::Int,
    user_id: rtm::Types::Int,
    title: rtm::Types::String,
}

// The function `for_users` is the view indicated in the associations list.
impl Tasks {
    fn for_users(_assoc: Association, users: Users){
        retain(|t| users.map(|u| u.id ).collect().contains(t.user_id))
    }
}

let rtm = rtm::Container(Memory, |config|{
  config.register(Users, Tasks)
});

let users = rtm.relations!(Users);
let tasks = rtm.relations!(Tasks);

[User { id: 1, name: "Jane" },
 User { id: 2, name: "John" }].iter()
    .map(|tuple| users.insert(tuple))
[Task { id: 1, user_id: 1, title: "Jane's task" },
 Task { id: 2, user_id: 2, title: "John's task" }].iter()
    .map(|tuple| tasks.insert(tuple))

// load all tasks for all users
tasks.for_users(users.associations!(Tasks), users).to_vec
// Vec< Task {:id=>1, :user_id=>1, :title=>"Jane's task"},
//      Task {:id=>2, :user_id=>2, :title=>"John's task"} >

// load tasks for particular users
tasks.for_users(users.associations!(Tasks), users.retain(|&u| u.name == "John")).to_vec
// Vec< Task {:id=>2, :user_id=>2, :title=>"John's task"} >

// when we use `combine`, our `for_users` will be called behind the scenes
puts users.restrict(name: "John").combine(:tasks).to_vec
// Vec< UsersTasks {:id=>2, :name=>"John",
//       :tasks=>[{:id=>2, :user_id=>2, :title=>"John's task"}]} >
```

---

```ruby
require "rom"
require "rom/memory"

class Users < ROM::Relation[:memory]
  schema do
    attribute :id, Types::Int
    attribute :name, Types::String

    primary_key :id

    associations do
      has_many :tasks, combine_key: :user_id, override: true, view: :for_users
    end
  end
end

class Tasks < ROM::Relation[:memory]
  schema do
    attribute :id, Types::Int
    attribute :user_id, Types::Int
    attribute :title, Types::String

    primary_key :id
  end

  def for_users(_assoc, users)
    restrict(user_id: users.map { |u| u[:id] })
  end
end

rom = ROM.container(:memory) do |config|
  config.register_relation(Users, Tasks)
end

users = rom.relations[:users]
tasks = rom.relations[:tasks]

[{ id: 1, name: "Jane" }, { id: 2, name: "John" }].each{|tuple|
    users.insert(tuple)
}
[{ id: 1, user_id: 1, title: "Jane's task" },
 { id: 2, user_id: 2, title: "John's task" }].each{|tuple|
    tasks.insert(tuple)
}

# load all tasks for all users
tasks.for_users(users.associations[:tasks], users).to_a
# [{:id=>1, :user_id=>1, :title=>"Jane's task"},
#  {:id=>2, :user_id=>2, :title=>"John's task"}]

# load tasks for particular users
tasks.for_users(users.associations[:tasks], users.restrict(name: "John")).to_a
# [{:id=>2, :user_id=>2, :title=>"John's task"}]

# when we use `combine`, our `for_users` will be called behind the scenes
puts users.restrict(name: "John").combine(:tasks).to_a
# {:id=>2, :name=>"John", :tasks=>[{:id=>2, :user_id=>2, :title=>"John's task"}]}
```

{% end %}

Notice that:

- Just like in our plain Rust example, the "view" `Tasks#for_users` is a function
  which returns all tasks for particular users, and `Users` and `Tasks`
  relations are just collections of data
- We specified `user_id` as our combine-key, so that data can be merged into a
  nested data structure via the `combine` method

This model is used by all adapters, even when you don't see it, it is there. In
`rtm-sql` default association views are generated for you, which is the whole
magic behind associations in SQL, this is why in case of SQL, we could translate
our previous example to this:

{% tip() %}

In RTM all table create/update/delete actions must be done via migrations. You
can, transparently to the user, infer a Rust `struct` or `type` from a data
store because the data store adapter has to explicitly setout how it maps
components to Rust `struct` or `enum`. You cannot infer a data store from a
`struct` or `type` without requiring the user hold a mental model of the data
store adapter - one purpose of RTM is to remove such burdens.

{% end %}

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
use "rtm"

rtm::container[Sql]["sqlite::memory"](|config| {

    #[derive(rtm::Relation)]
    #[rtm(adapter = sql, gateway = default, interpolate = true,
          primary_keys = [id],
          association = [has_many = Tasks])]
    struct Users ;

    #[derive(rtm::Relation)]
    #[rtm(adapter = sql, gateway = default, interpolate = true
          primary_keys =[id], foreign_keys = [(Users,user_id)])]
    struct Tasks;

  // Can register: Relations, Commands, Mappers.  Distinct from plugins.
  // Reference: https://stackoverflow.com/a/41666358
  // fn register(core: impl Core, components: Vec<&Core>)
  config.register(Relations, vec![Users, Tasks])
})

let mut users = rom.relations[Users]
let mut tasks = rom.relations[Tasks]

let mut u = vec![ User { id: 1, name: "Jane" },
                  User { id: 2, name: "John" }];
users.append(u);

let mut t = vec![ Task { id: 1, user_id: 1, title: "Jane's task" },
                  Task { id: 2, user_id: 2, title: "John's task" }];
tasks.append(t);

users.combine(tasks).to_vec
// HashMap< (User {:id=>1, :name=>"Jane"},
//           Tasks< Task {:id=>1, :user_id=>1, :title=>"Jane's task"}),
//          (User {:id=>2, :name=>"John"},
//           Tasks< Task {:id=>2, :user_id=>2, :title=>"John's task"})>

// Implementation reference for Hashable types and Type Objects:
// https://stackoverflow.com/questions/64838355/how-do-i-create-a-hashmap-with-type-erased-keys
users.where(name: "John").combine(:tasks).to_a
// HashMap< User {:id=>2, :name=>"John" },
//          Tasks< Task {:id=>2, :user_id=>2, :title=>"John's task"}>} >
```

---

```ruby
require "rom"

ROM.container(:sql, 'sqlite::memory') do |config|
  config.gateways[:default].create_table(:users) do
    primary_key :id
    column :name, String
  end

  config.gateways[:default].create_table(:tasks) do
    primary_key :id
    foreign_key :user_id, :users
    column :title, String
  end

  class Users < ROM::Relation[:sql]
    schema(infer: true) do
      associations do
        has_many :tasks
      end
    end
  end

  class Tasks < ROM::Relation[:sql]
    schema(infer: true)
  end

  config.register_relation(Users, Tasks)
end

users = rom.relations[:users]
tasks = rom.relations[:tasks]

[{ id: 1, name: "Jane" },
 { id: 2, name: "John" }].each { |tuple| users.insert(tuple) }
[{ id: 1, user_id: 1, title: "Jane's task" },
 { id: 2, user_id: 2, title: "John's task" }].each {
    |tuple| tasks.insert(tuple)
}

users.combine(:tasks).to_a
# [{:id=>1, :name=>"Jane", :tasks=>[{:id=>1, :user_id=>1, :title=>"Jane's task"}]},
#  {:id=>2, :name=>"John", :tasks=>[{:id=>2, :user_id=>2, :title=>"John's task"}]}]

users.where(name: "John").combine(:tasks).to_a
# [{:id=>2, :name=>"John", :tasks=>[{:id=>2, :user_id=>2, :title=>"John's task"}]}]
```

{% end %}

## Learn more

- [api::rom::Schema](AssociationsDSL)
- [api::rom::Relation](combine)
- [api::rom::Relation](wrap)
