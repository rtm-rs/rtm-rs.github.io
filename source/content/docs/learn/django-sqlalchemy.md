+++
title = "Django & SQLAlchemy"
description = "RTM alongside Django & SQLAlchemy."
date = 2022-05-01T15:00:00+00:00
updated = 2022-05-01T15:00:00+00:00
draft = false
weight = 30
sort_by = "weight"
template = "docs/page.html"

[extra]
lead = 'RTM alongside Django & SQLAlchemy.'
toc = true
top = false
+++

SQLAlchemy is the most popular persistence framework in Python land.

Django ORM is also familiar to many developers, deployed inside the majority of Django applications across the web.

Both provide APIs for quick and simple data access making it a great solution for constructing CRUD style applications.

Our intention for this guide is to act as a primer for anyone familiar with Django or SQLAlchemy and looking for a quick start guide. Examples in each set will show how Django and SQLAlchemy accomplishes each task followed by an example with the equivalent using RTM.

All RTM examples are based on `rom-sql` which is an adapter needed to use SQL databases with ROM. Information on installing and configuring rom-sql for your database can be found in the [SQL](/learn/sql) guide.

^INFO
Examples below assume a configured environment for each framework. For RTM examples this means an initialized `ROM::Container` with each component registered.

For information on how to configure RTM see either [Quick setup](/learn/core/5.2/quick-setup) or [Rails](/learn/rails) guides.
^

^INFO
All these frameworks have many similar APIs but philosophically they are completely different. In this guide, we attempt to highlight these differences and provide context for why we chose a different path. That is not to say RTM is better than Django or SQLAlchemy or vise-versa, it's that they're different and each has its own strengths and weaknesses.
^

## Models vs Relations

The first difference is RTM doesn't really have a concept of models. RTM objects are instantiated by the mappers and have no knowledge about persistence. You can map to whatever structure you want and in common use-cases you can use relations to automatically map query results to simple struct-like objects.

The closest implementation to models would be `ROM::Struct`, which is essentially a data object with attribute readers, coercible to a hash.  More on RTM Structs later.

<h4 class="text-center">Django ORM</h4>
```python

```

<h4 class="text-center">ROM</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class Users < ROM::Relation[:sql]
  schema(infer: true)
end
```

---

```rust
class Users < ROM::Relation[:sql]
  schema(infer: true)
end
```

{% end %}

As you can see, ActiveRecord and RTM have similar boilerplate and as this guide progresses both will use similar APIs to accomplish the same tasks. The difference between models and relations lies within their scope and intended purposes. ActiveRecord models represent an all encompassing thing that contains *state*, *behavior*, *identity*, *persistence logic* and *validations* whereas RTM relations describe how data is connected to other relations and provides stateless APIs for applying *views* of that data on demand.

### Models vs RTM Structs

The most direct analog to ActiveRecord models in RTM is a `ROM::Struct`. RTM structs provide a quick method for adding behavior to mapped data returned from a relation. A custom type or plain hash can also be used instead, but RTM structs offer a fast alternative without having to write a lot of boilerplate.

<h4 class="text-center">Active Record</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class User < ApplicationRecord
  def first_name
    name.split(' ').first
  end

  def last_name
    name.split(' ').last
  end
end

user = User.first
#> #<User id: 1, name: "Jane Doe">

user.first_name
#> "Jane"

user.last_name
#> "Doe"
```

---

```rust
class User < ApplicationRecord
  def first_name
    name.split(' ').first
  end

  def last_name
    name.split(' ').last
  end
end

user = User.first
#> #<User id: 1, name: "Jane Doe">

user.first_name
#> "Jane"

user.last_name
#> "Doe"
```

{% end %}

<h4 class="text-center">ROM</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class Users < ROM::Relation[:sql]
  struct_namespace Entities

  schema(infer: true)
end

module Entities
  class User < ROM::Struct
    def first_name
      name.split(' ').first
    end

    def last_name
      name.split(' ').last
    end
  end
end

user = users_relation.first
#> #<Entities::User id=1 name="Jane Doe">

user.first_name
#> "Jane"

user.last_name
#> "Doe"
```

---

```rust
class Users < ROM::Relation[:sql]
  struct_namespace Entities

  schema(infer: true)
end

module Entities
  class User < ROM::Struct
    def first_name
      name.split(' ').first
    end

    def last_name
      name.split(' ').last
    end
  end
end

user = users_relation.first
#> #<Entities::User id=1 name="Jane Doe">

