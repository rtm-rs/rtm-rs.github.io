+++
title = "Combines"
description = "Reliably combine and construct complex nested data structures."
date = 2022-05-01T19:30:00+00:00
updated = 2022-05-01T19:30:00+00:00
draft = false
weight = 60
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = "Reliably combine and construct complex nested data structures."
toc = true
top = false
+++

Combines are a feature provided by [relations](/learn/core/relations) that take
advantage of [associations](/learn/core/associations) between relations to
reliably merge (a.k.a. combine) and construct complex nested data structures.

In cases where there is a need to load some data along with its dependent nested
data then `<Relation>.combine` is the tool to reach for. It might be a
bit of a paradigm shift, but it's important to realize RTM will **never** load
associated data unless it is explicitly told to do so.

This idea is in stark contrast with other ORMs such as Active Record for Rails,
and SQLAlchemy which offer lazy loading by default and Django which provides
opt-in lazy loading. Since composing data is so quick and easy lazy loading is
not needed preventing a whole class of issues such as `N+1` query performance
problems.

{% info() %}

  Before you can combine relations an association has to be configured in the
  relation schema. See [associations](/docs/core/associations) for more
  details.

{% end %}

## Basic Combine

Suppose we have a set of relations `Projects`, `ProjectTasks`, `Users` and a
dataset defined as such:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
// Dataset:
//
// Purely a visual representation of data as it would sit in a data store
users = vec![
  User {id: 1, username: "briang"},
  User {id: 2, username: "mary_matrix"}
]

projects = vec![
  Project {id: 1, user_id: 1, name: "Kinda Lame Project"},
  Project {id: 2, user_id: 2, name: "Super Important Project"},
  Project {id: 3, user_id: 1, name: "Secret Mega Project"}
]

project_tasks = vec![
  ProjectTask {id: 1, project_id: 1, description: "Project 1, Task 1"},
  ProjectTask {id: 2, project_id: 1, description: "Project 1, Task 2"},
  ProjectTask {id: 3, project_id: 2, description: "Project 2, Task 1"},
  ProjectTask {id: 4, project_id: 2, description: "Project 2, Task 2"},
  ProjectTask {id: 5, project_id: 3, description: "Project 3, Task 1"},
]

// Relations
#[derive(rtm::Relation)]
#[rtm(adapter = sql, interpolate = true,
      associations = [ has_many = [relation = ProjectTasks],
                       belongs_to = [relation = users, as = User]])]
struct Projects;

#[derive(rtm::Relation)]
#[rtm(adapter = sql, interpolate = true,
      associations = [ belongs_to = [ relation = Projects, as = Project]])]
struct ProjectTasks;

#[derive(rtm::Relation)]
#[rtm(adapter = Sql, interpolate = true,
      associations = [has_many = [relation = Projects, view = by_id]])]
struct Users;

// `rtm-sql` provides a relation view called `by_pk(id)`
// which does the same thing as this - for clarity we've included
// this relation view
fn by_id(&self, id: impl PrimaryKeyTrait ) {
  self.where(id)
}
```

---

```ruby
# Dataset representation

# purely a visual representation of the data
# as it would sit in the database
users = [
  {id: 1, username: 'briang'},
  {id: 2, username: 'mary_matrix'}
]

projects = [
  {id: 1, user_id: 1, name: 'Kinda Lame Project'},
  {id: 2, user_id: 2, name: 'Super Important Project'},
  {id: 3, user_id: 1, name: 'Secret Mega Project'}
]

project_tasks = [
  {id: 1, project_id: 1, description: 'Project 1, Task 1'},
  {id: 2, project_id: 1, description: 'Project 1, Task 2'},
  {id: 3, project_id: 2, description: 'Project 2, Task 1'},
  {id: 4, project_id: 2, description: 'Project 2, Task 2'},
  {id: 5, project_id: 3, description: 'Project 3, Task 1'},
]

# Relations
class Projects < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      has_many   :project_tasks
      belongs_to :users, as: :user
    end
  end
end

class ProjectTasks < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      belongs_to :projects, as: :project
    end
  end
end

class Users < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      has_many :projects
    end
  end

  # rom-sql by default provides a relation view called 'by_pk(id)'
  # which does the same thing as this however for clarities sake
  # we've included this relation view
  def by_id(id)
    where(id: id)
  end
end
```

{% end %}

To load a specific user with all of their projects is pretty easy in RTM:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```ruby
# Example: 1
users_relation.by_id(2).one()
# => (User {:id=>2, :username=>"mary_matrix"})

# Example: 2
users_relation.combine!(Projects).by_id(2).one()
# => (User {id: 2, username: "mary_matrix"},
#     Projects< Project {:id=>2, :user_id=>2, :name=>"Super Important Project"} >)
```

---

```rust
//Example: 1
users_relation.by_id(2).one
// => User {:id=>2, :username=>"mary_matrix"}

// Example: 2
users_relation.combine(:projects).by_id(2).one
// => User {id: 2, username: "mary_matrix"},
//     Projects< Project{id: 2, user_id: 2, name: "Super Important Project"}>
```

{% end %}

As you can see from the output in the first example, only the data available in
the user relation is available where as in the second example the user with
their projects are included in the output. It's important to note that while the
project records are in the output, no project task records are. This again is
because RTM only loads the data you've requested. So what if you want to load a
user with all of their projects ***and*** tasks?

### Nested Combine

Using the same relations as defined in the [Basic Combine](#basic-combine)
section we can combine as many relations as we wish at any arbitrary depth:

Relations is a Vector newtype. Implmentation:
https://users.rust-lang.org/t/how-to-make-a-struct-that-holds-a-vector-collection-of-trait-objects/12829/9

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
// Fork the `vec![...]` macro as `rel![...]`
let rels: Relations = rel![Projects, ProjectTasks];
user_relation.by_id(2).combine(rels).one

// => {:id=>2,
//     :username=>"mary_matrix",
//     :projects=>[
//       {
//         :id=>2,
//         :user_id=>2,
//         :name=>"Super Important Project",
//         :project_tasks=>[
//           {
//             :id=>3,
//             :project_id=>2,
//             :description=>"Project 2, Task 1"
//           },
//           {
//            :id=>4,
//            :project_id=>2,
//            :description=>"Project 2,Task 2"
//           }
//         ]
//       }
//     ]
//   }
```

---

```ruby
user_relation.by_id(2).combine(projects: :project_tasks).one

# => {:id=>2,
#     :username=>"mary_matrix",
#     :projects=>[
#       {
#         :id=>2,
#         :user_id=>2,
#         :name=>"Super Important Project",
#         :project_tasks=>[
#           {
#             :id=>3,
#             :project_id=>2,
#             :description=>"Project 2, Task 1"
#           },
#           {
#             :id=>4,
#             :project_id=>2,
#             :description=>"Project 2,Task 2"
#           }
#         ]
#       }
#     ]
#   }
```

{% end %}

Nested combines allow developers to create properly normalized data sets and
then query them with ease. Since `Relation.combine` accepts a collection (a
Vector newtype) we could combine many, many more relations if we needed.

For instance, say every project and project task required a 'reviewer' to be
tracked on the record; something like this:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
#[derive(rtm::Relation)]
#[rtm(adapter=sql, interpolate = true,
      associations = [ has_many = [relation = ProjectTasks],
          belongs_to = [relation = Users, as = User],
          belongs_to = [relation = Users, as = ReviewedBy]])]
struct Projects;

#[derive(rtm::Relation)]
#[rtm(adapter=sql, interpolate = true,
      associations = [belongs_to = [relation = Projects, as = Project],
                      belongs_to = [relation = Users, as = reviewed_by]])]
struct ProjectTasks;
```

---

```ruby
class Projects < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      has_many   :project_tasks
      belongs_to :users, as: :user
      belongs_to :users, as: :reviewed_by
    end
  end
end

class ProjectTasks < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      belongs_to :projects, as: :project
      belongs_to :users, as: :reviewed_by
    end
  end
end
```

{% end %}

We can then combine a set of nested relations by passing `.combine(...)` a
`Hash` made of sub hashes or arrays matching the nested structure of our
relations. As an example:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
// Implementtaion:
// https://www.elmalabarista.com/blog/2022-flat-tree/
// https://manishearth.github.io/blog/2021/03/15/arenas-in-rust/
let rels: Relations = rel![Projects, rel![ProjectTasks, ReviewedBy], ReviewedBy]]
user_relation
  .by_id(2)
  .combine(rels)
  .one

// {:id=>2,
//  :username=>"mary_matrix",
//  :projects=>
//   [{:id=>2,
//     :user_id=>2,
//     :reviewed_by_id=>1,
//     :name=>"Super Important Project",
//     :project_tasks=>
//      [{:id=>3,
//        :project_id=>2,
//        :reviewed_by_id=>1,
//        :description=>"Project 2, Task 1",
//        :reviewed_by=>{:id=>1, :username=>"briang"}},
//       {:id=>4,
//        :project_id=>2,
//        :reviewed_by_id=>1,
//        :description=>"Project 2, Task 2",
//        :reviewed_by=>{:id=>1, :username=>"briang"}}],
//     :reviewed_by=>{:id=>2, :username=>"mary_matrix"}}]}
```

---