user.first_name
#> "Jane"

user.last_name
#> "Doe"
```

{% end %}

For a brief overview and links to more in-depth information about relations see the Relations in our [Core](/learn/core/5.2/relations) section.

## Queries

### Basic Queries

Once you have a relation, it becomes almost trivial to start querying for information in a similar fashion as ActiveRecord. A basic example below:

<h4 class="text-center">Active Record</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
User.where(name: "Jane").first
#> #<User id: 1, name: "Jane">
```

---

```rust
User.where(name: "Jane").first
#> #<User id: 1, name: "Jane">
```

{% end %}

<h4 class="text-center">ROM</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
users_relation.where(name: "Jane").first
#<ROM::Struct::User id=1 name="Jane">
```

---

```rust
users_relation.where(name: "Jane").first
#<ROM::Struct::User id=1 name="Jane">
```

{% end %}

### Query Subset of Data

<h4 class="text-center">Active Record</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
User.select("name").where(name: name).first

#> #<User id: nil, name: "Jane">
```

---

```rust
User.select("name").where(name: name).first

#> #<User id: nil, name: "Jane">
```

{% end %}

<h4 class="text-center">ROM</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
users_relation.select(:name).where(name: name).one

#> #<ROM::Struct::User name="Jane">
```

---

```rust
users_relation.select(:name).where(name: name).one

#> #<ROM::Struct::User name="Jane">
```

{% end %}

### Query with Complex Conditions

<h4 class="text-center">Active Record</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
User.where("admin IS ? OR moderator IS ?", true, true)
```

---

```rust
User.where("admin IS ? OR moderator IS ?", true, true)
```

{% end %}


<h4 class="text-center">ROM</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
users_relation.where { admin.is(true) | (moderator.is(true)) }
```

---

```rust
users_relation.where { admin.is(true) | (moderator.is(true)) }
```

{% end %}

For several SQL keywords, such as `select` & `where`, RTM provides a DSL for blocks. The benefit is the ability to use any SQL functions supported by your database.

## Associations

Similar to ActiveRecord, RTM uses associations as a means of describing the interconnections between data.

<!--
  NOTE: Expand on this section with examples on how associations work
        and how to configure them properly.
-->

### Join Query

<h4 class="text-center">Active Record</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
Article.joins(:users)
```

---

```rust
Article.joins(:users)
```

{% end %}

<h4 class="text-center">ROM</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
articles_relation.join(:users)
```

---

```rust
articles_relation.join(:users)
```

{% end %}

Obviously the join interface for both frameworks can support different configurations to handle different types of joins, however this example illustrates that other than a minor name change, in the majority of use-cases they will act the same.

## Persistence

### Creating Simple Objects

<h4 class="text-center">Active Record</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
User.create(name: "Jane")
#> #<User id: 1, name: "Jane">
```

---

```rust
User.create(name: "Jane")
#> #<User id: 1, name: "Jane">
```

{% end %}


<h4 class="text-center">ROM</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
users_relation
  .changeset(:create, name: "Jane")
  .commit
#> #<ROM::Struct::User id=1 name="Jane">
```

---

```rust
users_relation
  .changeset(:create, name: "Jane")
  .commit
#> #<ROM::Struct::User id=1 name="Jane">
```

{% end %}

Changesets are an abstraction created over commands which are what actually manipulate stored records. They are preferred over commands due to additional functionality they provide.

### Updating Simple Objects

<h4 class="text-center">Active Record</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
user = User.find_by(name: "Jane")
user.update(name: "Jane Doe")

#> #<User id=1 name="Jane Doe">
```

---

```rust
user = User.find_by(name: "Jane")
user.update(name: "Jane Doe")

#> #<User id=1 name="Jane Doe">
```

{% end %}


<h4 class="text-center">ROM</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
users_relation
  .where(name: "Jane")
  .changeset(:update, name: "Jane Doe")
  .commit

#> #<ROM::Struct::User id=1 name="Jane Doe">
```

---

```rust
users_relation
  .where(name: "Jane")
  .changeset(:update, name: "Jane Doe")
  .commit