```ruby
user_relation
  .by_id(2)
  .combine(projects: [{project_tasks: :reviewed_by}, :reviewed_by])
  .one

# {:id=>2,
#  :username=>"mary_matrix",
#  :projects=>
#   [{:id=>2,
#     :user_id=>2,
#     :reviewed_by_id=>1,
#     :name=>"Super Important Project",
#     :project_tasks=>
#      [{:id=>3,
#        :project_id=>2,
#        :reviewed_by_id=>1,
#        :description=>"Project 2, Task 1",
#        :reviewed_by=>{:id=>1, :username=>"briang"}},
#       {:id=>4,
#        :project_id=>2,
#        :reviewed_by_id=>1,
#        :description=>"Project 2, Task 2",
#        :reviewed_by=>{:id=>1, :username=>"briang"}}],
#     :reviewed_by=>{:id=>2, :username=>"mary_matrix"}}]}
```

{% end %}

Admittedly, `combine` can become a bit messy when dealing with nested
relations, however if the nested combine becomes too unwieldy it might suggest
you're using the relation to select too much multi-purpose data. Our advice
would be to reevaluate the purpose of the final entity and see if it can be
broken into smaller, easily retrieved entities.

### Adjusted Combine

Sometimes you only want a subset of the data in a nested relation or you
want to restrict a nested relation to only return certain matching data.

Luckily with RTM that can easily be accomplished with the use of
`Relation.node`, or more accurately `Relation::Combined.node`. The node method
allows for the adjustment of all the relations in the composition.

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
user_relation
  .by_id(1)
  .combine(rel![Projects, ProjectTasks])
  .node(rel![Projects, ProjectTasks], |project_tasks_relation|{
    project_tasks_relation.where(Description, "Project 1, Task 2")
  })
  .one()

// {:id=>1,
//   :username=>"briang",
//   :projects=>
//    [{:id=>1,
//      :user_id=>1,
//      :reviewed_by_id=>2,
//      :name=>"Kinda Lame Project",
//      :project_tasks=>
//       [{:id=>2,
//         :project_id=>1,
//         :reviewed_by_id=>2,
//         :description=>"Project 1, Task 2"}]},   <-- LOOK HERE
//     {:id=>3,
//      :user_id=>1,
//      :reviewed_by_id=>2,
//      :name=>"Secret Mega Project",
//      :project_tasks=>[]}]}
```

---

```ruby
user_relation
  .by_id(1)
  .combine(projects: :project_tasks)
  .node(projects: :project_tasks) {|project_tasks_relation|
    project_tasks_relation.where(description: 'Project 1, Task 2')
  }
  .one

# {:id=>1,
#   :username=>"briang",
#   :projects=>
#    [{:id=>1,
#      :user_id=>1,
#      :reviewed_by_id=>2,
#      :name=>"Kinda Lame Project",
#      :project_tasks=>
#       [{:id=>2,
#         :project_id=>1,
#         :reviewed_by_id=>2,
#         :description=>"Project 1, Task 2"}]},   <-- LOOK HERE
#     {:id=>3,
#      :user_id=>1,
#      :reviewed_by_id=>2,
#      :name=>"Secret Mega Project",
#      :project_tasks=>[]}]}
```

{% end %}

Here we can see that a restriction was applied to project tasks and only the
task matching our restriction was loaded.

To grab only a subset of the data associated with a nested relation we can
adjust the projection by using `select`:

{% fenced_code_tab(tabs=["rust", "ruby"]) %}

```rust
let rel = rel![Projects, ProjectTasks];
user_relation
  .by_id(2)
  .combine(rel)
  .node(rel, |project_tasks_relation|{
    project_tasks_relation.select(Id, ProjectId)
  })
  .one()

//  {:id=>2,
//   :username=>"mary_matrix",
//   :projects=>
//    [{:id=>2,
//      :user_id=>2,
//      :reviewed_by_id=>1,
//      :name=>"Super Important Project",
//      :project_tasks=>[{:id=>3, :project_id=>2}, {:id=>4, :project_id=>2}]}]}
```

---

```ruby
user_relation
  .by_id(2)
  .combine(projects: :project_tasks)
  .node(projects: :project_tasks) {|project_tasks_relation|
    project_tasks_relation.select(:id, :project_id)
  }
  .one

#  {:id=>2,
#   :username=>"mary_matrix",
#   :projects=>
#    [{:id=>2,
#      :user_id=>2,
#      :reviewed_by_id=>1,
#      :name=>"Super Important Project",
#      :project_tasks=>[{:id=>3, :project_id=>2}, {:id=>4, :project_id=>2}]}]}
```

{% end %}

{% info() %}

  When adjusting combines, the order of `#combine` and `#node` is important.
  `#node` must come after `#combine` in the call chain otherwise the *block*
  will be ignored and the adjustment will fail.

{% end %}

## Learn More

You can learn more about `#node` and its method signatures:

- [api::rom::Relation/Combined](node)