#> #<ROM::Struct::User id=1 name="Jane Doe">
```

{% end %}

It should be noted that updating a record in ActiveRecord generally requires that record to first be loaded then updated then committed. We view this as a bad practice as it leads to more round trips from the database and entities that are initialized in an invalid state. If a developer is sufficiently validating data at the boundaries of the application then updating or creating a record without loading it should be no problem and in fact preferable.

<!-- ### Create Nested Objects

<h4 class="text-center">Active Record</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class User < ApplicationRecord
  has_many :tasks

  accepts_nested_attributes_for :tasks
end

class Task < ApplicationRecord
  belongs_to :user
end

user_data = {
  name: "Joe",
  tasks_attributes: [ {title: "Task 1"} ]
}

user = User.create(user_data)
```

---

```rust
class User < ApplicationRecord
  has_many :tasks

  accepts_nested_attributes_for :tasks
end

class Task < ApplicationRecord
  belongs_to :user
end

user_data = {
  name: "Joe",
  tasks_attributes: [ {title: "Task 1"} ]
}

user = User.create(user_data)
```

{% end %}

%
  REVIEW NOTES: The following example is broken ensure it works before
  publishing.
%

<h4 class="text-center">ROM</h4>
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

user_data = {
  name: "Joe",
  tasks: [ {title: "Task 1"} ]
}

users_relation
  .combine(:tasks)
  .changeset(:create, user_data)
  .commit

#> #<ROM::Struct::User id=4 name="Joe" tasks= [
#>  #<ROM::Struct::Task id=3 user_id=4 title="Task 1">
#> ]>
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

user_data = {
  name: "Joe",
  tasks: [ {title: "Task 1"} ]
}

users_relation
  .combine(:tasks)
  .changeset(:create, user_data)
  .commit

#> #<ROM::Struct::User id=4 name="Joe" tasks= [
#>  #<ROM::Struct::Task id=3 user_id=4 title="Task 1">
#> ]>
```

{% end %}

Instead of requiring changes to a relation to handle nested attributes, a RTM relation can leverage its existing associations to determine nested input and changesets can wire up any ids needed by sub records.  This is all possible without a tool like `accepts_nested_attributes_for` because RTM relations are not expected to handle raw input from a multitude of external sources and they're not expected to handle an object that could be in any random state at any time. Changesets utilize relation schemas to be sure that each attribute is the correct data type and when composed with `#combine` they know to expect associated relations.
-->

## Validation

ActiveRecord mixes domain-specific data validation with persistence layer. An active record object validates itself using its own validation rules. We feel this ultimately ends up complicating persistence logic especially when tuning queries in larger projects as the single source of validation needs to work in every context the model is used.  RTM on the other hand does not have a validation concept built-in. Validations in RTM projects need to be handled externally by separate libraries and validated data can be passed down to the command layer to be persisted. We expect users to validate data at the system boundaries using rules that make sense in the current context.

## Where RTM Shines

### Datastore Support

As long as there is an adapter, RTM can theoretically support any datastore.

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class Users < ROM::Relation[:mongo]
  schema do
    attribute :_id, Types::ObjectID
    attribute :name, Types::String
  end
end
```

---

```rust
class Users < ROM::Relation[:mongo]
  schema do
    attribute :_id, Types::ObjectID
    attribute :name, Types::String
  end
end
```

{% end %}

### Cross Database Associations

Couple multi-database support with cross database associations and suddenly a world of opportunity opens up.

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class Users < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      has_many :tasks, override: true, view: :for_users
    end
  end
end

class Tasks < ROM::Relation[:yaml]
  gateway :external

  schema(infer: true)

  def for_users(_assoc, users)
    tasks.restrict(UserId: users.pluck(:id))
  end
end
```

---

```rust
class Users < ROM::Relation[:sql]
  schema(infer: true) do
    associations do
      has_many :tasks, override: true, view: :for_users
    end
  end
end

class Tasks < ROM::Relation[:yaml]
  gateway :external

  schema(infer: true)

  def for_users(_assoc, users)
    tasks.restrict(UserId: users.pluck(:id))
  end
end
```

{% end %}

### Mapping Custom Models

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class CustomUser < MySuperModelLibary
end

users_relation.map_to(CustomUser).first

#> #<CustomUser id="1", username="Joe">
```

---

```rust
class CustomUser < MySuperModelLibary
end

users_relation.map_to(CustomUser).first

#> #<CustomUser id="1", username="Joe">
```

{% end %}

RTM does not care what your final output object is as long as it accepts a hash of all the attributes and their values. Coupled with other mappers, the output from a query can be incredibly flexible.

### SQL Functions

<h4 class="text-center">Active Record</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
User
  .select("*, concat(first_name, ' ', last_name) as 'full_name')")
  .first

#> #<User id=1 full_name="Jane Doe">
```

---

```rust
User
  .select("*, concat(first_name, ' ', last_name) as 'full_name')")
  .first

#> #<User id=1 full_name="Jane Doe">
```

{% end %}


<h4 class="text-center">ROM</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
users_relation.select_append {
  str::first_name.concat(' ', last_name).as(:full_name)
}.first

#> #<ROM::Struct::User id=1, full_name="Jane Doe">
```

---

```rust
users_relation.select_append {
  str::first_name.concat(' ', last_name).as(:full_name)
}.first

#> #<ROM::Struct::User id=1, full_name="Jane Doe">
```

{% end %}

### Legacy Schemas

<h4 class="text-center">Active Record</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class User < ApplicationRecord
  self.table_name = 'SomeHorriblyNamedUserTable'
  self.primary_key = 'UserIdentifier'

  alias_attribute :id, :UserIdentifier
  alias_attribute :name, :UserName
end

User.find_by(name: 'Jane')

#> #<User UserIdentifier: "2", UserName: "Jane">

User.where('name IS ?', 'Jane').first

# 🔥🔥 KA-BOOM! 🔥🔥
# ActiveRecord::StatementInvalid: no such column
```

---

```rust
class User < ApplicationRecord
  self.table_name = 'SomeHorriblyNamedUserTable'
  self.primary_key = 'UserIdentifier'

  alias_attribute :id, :UserIdentifier
  alias_attribute :name, :UserName
end

User.find_by(name: 'Jane')

#> #<User UserIdentifier: "2", UserName: "Jane">

User.where('name IS ?', 'Jane').first

# 🔥🔥 KA-BOOM! 🔥🔥
# ActiveRecord::StatementInvalid: no such column
```

{% end %}


<h4 class="text-center">ROM</h4>
{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class Users < ROM::Relation[:sql]
  schema(:SomeHorriblyNamedUserTable, as: :users) do
    attribute :UserIdentifier, alias: :id
    attribute :UserName, alias: :name
  end
end

users_relation.where(name: 'Jane').first

#> #<ROM::Struct::User id=1 name="Jane">
```

---

```rust
class Users < ROM::Relation[:sql]
  schema(:SomeHorriblyNamedUserTable, as: :users) do
    attribute :UserIdentifier, alias: :id
    attribute :UserName, alias: :name
  end
end

users_relation.where(name: 'Jane').first

#> #<ROM::Struct::User id=1 name="Jane">
```

{% end %}

RTM makes working with legacy schemas a breeze. All that's needed is to define attributes on the relations schema along with their aliases. Afterwards just reuse the aliased names throughout your RTM queries - *quick* and *easy*.

Working with ActiveRecord in this regard is a bit more difficult. While you can alias attributes, there is no real supported method for changing attribute names. Worse yet, ActiveRecord breaks the rule of Least Surprise because while some parts of the ActiveRecord API takes `alias_attribute` into account, [arel](https://github.com/rails/arel) does not, causing performance tuning SQL queries to fall back on the ugly database attribute names you were trying to avoid.

### Custom Mappers

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class EncryptionMapper < ROM::Mapper
  register_as :encryption

  def call(relation)
    relation.map {|tuple|
      # do whatever you want
    }
  end
end

users.map_with(:encryption)
```

---

```rust
class EncryptionMapper < ROM::Mapper
  register_as :encryption

  def call(relation)
    relation.map {|tuple|
      # do whatever you want
    }
  end
end

users.map_with(:encryption)
```

{% end %}

### Transform Data Before Persisting

Not only can data be transformed when reading records from the database, they can also be transformed just before storage as well. Changesets offer a built in method for executing a set of transformations that can be used to make minor adjustments such as the example below, where an attribute needs to be renamed.  They can also handle more powerful transformations such as flattening nested objects. For more information on available transformations see [Transproc](https://github.com/solnic/transproc)

{% fenced_code_tab(tabs=["ruby", "rust"]) %}

```ruby
class NewUser < ROM::Changeset::Create
  map do
    rename_keys user_name: :name
  end
end

users_relation.changeset(NewUser, user_name: "Jane").commit
```

---

```rust
class NewUser < ROM::Changeset::Create
  map do
    rename_keys user_name: :name
  end
end

users_relation.changeset(NewUser, user_name: "Jane").commit
```

{% end %}

## NEXT

To further understand RTM it is recommended to review the [Core section](/learn/core/5.2) page followed by the guides under Core.
